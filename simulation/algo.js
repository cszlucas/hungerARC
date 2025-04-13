const mongoose = require("mongoose");
// const StateTax = require("../server/importStateYaml.js");
const StateTax = require("../server/models/stateTax.js");
const Tax = require("../server/models/tax.js");
const Scenario = require("../server/models/scenario");
const Investment = require("../server/models/investment");
const InvestmentType = require("../server/models/investmentType");
const { IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent } = require("../server/models/eventSeries");
const { performRMDs, payNonDiscretionaryExpenses, payDiscretionaryExpenses, runInvestStrategy, rebalance } = require("./main.js");
const { getCurrentEvent, getStrategy, getRebalanceStrategy, setValues } = require("./format.js");

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

function updateStateDeduction(stateDeduction, inflationRate) {
  stateDeduction *= 1 + inflationRate;
  return stateDeduction;
}

function findUpperFedTaxBracket(curYearFedTaxableIncome, federalIncomeTax) {
  for (let taxBracket of federalIncomeTax) {
    if (curYearFedTaxableIncome <= taxBracket.incomeRange[1]) return taxBracket.incomeRange[1];
  }
  return -1;
}

function rothConversion(scenario, year, curYearIncome, curYearSS, federalIncomeTax, investmentTypes, investments, curYearEarlyWithdrawals, rothConversionStrategyInvestments) {
  let curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS;
  // upper limit of the tax bracket user is in
  // console.log("curYearFedTaxableIncome :>> ", curYearFedTaxableIncome);
  // console.log("fedIncomeTaxBracket :>> ", federalIncomeTax);
  let u = findUpperFedTaxBracket(curYearFedTaxableIncome, federalIncomeTax);
  // roth conversation amount
  rc = u - curYearFedTaxableIncome;
  //console.log("u :>> ", u);
  //console.log("rc :>> ", rc);
  // transfer from pre-tax to after-tax retirement
  for (let investment of rothConversionStrategyInvestments) {
    if (rc > 0) {
      //console.log("rc :>> ", rc);
      //console.log("investment.value :>> ", investment.value);
      // if (investment.accountTaxStatus == "pre-tax" && rc > 0) {
      if (rc >= investment.value) {
        rc -= investment.value;
        investment.accountTaxStatus = "after-tax";
      } else {
        investment.value -= rc;
        const newInvestmentObject = {
          _id: uuidv4(),
          investmentType: investment.investmentType,
          // investmentType: investmentTypes.find(type => type._id === investment.investmentType),
          value: rc,
          accountTaxStatus: "after-tax",
          // is this needed?
          purchasePrice: rc,
        };

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
  // console.log('scenario.investments :>> ', scenario.setOfInvestments);
  // console.log('investments :>> ', investments);
  curYearIncome += rc;
  return curYearIncome;
}
// incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment);

function updateIncomeEvents(incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment) {
  for (let incomeEvent of incomeEvents) {
      let annualChange = incomeEvent.annualChange;
      let incomeValue = incomeEvent.initialAmount;
      console.log('incomeValue :>> ', incomeValue);
      console.log('inflationRate :>> ', inflationRate);
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

      if (filingStatus == "marriedFilingJointly" && year > scenario.birthYearSpouse + scenario.lifeExpectancySpouse) {
        incomeValue *= incomeEvent.userPercentage * 0.01;
      }

      incomeEvent.initialAmount = incomeValue;

      cashInvestment += incomeValue;
      curYearIncome += incomeValue;
      if (incomeEvent.isSocialSecurity) {
        curYearSS += incomeValue; // incomeValue because social security does not apply to cash investments
      }
  }
  return { curYearIncome, curYearSS, cashInvestment };
}


function updateInvestmentValues(investments, investmentTypes, curYearIncome, curYearGains) {
  for(let investment of investments){
  // Calculate the generated income, using the given fixed amount or percentage, or sampling from the specified probability distribution.  
    let initialValue = investment.value;
    let investmentType = investmentTypes.find(type => type._id === investment.investmentType);
    let annualIncome = investmentType.annualIncome;
    let income = 0;
    if (annualIncome.type == "normal") {
      income = calculateNormalDist(annualIncome.stdDev, annualIncome.mean);
    } else if (annualIncome.type == "fixed") {
      income = annualIncome.value;
    }

    if (annualIncome.unit == "percentage") {
      income = investment.value * (1 + (income * 0.01));
    }
  
  // Add the income to curYearIncome, if the investment’s tax status is ‘non-retirement’ and the investment type’s taxability is ‘taxable’. 
    if (investment.accountTaxStatus == "non-tax" && investmentType.taxability == "taxable") {
      curYearIncome += income;
    } 

  // Calculate the change in value, using the given fixed amount or percentage, or sampling from the specified probability distribution.
    let annualReturn = investmentType.annualReturn; 
    let change = 0;
    if (annualReturn.type == "normal") {
      change = calculateNormalDist(annualReturn.stdDev, annualReturn.mean);
    } else if (annualReturn.type == "fixed") {
      change = annualReturn.value;
    }
    if (annualReturn.unit == "percentage") {
      change = investment.value * ((change * 0.01));
    } 
  // Add the income to the value of the investment
    investment.value += change;
    curYearGains += change;
  // Calculate this year’s expenses, by multiplying the expense ratio and the average value of the investment
    let expenses = investmentType.expenseRatio * ((initialValue + investment.value) / 2);
    investment.value -= expenses;
  }
  return {curYearIncome, curYearGains};
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
  let federalIncomeTax, stateIncomeTaxBracket, fedDeduction, stateDeduction, capitalGains;
  // previous year's tax
  if (filingStatus == "single") {
    federalIncomeTax = tax.single.federalIncomeTaxRatesBrackets;
    fedDeduction = tax.single.standardDeductions;
    capitalGains = tax.single.capitalGainsTaxRates;
    if (stateTax) {
      stateIncomeTaxBracket = stateTax.taxDetails[prevYear].single.stateIncomeTaxRatesBrackets;
      stateDeduction = stateTax.taxDetails[prevYear].single.standardDeduction;
    }
  } else {
    federalIncomeTax = tax.marriedFilingJointly.federalIncomeTaxRatesBrackets;
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

  setValues([...incomeEvent, ...expenseEvent, ...investEvent, ...rebalanceEvent]);
  // console.log("incomeEvent :>> ", incomeEvent);
  let sumInvestmentsPreTaxRMD = 0;
  let yearTotals = {
    curYearGains: 0,
    curYearSS: 0,
    curYearIncome: 0,
    curYearEarlyWithdrawals: 0
  };  
  let prevYearIncome = 0;
  let prevYearSS = 0;
  let prevYearEarlyWithdrawals = 0;
  let prevYearGains = 0;

  //  // SIMULATION LOOP  
  // manually adjusted for testing, should be year <= userEndYear !!
  for (let year = currentYear; year <= 2026; year++) {
    console.log("\nSIMULATION YEAR", year);
    inflationRate = findInflation(scenario.inflationAssumption) * 0.01;
    let { curIncomeEvent, curExpenseEvent, curInvestEvent, curRebalanceEvent } = getCurrentEvent(year, incomeEvent, expenseEvent, investEvent, rebalanceEvent);
    let { RMDStrategyInvestOrder, withdrawalStrategy, spendingStrategy, investStrategy } = getStrategy(scenario, investments, curExpenseEvent, curInvestEvent, year);
    // console.log("curIncomeEvent :>> ", curIncomeEvent);
    // console.log("curExpenseEvent :>> ", curExpenseEvent);
    // console.log("curInvestEvent :>> ", curInvestEvent);
    // console.log("curRebalanceEvent :>> ", curRebalanceEvent);

    // RUN INCOME EVENTS
    let cashInvestmentType = investmentTypes.find((inv) => inv.name === "Cash");
    let cashInvestment = 0;
    if (cashInvestmentType) {
      let cashId = cashInvestmentType._id;
      let foundById = investments.find((inv) => inv.investmentType === cashId);
      cashInvestment = foundById.value;
    }
    // console.log('curIncomeEvent :>> ', curIncomeEvent);
    ({ curYearIncome, curYearSS, cashInvestment } = updateIncomeEvents(curIncomeEvent, year, userEndYear, inflationRate, filingStatus, scenario, yearTotals.curYearIncome, yearTotals.curYearSS, cashInvestment));
    // console.log("curYearIncome :>> ", curYearIncome);
    // console.log("curYearSS :>> ", curYearSS);
    // console.log("cashInvestment :>> ", cashInvestment);
    //   // PERFORM RMD FOR PREVIOUS YEAR
    const userAge = year - scenario.birthYearUser;
    investments = await performRMDs(investments, yearTotals.curYearIncome, userAge, RMDStrategyInvestOrder, sumInvestmentsPreTaxRMD);
    sumInvestmentsPreTaxRMD = 0;
   
    //   // UPDATE INVESTMENT VALUES
    ({ curYearIncome, curYearGains } = updateInvestmentValues(investments, investmentTypes, yearTotals.curYearIncome, yearTotals.curYearGains));

    // find all the investment objects by the roth conversion strategy ids
    let rothConversionStrategyInvestments = [];
    for (let investment of scenario.rothConversionStrategy) {
      let foundInvestment = investments.find((inv) => inv._id === investment);
      if (foundInvestment) {
        rothConversionStrategyInvestments.push(foundInvestment);
      }
    }

    // RUN ROTH CONVERSION IF ENABLED
    if (scenario.optimizerSettings.enabled && year >= scenario.optimizerSettings.startYear && year <= scenario.optimizerSettings.endYear) {
      curYearIncome = rothConversion(scenario, year, yearTotals.curYearIncome, yearTotals.curYearSS, federalIncomeTax, investmentTypes, investments, yearTotals.curYearEarlyWithdrawals, rothConversionStrategyInvestments);
    }

    //   // PAY NON-DISCRETIONARY EXPENSES AND PREVIOUS YEAR TAXES
    payNonDiscretionaryExpenses(curExpenseEvent, cashInvestment, prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeTax, stateIncomeTaxBracket, fedDeduction, year, userAge, capitalGains, withdrawalStrategy, yearTotals, inflationRate);

    //   // PAY DISCRETIONARY EXPENSES

    payDiscretionaryExpenses(scenario.financialGoal, cashInvestment, year, userAge, spendingStrategy, withdrawalStrategy, yearTotals, inflationRate);

    //   // RUN INVEST EVENT
    // runInvestStrategy(cashInvestment, irsLimit, year, investments, investStrategy);

    //   // RUN REBALANCE EVENT
    // let types = ["pre-tax", "after-tax", "non-retirement"];
    // for (let type of types) {
    //   let rebalanceStrategy = getRebalanceStrategy(scenario, curRebalanceEvent, type, year);
    //   if (rebalanceStrategy.length != 0) {
    //     rebalance(curYearGains, investments, year, rebalanceStrategy);
    //   }
    // }

     // PRELIMINARIES
    // can differ each year if sampled from distribution
    federalIncomeTax = updateFedIncomeTaxBracket(federalIncomeTax, inflationRate);
    fedDeduction = updateFedDeduction(fedDeduction, inflationRate);
    capitalGains = updateCapitalGains(capitalGains, inflationRate);
    if (stateTax) {
      updateStateIncomeTaxBracket(stateIncomeTaxBracket, inflationRate);
    }
    // retirement account limit - after tax
    irsLimit *= 1 + inflationRate;

    //  // SAVE FOR PREV YEAR
    let allInvestmentsPreTax = investments.filter((investment) => investment.accountTaxStatus.trim().toLowerCase() === "pre-tax");
    for (let preTaxInvestment of allInvestmentsPreTax) {
      sumInvestmentsPreTaxRMD += preTaxInvestment.value;
    }
    console.log("The sum of investments with value pretax (to use in RMD) is: ", sumInvestmentsPreTaxRMD, "as of year: ", year);
    
    prevYearIncome = yearTotals.curYearIncome;
    prevYearSS = yearTotals.curYearSS;
    prevYearEarlyWithdrawals = yearTotals.curYearEarlyWithdrawals;
    prevYearGains = yearTotals.curYearGains;
    yearTotals.curYearIncome = 0;
    yearTotals.curYearSS = 0;
    yearTotals.curYearEarlyWithdrawals = 0;
    yearTotals.curYearGains = 0;
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
// main(1, "67df22db4996aba7bb6e8d73");
//67e084385ca2a5376ad2efd2
main(1, "67df22db4996aba7bb6e8d73");
