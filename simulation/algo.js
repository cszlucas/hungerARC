const { randomNormal, randomUniform } = require('./helper.js');
const { ObjectId } = require('mongodb');
const { logFinancialEvent, printIncomeEvents, printInvestments } = require("./logs.js");

// const formatCurrency = (val) => (typeof val === "number" ? `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : val ?? "");
function formatCurrency(val) {
  if (typeof val === "number") {
    return `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  } else {
    return val ?? "";
  }
}
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
 // console.log("u :>> ", u);
  console.log("fedDeduction :>> ", fedDeduction);
  console.log("curYearFedTaxableIncome :>> ", curYearFedTaxableIncome);
  let rc = u - (curYearFedTaxableIncome - fedDeduction);
  let rcCopy = rc;

  logFinancialEvent({
    year: year,
    type: "roth conversion",
    description: `Amount of Roth conversion is ${formatCurrency(rc)}`,
  });

  if(rothConversionStrategyInvestments.length==0){
    logFinancialEvent({
      year: year,
      type: "roth conversion",
      description: "There are no investments for Roth conversion.",
    });
  }
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
        console.log("investment ID ", investmentType.name, " is now after-tax account with same value");
        logFinancialEvent({
          year: year,
          type: "roth conversion",
          description: `Investment ID ${investmentType._id} is now an after-tax account with same value of ${formatCurrency(investment.value)}. RC becomes ${formatCurrency(rc)}`,
        });
      } else {
        investment.value -= rc;
        const newInvestmentObject = {
          _id: new ObjectId(),
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
        logFinancialEvent({
          year: year,
          type: "roth conversion",
          description: `Investment ID ${investmentType._id} is partially transferred, value is now ${formatCurrency(investment.value)} after
            subtracting ${formatCurrency(rc)}. A new investment object is created with value ${formatCurrency(rc)} and account tax status after-tax. RC becomes 0`,
        });
        rc = 0;
      }
      //  console.log('scenario.investments :>> ', scenario.setOfInvestments);
      // console.log('investments :>> ', investments);
    }
  }

  yearTotals.curYearIncome += rcCopy;
  logFinancialEvent({
    year: year,
    type: "roth conversion",
    description: `CurYearIncome changes from ${formatCurrency(yearTotals.curYearIncome - rcCopy)} to ${formatCurrency(yearTotals.curYearIncome)}`,
  });
  logFinancialEvent({
    year: year,
    type: "roth conversion",
    description: "Roth conversion has now been done.",
  });
}

function updateIncomeEvents(incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, yearTotals, cashInvestment, curIncomeEvent, spouseDeath) {
  console.log("\nUPDATE INCOME EVENTS");
  logFinancialEvent({
    year: year,
    type: "income",
    description: "The income events before running it.",
  });
  printIncomeEvents(incomeEvents, year, "income", "income", inflationRate, spouseDeath);

  for (let incomeEvent of incomeEvents) {
    // log income event detail
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

        console.log('amt :>> ', amt);
        console.log("normal distribution, of mean and stdDev respectively, ", annualChange.mean, " ", annualChange.stdDev, ", amount is ", amt);
      }

      if (annualChange.type == "fixed") {
        incomeValue += amt;
      } else if (annualChange.type == "percentage") {
        incomeValue *= 1 + amt;
      }
      if (incomeEvent.inflationAdjustment) {
        console.log("inflationAdjustment is true, income value goes to ", incomeValue);
        incomeValue *= 1 + inflationRate;
      }

      if (spouseDeath) {
        incomeValue *= incomeEvent.userPercentage;
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
  logFinancialEvent({
    year: year,
    type: "income",
    description: "The income events after running it.",
  });
  printIncomeEvents(incomeEvents, year, "income", "income", inflationRate, spouseDeath);
  logFinancialEvent({
    year: year,
    type: "income",
    description: "The income has now been done.",
  });
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

function updateInvestmentValues(investments, investmentTypes, yearTotals, year) {
  console.log("\nUPDATE INVESTMENT VALUES");
  logFinancialEvent({
    year: year,
    type: "investment",
    description: "The investment before updating values.",
  });
  printInvestments(investments, year, "investment", "investments");

  for (let investment of investments) {
    // Calculate the generated income, using the given fixed amount or percentage, or sampling from the specified probability distribution.
    let initialValue = investment.value;
    let investmentType = investmentTypes.find((type) => type._id === investment.investmentType);
    console.log("investment type name of ", investmentType.name, ", investment is ", investment.accountTaxStatus, " and value is ", formatCurrency(investment.value));

    let annualIncome = investmentType.annualIncome;
    let income = 0;
    if (annualIncome.type == "normal") {
      income = randomNormal(annualIncome.mean, annualIncome.stdDev);
    } else if (annualIncome.type == "fixed") {
      income = annualIncome.value;
    }

    if (annualIncome.unit == "percentage") {
      income *= 1 + investment.value;
    }
    // Add the income to curYearIncome, if the investment’s tax status is ‘non-retirement’ and the investment type’s taxability is ‘taxable’.
    if (investment.accountTaxStatus == "non-retirement" && investmentType.taxability==true) {
      let curYearIncome = yearTotals.curYearIncome;
      yearTotals.curYearIncome += income;
      logFinancialEvent({
        year: year,
        type: "investment",
        description: `CurYearIncome changes from ${formatCurrency(curYearIncome)} to ${formatCurrency(yearTotals.curYearIncome)} from `,
        details: {
          ID: investment._id,
          type: "curYearIncome",
          taxStatus: investment.accountTaxStatus,
        }
      });
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
      change = investment.value * (change);
    }
    // Add the income to the value of the investment
    investment.value += change;
    console.log("change :>> ", change);
    let prevYearGains = yearTotals.curYearGains;
    yearTotals.curYearGains += change;
    if (change != 0){
      logFinancialEvent({
        year: year,
        type: "investment",
        description: `CurYearGains changes from ${formatCurrency(prevYearGains)} to ${formatCurrency(yearTotals.curYearGains)}  with Investment ID ${investment._id}`,
      });
    }
    // Calculate this year’s expenses, by multiplying the expense ratio and the average value of the investment
    let expenses = investmentType.expenseRatio * ((initialValue + investment.value) / 2);
    if(investmentType.name=="Cash" || investmentType.name=="cash"){
    console.log('investment of CASH :>> ', investment);
    }
    investment.value -= expenses;
    console.log("now its value is ", investment.value, "after subtracting an expense of ", expenses);
  }
  logFinancialEvent({
    year: year,
    type: "investment",
    description: "The investment after updating values.",
  });
  printInvestments(investments, year, "investment", "investments");
  logFinancialEvent({
    year: year,
    type: "investment",
    description: "Updating investment values has now been done.",
  });
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

module.exports = {
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
