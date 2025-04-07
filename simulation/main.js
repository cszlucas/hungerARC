const Investment = require("../server/models/investment");
const RMD = require("../server/models/rmd-schema");

//zoe figure out year factor
//RMDStrategyInvestOrder is an ordering on investments in pre-tax retirement accounts.
async function performRMDs(scenario, investments, currYearIncome, currYear) {
  userAge = currYear - scenario.birthYearUser;
  // console.log("my scenario rmd: ", scenario.rmdStrategy);
  //console.log("my investments ", investments);
  const RMDStrategyInvestOrder = scenario.rmdStrategy.map((id) => {
    return investments.find((investment) => investment._id === id);
  });
  //console.log("RMDStrategyInvestOrder: ", RMDStrategyInvestOrder);
  if (userAge >= 73 && RMDStrategyInvestOrder != null) {
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
    currYearIncome += rmd;
    rmd = 5; // just for testing
    rmdCount = rmd;
    for (let preTaxInvest of RMDStrategyInvestOrder) {
      console.log("The rmd count: ", rmdCount);
      console.log("The pretax investment", preTaxInvest);
      if (rmdCount > 0) {
        if (preTaxInvest.value - rmdCount >= 0) {
          //able to accomplish rmd with this investment, keep some of old investment and transfer new
          transferInvestment(preTaxInvest, allInvestmentsAfterTax, rmdCount, investments);
          preTaxInvest.value -= rmdCount;
          console.log("can pay all this round. pretax investment", preTaxInvest);
          break;
        } else {
          //not able to accomplish rmd with this investment, transfer all of old investment and go to next investment in strategy order
          transferInvestment(preTaxInvest, allInvestmentsAfterTax, preTaxInvest.value, investments);
          rmdCount -= preTaxInvest.value;
          preTaxInvest.value = 0;
          console.log("cant pay all this round.", preTaxInvest);
          //remove(preTaxInvest);
        }
      }
    }
  }
  return investments;
  //console.log("my investments ", investments);
}

//from the pretax account to non-retirement accounts
function transferInvestment(preTaxInvest, allInvestmentsAfterTax, amountTransfer, investments) {
  foundMatch = false;
  for (let afterTaxInvestment of allInvestmentsAfterTax) {
    //find a name match
    if (afterTaxInvestment.investmentType === preTaxInvest.investmentType && afterTaxInvestment.accountTaxStatus === preTaxInvest.accountTaxStatus) {
      //able to add to a current afterTaxInvestment
      console.log("able to add to a current afterTaxInvestment", afterTaxInvestment);
      foundMatch = true;
      afterTaxInvestment.value += amountTransfer;
    }
  }

  if (!foundMatch) {
    //create new after tax investment in memory with transferred amount
    console.log("create new after tax investment");
    let investment = {
      ...preTaxInvest,
      investmentType: preTaxInvest.investmentType,
      value: amountTransfer,
      accountTaxStatus: "after-tax",
    };
    investments.push(investment);
  }
}

//ordering on a set of investments that specifies the order in which
//investments are sold to generate cash.
function payNonDiscretionaryExpenses(
  scenario,
  expenseEvents,
  investments,
  cashInvestment,
  currYearIncome,
  currYearSS,
  curYearGains,
  curYearEarlyWithdrawals,
  federalIncomeRange,
  stateIncomeRange,
  ssRange
) {
  nonDiscretionaryExpenses = expenseEvents.filter((expenseEvent) => expenseEvent.isDiscretionary === false);
  const withdrawalStrategy = scenario.expenseWithdrawalStrategy.map((id) => {
    return investments.find((investment) => investment._id === id);
  });
  console.log("nonDiscretionaryExpenses ", nonDiscretionaryExpenses);
  const expenseAmt = sumAmt(nonDiscretionaryExpenses, 2023);
  const taxes = getTaxes(currYearIncome, currYearSS, curYearGains, curYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, ssRange);
  withdrawalAmt = expenseAmt + taxes;
  console.log("expenseAmt ", expenseAmt);
  console.log("taxes ", taxes);

  if (cashInvestment - withdrawalAmt >= 0) {
    //can pay from cash investment
    cashInvestment -= withdrawalAmt;
  } else {
    //get money from investments
    expense.value -= cashInvestment;
    cashInvestment = 0; //use up cash
    for (let investment in withdrawalStrategy) {
      if (withdrawalAmt > 0) {
        withdrawalAmt -= payFromInvestment(withdrawalAmt, investment, userAge);
      }
    }
  }
}

function payDiscretionaryExpenses(scenario, cashInvestment) {
  spendingStrategy = db.scenario.query({ _id: scenario.id }).spendingStrategy;
  withdrawalStrategy = db.scenario.query({ _id: scenario.id }).expenseWithdrawalStrategy;
  //pay expenses in order given from cashInvestment
  for (let expense in spendingStrategy) {
    if (cashInvestment - expense.value >= 0) {
      //can pay from cash investment
      cashInvestment -= expense.value;
      expense.value = 0;
      continue;
    }
    expense.value -= cashInvestment;
    cashInvestment = 0; //use up cash
    //Can't pay from cash have to withdraw from investments
    for (let investment in withdrawalStrategy) {
      if (expense.value > 0 && scenario.financialGoal - expense.value >= 0) {
        //does not violate financial goal
        expense.value -= payFromInvestment(expense.value, investment, userAge);
      } else if (expense.value > 0 && scenario.financialGoal - expense.value < 0) {
        //only pay as much as does not violate financial goal
        expense.value -= payFromInvestment(expense.value - scenario.financialGoal, investment, userAge);
      }
    }
    if (expense.value > 0) {
      console.log("You were not able to pay all your discretionary expenses.");
    }
  }
}

