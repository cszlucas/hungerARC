const Investment = require("../server/models/investment");
const RMD = require("../server/models/rmd-schema");

//zoe figure out year factor
//RMDStrategyInvestOrder is an ordering on investments in pre-tax retirement accounts.
async function performRMDs(scenario, investments, currYearIncome, currYear, userAge) {
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
  curYearIncome,
  curYearSS,
  curYearGains,
  curYearEarlyWithdrawals,
  federalIncomeRange,
  stateIncomeRange,
  year,
  userAge,
  capitalGains
) {
  nonDiscretionaryExpenses = expenseEvents.filter((expenseEvent) => expenseEvent.isDiscretionary === false);
  const withdrawalStrategy = scenario.expenseWithdrawalStrategy.map((id) => {
    return investments.find((investment) => investment._id === id);
  });
  console.log("nonDiscretionaryExpenses ", nonDiscretionaryExpenses);
  const expenseAmt = sumAmt(nonDiscretionaryExpenses, year);
  const taxes = getTaxes(curYearIncome, curYearSS, curYearGains, curYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, capitalGains, userAge);
  withdrawalAmt = expenseAmt + taxes - cashInvestment;
  cashInvestment = 0; //use up cash
  console.log("expenseAmt ", expenseAmt);
  console.log("taxes ", taxes);
  if (withdrawalAmt > 0) {
    //get money from investments
    for (let investment of withdrawalStrategy) {
      if (withdrawalAmt > 0) {
        console.log("withdrawalAmt: ", withdrawalAmt);
        console.log("investment to withdraw from ID:", investment._id, ",type:", investment.accountTaxStatus, ",value:", investment.value);
        const payAmt = payFromInvestment(withdrawalAmt, investment, userAge, curYearGains, curYearIncome, curYearEarlyWithdrawals);
        withdrawalAmt -= payAmt;
        if (payAmt == investment.value) {
          investment.value = 0;
        }
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
function payDiscretionaryExpenses(scenario, cashInvestment, investments, expenses, year, userAge) {
  const spendingStrategy = scenario.spendingStrategy.map((id) => {
    return expenses.find((expense) => expense._id === id);
  });
  const withdrawalStrategy = scenario.expenseWithdrawalStrategy.map((id) => {
    return investments.find((investment) => investment._id === id);
  });
  // console.log("spendingStrategy: ", spendingStrategy);
  // console.log("withdrawalStrategy", withdrawalStrategy);
  console.log("cashInvestment: ", cashInvestment);
  //pay expenses in order given from cashInvestment
  for (let expense of spendingStrategy) {
    expenseVal = sumAmt([expense], year);

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
      if (expenseVal > 0 && scenario.financialGoal - expenseVal >= 0) {
        //does not violate financial goal
        expenseVal -= payFromInvestment(expenseVal, investment, userAge);
      } else if (expenseVal > 0 && scenario.financialGoal - expenseVal < 0) {
        //only pay as much as does not violate financial goal
        expenseVal -= payFromInvestment(expenseVal - scenario.financialGoal, investment, userAge);
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
      capitalGain = withdrawalAmt * (investment.value - investment.purchasePrice);
      curYearGains += capitalGain;
    }
    investment.value -= withdrawalAmt;
    return withdrawalAmt;
  } else {
    //use up this investment "sell" and move onto next
    if (investment.accountTaxStatus != "pre-tax") {
      capitalGain = investment.value - investment.purchasePrice;
      curYearGains += capitalGain;
    }
    if (investment.accountTaxStatus == "pre-tax") {
      curYearIncome -= investment.value;
    }
    if ((investment.accountTaxStatus == "pre-tax" || investment.accountTaxStatus == "after-tax") && userAge < 59) {
      curYearEarlyWithdrawals += investment.value;
    }
    //remove(investment);
    return investment.value;
  }
}

function sumAmt(events, year) {
  sum = 0;
  for (let event of events) {
    if (year >= event.startYear.year && year <= event.startYear.year + event.duration.value) {
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
function runInvestStrategy(scenario, cashInvestment, irsLimit, investEvent, year, investments) {
  //find investEvent for current year
  const investStrategy = investEvent.filter((invest) => scenario.investEventSeries.includes(invest._id) && invest.startYear.year == 2020);
  console.log("investStrategy", investStrategy);
  console.log("excessCash: ", investStrategy[0].maxCash - cashInvestment);
  const excessCash = investStrategy[0].maxCash - cashInvestment;
  const allocations = [];
  if (excessCash > 0) {
    if (investStrategy[0].assetAllocation.type === "glidePath") {
      // Example: allocation in year 2025 between 2020 and 2030
      //allocation has list of map [{investmentId: value}, ...]
      allocations = getGlidePathAllocation(
        year,
        investStrategy.startYear.year,
        investStrategy.startYear.year + investStrategy.duration.value,
        investStrategy.initialPercentages,
        investStrategy.finalPercentages
      );
    }

    // Translate assetIds to actual investment objects based on the IDs and value is percentage of allocation
    const investmentsWithAllocations = allocations
      .map(({ assetId, percentage }) => {
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
    
    const afterTaxRatio = scaleDownRatio("after-tax", investmentsWithAllocations, irsLimit, excessCash);
    console.log("in invest, the investments: ", investmentsWithAllocations);

    for (const { investment, percentage } of investmentsWithAllocations) {
      let buyAmt = 0;

      if (investment.accountTaxStatus === "after-tax") {
        buyAmt = excessCash * percentage * afterTaxRatio;
      } else {
        // no scaling needed for non-retirement accounts
        buyAmt = excessCash * percentage;
      }

      // Safely update the correct investment object
      investment.purchasePrice += buyAmt;
    }

    if (excessCash - buyAmt > 0) {
      //everything else in non-retirement
      buyNonRetirement(investmentsWithAllocations, excessCash - buyAmt);
    }
  }
}

function getGlidePathAllocation(year, startYear, endYear, initial, final) {
  const t = (year - startYear) / (endYear - startYear);
  const allocation = {};

  for (const asset in initial) {
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

function scaleDownRatio(type, investmentsWithAllocations, limit, excessCash) {
  let sum = 0;

  for (const { investment, percentage } of investmentsWithAllocations) {
    if (investment.accountTaxStatus === type) {
      sum += percentage * excessCash;
    }
  }

  if (sum > limit) {
    return limit / sum; // scale down if over limit
  } else {
    return 1; // no scaling needed
  }
}

function rebalance(scenario, curYearGains) {
  rebalanceStrategy = db.rebalance.assetAllocation.query({ _scenario_id: scenario.id });

  for (let investment of rebalanceStrategy) {
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
  payDiscretionaryExpenses,
  runInvestStrategy,
};
