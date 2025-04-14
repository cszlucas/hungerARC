const Investment = require("../server/models/investment");
const RMD = require("../server/models/rmd-schema");
const { getExpenseAmountInYear } = require("./helper.js");

//RMDStrategyInvestOrder is an ordering on investments in pre-tax retirement accounts.
async function performRMDs(investments, yearTotals, userAge, RMDStrategyInvestOrder, sumInvestmentsPreTaxRMD) {
  //console.log("RMDStrategyInvestOrder: ", RMDStrategyInvestOrder);
  if (userAge >= 74 && RMDStrategyInvestOrder != null) {
    console.log("\nRMDs\nUser age", userAge, "and sum of pre-tax values from prev year is", sumInvestmentsPreTaxRMD);
    //at least one pretax investment in previous year
    const match = await RMD.findOne({ "rmd.age": userAge }, { "rmd.$": 1 });
    const distributionPeriod = match.rmd[0].distributionPeriod;
    allInvestmentsPreTax = investments.filter((investment) => investment.accountTaxStatus.trim().toLowerCase() === "pre-tax");
    allInvestmentsNonRetirement = investments.filter((investment) => investment.accountTaxStatus.trim().toLowerCase() === "non-retirement");
    let rmd = sumInvestmentsPreTaxRMD / distributionPeriod;
    yearTotals.curYearIncome += rmd;
    rmdCount = rmd;
    for (let preTaxInvest of RMDStrategyInvestOrder) {
      console.log("The rmd count: ", rmdCount);
      if (rmdCount > 0) {
        console.log("The pretax investment", preTaxInvest._id, "and value: ", preTaxInvest.value);
        if (preTaxInvest.value - rmdCount >= 0) {
          //able to accomplish rmd with this investment, keep some of old investment and transfer new
          transferInvestment(preTaxInvest, allInvestmentsNonRetirement, rmdCount, investments);
          preTaxInvest.value -= rmdCount;
          console.log("can perform rmd all this round. The old pretax investment", preTaxInvest._id, " now has", preTaxInvest.value);
          break;
        } else {
          //not able to accomplish rmd with this investment, transfer all of old investment and go to next investment in strategy order
          transferInvestment(preTaxInvest, allInvestmentsNonRetirement, preTaxInvest.value, investments);
          rmdCount -= preTaxInvest.value;
          preTaxInvest.value = 0;
          console.log("cant pay all this round. The rmd amount left to transfer: ", rmdCount);
        }
      } else {
        console.log("RMD transferred");
        break;
      }
    }
  }
  return investments;
}

//from the pretax account to non-retirement accounts
function transferInvestment(preTaxInvest, allInvestmentsNonRetirement, amountTransfer, investments) {
  foundMatch = false;
  for (let nonRetirementInvestment of allInvestmentsNonRetirement) {
    //find a name match
    if (nonRetirementInvestment.investmentType === preTaxInvest.investmentType) {
      //able to add to a current nonRetirementInvestment
      console.log("able to add value: ", amountTransfer, "to a current afterTaxInvestment of value", nonRetirementInvestment.value);
      foundMatch = true;
      nonRetirementInvestment.value += amountTransfer;
    }
  }

  if (!foundMatch) {
    //create new after tax investment in memory with transferred amount
    console.log("create a new after tax investment with value: ", amountTransfer);
    let investment = {
      ...preTaxInvest,
      value: amountTransfer,
      accountTaxStatus: "non-retirement",
    };
    investments.push(investment);
  }
}

