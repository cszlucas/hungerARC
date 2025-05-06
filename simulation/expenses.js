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
  spouseDeath,
  metGoal
) {
  console.log("\nPAY NON-DISCRETIONARY EXPENSES");
  const nonDiscretionaryExpenses = curExpenseEvent.filter((expenseEvent) => expenseEvent.isDiscretionary === false);
  let goal = true;
  //console.log("nonDiscretionaryExpenses ", nonDiscretionaryExpenses);
  let expenseAmt = 0;
  for (let expense of nonDiscretionaryExpenses) {
    let amt = getValueInYear(expense, year, inflationRate, spouseDeath);
    expense.initialAmount = amt;
    expenseAmt += amt;
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
      goal = false;
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
    metGoal: goal,
  };
}

//calculate TAX
function getTaxes(prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, capitalGains, userAge, fedDeduction, year) {
  console.log("CALCULATING TAXES, my prev year income: ", prevYearIncome);
  //console.log("stateIncomeRange", stateIncomeRange);
  logFinancialEvent({
    year: year,
    type: "non-discretionary",
    description: `Calculating taxes, my prev year income: ${prevYearIncome.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}, fedDeduction: ${fedDeduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, prevYearSS: ${prevYearSS.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  });
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
function payDiscretionaryExpenses(financialGoal, cashInvestment, year, userAge, spendingStrategy, withdrawalStrategy, yearTotals, inflationRate, spouseDeath, metGoal) {
  console.log("\nPAY DISCRETIONARY EXPENSES");
  let expensesPaid = 0;

  logFinancialEvent({
    year,
    type: "discretionary",
    details: { cash: cashInvestment.value },
  });

  let goalRemaining = withdrawalStrategy.reduce((sum, inv) => sum + inv.value, 0);

  for (let expense of spendingStrategy) {
    printEvents([expense], year, "discretionary", "expense", inflationRate, spouseDeath);
    let expenseVal = getValueInYear(expense, year, inflationRate, spouseDeath);
    expense.initialAmount = expenseVal;

    // Pay from cash first
    if (cashInvestment.value >= expenseVal) {
      cashInvestment.value -= expenseVal;
      expensesPaid += expenseVal;
      expenseVal = 0;

      logFinancialEvent({
        year,
        type: "discretionary",
        description: `Paid expense ID: ${expense._id} entirely with cash.`,
        details: { cash: cashInvestment.value },
      });
      continue;
    }

    // Partial from cash
    expenseVal -= cashInvestment.value;
    cashInvestment.value = 0;

    printInvestments(withdrawalStrategy, year, "discretionary", "investments");

    // Pay from investments
    for (let investment of withdrawalStrategy) {
      if (expenseVal <= 0) break;

      console.log("Paying expense, remaining:", expenseVal, "from investment:", investment.value, "goalRemaining:", goalRemaining);

      if (goalRemaining >= expenseVal) {
        let amtPaid = payFromInvestment(expenseVal, investment, userAge, yearTotals, year, "discretionary");
        expensesPaid += amtPaid;
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;
      } else if (goalRemaining > 0) {
        let partialAmt = Math.min(expenseVal, goalRemaining);
        let amtPaid = payFromInvestment(partialAmt, investment, userAge, yearTotals, year, "discretionary");
        expensesPaid += amtPaid;
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;

        console.log("Partially paid to avoid violating financial goal. Remaining expense:", expenseVal);
        break; // stop trying once goalRemaining is exhausted
      }
    }

    printInvestments(withdrawalStrategy, year, "discretionary", "investments");

    if (expenseVal > 0) {
      logFinancialEvent({
        year,
        type: "discretionary",
        description: "NOT able to pay all discretionary expenses.",
      });
      return false;
    } else {
      logFinancialEvent({
        year,
        type: "discretionary",
        description: "Able to pay discretionary expense without violating financial goal.",
      });
    }
  }

  return true;
}

function payFromInvestment(withdrawalAmt, investment, userAge, yearTotals, year, type) {
  if (investment.value === 0) {
    console.log("Investment is already empty:", investment._id);
    logFinancialEvent({ year, type, description: "This investment is already empty" });
    return 0;
  }

  const amountPaid = Math.min(withdrawalAmt, investment.value);
  const partial = amountPaid < investment.value;

  updateValues(investment, userAge, yearTotals, partial, amountPaid, year, type);
  investment.value -= amountPaid;

  return amountPaid;
}

function updateValues(investment, userAge, yearTotals, partial, amountPaid, year, type) {
  if (investment.accountTaxStatus === "non-retirement") {
    const originalValue = investment.value + amountPaid; // value before deduction
    const fractionSold = originalValue > 0 ? amountPaid / originalValue : 0;
    const gain = fractionSold * Math.max(investment.value + amountPaid - investment.purchasePrice, 0);

    yearTotals.curYearGains += gain;
    investment.purchasePrice *= 1 - fractionSold;
    investment.purchasePrice = Math.max(investment.purchasePrice, 0);

    logFinancialEvent({
      year,
      type,
      description: `Capital gains: ${gain.toFixed(2)}, updated purchase price: ${investment.purchasePrice.toFixed(2)}`,
    });
  }

  if (investment.accountTaxStatus === "pre-tax") {
    yearTotals.curYearIncome += amountPaid;
    logFinancialEvent({
      year,
      type,
      description: `Added to curYearIncome: ${amountPaid}`,
    });
  }

  if ((investment.accountTaxStatus === "pre-tax" || investment.accountTaxStatus === "after-tax") && userAge < 59) {
    yearTotals.curYearEarlyWithdrawals += amountPaid;
    logFinancialEvent({
      year,
      type,
      description: `Early withdrawal under 59: ${amountPaid}`,
    });
  }
}

export { payNonDiscretionaryExpenses, payDiscretionaryExpenses, updateValues };
