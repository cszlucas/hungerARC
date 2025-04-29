import { logFinancialEvent, printInvestments, printStrategy } from "./logs.js";
import { updateValues } from "./expenses.js";

//Use up excess cash with invest strategy
function runInvestStrategy(cashInvestment, irsLimit, year, investments, investStrategy) {
  console.log("\nINVEST STRATEGY");
  //console.log("investStrategy :>> ", investStrategy);
  const strategy = Array.isArray(investStrategy) ? investStrategy[0] : investStrategy;
  console.log("strategy :>> ", strategy);
  //console.log("cashInvestment", cashInvestment.value, " maxCash to keep: ", strategy.maxCash);

  logFinancialEvent({
    year: year,
    type: "invest",
    details: {
      cash: cashInvestment.value,
      excessCash: cashInvestment.value - strategy.maxCash,
    },
  });
  const excessCash = cashInvestment.value - strategy.maxCash;
  //.log("The excess cash is (if <0 no money to invest)", excessCash);
  printStrategy(strategy.assetAllocation, "invest", strategy.assetAllocation.type, year);
  printInvestments(investments, year, "invest", "investments");
  let allocations = [];

  if (excessCash > 0) {
    //console.log("The excess cash now is", excessCash);
    if (strategy.assetAllocation.type === "glidePath") {
      allocations = getGlidePathAllocation(
        year,
        strategy.startYear.value,
        strategy.startYear.value + strategy.duration.value,
        strategy.assetAllocation.initialPercentages,
        strategy.assetAllocation.finalPercentages
      );
      printStrategy(allocations, "invest", strategy.assetAllocation.type, year, true);
    } else if (strategy.assetAllocation.type === "fixed") {
      allocations = strategy.assetAllocation.fixedPercentages;
    }
    //console.log("moon", allocations);
    const investmentsWithAllocations = allocationIDToObject(allocations, investments);
    const afterTaxRatio = scaleDownRatio("after-tax", investmentsWithAllocations, irsLimit, excessCash);
    //console.log("afterTaxRatio: ", afterTaxRatio);
    logFinancialEvent({
      year: year,
      type: "invest",
      details: {
        irsLimit: irsLimit,
        afterTaxRatio: afterTaxRatio,
      },
    });
    let totalInvested = 0;
    let excessDueToLimit = 0;

    for (const { investment, percentage } of investmentsWithAllocations) {
      let buyAmt = 0;

      if (investment.accountTaxStatus === "after-tax") {
        buyAmt = excessCash * percentage * afterTaxRatio;
        excessDueToLimit += excessCash * percentage * (1 - afterTaxRatio);
      } else {
        buyAmt = excessCash * percentage;
      }

      investment.purchasePrice += buyAmt;
      investment.value += buyAmt;
      totalInvested += buyAmt;

      //console.log("investment", investment._id, "percentage", percentage, "type", investment.accountTaxStatus, "increase purchasePrice by:", buyAmt);
    }

    if (excessCash - totalInvested > 0) {
      console.log("everything else in non-retirement: ", excessDueToLimit);
      buyNonRetirement(investmentsWithAllocations, excessDueToLimit, year);
    }
    printInvestments(investments, year, "invest", "investments");
  }
}

function allocationIDToObject(allocations, investments) {
  const investmentMap = new Map(investments.map((investment) => [investment._id, investment])); // Create a map for O(1) lookup

  const investmentsWithAllocations = Object.entries(allocations)
    .map(([assetId, percentage]) => {
      const investAllocation = investmentMap.get(assetId); // O(1) lookup

      if (investAllocation) {
        return {
          investment: investAllocation,
          percentage: percentage,
        };
      }

      // Handle missing investment more clearly (e.g., log a warning)
      console.warn(`Warning: Investment with ID ${assetId} not found.`);
      return null;
    })
    .filter((item) => item !== null); // Remove any null entries

  return investmentsWithAllocations;
}

function getGlidePathAllocation(year, startYear, endYear, initial, final) {
  const tRaw = (year - startYear) / (endYear - startYear);
  const t = Math.max(0, Math.min(1, tRaw)); // clamp between 0 and 1

  const allocation = {};
  const allAssets = new Set([...Object.keys(initial), ...Object.keys(final)]);

  for (const asset of allAssets) {
    const initVal = initial[asset] || 0;
    const finalVal = final[asset] || 0;
    allocation[asset] = (1 - t) * initVal + t * finalVal;
  }

  return allocation;
}

