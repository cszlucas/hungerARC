const Investment = require("../server/models/investment");
const RMD = require("../server/models/rmd-schema");

//zoe figure out year factor
//RMDStrategyInvestOrder is an ordering on investments in pre-tax retirement accounts.
async function performRMDs(investments, curYearIncome, userAge, RMDStrategyInvestOrder) {
  console.log("Perform RMDs");
  //console.log("RMDStrategyInvestOrder: ", RMDStrategyInvestOrder);
  if ((userAge-1) >= 73 && RMDStrategyInvestOrder != null) { //-1 b/c prevYear
    //at least one pretax investment in previous year
    const match = await RMD.findOne({ "rmd.age": userAge }, { "rmd.$": 1 });
    const distributionPeriod = match.rmd[0].distributionPeriod;
    allInvestmentsPreTax = investments.filter((investment) => investment.accountTaxStatus.trim().toLowerCase() === "pre-tax");
    allInvestmentsAfterTax = investments.filter((investment) => investment.accountTaxStatus.trim().toLowerCase() === "after-tax");
    sumInvestmentsPreTax = 0;
    for (let preTaxInvestment of allInvestmentsPreTax) {
      sumInvestmentsPreTax += preTaxInvestment.value;
    }
    rmd = sumInvestmentsPreTax / distributionPeriod;
    curYearIncome += rmd;
    rmdCount = rmd;
    for (let preTaxInvest of RMDStrategyInvestOrder) {
      console.log("The rmd count: ", rmdCount);
      console.log("The pretax investment", preTaxInvest._id, "and value: ", preTaxInvest.value);
      if (rmdCount > 0) {
        if (preTaxInvest.value - rmdCount >= 0) {
          //able to accomplish rmd with this investment, keep some of old investment and transfer new
          transferInvestment(preTaxInvest, allInvestmentsAfterTax, rmdCount, investments);
          preTaxInvest.value -= rmdCount;
          console.log("can perform rmd all this round. The old pretax investment", preTaxInvest._id, " now has", preTaxInvest.value);
          break;
        } else {
          //not able to accomplish rmd with this investment, transfer all of old investment and go to next investment in strategy order
          transferInvestment(preTaxInvest, allInvestmentsAfterTax, preTaxInvest.value, investments);
          rmdCount -= preTaxInvest.value;
          preTaxInvest.value = 0;
          console.log("cant pay all this round. The rmd amount left to transfer: ", rmdCount);
        }
      }
    }
  }
  return investments;
}

//from the pretax account to non-retirement accounts
function transferInvestment(preTaxInvest, allInvestmentsAfterTax, amountTransfer, investments) {
  foundMatch = false;
  for (let afterTaxInvestment of allInvestmentsAfterTax) {
    //find a name match
    if (afterTaxInvestment.investmentType === preTaxInvest.investmentType && afterTaxInvestment.accountTaxStatus === preTaxInvest.accountTaxStatus) {
      //able to add to a current afterTaxInvestment
      console.log("able to add value: ", amountTransfer, "to a current afterTaxInvestment of value", afterTaxInvestment.value);
      foundMatch = true;
      afterTaxInvestment.value += amountTransfer;
    }
  }

  if (!foundMatch) {
    //create new after tax investment in memory with transferred amount
    console.log("create a new after tax investment with value: ", amountTransfer);
    let investment = {
      ...preTaxInvest,
      value: amountTransfer,
      accountTaxStatus: "after-tax",
    };
    investments.push(investment);
  }
}

