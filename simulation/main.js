import RMD from "../server/models/rmd-schema.js";
import { getExpenseAmountInYear } from "./helper.js";
import structuredClone from "structured-clone";
import { v4 as uuidv4 } from "uuid";
import { logFinancialEvent, printInvestments, printEvents, printStrategy } from "./logs.js";

//RMDStrategyInvestOrder is an ordering on investments in pre-tax retirement accounts.
async function performRMDs(investments, yearTotals, userAge, RMDStrategyInvestOrder, sumInvestmentsPreTaxRMD, year) {
  console.log("Perform RMD");
  if (userAge >= 74 && RMDStrategyInvestOrder != null) {
    //console.log("\nRMDs\nUser age", userAge, "and sum of pre-tax values from prev year is", sumInvestmentsPreTaxRMD);

    const match = await RMD.findOne({ "rmd.age": userAge }, { "rmd.$": 1 });
    if (!match || !match.rmd || !match.rmd[0]) {
      console.error("RMD data not found for age:", userAge);
    }

    const distributionPeriod = match.rmd[0].distributionPeriod;
    const allInvestmentsNonRetirement = investments.filter((investment) => investment.accountTaxStatus.trim().toLowerCase() === "non-retirement");

    let rmd = sumInvestmentsPreTaxRMD / distributionPeriod;
    yearTotals.curYearIncome += rmd;
    let rmdCount = rmd;
    logFinancialEvent({
      year: year,
      type: "rmd",
      description: "Performing RMD",
      details: {
        amount: rmdCount,
        userAge: userAge,
      },
    });

    for (let preTaxInvest of RMDStrategyInvestOrder) {
      if (rmdCount > 0) {
        logFinancialEvent({
          year: year,
          type: "rmd",
          details: {
            rmdCount: rmdCount,
            preTaxInvestmentValue: preTaxInvest.value,
            preTaxInvestmentID: preTaxInvest._id,
          },
        });
        //console.log("The rmd count: ", rmdCount, "and the pretax investment", preTaxInvest._id, "has value:", preTaxInvest.value);
        if (preTaxInvest.value - rmdCount >= 0) {
          transferInvestment(preTaxInvest, allInvestmentsNonRetirement, rmdCount, investments, year);
          preTaxInvest.value -= rmdCount;

          logFinancialEvent({
            year: year,
            type: "rmd",
            description: "Performed all rmd this round. The new pretax investment values are:",
            details: {
              rmdCount: rmdCount,
              preTaxInvestmentValue: preTaxInvest.value,
              preTaxInvestmentID: preTaxInvest._id,
            },
          });
          //console.log("can perform rmd all this round. The old pretax investment", preTaxInvest._id, " now has", preTaxInvest.value);
          break;
        } else {
          transferInvestment(preTaxInvest, allInvestmentsNonRetirement, preTaxInvest.value, investments, year);
          rmdCount -= preTaxInvest.value;
          preTaxInvest.value = 0;

          logFinancialEvent({
            year: year,
            type: "rmd",
            description: "can NOT pay all this round. Transferred all of pretax investment to non-retirement.",
            details: {
              rmdCount: rmdCount,
              preTaxInvestmentValue: preTaxInvest.value,
              preTaxInvestmentID: preTaxInvest._id,
            },
          });
          //console.log("can NOT pay all this round. Transfer all of pretax investment. The rmd amount left to transfer: ", rmdCount);
        }
      } else {
        //console.log("RMD transferred");
        logFinancialEvent({
          year: year,
          type: "rmd",
          description: "All RMD transferred.",
          rmdCount: rmdCount,
        });
        break;
      }
    }
  }
}