//ordering on a set of investments that specifies the order in which
//investments are sold to generate cash.
function payNonDiscretionaryExpenses(curExpenseEvent, cashInvestment, prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeTax, stateIncomeTaxBracket, fedDeduction, year, userAge, capitalGains, withdrawalStrategy, yearTotals, inflationRate, spouseDeath) {
  console.log("\nPAY NON-DISCRETIONARY EXPENSES");
  const nonDiscretionaryExpenses = curExpenseEvent.filter((expenseEvent) => expenseEvent.isDiscretionary === false);
  //console.log("nonDiscretionaryExpenses ", nonDiscretionaryExpenses);
  let expenseAmt = 0;
  for (let expense of nonDiscretionaryExpenses) {
    expenseAmt += getExpenseAmountInYear(expense, year, inflationRate, spouseDeath);
  }
  const taxes = getTaxes(prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeTax, stateIncomeTaxBracket, capitalGains, userAge, fedDeduction);
  console.log("nonDiscretionaryExpenses Amt: ", expenseAmt, "and taxes: ", taxes);
  let withdrawalAmt = expenseAmt + taxes;
  console.log("My cash investment: ", cashInvestment, "so I need to withdraw: ", withdrawalAmt, "from investments");
  if (cashInvestment >= withdrawalAmt) {
    cashInvestment -= withdrawalAmt; //use up cash needed
    withdrawalAmt = 0;
  } else {
    withdrawalAmt -= cashInvestment;
    cashInvestment = 0; //use up cash
    for (let investment of withdrawalStrategy) {
      if (withdrawalAmt > 0) {
        console.log("withdrawalAmt: ", withdrawalAmt);
        console.log("investment to withdraw from ID:", investment._id, ",type:", investment.accountTaxStatus, ",value:", investment.value);
        const amtPaid = payFromInvestment(withdrawalAmt, investment, userAge, yearTotals);
        withdrawalAmt -= amtPaid;
      } else {
        break;
      }
    }
    if (withdrawalAmt > 0) {
      console.log("You CAN NOT pay your non-discretionary expenses SAD...;A;");
    }
  }
}