function buyNonRetirement(investmentsWithAllocations, excessCash, year) {
  // Filter only non-retirement investments first
  const nonRetirement = investmentsWithAllocations.filter(({ investment }) => investment.accountTaxStatus === "non-retirement");

  // Total their percentage (in case it doesn't sum to 1)
  const totalPercentage = nonRetirement.reduce((sum, { percentage }) => sum + percentage, 0);

  logFinancialEvent({
    year: year,
    type: "invest",
    details: {
      excessCash: excessCash,
    },
  });

  for (const { investment, percentage } of nonRetirement) {
    // Normalize percentage if necessary
    const adjustedPercentage = percentage / totalPercentage;
    const buyAmt = excessCash * adjustedPercentage;
    investment.purchasePrice += buyAmt;
    investment.value += buyAmt;
    console.log("Buying into non-retirement:", investment._id, "purchase:", buyAmt);
    logFinancialEvent({
      year: year,
      type: "invest",
      details: {
        type: "investments",
        tax_status: investment.accountTaxStatus,
        ID: investment._id,
        purchasePrice: buyAmt,
      },
    });
  }
}

function scaleDownRatio(type, investmentsWithAllocations, irsLimit, excessCash) {
  let sum = 0;

  for (const { investment, percentage } of investmentsWithAllocations) {
    if (investment.accountTaxStatus === type) {
      sum += percentage * excessCash;
    }
  }
  console.log(`Total intended contribution to '${type}' accounts: $${sum}, IRS limit: $${irsLimit}`);
  if (sum > irsLimit) {
    return irsLimit / sum; // scale down if over irsLimit
  } else {
    return 1; // no scaling needed
  }
}

//rebalance investment allocations of same account tax status based on desired targets specified in rebalance strategy.
function rebalance(investments, year, rebalanceStrategy, userAge, yearTotals, type) {
  console.log("\nREBALANCE STRATEGY");
  logFinancialEvent({
    year: year,
    type: "rebalance",
    details: {
      tax_status: type,
    },
  });
  rebalanceStrategy = rebalanceStrategy[0];
  printStrategy(rebalanceStrategy.rebalanceAllocation, "rebalance", rebalanceStrategy.rebalanceAllocation.type, year);

  let allocations = [];
  if (rebalanceStrategy.rebalanceAllocation.type === "glidePath") {
    console.log("you chose glidepath woohoo");
    allocations = getGlidePathAllocation(
      year,
      rebalanceStrategy.startYear.value,
      rebalanceStrategy.startYear.value + rebalanceStrategy.duration.value,
      rebalanceStrategy.rebalanceAllocation.initialPercentages,
      rebalanceStrategy.rebalanceAllocation.finalPercentages
    );
    printStrategy(allocations, "rebalance", rebalanceStrategy.rebalanceAllocation.type, year, true);
  } else if (rebalanceStrategy.rebalanceAllocation.type === "fixed") {
    allocations = rebalanceStrategy.rebalanceAllocation.fixedPercentages;
  }
  console.log(allocations);
  const investmentsWithAllocations = allocationIDToObject(allocations, investments);

  let sum = 0;
  for (const { investment } of investmentsWithAllocations) {
    sum += investment.value;
  }
  printInvestments(
    investmentsWithAllocations.map((item) => item.investment),
    year,
    "rebalance",
    "investments"
  );

  // First: process sales
  for (const { investment, percentage } of investmentsWithAllocations) {
    const target = sum * percentage;

    if (investment.value > target) {
      const sellAmt = investment.value - target;

      if (investment.value - sellAmt <= 0) {
        // full sale
        console.log("Sell entire investment", investment._id, "value: ", investment.value);
        updateValues(investment, userAge, yearTotals, false, investment.value);
        investment.value = 0;
      } else {
        // partial sale
        console.log("Sell partial investment", investment._id, "value:", investment.value, "sell amount:", sellAmt);
        updateValues(investment, userAge, yearTotals, true, sellAmt);
        investment.value -= sellAmt;
      }
    }
  }

  // Then: process purchases
  for (const { investment, percentage } of investmentsWithAllocations) {
    const target = sum * percentage;

    if (investment.value < target) {
      const buyAmt = target - investment.value;
      console.log("Buy investment", investment._id, "value: ", investment.value, "buy amount:", buyAmt);
      investment.purchasePrice += buyAmt;
      investment.value += buyAmt;
    }
  }
  logFinancialEvent({
    year: year,
    type: "rebalance",
    description: "The rebalance has now been done.",
  });
  printInvestments(
    investmentsWithAllocations.map((item) => item.investment),
    year,
    "rebalance",
    "investments"
  );
}

export { runInvestStrategy, rebalance };
