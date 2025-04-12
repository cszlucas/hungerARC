const mongoose = require("mongoose");
// const StateTax = require("../server/importStateYaml.js");
const StateTax = require("../server/models/stateTax.js");
const Tax = require("../server/models/tax.js");
const Scenario = require("../server/models/scenario");
const Investment = require("../server/models/investment");
const InvestmentType = require("../server/models/investmentType");
const { IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent } = require("../server/models/eventSeries");
const { performRMDs, payNonDiscretionaryExpenses, payDiscretionaryExpenses, runInvestStrategy, rebalance } = require("./main.js");
const {getCurrentEvent, getStrategy} = require("./format.js");

function calculateNormalDist(std, mean) {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

function calculateUniformDist(min, max) {
  return Math.random() * (max - min) + min;
}

function findInflation(inflationAssumption) {
  if (inflationAssumption.type == "fixed") return inflationAssumption.fixedRate;
  else if (inflationAssumption.type == "uniform") return calculateUniformDist(inflationAssumption.min, inflationAssumption.max);
  else {
    return calculateNormalDist(inflationAssumption.std, inflationAssumption.mean);
  }
}

function updateFedIncomeTaxBracket(fedIncomeTaxBracket, inflationRate) {
  fedIncomeTaxBracket.forEach((bracket) => {
    bracket.incomeRange[0] *= 1 + inflationRate;
    bracket.incomeRange[1] *= 1 + inflationRate;
  });
  return fedIncomeTaxBracket;
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

function updateStateDeduction(stateDeduction, inflationRate) {
  stateDeduction *= 1 + inflationRate;
  return stateDeduction;
}

function findUpperFedTaxBracket(curYearFedTaxableIncome, fedIncomeTaxBracket) {
  for (let taxBracket of fedIncomeTaxBracket) {
    if (curYearFedTaxableIncome <= taxBracket.incomeRange[1]) return taxBracket.incomeRange[1];
  }
  return -1;
}

function rothConversion(scenario, year, curYearIncome, curYearSS, fedIncomeTaxBracket) {
  let curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS;
  // upper limit of the tax bracket user is in
  console.log("curYearFedTaxableIncome :>> ", curYearFedTaxableIncome);
  console.log("fedIncomeTaxBracket :>> ", fedIncomeTaxBracket);
  let u = findUpperFedTaxBracket(curYearFedTaxableIncome, fedIncomeTaxBracket);
  // roth conversation amount
  rc = u - curYearFedTaxableIncome;
  console.log("u :>> ", u);
  console.log("rc :>> ", rc);
  // transfer from pre-tax to after-tax retirement
  // for (let investment of scenario.rothConversionStrategy) {
  //   if (investment.accountTaxStatus == "pre-tax" && rc > 0) {
  //     if (rc >= investment.value) {
  //       rc -= investment.value;
  //       investment.accountTaxStatus = "after-tax";
  //     } else {
  //       investment.value -= rc;
  //       // create new after tax investment in memory with transferred amount
  //       scenario.investments.push({
  //         investmentType: investment.investmentType,
  //         value: rc,
  //         accountTaxStatus: "after-tax",
  //       });
  //       rc = 0;
  //     }
  //   }
  // }
  // curYearIncome += rc;
  // if (year - user.birthYearUser < 59) {
  //   curYearEarlyWithdrawals += rc;
  // }
}
// incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment);

function updateIncomeEvents(incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment) {
  for (let incomeEvent of incomeEvents) {
    // console.log('incomeEvent.initialAmt IS HERE :>> ', incomeEvent.initialAmount);

    startYear = incomeEvent.startYearCalc;
    endYear = incomeEvent.startYearCalc + incomeEvent.durationCalc;
    if (year >= startYear && year <= endYear && endYear <= userEndYear) {
      let annualChange = incomeEvent.annualChange;
      let incomeValue = incomeEvent.initialAmount;
      // console.log('incomeValue :>> ', incomeValue);
      // console.log('inflationRate :>> ', inflationRate);
      let amt = 0;
      if (annualChange.distribution == "none") {
        amt = annualChange.amount;
      } else if (annualChange.distribution == "uniform") {
        amt = calculateUniformDist(annualChange.min, annualChange.max);
      } else {
        amt = calculateNormalDist(annualChange.stdDev, annualChange.mean);
      }

      if (annualChange.type == "fixed") {
        incomeValue += amt;
      } else if (annualChange.type == "percentage") {
        incomeValue *= 1 + amt * 0.01;
      }
      if (incomeEvent.inflationAdjustment) incomeValue *= 1 + inflationRate;

      // is this set before or after inflation adjustment?
      incomeEvent.initialAmount = incomeValue;

      if (filingStatus == "marriedFilingJointly" && year > scenario.birthYearSpouse + scenario.lifeExpectancySpouse) {
        incomeValue *= incomeEvent.userPercentage * 0.01;
      }

      cashInvestment += incomeValue;
      curYearIncome += cashInvestment;
      if (incomeEvent.isSocialSecurity) {
        curYearSS += incomeValue; // incomeValue because social security does not apply to cash investments
      }
    }
  }
  return { curYearIncome, curYearSS, cashInvestment };
}

class DataStore {
  constructor() {
    this.taxData = this.stateTax = this.scenario = this.investment = this.income = this.expense = this.rebalance = this.invest = this.investmentType = {};
  }
  async populateData(scenarioId) {
    const query = { _id: new mongoose.Types.ObjectId(scenarioId) };
    try {
      const scenario = await Scenario.findOne(query);
      if (!scenario) {
        console.log("Scenario not found");
        return;
      }
      this.scenario = scenario;
      const investment = await Investment.find({
        _id: { $in: scenario.setOfInvestments },
      });
      investment.purchasePrice = 0;
      this.investment = investment;
      const income = await IncomeEvent.find({
        _id: { $in: scenario.incomeEventSeries },
      });
      this.income = income;
      const expense = await ExpenseEvent.find({
        _id: { $in: scenario.expenseEventSeries },
      });
      this.expense = expense;
      const invest = await InvestEvent.find({
        _id: { $in: scenario.investEventSeries },
      });
      this.invest = invest;
      const rebalance = await RebalanceEvent.find({
        _id: { $in: scenario.rebalanceEventSeries },
      });
      this.rebalance = rebalance;
      const tax = await Tax.find();
      this.taxData = tax;
      const stateTax = await StateTax.find();
      this.stateTax = stateTax;
      const investmentType = await InvestmentType.find({
        _id: { $in: scenario.setOfInvestmentTypes },
      });
      this.investmentType = investmentType;
    } catch (err) {
      console.log("Error while populating data:", err);
    }
  }

  getData(property) {
    return this[property];
  }
}

async function runSimulation(scenario, tax, stateTax, prevYear, lifeExpectancyUser, investments, incomeEvent, expenseEvent, investEvent, rebalanceEvent, investmentTypes) {
  // previous year
  let irsLimit = scenario.irsLimit;
  let filingStatus = scenario.filingStatus;
  let state = scenario.stateResident;
  let fedIncomeTaxBracket, stateIncomeTaxBracket, fedDeduction, stateDeduction, capitalGains;
  // previous year's tax
  if (filingStatus == "single") {
    fedIncomeTaxBracket = tax.single.federalIncomeTaxRatesBrackets;
    fedDeduction = tax.single.standardDeductions;
    capitalGains = tax.single.capitalGainsTaxRates;
    if (stateTax) {
      stateIncomeTaxBracket = stateTax.taxDetails[prevYear].single.stateIncomeTaxRatesBrackets;
      stateDeduction = stateTax.taxDetails[prevYear].single.standardDeduction;
    }
  } else {
    fedIncomeTaxBracket = tax.marriedFilingJointly.federalIncomeTaxRatesBrackets;
    fedDeduction = tax.marriedFilingJointly.standardDeduction;
    capitalGains = tax.marriedFilingJointly.capitalGainsTaxRates;
    if (stateTax) {
      stateIncomeTaxBracket = stateTax.taxDetails[prevYear].single.stateIncomeTaxRatesBrackets;
      stateDeduction = stateTax.taxDetails[prevYear].single.standardDeduction;
    }
  }
  //console.log("capitalGains :>> ", capitalGains);
  let currentYear = new Date().getFullYear();
  // let incomeEvents = scenario.incomeEventSeries;
  let userEndYear = scenario.birthYearUser + lifeExpectancyUser;
  // console.log("user end year: ", userEndYear);
  // //save initial value and purchase price of investments
  for (let invest of investments) {
    invest.purchasePrice = invest.value;
  }

  // calculate the start year and duration of each income event
  for (let income of incomeEvent) {
    let startYear, duration;
    if (income.startYear.type == "fixedAmt") {
      startYear = income.startYear.value;
    } else if (income.startYear.type == "uniform") {
      startYear = calculateUniformDist(income.startYear.min, income.startYear.max);
    } else if (income.startYear.type == "normal") {
      startYear = calculateNormalDist(income.startYear.stdDev, income.startYear.mean);
    } else {
      startYear = year;
    }

    if (income.duration.type == "fixedAmt") {
      duration = income.duration.value;
    } else if (income.duration.type == "uniform") {
      duration = calculateUniformDist(income.duration.min, income.duration.max);
    } else {
      duration = calculateNormalDist(income.duration.stdDev, income.duration.mean);
    }
    income.startYearCalc = startYear;
    income.durationCalc = duration;
  }

  // manually adjusted for testing, should be year <= userEndYear !!
  for (let year = currentYear; year <= 2025; year++) {
    let { curIncomeEvent, curExpenseEvent, curInvestEvent, curRebalanceEvent } = getCurrentEvent(year, incomeEvent, expenseEvent, investEvent, rebalanceEvent);
    let { RMDStrategyInvestOrder, withdrawalStrategy, spendingStrategy, investStrategy, rebalanceStrategy } = getStrategy(scenario, investments, curExpenseEvent, curInvestEvent, curRebalanceEvent, year);

    // PRELIMINARIES
    // can differ each year if sampled from distribution
    inflationRate = findInflation(scenario.inflationAssumption) * 0.01;
    // console.log('fedIncomeTaxBracket :>> ', fedIncomeTaxBracket);
    // console.log('inflationRate :>> ', inflationRate);
    federalIncomeTax = updateFedIncomeTaxBracket(fedIncomeTaxBracket, inflationRate);
    //console.log("fedIncomeTaxBracket :>> ", fedIncomeTaxBracket);
    // console.log('federalIncomeTax HERE  :>> ', federalIncomeTax);
    fedDeduction = updateFedDeduction(fedDeduction, inflationRate);
    capitalGains = updateCapitalGains(capitalGains, inflationRate);
    //console.log("UPDATED capitalGains :>> ", capitalGains);
    if (stateTax) {
      updateStateIncomeTaxBracket(stateIncomeTaxBracket, inflationRate);
    }
    // retirement account limit - after tax
    irsLimit *= 1 + inflationRate;

    // RUN INCOME EVENTS
    let curYearIncome = 0;
    let curYearSS = 0;
    let curYearEarlyWithdrawals = 0;
    let curYearGains = 0;

    let cashInvestmentType = investmentTypes.find((inv) => inv.name === "Cash");
    let cashInvestment = 0;
    if (cashInvestmentType) {
      let cashId = cashInvestmentType._id;
      let foundById = investments.find((inv) => inv.investmentType === cashId);
      cashInvestment = foundById.value;
    }

    ({ curYearIncome, curYearSS, cashInvestment } = updateIncomeEvents(incomeEvent, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment));
    console.log("curYearIncome :>> ", curYearIncome);
    console.log("curYearSS :>> ", curYearSS);
    console.log("cashInvestment :>> ", cashInvestment);

    //   // PERFORM RMD FOR PREVIOUS YEAR
    const userAge = year - scenario.birthYearUser;
    //investments = await performRMDs(investments, curYearIncome, userAge, RMDStrategyInvestOrder);
    //   // UPDATE INVESTMENT VALUES

    // RUN ROTH CONVERSION IF ENABLED
    if (scenario.optimizerSettings.enabled && year >= scenario.optimizerSettings.startYear && year <= scenario.optimizerSettings.endYear) {
      //rothConversion(scenario, year, curYearIncome, curYearSS, fedIncomeTaxBracket);
    }

    //   // PAY NON-DISCRETIONARY EXPENSES AND PREVIOUS YEAR TAXES
    curYearSS = 20;
    curYearGains = 30;
    curYearEarlyWithdrawals = 30;
    curYearIncome = 200;
    //cashInvestment = 5000;
    //payNonDiscretionaryExpenses(curExpenseEvent, investments, cashInvestment, curYearIncome, curYearSS, curYearGains, curYearEarlyWithdrawals, federalIncomeTax, stateIncomeTaxBracket, year, userAge, capitalGains, withdrawalStrategy);


    //   // PAY DISCRETIONARY EXPENSES
    //payDiscretionaryExpenses(scenario, cashInvestment, year, userAge, spendingStrategy, withdrawalStrategy, curYearGains, curYearIncome, curYearEarlyWithdrawals);


    //   // RUN INVEST EVENT
    runInvestStrategy(cashInvestment, irsLimit, year, investments, investStrategy);


    //   // RUN REBALANCE EVENT
    //let rebalanceStrategy = getRebalanceStrategy(type)
    //rebalance(curYearGains, investments, year, rebalanceStrategy); //get strategy for each type

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

async function main(numScenarioTimes, scenarioId) {
  // not sure how to get a value using this, not needed
  var distributions = require("distributions");
  const dataStore = new DataStore();
  await Promise.all([dataStore.populateData(scenarioId)]);

  const { taxData, scenario, stateTax, invest, income, expense, rebalance, investment, investmentType } = {
    taxData: dataStore.getData("taxData"),
    scenario: dataStore.getData("scenario"),
    stateTax: dataStore.getData("stateTax"),
    invest: dataStore.getData("invest"),
    income: dataStore.getData("income"),
    expense: dataStore.getData("expense"),
    rebalance: dataStore.getData("rebalance"),
    investment: dataStore.getData("investment"),
    investmentType: dataStore.getData("investmentType"),
  };
  // console.log("scenario: ", scenario);
  // console.log("stateTax :>> ", stateTax);
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
      taxData: JSON.parse(JSON.stringify(taxData)),
      investmentType: JSON.parse(JSON.stringify(investmentType)),
    };
    runSimulation(
      clonedData.scenario,
      clonedData.taxData[0],
      clonedData.stateTax[0],
      prevYear,
      lifeExpectancyUser,
      clonedData.investment,
      clonedData.income,
      clonedData.expense,
      clonedData.invest,
      clonedData.rebalance,
      clonedData.investmentType
    );
  }
}

// Call the main function to execute everything
main(1, "67df22db4996aba7bb6e8d73");