//calculate TAX
function getTaxes(prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, capitalGains, userAge, fedDeduction) {
  console.log("CALCULATING TAXES, my income: ", prevYearIncome);
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
function payDiscretionaryExpenses(
  financialGoal, cashInvestment, year, userAge, spendingStrategy, withdrawalStrategy, yearTotals, inflationRate, spouseDeath) {
  console.log("\nPAY DISCRETIONARY EXPENSES");
  let goalRemaining = financialGoal;

  for (let expense of spendingStrategy) {
    let expenseVal = getExpenseAmountInYear(expense, year, inflationRate, spouseDeath);
    console.log("Expense:", expense._id, "Amount:", expenseVal, "Cash available:", cashInvestment);

    if (cashInvestment >= expenseVal) {
      cashInvestment -= expenseVal;
      expenseVal = 0;
      continue;
    }

    expenseVal -= cashInvestment;
    cashInvestment = 0;

    for (let investment of withdrawalStrategy) {
      if (expenseVal <= 0) break;

      if (goalRemaining >= expenseVal) {
        let amtPaid = payFromInvestment(expenseVal, investment, userAge, yearTotals);
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;
      } else if (goalRemaining > 0) {
        let partialAmt = Math.min(expenseVal, goalRemaining);
        let amtPaid = payFromInvestment(partialAmt, investment, userAge, yearTotals);
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;
      }
    }

    if (expenseVal > 0) {
      console.log("You were not able to pay all your discretionary expenses.");
    }
  }
}

function payFromInvestment(withdrawalAmt, investment, userAge, yearTotals) {
  if (investment.value - withdrawalAmt > 0) {
    updateValues(investment, userAge, yearTotals, true, withdrawalAmt);
    investment.value -= withdrawalAmt;
    console.log("subtract needed and keep investment:", investment._id, "type:", investment.accountTaxStatus, "now with value", investment.value);
    return withdrawalAmt;
  } else {
    let amountPaid = investment.value;
    updateValues(investment, userAge, yearTotals, false, amountPaid);
    investment.value = 0;
    console.log("use up investment:", investment._id, "now with value", investment.value, "and move onto next");
    return amountPaid;
  }
}

function updateValues(investment, userAge, yearTotals, partial, amountPaid) {
  if (investment.accountTaxStatus != "pre-tax" && partial === false) {
    yearTotals.curYearGains += (investment.value - investment.purchasePrice);
  }

  if (investment.accountTaxStatus != "pre-tax" && partial === true) {
    const fractionSold = amountPaid / investment.value;
    const gain = fractionSold * (investment.value - investment.purchasePrice);
    yearTotals.curYearGains += gain;
    console.log("update curYearGains by a fraction:", gain, "purchase price:", investment.purchasePrice);
  }

  if (investment.accountTaxStatus === "pre-tax") {
    yearTotals.curYearIncome += amountPaid;
  }

  if (
    (investment.accountTaxStatus === "pre-tax" || investment.accountTaxStatus === "after-tax") &&
    userAge < 59
  ) {
    yearTotals.curYearEarlyWithdrawals += amountPaid;
  }
}


//Use up excess cash with invest strategy
function runInvestStrategy(cashInvestment, irsLimit, year, investments, investStrategy) {
  console.log("\nINVEST STRATEGY");
  investStrategy = investStrategy[0];
  console.log("cashInvestment", cashInvestment, " maxCash to keep: ", investStrategy.maxCash);
  let excessCash = cashInvestment - investStrategy.maxCash;
  let allocations = [];
  console.log("cash to burn? ", excessCash);
  if (excessCash > 0) {
    if (investStrategy.assetAllocation.type === "glidePath") {
      console.log("you choose glide path");
      // Example: allocation in year 2025 between 2020 and 2030
      //allocation has list of map [{investmentId: value}, ...]
      allocations = getGlidePathAllocation(
        year,
        investStrategy.startYear.year,
        investStrategy.startYear.year + investStrategy.duration.value,
        investStrategy.assetAllocation.initialPercentages,
        investStrategy.assetAllocation.finalPercentages
      );
    } else if (investStrategy.assetAllocation.type === "fixed") {
      allocations = investStrategy.assetAllocation.fixedPercentages;
    }

    // Translate assetIds to actual investment objects based on the IDs and value is percentage of allocation
    const investmentsWithAllocations = allocationIDToObject(allocations, investments);
    //console.log("in invest, the investments: ", investmentsWithAllocations);
    const afterTaxRatio = scaleDownRatio("after-tax", investmentsWithAllocations, irsLimit, excessCash);
    console.log("afterTaxRatio: ", afterTaxRatio);
    let buyAmt = 0;
    let excessDueToLimit = 0;
    for (const { investment, percentage } of investmentsWithAllocations) {
      buyAmt = 0;

      if (investment.accountTaxStatus === "after-tax") {
        buyAmt = excessCash * percentage * afterTaxRatio;
        excessDueToLimit += excessCash * percentage - excessCash * percentage * afterTaxRatio;
      } else {
        // no scaling needed for non-retirement accounts
        buyAmt = excessCash * percentage;
      }

      // Safely update the correct investment object
      console.log("investment", investment._id, "percentage", percentage, "type", investment.accountTaxStatus, "increase purchasePrice by: ", buyAmt);
      investment.purchasePrice += buyAmt;
    }

    if (excessCash - buyAmt > 0) {
      //everything else in non-retirement
      console.log("everything else in non-retirement: ", excessDueToLimit);
      buyNonRetirement(investmentsWithAllocations, excessDueToLimit);
    }
  }
}

function allocationIDToObject(allocations, investments) {
  const investmentsWithAllocations = Object.entries(allocations)
    .map(([assetId, percentage]) => {
      const investAllocation = investments.find((investment) => investment._id === assetId);

      if (investAllocation) {
        // You can now work with both the investment object and the percentage
        return {
          investment: investAllocation,
          percentage: percentage,
        };
      }

      // If investment not found, handle it (e.g., log or return null)
      return null;
    })
    .filter((item) => item !== null); // Remove any null entries (if the investment wasn't found)
  return investmentsWithAllocations;
}

function getGlidePathAllocation(year, startYear, endYear, initial, final) {
  const t = (year - startYear) / (endYear - startYear);
  const allocation = {};
  for (const asset in initial) {
    console.log("asset: ", asset);
    allocation[asset] = initial[asset] + t * (final[asset] - initial[asset]);
  }

  return allocation;
}

function buyNonRetirement(investmentsWithAllocations, excessCash) {
  for (const { investment, percentage } of investmentsWithAllocations) {
    buyAmt = 0;
    if (investment.accountTaxStatus == "non-retirement") {
      buyAmt = excessCash * (percentage / excessCash);
      investment.purchasePrice += buyAmt;
    }
  }
}

function scaleDownRatio(type, investmentsWithAllocations, irsLimit, excessCash) {
  let sum = 0;

  for (const { investment, percentage } of investmentsWithAllocations) {
    if (investment.accountTaxStatus === type) {
      sum += percentage * excessCash;
    }
  }
  console.log("the purchase price sum for investments with type after-tax is: ", sum, "and the limit is: ", irsLimit);
  if (sum > irsLimit) {
    return irsLimit / sum; // scale down if over irsLimit
  } else {
    return 1; // no scaling needed
  }
}

//rebalance investment allocations of same account tax status based on desired targets specified in rebalance strategy.
function rebalance(curYearGains, investments, year, rebalanceStrategy) {
  console.log("\nREBALANCE STRATEGY");
  rebalanceStrategy = rebalanceStrategy[0];
  let allocations = [];
  if (rebalanceStrategy.rebalanceAllocation.type === "glidePath") {
    console.log("you choose glide path");
    // Example: allocation in year 2025 between 2020 and 2030
    //allocation has list of map [{investmentId: value}, ...]
    allocations = getGlidePathAllocation(
      year,
      rebalanceStrategy.startYear.year,
      rebalanceStrategy.startYear.year + rebalanceStrategy.duration.value,
      rebalanceStrategy.rebalanceAllocation.initialPercentages,
      rebalanceStrategy.rebalanceAllocation.finalPercentages
    );
  } else if (rebalanceStrategy.rebalanceAllocation.type === "fixed") {
    allocations = rebalanceStrategy.rebalanceAllocation.fixedPercentages;
  }
  console.log("allocations: ", allocations);
  const investmentsWithAllocations = allocationIDToObject(allocations, investments);
  //console.log("investmentsWithAllocations: ", investmentsWithAllocations);
  let sum = 0;
  for (const { investment, percentage } of investmentsWithAllocations) {
    sum += investment.value;
  }
  for (const { investment, percentage } of investmentsWithAllocations) {
    const target = sum * percentage;
    console.log("The investment ", investment._id, "value: ", investment.value, "and the desired target is: ", target);
    if (investment.value > target) {
      //sell
      let sellAmt = investment.value - target;
      if (investment.value - sellAmt <= 0) {
        //sell entire investment. investment.value is how much money got when sold. investment.purchasePrice
        if (investment.taxAccountStatus == "non-retirement") {
          let gain = investment.value - investment.purchasePrice;
          curYearGains += gain;
          console.log("Sell entire investment ", investment._id, "with gain: ", gain);
        }
        investment.value = 0;
        console.log("Entire investment sold.");
      } else {
        //sell part of investment
        if (investment.taxAccountStatus == "non-retirement") {
          const fractionSold = sellAmt / investment.value;
          let gain = fractionSold * (investment.value - investment.purchasePrice);
          curYearGains += gain;
          console.log("Sell some of investment ", investment._id, "with gain: ", gain);
        }
        investment.value -= sellAmt;
        console.log("The part of investment sold", investment._id, sellAmt);
      }
    } else if (investment.value < target) {
      //buy some of investment
      let buyAmt = target - investment.value;
      investment.purchasePrice += buyAmt;
      console.log("Buy some of investment", investment._id, buyAmt);
    }
  }
}

module.exports = {
  performRMDs,
  payNonDiscretionaryExpenses,
  payDiscretionaryExpenses,
  runInvestStrategy,
  rebalance,
};