//ordering on a set of investments that specifies the order in which
//investments are sold to generate cash.
function payNonDiscretionaryExpenses(curExpenseEvent, investments, cashInvestment, curYearIncome, curYearSS, curYearGains, curYearEarlyWithdrawals, federalIncomeTax, stateIncomeTaxBracket, year, userAge, capitalGains, withdrawalStrategy){
  console.log("In payNonDiscretionaryExpenses");
  const nonDiscretionaryExpenses = curExpenseEvent.filter((expenseEvent) => expenseEvent.isDiscretionary === false);
  //console.log("nonDiscretionaryExpenses ", nonDiscretionaryExpenses);
  const expenseAmt = sumAmt(nonDiscretionaryExpenses, year);
  const taxes = getTaxes(curYearIncome, curYearSS, curYearGains, curYearEarlyWithdrawals, federalIncomeTax, stateIncomeTaxBracket, capitalGains, userAge);
  console.log("nonDiscretionaryExpenses Amt: ", expenseAmt, "and taxes: ", taxes);
  let withdrawalAmt = (expenseAmt+taxes);
  console.log("My cash investment: ", cashInvestment, "so I need to withdraw: ", withdrawalAmt, "from investments");
  cashInvestment -= withdrawalAmt; //use up cash
  if (cashInvestment <= 0) {
    cashInvestment = 0;
    //get money from investments
    for (let investment of withdrawalStrategy) {
      if (withdrawalAmt > 0) {
        console.log("withdrawalAmt: ", withdrawalAmt);
        console.log("investment to withdraw from ID:", investment._id, ",type:", investment.accountTaxStatus, ",value:", investment.value);
        const amtPaid = payFromInvestment(withdrawalAmt, investment, userAge, curYearGains, curYearIncome, curYearEarlyWithdrawals);
        withdrawalAmt -= amtPaid;
      } else {
        break;
      }
    }
    if (withdrawalAmt > 0) {
      console.log("You can't pay your non-discretionary expenses ;A;");
    }
  }
}

//spendingStrategy is an ordering on expenses
//withdrawalStrategy is an ordering on investments
function payDiscretionaryExpenses(scenario, cashInvestment, year, userAge, spendingStrategy, withdrawalStrategy, curYearGains, curYearIncome, curYearEarlyWithdrawals) {
  console.log("In payDiscretionaryExpenses");
  //pay expenses in order given from cashInvestment
  for (let expense of spendingStrategy) {
    let expenseVal = sumAmt([expense], year);//trick to get init or annual change expense value for one event
    console.log("The expense you want to pay: ", expense._id, " with value: ", expenseVal, ". Your cashInvestment: ", cashInvestment);
    
    if (cashInvestment - expenseVal >= 0) {
      //can pay from cash investment
      cashInvestment -= expenseVal;
      expenseVal = 0;
      continue;
    }
    expenseVal -= cashInvestment;
    cashInvestment = 0; //use up cash
    //Can't pay from cash have to withdraw from investments
    for (let investment of withdrawalStrategy) {
      console.log("the value of investment ", investment._id, "to pay from is ", investment.value);
      if (expenseVal > 0 && scenario.financialGoal - expenseVal >= 0) {
        //does not violate financial goal
        expenseVal -= payFromInvestment(expenseVal, investment, userAge, curYearGains, curYearIncome, curYearEarlyWithdrawals);
      } else if (expenseVal > 0 && scenario.financialGoal - expenseVal < 0) {
        //only pay as much as does not violate financial goal
        expenseVal -= payFromInvestment(expenseVal - scenario.financialGoal, investment, userAge, curYearGains, curYearIncome, curYearEarlyWithdrawals);
      }
    }
    if (expenseVal > 0) {
      console.log("You were not able to pay all your discretionary expenses.");
    }
  }
}