// from the pretax account to non-retirement accounts
function transferInvestment(preTaxInvest, allInvestmentsNonRetirement, amountTransfer, investments, year) {
  let nonRetirementMap = new Map(allInvestmentsNonRetirement.map((investment) => [investment.investmentType, investment]));
  let nonRetirementInvestment = nonRetirementMap.get("preTaxInvest.investmentType");

  if (nonRetirementInvestment) {
    // console.log("able to add value: ", amountTransfer, "to a current afterTaxInvestment ", nonRetirementInvestment._id, "of value", nonRetirementInvestment.value);
    logFinancialEvent({
      year: year,
      type: "rmd",
      description: "Add amount to old non-retirement investment",
      details: {
        amountTransfer: amountTransfer,
        nonRetirementInvestmentValue: nonRetirementInvestment.value,
        nonRetirementInvestmentID: nonRetirementInvestment._id,
      },
    });
    nonRetirementInvestment.value += amountTransfer;
  } else {
    //console.log("create a new non-retirement investment with value: ", amountTransfer);
    let newInvestment = {
      _id: uuidv4(),
      ...structuredClone(preTaxInvest),
      value: amountTransfer,
      accountTaxStatus: "non-retirement",
    };

    logFinancialEvent({
      year: year,
      type: "rmd",
      description: "Add amount to new non-retirement investment",
      details: {
        amountTransfer: amountTransfer,
        nonRetirementInvestmentID: newInvestment._id,
      },
    });

    investments.push(newInvestment);
  }
}

//ordering on a set of investments that specifies the order in which
//investments are sold to generate cash.
function payNonDiscretionaryExpenses(
  curExpenseEvent,
  cashInvestment,
  prevYearIncome,
  prevYearSS,
  prevYearGains,
  prevYearEarlyWithdrawals,
  federalIncomeTax,
  stateIncomeTaxBracket,
  fedDeduction,
  year,
  userAge,
  capitalGains,
  withdrawalStrategy,
  yearTotals,
  inflationRate,
  spouseDeath
) {
  console.log("\nPAY NON-DISCRETIONARY EXPENSES");
  const nonDiscretionaryExpenses = curExpenseEvent.filter((expenseEvent) => expenseEvent.isDiscretionary === false);
  //console.log("nonDiscretionaryExpenses ", nonDiscretionaryExpenses);
  let expenseAmt = 0;
  for (let expense of nonDiscretionaryExpenses) {
    expenseAmt += getExpenseAmountInYear(expense, year, inflationRate, spouseDeath);
  }
  const taxes = getTaxes(prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeTax, stateIncomeTaxBracket, capitalGains, userAge, fedDeduction);
  let withdrawalAmt = expenseAmt + taxes;
  logFinancialEvent({
    year: year,
    type: "non-discretionary",
    details: {
      amount: expenseAmt,
      taxes: taxes,
      cash: cashInvestment.value,
      withdrawalAmt: withdrawalAmt,
    },
  });
  printInvestments(withdrawalStrategy, year, "non-discretionary", "investment");
  printEvents(nonDiscretionaryExpenses, year, "non-discretionary", "expense", inflationRate, spouseDeath);
  //console.log("nonDiscretionaryExpenses Amt: ", expenseAmt, "and taxes: ", taxes);
  //console.log("My cash investment: ", cashInvestment.value, "Amount I need to withdraw: ", withdrawalAmt);
  if (cashInvestment.value >= withdrawalAmt) {
    cashInvestment.value -= withdrawalAmt; //use up cash needed
    logFinancialEvent({
      year: year,
      type: "non-discretionary",
      description: "You paid all your non-discretionary expenses with cash...wow!",
      details: {
        cash: cashInvestment.value,
      },
    });
    withdrawalAmt = 0;
  } else {
    withdrawalAmt -= cashInvestment.value;
    cashInvestment.value = 0; //use up cash
    for (let investment of withdrawalStrategy) {
      if (withdrawalAmt > 0) {
        //console.log("Still left to withdraw: ", withdrawalAmt);
        //console.log("investment to withdraw from ID:", investment._id, ",type:", investment.accountTaxStatus, ",value:", investment.value);
        const amtPaid = payFromInvestment(withdrawalAmt, investment, userAge, yearTotals);
        withdrawalAmt -= amtPaid;
      } else {
        break;
      }
    }

    printInvestments(withdrawalStrategy, year, "non-discretionary", "investments");
    printEvents(nonDiscretionaryExpenses, year, "non-discretionary", "expense", inflationRate, spouseDeath);

    if (withdrawalAmt > 0) {
      logFinancialEvent({
        year: year,
        type: "non-discretionary",
        description: "You CAN NOT pay your non-discretionary expenses GO TO JAIL-Don't pass go...;A;",
      });
      //console.log("You CAN NOT pay your non-discretionary expenses GO TO JAIL-Don't pass go...;A;");
    } else {
      logFinancialEvent({
        year: year,
        type: "non-discretionary",
        description: "You paid all your non-discretionary expenses...phew",
      });
      //console.log("You paid all your non-discretionary expenses...phew");
    }
  }
  return {
    nonDiscretionary: nonDiscretionaryExpenses,
    taxes: taxes,
  };
}

