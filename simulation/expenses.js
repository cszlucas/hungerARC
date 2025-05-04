import { getValueInYear } from "./value.js";
import { logFinancialEvent, printInvestments, printEvents } from "./logs.js";

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
    expenseAmt += getValueInYear(expense, year, inflationRate, spouseDeath);
  }
  const taxes = getTaxes(prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeTax, stateIncomeTaxBracket, capitalGains, userAge, fedDeduction, year);
  let withdrawalAmt = expenseAmt + taxes;
  logFinancialEvent({
    year: year,
    type: "non-discretionary",
    details: {
      amount: expenseAmt,
      taxes: taxes,
      cash: cashInvestment.value,
    },
  });
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
    printInvestments(withdrawalStrategy, year, "non-discretionary", "investments");
    withdrawalAmt -= cashInvestment.value;
    cashInvestment.value = 0; //use up cash
    for (let investment of withdrawalStrategy) {
      if (withdrawalAmt > 0) {
        //console.log("Still left to withdraw: ", withdrawalAmt);
        //console.log("investment to withdraw from ID:", investment._id, ",type:", investment.accountTaxStatus, ",value:", investment.value);
        const amtPaid = payFromInvestment(withdrawalAmt, investment, userAge, yearTotals, year, "non-discretionary");
        withdrawalAmt -= amtPaid;
      } else {
        break;
      }
    }

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
      printInvestments(withdrawalStrategy, year, "non-discretionary", "investments");
      //console.log("You paid all your non-discretionary expenses...phew");
    }
  }
  return {
    nonDiscretionary: nonDiscretionaryExpenses,
    taxes: taxes,
  };
}

//calculate TAX
function getTaxes(prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, capitalGains, userAge, fedDeduction, year) {
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

  logFinancialEvent({
    year: year,
    type: "non-discretionary",
    description: `Taxes to pay include federalTax: $${federalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, stateTax: $${stateTax.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}, social security tax: $${ssTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, earlyWithdrawalTax: $${earlyWithdrawalTax.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}, capitalGainsTax: $${capitalGainsTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  });
  return federalTax + stateTax + ssTax + earlyWithdrawalTax + capitalGainsTax;
}

function taxAmt(income, taxBracket, type) {
  if (taxBracket) {
    for (let range of taxBracket) {
      if (income >= range.incomeRange[0] && income <= range.incomeRange[1]) {
        if (type === "capitalGains") {
          return income > 0 ? income * (range.gainsRate / 100) : 0;
        } else {
          return income * (range.taxRate / 100);
        }
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
  logFinancialEvent({
    year: year,
    type: "discretionary",
    details: {
      cash: cashInvestment.value,
    },
  });
  for (let expense of spendingStrategy) {
    printEvents([expense], year, "discretionary", "expense", inflationRate, spouseDeath);
    let expenseVal = getValueInYear(expense, year, inflationRate, spouseDeath);
    //console.log("Expense:", expense._id, "Amount:", expenseVal, "Cash available:", cashInvestment.value);

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
    //console.log("withdrawalStrategy", withdrawalStrategy);
    printInvestments(withdrawalStrategy, year, "discretionary", "investments");
    for (let investment of withdrawalStrategy) {
      if (expenseVal <= 0) break;
      //console.log("Expense value now is: ", expenseVal);
      if (goalRemaining >= expenseVal) {
        let amtPaid = payFromInvestment(expenseVal, investment, userAge, yearTotals, year, "discretionary");
        expensesPaid += amtPaid;
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;
      } else if (goalRemaining > 0) {
        let partialAmt = Math.min(expenseVal, goalRemaining);
        expensesPaid += partialAmt;
        let amtPaid = payFromInvestment(partialAmt, investment, userAge, yearTotals, year, "discretionary");
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;
        //console.log("You paid some of the expense and then was forced to stop to not violate financial goal.", expenseVal);
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
        description: "You were able to pay your discretionary expense without violating your financial goal.",
      });
    }
  }
  return expensesPaid;
}

function payFromInvestment(withdrawalAmt, investment, userAge, yearTotals, year, type) {
  if (investment.value == 0) {
    console.log("This investment: ", investment._id, "is already empty", investment.value);
    logFinancialEvent({
      year: year,
      type: type,
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

export { payNonDiscretionaryExpenses, payDiscretionaryExpenses, updateValues };