function payFromInvestment(withdrawalAmt, investment, userAge, curYearGains, curYearIncome, curYearEarlyWithdrawals) {
  if (investment.value - withdrawalAmt > 0) {
    //subtract needed and keep investment
    if (investment.accountTaxStatus != "pre-tax retirement") {
      const fractionSold = withdrawalAmt / investment.value;
      const gain = fractionSold * (investment.value - investment.purchasePrice);
      curYearGains += gain;
      console.log("update curYearGains by a fraction: ", gain, "the purchase price was: ", investment.purchasePrice);
    }
    investment.value -= withdrawalAmt;
    console.log("subtract needed and keep investment: ", investment._id, " type:", investment.accountTaxStatus, " now with value ", investment.value);
    return withdrawalAmt; //amtPaid is full withdrawalAmt needed
  } else {
    //use up this investment "sell" and move onto next
    if (investment.accountTaxStatus != "pre-tax") {
      curYearGains += investment.value - investment.purchasePrice;
    }
    if (investment.accountTaxStatus == "pre-tax") {
      curYearIncome -= investment.value;
    }
    if ((investment.accountTaxStatus == "pre-tax" || investment.accountTaxStatus == "after-tax") && userAge < 59) {
      curYearEarlyWithdrawals += investment.value;
    }
    let amountPaid = investment.value;
    investment.value = 0;
    console.log("use up investment: ", investment._id," now with value ", investment.value, "and move onto next");
    return amountPaid;
  }
}

function sumAmt(events, year) {
  sum = 0;
  for (let event of events) {
    if (year === event.startYear.year) {
      sum += event.initialAmount;
    } else {
      sum += event.annualChange.amount; //need to figure out how to handle glide path for this.
    }
  }
  return sum;
}

//calculate tax income and ss prices
function getTaxes(curYearIncome, curYearSS, curYearGains, currYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, capitalGains, userAge) {
  console.log("in get taxes my income ", curYearIncome);
  const federalTax = taxAmt(curYearIncome, federalIncomeRange);
  const stateTax = taxAmt(curYearIncome, stateIncomeRange);
  //social security (ss) income tax
  const ssTax = taxAmt(curYearSS * 0.85, federalIncomeRange);
  //early withdrawal tax - Withdrawals from retirement accounts (pre-tax or after-tax) taken before age 59 ½ incur a 10% tax.
  const earlyWithdrawalTax = 0;
  if (userAge < 59.5) {
    earlyWithdrawalTax = currYearEarlyWithdrawals * 0.1;
  }
  //capital gains tax
  capitalGainsTax = taxAmt(curYearGains, capitalGains, "capitalGains");
  return federalTax + stateTax + ssTax + earlyWithdrawalTax + capitalGainsTax;
}

function taxAmt(income, taxBracket, type) {
  for (let range of taxBracket) {
    if (income >= range.incomeRange[0] && income <= range.incomeRange[1] && type != "capitalGains") {
      return income * (range.taxRate / 100);
    } else if (income >= range.incomeRange[0] && income <= range.incomeRange[1] && type == "capitalGains") {
      //console.log("capitalGains", range);
      return income * (range.gainsRate / 100);
    }
  }
}

//Use up excess cash with invest strategy
function runInvestStrategy(cashInvestment, irsLimit, year, investments, investStrategy) {
  console.log("in invest strategy");
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
    } else if(investStrategy.assetAllocation.type === "fixed"){
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
        excessDueToLimit += (excessCash * percentage) - (excessCash * percentage * afterTaxRatio)
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
  
  rebalanceStrategy = rebalanceStrategy[0];
  console.log("rebalanceStrategy: ", rebalanceStrategy);
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
  } else if(rebalanceStrategy.rebalanceAllocation.type === "fixed"){
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
    console.log("The investment value: ", investment.value, "and the desired target is: ", target);
    if (investment.value > target) {
      //sell
      let sellAmt = investment.value - target;
      if (investment.value - sellAmt <= 0) {
        //sell entire investment. investment.value is how much money got when sold. investment.purchasePrice
        if (investment.taxAccountStatus == "non-retirement") {
          curYearGains += investment.value - investment.purchasePrice;
        }
        //remove(investment);
      } else {
        //sell part of investment
        if (investment.taxAccountStatus == "non-retirement") {
          const fractionSold = sellAmt / investment.value;
          curYearGains += fractionSold * (investment.value - investment.purchasePrice);
        }
      }
      investment.value -= sellAmt;
    } else if (investment.value < target) {
      //buy some of investment
      let buyAmt = target - investment.value;
      investment.purchasePrice += buyAmt;
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