//calculate TAX
function getTaxes(prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, capitalGains, userAge, fedDeduction) {
  console.log("CALCULATING TAXES, my prev year income: ", prevYearIncome);
  const adjustedIncome = Math.max(0, prevYearIncome - fedDeduction - prevYearSS);
  const federalTax = taxAmt(adjustedIncome, federalIncomeRange);
  const stateTax = taxAmt(adjustedIncome, stateIncomeRange);

  const ssTax = taxAmt(prevYearSS * 0.85, federalIncomeRange);

  let earlyWithdrawalTax = 0;
  if (userAge < 59) {
    earlyWithdrawalTax = prevYearEarlyWithdrawals * 0.1;
  }

  const capitalGainsTax = taxAmt(prevYearGains, capitalGains, "capitalGains");

  return federalTax + stateTax + ssTax + earlyWithdrawalTax + capitalGainsTax;
}

function taxAmt(income, taxBracket, type) {
  for (let range of taxBracket) {
    if (income >= range.incomeRange[0] && income <= range.incomeRange[1]) {
      if (type === "capitalGains") {
        return income > 0 ? income * (range.gainsRate / 100) : 0;
      } else {
        return income * (range.taxRate / 100);
      }
    }
  }
  return 0;
}

//spendingStrategy is an ordering on expenses
//withdrawalStrategy is an ordering on investments
function payDiscretionaryExpenses(financialGoal, cashInvestment, year, userAge, spendingStrategy, withdrawalStrategy, yearTotals, inflationRate, spouseDeath) {
  console.log("\nPAY DISCRETIONARY EXPENSES");
  let goalRemaining = financialGoal;
  let expensesPaid = 0;
  printEvents(spendingStrategy, year, "discretionary", "expense", inflationRate, spouseDeath);
  logFinancialEvent({
    year: year,
    type: "discretionary",
    details: {
      cash: cashInvestment.value,
    },
  });
  for (let expense of spendingStrategy) {
    let expenseVal = getExpenseAmountInYear(expense, year, inflationRate, spouseDeath);
    console.log("Expense:", expense._id, "Amount:", expenseVal, "Cash available:", cashInvestment.value);

    if (cashInvestment.value >= expenseVal) {
      cashInvestment.value -= expenseVal;
      expensesPaid += expenseVal;
      expenseVal = 0;
      logFinancialEvent({
        year: year,
        type: "discretionary",
        description: `You paid expense ID: ${expense._id} all with cash.`,
        details: {
          cash: cashInvestment.value,
        },
      });
      //console.log("You paid expense all with cash.");
      continue;
    }

    expenseVal -= cashInvestment.value;
    cashInvestment.value = 0;
    printInvestments(withdrawalStrategy, year, "discretionary", "investments");
    for (let investment of withdrawalStrategy) {
      if (expenseVal <= 0) break;
      console.log("Expense value now is: ", expenseVal);
      if (goalRemaining >= expenseVal) {
        let amtPaid = payFromInvestment(expenseVal, investment, userAge, yearTotals);
        expensesPaid += amtPaid;
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;
      } else if (goalRemaining > 0) {
        let partialAmt = Math.min(expenseVal, goalRemaining);
        expensesPaid += partialAmt;
        let amtPaid = payFromInvestment(partialAmt, investment, userAge, yearTotals);
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;
        console.log("You paid some of the expense and then was forced to stop", expenseVal);
      }
    }
    printInvestments(withdrawalStrategy, year, "discretionary", "investments");
    if (expenseVal > 0) {
      logFinancialEvent({
        year: year,
        type: "discretionary",
        description: "You were NOT able to pay all your discretionary expenses.",
        details: {
          cash: cashInvestment.value,
        },
      });
      //console.log("You were NOT able to pay all your discretionary expenses.");
    } else {
      //console.log("You were able to pay all your discretionary expenses without violating your financial goal.");
      logFinancialEvent({
        year: year,
        type: "discretionary",
        description: "You were able to pay all your discretionary expenses without violating your financial goal.",
      });
    }
  }
  return expensesPaid;
}

