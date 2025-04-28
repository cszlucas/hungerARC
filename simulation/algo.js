import { randomNormal, randomUniform } from "./helper.js";
import { v4 as uuidv4 } from "uuid";

function findInflation(inflationAssumption) {
  if (inflationAssumption.type == "fixed") return inflationAssumption.fixedRate;
  else if (inflationAssumption.type == "uniform") return randomUniform(inflationAssumption.min, inflationAssumption.max);
  else {
    return randomNormal(inflationAssumption.mean, inflationAssumption.stdDev);
  }
}

function updateFedIncomeTaxBracket(federalIncomeTax, inflationRate) {
  federalIncomeTax.forEach((bracket) => {
    bracket.incomeRange[0] *= 1 + inflationRate;
    bracket.incomeRange[1] *= 1 + inflationRate;
  });
  return federalIncomeTax;
}

function updateStateIncomeTaxBracket(stateIncomeTaxBracket, inflationRate) {
  stateIncomeTaxBracket.forEach((bracket) => {
    bracket.incomeRange[0] *= 1 + inflationRate;
    bracket.incomeRange[1] *= 1 + inflationRate;
  });
  return stateIncomeTaxBracket;
}

function updateCapitalGains(capitalGains, inflationRate) {
  capitalGains.forEach((bracket) => {
    bracket.incomeRange[0] *= 1 + inflationRate;
    bracket.incomeRange[1] *= 1 + inflationRate;
  });
  return capitalGains;
}

function updateFedDeduction(fedDeduction, inflationRate) {
  fedDeduction *= 1 + inflationRate;
  return fedDeduction;
}

function findUpperFedTaxBracket(curYearFedTaxableIncome, federalIncomeTax) {
  for (let taxBracket of federalIncomeTax) {
    if (curYearFedTaxableIncome <= taxBracket.incomeRange[1]) return taxBracket.incomeRange[1];
  }
  return -1;
}

function rothConversion(scenario, year, yearTotals, federalIncomeTax, investmentTypes, investments, rothConversionStrategyInvestments, fedDeduction) {
  console.log("\nROTH CONVERSION");
  let curYearFedTaxableIncome = yearTotals.curYearIncome - 0.15 * yearTotals.curYearSS;
  // upper limit of the tax bracket user is in
  // console.log("curYearFedTaxableIncome :>> ", curYearFedTaxableIncome);
  // console.log("fedIncomeTaxBracket :>> ", federalIncomeTax);
  let u = findUpperFedTaxBracket(curYearFedTaxableIncome, federalIncomeTax);
  // roth conversation amount
  rc = u - (curYearFedTaxableIncome - fedDeduction);
  let rcCopy = rc;
  // transfer from pre-tax to after-tax retirement
  for (let investment of rothConversionStrategyInvestments) {
    if (investment.accountTaxStatus == "after-tax") continue;
    let investmentType = investmentTypes.find((type) => type._id === investment.investmentType);
    if (rc > 0) {
      console.log("rc :>> ", rc);
      //console.log("investment.value :>> ", investment.value);
      // if (investment.accountTaxStatus == "pre-tax" && rc > 0) {
      if (rc >= investment.value) {
        rc -= investment.value;
        investment.accountTaxStatus = "after-tax";
        console.log("investment ", investmentType.name, " is now after-tax account with same value");
      } else {
        investment.value -= rc;
        const newInvestmentObject = {
          _id: uuidv4(),
          investmentType: investment.investmentType,
          value: rc,
          accountTaxStatus: "after-tax",
          purchasePrice: rc,
        };
        console.log(
          "investment ",
          investmentType.name,
          " has a value of ",
          investment.value,
          " after subtracting ",
          rc,
          ". A new investment object is created with value ",
          rc,
          " and account tax status after-tax"
        );
        // save or process the object (e.g., store in another array or database)
        investments.push(newInvestmentObject); // optional, depending on your context

        // push only the ID to the scenario
        scenario.setOfInvestments.push(newInvestmentObject._id);

        rc = 0;
      }
      //  console.log('scenario.investments :>> ', scenario.setOfInvestments);
      // console.log('investments :>> ', investments);
    }
  }

  yearTotals.curYearIncome += rcCopy;
}

