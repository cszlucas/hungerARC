const axios = require("axios");
const {Tax, StateTax}= require("../server/models/tax");
const Scenario = require("../server/models/scenario");
const Investment = require("../server/models/investment");
const {Income, Expense, Invest, Rebalance} = require("../server/models/eventSeries");


function calculateNormalDist(std, mean) {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

function findInflation(inflationAssumption) {
  if (inflationAssumption.type == "fixed") return inflationAssumption.fixedRate;
  else if (inflationAssumption.type == "uniform") return Math.random() * (inflationAssumption.max - inflationAssumption.min) + inflationAssumption.min;
  else {
    return calculateNormalDist(inflationAssumption.std, inflationAssumption.mean);
  }
}

function updateFedIncomeTaxBracket(fedIncomeTaxBracket, inflationRate) {
  fedIncomeTaxBracket.forEach((bracket) => {
    bracket.incomeRange[0] *= 1 + inflationRate;
    bracket.incomeRange[1] *= 1 + inflationRate;
  });
}

function updateStateIncomeTaxBracket(stateIncomeTaxBracket, inflationRate) {
  stateIncomeTaxBracket.forEach((bracket) => {
    bracket.incomeRange[0] *= 1 + inflationRate;
    bracket.incomeRange[1] *= 1 + inflationRate;
  });
}

function updateFedDeduction(fedDeduction, inflationRate) {
  fedDeduction *= 1 + inflationRate;
  return fedDeduction;
}

function updateStateDeduction(stateDeduction, inflationRate) {
  stateDeduction *= 1 + inflationRate;
  return stateDeduction;
}

function findUpperFedTaxBracket(curYearFedTaxableIncome, fedIncomeTaxBracket) {
  for (let taxBracket of fedIncomeTaxBracket) {
    if (curYearFedTaxableIncome <= taxBracket.incomeRange[1]) return taxBracket.upperBound;
  }
  return -1;
}

function rothConversion(scenario, year, curYearIncome, curYearSS, fedIncomeTaxBracket) {
  let curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS;
  // upper limit of the tax bracket user is in
  u = findUpperFedTaxBracket(curYearFedTaxableIncome, fedIncomeTaxBracket);
  // roth conversation amount
  rc = u - curYearFedTaxableIncome;
  // transfer from pre-tax to after-tax retirement
  for (let investment of scenario.rothConversionStrategyOrderPreTax) {
    if (investment.accountTaxStatus == "pre-tax retirement" && rc > 0) {
      if (rc >= investment.value) {
        rc -= investment.value;
        investment.accountTaxStatus = "after-tax retirement";
      } else {
        investment.value -= rc;
        // create new after tax investment in memory with transferred amount
        scenario.investments.push({
          investmentType: investment.investmentType,
          value: rc,
          accountTaxStatus: "after-tax retirement",
        });
        rc = 0;
      }
    }
  }
  curYearIncome += rc;
  if (year - user.birthYearUser < 59) {
    curYearEarlyWithdrawals += rc;
  }
}

function updateIncomeEvents(incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment) {
  for (let incomeEvent of incomeEvents) {
    if (incomeEvent.startYear >= year && incomeEvent.endYear <= userEndYear) {
      let annualChange = incomeEvent.annualChange;
      let incomeValue = incomeEvent.value;

      // update by annual change in amount
      if (annualChange.type == "fixed") {
        incomeValue += annualChange.amount;
      } else if (annualChange.type == "percentage") {
        incomeValue *= 1 + annualChange.amount;
      } else if (annualChange.type == "uniform") {
        incomeValue += Math.random() * (annualChange.max - annualChange.min) + annualChange.min;
        // normal distribution
      } else {
        const u = 1 - Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        incomeValue += z * annualChange.mean.std + annualChange.mean;
      }
      if (incomeEvent.inflationAdjustment) incomeValue *= 1 + inflationRate;
      // spouse is dead :(
      if (filingStatus == "marriedFilingJointly" && year > scenario.birthYearSpouse + scenario.lifeExpectancySpouse) {
        incomeValue *= incomeEvent.userPercentage;
      }
      // is this right?
      cashInvestment += incomeValue;
      curYearIncome += cashInvestment;
      if (incomeEvent.incomeType == "socialSecurity") {
        curYearSS += incomeValue; // incomeValue because social security does not apply to cash investments
      }
    }
  }
  return { curYearIncome, curYearSS, cashInvestment };
}

class DataStore {
  constructor() {
    this.taxData = this.stateTax = this.scenario = this.investment = this.income = this.expense = this.rebalance = this.invest = {};
  }
  async populateData(scenarioId) {
    const query = { id: scenarioId };
    this.taxData.data = await Tax.findOne();
    this.scenario.data = await Scenario.findOne(query);
    this.stateTax.data = await StateTax.findOne();
    this.investment.data = await Investment.findAll(query);
    this.income.data = await Income.findAll(query);
    this.expense.data = await Expense.findAll(query);
    this.invest.data = await Invest.findAll(query);
    this.rebalance.data = await Rebalance.findAll(query);
  }
  getData(property) {
    return this[property];
  }
}

function runSimulation(scenario, tax, statetax, prevYear, lifeExpectancyUser, investment, income, expense, invest, rebalance) {
  console.log("SCENARIO", scenario);
  console.log(tax);
  console.log(statetax);
  console.log(investment);
  console.log(income);
  console.log(expense);
  console.log(invest);
  console.log(rebalance);
  return;

  // previous year
  let irsLimit = scenario.irsLimits.initialAfterTax;
  let filingStatus = scenario.filingStatus;
  let state = scenario.stateResident;
  let fedIncomeTaxBracket, stateIncomeTaxBracket, fedDeduction, stateDeduction;
  // previous year's tax
  if (filingStatus == "single") {
    fedIncomeTaxBracket = tax.single.federalIncomeTaxRatesBrackets;
    fedDeduction = tax.single.standardDeductions;
    if (statetax) {
      stateIncomeTaxBracket = statetax.taxDetails[prevYear].single.stateIncomeTaxRatesBrackets;
      stateDeduction = statetax.taxDetails[prevYear].single.standardDeduction;
    }
  } else {
    fedIncomeTaxBracket = tax.marriedFilingJointly.federalIncomeTaxRatesBrackets;
    fedDeduction = tax.marriedFilingJointly.standardDeduction;
    if (statetax) {
      stateIncomeTaxBracket = statetax.taxDetails[prevYear].single.stateIncomeTaxRatesBrackets;
      stateDeduction = statetax.taxDetails[prevYear].single.standardDeduction;
    }
  }
  let currentYear = new Date().getFullYear();
  let incomeEvents = scenario.incomeEventSeries;
  let userEndYear = scenario.birthYearUser + lifeExpectancyUser;
  // //save initial value and purchase price of investments
  for (let invest of investment) {
    invest.purchasePrice = invest.value;
  }

  for (let year = currentYear; year <= 2027; year++) {
    // for (let year = currentYear; year <= userEndYear; year++) {
    // PRELIMINARIES
    // can differ each year if sampled from distribution
    inflationRate = findInflation(scenario.inflationAssumption) * 0.01;
    federalIncomeTax = updateFedIncomeTaxBracket(fedIncomeTaxBracket, inflationRate);

    fedDeduction = updateFedDeduction(fedDeduction, inflationRate);

    if (statetax) {
      updateStateIncomeTaxBracket(stateIncomeTaxBracket, inflationRate);
    }
    // retirement account limit - after tax
    irsLimit *= 1 + inflationRate;

    // RUN INCOME EVENTS
    // let curYearIncome = 0;
    // let curYearSS = 0;
    // let curYearEarlyWithdrawals = 0;
    // let curYearGains = 0;
    // let cashInvestment = scenario.investments.cashInvestment;
    // ({ curYearIncome, curYearSS, cashInvestment } = updateIncomeEvents(incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment));
    // console.log('curYearIncome :>> ', curYearIncome);
    // console.log('curYearSS :>> ', curYearSS);
    // console.log('cashInvestment :>> ', cashInvestment);

    //   // PERFORM RMD FOR PREVIOUS YEAR
    //   performRMDs(scenario, RMDStrategyInvestOrder, currYearIncome, currYear);
    //   // UPDATE INVESTMENT VALUES

    //   // RUN ROTH CONVERSION IF ENABLED
    //   if (scenario.optimizerSettings && year >= scenario.optimizerSettings.startYear && year <= scenario.optimizerSettings.endYear) {
    //     rothConversion(scenario, year, curYearIncome, curYearSS, fedIncomeTaxBracket);
    //   }

    //   // PAY NON-DISCRETIONARY EXPENSES AND PREVIOUS YEAR TAXES
    //   payNonDiscretionaryExpenses(scenario, cashInvestment, currYearIncome, currYearSS, curYearGains, curYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, ssRange);
    //   // PAY DISCRETIONARY EXPENSES
    //   payDiscretionaryExpenses(scenario, cashInvestment);
    //   // RUN INVEST EVENT
    //   runInvestStrategy(scenario, cashInvestment, IRSLimits);
    //   // RUN REBALANCE EVENT
    //   rebalance(scenario, curYearGains);

    prevYear += 1;
  }
}

function calculateLifeExpectancy(scenario) {
  let lifeExpectancyUser, lifeExpectancySpouse;
  if (scenario.lifeExpectancy.type == "fixed") {
    lifeExpectancyUser = scenario.lifeExpectancy.fixedAge;
  } else {
    lifeExpectancyUser = calculateNormalDist(scenario.lifeExpectancy.stdDev, scenario.lifeExpectancy.mean);
    // lifeExpectancyUser=distributions.Normal(scenario.lifeExpectancy.mean,scenario.lifeExpectancy.stdDev);
  }
  if (scenario.filingStatus != "single") {
    // fix schema
    if (scenario.spouseLifeExpectancy.type == "fixed") {
      lifeExpectancySpouse = scenario.spouselifeExpectancy.fixedAge;
    } else {
      lifeExpectancyUser = calculateNormalDist(scenario.spouseLifeExpectancy.stdDev, scenario.spouseLifeExpectancy.mean);
    }
  }
  return { lifeExpectancyUser, lifeExpectancySpouse };
}



async function main(numScenarioTimes) {
  // not sure how to get a value using this, not needed
  var distributions = require("distributions");
  const dataStore = new DataStore();
  await Promise.all([dataStore.populateData('67df22db4996aba7bb6e8d73')]);

  const { taxData, scenario, stateTax, invest, income, expense, rebalance, investment } = {
    taxData: dataStore.getData("taxData"),
    scenario: dataStore.getData("scenario"),
    stateTax: dataStore.getData("stateTax"),
    invest: dataStore.getData("invest"),
    income: dataStore.getData("income"),
    expense: dataStore.getData("expense"),
    rebalance: dataStore.getData("rebalance"),
    investment: dataStore.getData("investment")
  };
  
  // const investment = dataStore.getInvestment();
  const prevYear = (new Date().getFullYear() - 1).toString();

  //calculate life expectancy
  const { lifeExpectancyUser, lifeExpectancySpouse } = calculateLifeExpectancy(scenario);
  for (let x = 0; x < numScenarioTimes; x++) {
    const clonedData = {
      scenario: JSON.parse(JSON.stringify(scenario)),
      stateTax: JSON.parse(JSON.stringify(stateTax)),
      investment: JSON.parse(JSON.stringify(investment)),
      expense: JSON.parse(JSON.stringify(expense)),
      income: JSON.parse(JSON.stringify(income)),
      invest: JSON.parse(JSON.stringify(invest)),
      rebalance: JSON.parse(JSON.stringify(rebalance)),
      investmentType: JSON.parse(JSON.stringify(investmentType)),
    };

    runSimulation(
      clonedData.scenario,
      clonedData.stateTax,
      clonedData.tax,
      prevYear,
      lifeExpectancyUser,
      clonedData.investment,
      clonedData.income,
      clonedData.expense,
      clonedData.invest,
      clonedData.rebalance
    );
  }
}

// Call the main function to execute everything
main(1);