function payFromInvestment(withdrawalAmt, investment, userAge, yearTotals) {
  if (investment.value == 0) {
    //console.log("This investment: ", investment._id, "is already empty", investment.value);
    logFinancialEvent({
      year: year,
      type: "non-discretionary",
      description: "This investment is already empty.",
    });
    return 0;
  } else if (investment.value - withdrawalAmt > 0) {
    //console.log("subtract needed and keep investment:", investment._id, "type:", investment.accountTaxStatus, "value: ", investment.value);
    updateValues(investment, userAge, yearTotals, true, withdrawalAmt);
    investment.value -= withdrawalAmt;
    //console.log("Investment now with value: ", investment.value);
    return withdrawalAmt;
  } else {
    let amountPaid = investment.value;
    //console.log("use up investment:", investment._id, "value: ", investment.value, "now with value 0 and move onto next");
    updateValues(investment, userAge, yearTotals, false, amountPaid);
    investment.value = 0;
    return amountPaid;
  }
}

function updateValues(investment, userAge, yearTotals, partial, amountPaid) {
  if (investment.accountTaxStatus === "non-retirement") {
    if (partial) {
      const fractionSold = investment.value > 0 ? amountPaid / investment.value : 0;
      const gain = fractionSold * (investment.value - investment.purchasePrice);
      yearTotals.curYearGains += Math.max(gain, 0);
      investment.purchasePrice -= (1 - fractionSold) * investment.purchasePrice;
      console.log("By a fraction update curYearGains:", gain, "purchase price:", investment.purchasePrice);
    } else {
      const gain = investment.value - investment.purchasePrice;
      yearTotals.curYearGains += Math.max(gain, 0);
      investment.purchasePrice -= 0;
      console.log("update curYearGains:", gain, "purchase price:", investment.purchasePrice);
    }
  }

  if (investment.accountTaxStatus === "pre-tax") {
    yearTotals.curYearIncome += amountPaid;
  }

  if ((investment.accountTaxStatus === "pre-tax" || investment.accountTaxStatus === "after-tax") && userAge < 59) {
    yearTotals.curYearEarlyWithdrawals += amountPaid;
  }
}

//Use up excess cash with invest strategy
function runInvestStrategy(cashInvestment, irsLimit, year, investments, investStrategy) {
  console.log("\nINVEST STRATEGY");
  //console.log("investStrategy :>> ", investStrategy);
  const strategy = Array.isArray(investStrategy) ? investStrategy[0] : investStrategy;
  //console.log("strategy :>> ", strategy);
  //console.log("cashInvestment", cashInvestment.value, " maxCash to keep: ", strategy.maxCash);

  logFinancialEvent({
    year: year,
    type: "invest",
    details: {
      cash: cashInvestment.value,
      excessCash: (cashInvestment.value - strategy.maxCash),
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

// function getGlidePathAllocation(year, startYear, endYear, initial, final) {
//   const t = (year - startYear) / (endYear - startYear);
//   const allocation = {};
//   for (const asset in initial) {
//     allocation[asset] = initial[asset] + t * (final[asset] - initial[asset]);
//   }

//   return allocation;
// }
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
function rebalance(investments, year, rebalanceStrategy, userAge, yearTotals) {
  console.log("\nREBALANCE STRATEGY");
  rebalanceStrategy = rebalanceStrategy[0];

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
  } else if (rebalanceStrategy.rebalanceAllocation.type === "fixed") {
    allocations = rebalanceStrategy.rebalanceAllocation.fixedPercentages;
  }
  console.log(allocations);
  const investmentsWithAllocations = allocationIDToObject(allocations, investments);

  let sum = 0;
  for (const { investment } of investmentsWithAllocations) {
    sum += investment.value;
  }

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
}

export { performRMDs, payNonDiscretionaryExpenses, payDiscretionaryExpenses, runInvestStrategy, rebalance };