function updateIncomeEvents(incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, yearTotals, cashInvestment, curIncomeEvent, spouseDeath) {
  console.log("\nUPDATE INCOME EVENTS");
  for (let incomeEvent of incomeEvents) {
    console.log("incomeEvent :>> ", incomeEvent.eventSeriesName);
    if (curIncomeEvent.includes(incomeEvent)) {
      let annualChange = incomeEvent.annualChange;
      let incomeValue = incomeEvent.initialAmount;
      let amt = 0;
      if (annualChange.distribution == "none") {
        amt = annualChange.amount;
      } else if (annualChange.distribution == "uniform") {
        amt = randomUniform(annualChange.min, annualChange.max);
        console.log("uniform distribution, of min and max respectively, ", annualChange.min, " ", annualChange.max, ", amount is ", amt);
      } else {
        amt = randomNormal(annualChange.mean, annualChange.stdDev);
        console.log("normal distribution, of mean and stdDev respectively, ", annualChange.mean, " ", annualChange.stdDev, ", amount is ", amt);
      }

      if (annualChange.type == "fixed") {
        incomeValue += amt;
      } else if (annualChange.type == "percentage") {
        incomeValue *= 1 + amt * 0.01;
      }
      if (incomeEvent.inflationAdjustment) {
        console.log("inflationAdjustment is true, income value goes to ", incomeValue);
        incomeValue *= 1 + inflationRate;
      }

      if (spouseDeath) {
        incomeValue *= incomeEvent.userPercentage * 0.01;
      }

      incomeEvent.initialAmount = incomeValue;
      console.log("incomeEvent.value after :>> ", incomeEvent.initialAmount);
      cashInvestment.value += incomeValue;
      yearTotals.curYearIncome += incomeValue;
      if (incomeEvent.isSocialSecurity) {
        yearTotals.curYearSS += incomeValue; // incomeValue because social security does not apply to cash investments
      }
    } else {
      if (incomeEvent.inflationAdjustment) {
        console.log("inflationAdjustment is true, amount updates to ", incomeEvent.initialAmount);
        incomeEvent.initialAmount *= 1 + inflationRate;
      }
    }
  }
}

function updateInflationExpenses(curExpenseEvent, expenseEvent, inflationRate) {
  for (let expense of expenseEvent) {
    if (expense.inflationAdjustment) {
      if (!curExpenseEvent.includes(expense)) {
        expense.initialAmount *= 1 + inflationRate;
      }
    }
  }
}

function updateInvestmentValues(investments, investmentTypes, yearTotals) {
  console.log("\nUPDATE INVESTMENT VALUES");
  for (let investment of investments) {
    // Calculate the generated income, using the given fixed amount or percentage, or sampling from the specified probability distribution.
    let initialValue = investment.value;
    let investmentType = investmentTypes.find((type) => type._id === investment.investmentType);
    console.log("investment type name of ", investmentType.name, ", investment is ", investment.accountTaxStatus, " and value is ", investment.value);

    let annualIncome = investmentType.annualIncome;
    let income = 0;
    if (annualIncome.type == "normal") {
      income = randomNormal(annualIncome.mean, annualIncome.stdDev);
    } else if (annualIncome.type == "fixed") {
      income = annualIncome.value;
    }

    if (annualIncome.unit == "percentage") {
      income *= 1 + investment.value * 0.01;
    }

    // Add the income to curYearIncome, if the investment’s tax status is ‘non-retirement’ and the investment type’s taxability is ‘taxable’.
    if (investment.accountTaxStatus == "non-retirement" && investmentType.taxability == "taxable") {
      yearTotals.curYearIncome += income;
    }

    // Calculate the change in value, using the given fixed amount or percentage, or sampling from the specified probability distribution.
    let annualReturn = investmentType.annualReturn;
    let change = 0;
    if (annualReturn.type == "normal") {
      change = randomNormal(annualReturn.mean, annualReturn.stdDev);
    } else if (annualReturn.type == "fixed") {
      change = annualReturn.value;
    }
    if (annualReturn.unit == "percentage") {
      change = investment.value * (change * 0.01);
    }
    // Add the income to the value of the investment
    investment.value += change;
    console.log("change :>> ", change);
    yearTotals.curYearGains += change;

    // Calculate this year’s expenses, by multiplying the expense ratio and the average value of the investment
    let expenses = investmentType.expenseRatio * 0.01 * ((initialValue + investment.value) / 2);
    investment.value -= expenses;
    console.log("now its value is ", investment.value, "after subtracting an expense of ", expenses);
  }
}

function calculateLifeExpectancy(scenario) {
  let lifeExpectancyUser,
    lifeExpectancySpouse = 0;
  if (scenario.lifeExpectancy.type == "fixed") {
    lifeExpectancyUser = scenario.lifeExpectancy.fixedAge;
  } else {
    lifeExpectancyUser = randomNormal(scenario.lifeExpectancy.mean, scenario.lifeExpectancy.stdDev);
    // lifeExpectancyUser=distributions.Normal(scenario.lifeExpectancy.mean,scenario.lifeExpectancy.stdDev);
  }
  if (scenario.filingStatus != "single") {
    // fix schema
    if (scenario.lifeExpectancySpouse.type == "fixed") {
      lifeExpectancySpouse = scenario.lifeExpectancySpouse.fixedAge;
    } else {
      lifeExpectancyUser = randomNormal(scenario.lifeExpectancySpouse.mean, scenario.lifeExpectancySpouse.stdDev);
    }
  }
  return { lifeExpectancyUser, lifeExpectancySpouse };
}

export {
  findInflation,
  calculateLifeExpectancy,
  updateInvestmentValues,
  updateInflationExpenses,
  updateIncomeEvents,
  updateFedIncomeTaxBracket,
  updateStateIncomeTaxBracket,
  rothConversion,
  updateCapitalGains,
  updateFedDeduction,
};