function payFromInvestment(withdrawalAmt, investment, userAge, curYearGains, curYearIncome, curYearEarlyWithdrawals) {
  if (investment.value - withdrawalAmt > 0) {
    //subtract needed and keep investment
    if (investment.accountTaxStatus != "pre-tax retirement") {
      capitalGain = withdrawalAmt * (investment.value - investment.purchasePrice);
      curYearGains += capitalGain;
    }
    investment.value -= withdrawalAmt;
    return withdrawalAmt;
  } else {
    //use up this investment "sell" and move onto next
    if (investment.accountTaxStatus != "pre-tax retirement") {
      capitalGain = investment.value - investment.purchasePrice;
      curYearGains += capitalGain;
    }
    if (investment.accountTaxStatus == "pre-tax retirement") {
      curYearIncome -= investment.value;
    }
    if ((investment.accountTaxStatus == "pre-tax retirement" || investment.accountTaxStatus == "after-tax retirement") && userAge < 59) {
      curYearEarlyWithdrawals += investment.value;
    }
    remove(investment);
    return investment.value;
  }
}

function sumAmt(events, year) {
  sum = 0;
  for (let event of events) {
    if (year >= event.startYear.year  && year <= (event.startYear.year + event.duration.value)) {
      //more glide paths
      if (year === event.startYear.year) {
        sum += event.initialAmount;
      } else {
        sum += event.annualChange.amount; //need to figure out how to handle glide path for this.
      }
    }
  }
  return sum;
}

//calculate tax income and ss prices
function getTaxes(currYearIncome, currYearSS, curYearGains, currYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, ssRange) {
  //federal income tax
  federalTax = taxAmt(currYearIncome, federalIncomeRange);
  console.log("federalTax: , currYearIncome: , federalIncomeRange:", federalTax, currYearIncome, federalIncomeRange);
  //state income tax
  stateTax = taxAmt(currYearIncome, stateIncomeRange);
  //social security (ss) income tax
  ssTax = taxAmt(currYearSS * 0.85, ssRange);
  //capital gains tax
  capitalGainsTax = taxAmt(curYearGains);
  //early withdrawal tax
  earlyWithdrawalTax = taxAmt(currYearEarlyWithdrawals);
  return federalTax + stateTax + ssTax + capitalGainsTax + earlyWithdrawalTax;
}

function taxAmt(income, ranges) {
  for (let range in ranges) {
    if (income >= range[0] && income <= range[1]) {
      return income * range.rate;
    }
  }
}

function runInvestStrategy(scenario, cashInvestment, IRSLimits) {
  //run invest event strategy for current year
  investStrategy = db.invest_strategy.assetAllocation.query({ _scenario_id: scenario.id });
  excessCash = investStrategy.maxCash - cashInvestment;
  if (excessCash > 0) {
    preTaxLimits = taxAmt(excessCash, IRSLimits);
    afterTaxLimits = taxAmt();
    preTaxRatio = scaleDownRatio("pre-tax retirement", investStrategy, preTaxLimits, excessCash);
    afterTaxRatio = scaleDownRatio("after-tax retirement", investStrategy, afterTaxLimits, excessCash);

    for (let investment in investStrategy) {
      buyAmt = 0;
      if (investment.accountTaxStatus == "pre-tax retirement") {
        buyAmt = excessCash * investment.value * preTaxRatio;
      } else if (investment.accountTaxStatus == "after-tax retirement") {
        buyAmt = excessCash * investment.value * afterTaxRatio;
      }
      investment.purchasePrice += buyAmt;
    }

    if (excessCash - buyAmt > 0) {
      //everything else in non-retirement
      buyNonRetirement(investStrategy, excessCash - buyAmt);
    }
  }
}

function buyNonRetirement(investStrategy, excessCash) {
  for (let investment in investStrategy) {
    buyAmt = 0;
    if (investment.accountTaxStatus == "non-retirement") {
      buyAmt = excessCash * (investment.percentage / excessCash);
      investment.purchasePrice += buyAmt;
    }
  }
}

function scaleDownRatio(type, investStrategy, limit, excessCash) {
  sum = 0;
  for (let investment in investStrategy) {
    if (investment.accountTaxStatus == type) {
      sum += investment.percentage * excessCash;
    }
  }
  if (sum > limit) {
    return limit / sum;
  } else {
    return investment.percentage;
  }
}

function rebalance(scenario, curYearGains) {
  rebalanceStrategy = db.rebalance.assetAllocation.query({ _scenario_id: scenario.id });

  for (let investment in rebalanceStrategy) {
    sum = sumAmt(investment);
    target = sum * investment.percentage;
    if (investment.value > target) {
      //sell
      sellAmt = investment.value - target;
      if (investment.value - sellAmt <= 0) {
        //sell entire investment
        if (investment.taxAccountStatus == "non-retirement") {
          curYearGains += investment.value - investment.purchasePrice;
        }
        remove(investment);
      } else {
        //sell part of investment
        if (investment.taxAccountStatus == "non-retirement") {
          curYearGains += sellAmt * (investment.value - investment.purchasePrice);
        }
      }
      investment.value -= sellAmt;
    } else if (investment.value < target) {
      //buy some of investment
      buyAmt = target - investment.value;
      investment.purchasePrice += buyAmt;
    }
  }
}

module.exports = {
  performRMDs,
  payNonDiscretionaryExpenses,
};
