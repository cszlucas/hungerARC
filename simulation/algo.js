const mongoose = require("mongoose");
// const StateTax = require("../server/importStateYaml.js");
const StateTax = require("../server/models/stateTax.js");
const Tax = require("../server/models/tax.js");
const Scenario = require("../server/models/scenario");
const Investment = require("../server/models/investment");
const InvestmentType = require("../server/models/investmentType");
const User = require("../server/models/user.js");
const { IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent } = require("../server/models/eventSeries");
const { performRMDs, payNonDiscretionaryExpenses, payDiscretionaryExpenses, runInvestStrategy, rebalance } = require("./main.js");
const { getCurrentEvent, getStrategy, getRebalanceStrategy, setValues, randomNormal, randomUniform } = require("./format.js");
const { buildChartDataFromBuckets, updateYearDataBucket, createYearDataBuckets } = require("./charts_prep.js");
const { writeCSVLog, writeEventLog, logInvestment } = require("./logs.js");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {getExpenseAmountInYear} = require("./helper.js");

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

class DataStore {
  constructor() {
    this.taxData = this.stateTax = this.scenario = this.investment = this.income = this.expense = this.rebalance = this.invest = this.investmentType = this.user = {};
  }
  async populateData(scenarioId, userId) {
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
      const user = await User.findById(userId);
      this.user = user;
      const stateTaxAll = await StateTax.find();

      // const stateTaxDocs = await StateTax.find(); // get all for direct lookup
      const residence = scenario.stateResident;

      let matchedTax = null;

      const triState = ["New York", "New Jersey", "Connecticut"];

      if (triState.includes(residence)) {
        // Search directly in StateTax collection
        matchedTax = stateTaxAll.find((tax) => tax.state === residence);
      } else {
        // Search user's uploaded YAMLs
        const userTaxDocs = await StateTax.find({ _id: { $in: user.stateYaml } });
        matchedTax = userTaxDocs.find((tax) => tax.state === residence);
      }
      this.stateTax = matchedTax;

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

async function runSimulation(
  scenario,
  tax,
  stateTax,
  startYearPrev,
  lifeExpectancyUser,
  lifeExpectancySpouse,
  investments,
  incomeEvent,
  expenseEvent,
  investEvent,
  rebalanceEvent,
  investmentTypes,
  csvLog,
  eventLog
) {
  // previous year
  let irsLimit = scenario.irsLimit;
  let filingStatus = scenario.filingStatus;
  let spouseDeath = false;
  let state = scenario.stateResident;
  let federalIncomeTax, stateIncomeTaxBracket, fedDeduction, stateDeduction, capitalGains;
  // previous year's tax
  if (filingStatus == "single") {
    federalIncomeTax = tax.single.federalIncomeTaxRatesBrackets;
    fedDeduction = tax.single.standardDeductions;
    capitalGains = tax.single.capitalGainsTaxRates;
    if (stateTax) {
      stateIncomeTaxBracket = stateTax.taxDetails[startYearPrev].single.stateIncomeTaxRatesBrackets;
      // stateDeduction = stateTax.taxDetails[prevYear].single.standardDeduction;
    }
  } else {
    federalIncomeTax = tax.married.federalIncomeTaxRatesBrackets;
    fedDeduction = tax.married.standardDeductions;
    capitalGains = tax.married.capitalGainsTaxRates;
    if (stateTax) {
      stateIncomeTaxBracket = stateTax.taxDetails[startYearPrev].single.stateIncomeTaxRatesBrackets;
      // stateDeduction = stateTax.taxDetails[prevYear].single.standardDeduction;
    }
  }
  //console.log("capitalGains :>> ", capitalGains);
  let currentYear = new Date().getFullYear();
  let userEndYear = scenario.birthYearUser + lifeExpectancyUser;
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
    curYearEarlyWithdrawals: 0,
  };
  let prevYearIncome = 0;
  let prevYearSS = 0;
  let prevYearEarlyWithdrawals = 0;
  let prevYearGains = 0;

  let cashInvestmentType = investmentTypes.find((inv) => inv.name === "Cash");
  let cashInvestment;
  if (cashInvestmentType) {
    let cashId = cashInvestmentType._id;
    cashInvestment = investments.find((inv) => inv.investmentType === cashId);
  }

  let yearDataBuckets = createYearDataBuckets(3); //2 is numYears
  let yearIndex = 0;

  //  // SIMULATION LOOP
  // manually adjusted for testing, should be year <= userEndYear !!
  for (let year = currentYear; year <= 2027; year++) {
    console.log("\nSIMULATION YEAR", year);
    if (filingStatus == "married") {
      if (year == scenario.birthYearSpouse + lifeExpectancySpouse) {
        spouseDeath = true;
        filingStatus = "single";
        federalIncomeTax = tax.single.federalIncomeTaxRatesBrackets;
        fedDeduction = tax.single.standardDeductions;
        capitalGains = tax.single.capitalGainsTaxRates;
        if (stateTax) {
          stateIncomeTaxBracket = stateTax.taxDetails[startYearPrev].single.stateIncomeTaxRatesBrackets;
          // stateDeduction = stateTax.taxDetails[prevYear].single.standardDeduction;
        }
      }
    }
    inflationRate = findInflation(scenario.inflationAssumption) * 0.01;
    let { curIncomeEvent, curExpenseEvent, curInvestEvent, curRebalanceEvent } = getCurrentEvent(year, incomeEvent, expenseEvent, investEvent, rebalanceEvent);
    let { RMDStrategyInvestOrder, withdrawalStrategy, spendingStrategy, investStrategy } = getStrategy(scenario, investments, curExpenseEvent, curInvestEvent, year);

    // RUN INCOME EVENTS
    updateIncomeEvents(incomeEvent, year, userEndYear, inflationRate, filingStatus, scenario, yearTotals, cashInvestment, curIncomeEvent, spouseDeath);
    console.log("after running income event, the curYearIncome is", yearTotals.curYearIncome);

    // PERFORM RMD FOR PREVIOUS YEAR
    const userAge = year - scenario.birthYearUser;
    //await performRMDs(investments, yearTotals, userAge, RMDStrategyInvestOrder, sumInvestmentsPreTaxRMD, year);
    sumInvestmentsPreTaxRMD = 0;

    //  UPDATE INVESTMENT VALUES
    updateInvestmentValues(investments, investmentTypes, yearTotals);

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
      rothConversion(scenario, year, yearTotals, federalIncomeTax, investmentTypes, investments, rothConversionStrategyInvestments, fedDeduction);
    }

    // account for inflation for expenses that are not in the current year
    updateInflationExpenses(curExpenseEvent, expenseEvent, inflationRate);

    //  PAY NON-DISCRETIONARY EXPENSES AND PREVIOUS YEAR TAXES
    //let { nonDiscretionary, taxes } = payNonDiscretionaryExpenses(
    //   curExpenseEvent,
    //   cashInvestment,
    //   prevYearIncome,
    //   prevYearSS,
    //   prevYearGains,
    //   prevYearEarlyWithdrawals,
    //   federalIncomeTax,
    //   stateIncomeTaxBracket,
    //   fedDeduction,
    //   year,
    //   userAge,
    //   capitalGains,
    //   withdrawalStrategy,
    //   yearTotals,
    //   inflationRate,
    //   spouseDeath
    // );

    // PAY DISCRETIONARY EXPENSES
    //let sumDiscretionary = payDiscretionaryExpenses(scenario.financialGoal, cashInvestment, year, userAge, spendingStrategy, withdrawalStrategy, yearTotals, inflationRate, spouseDeath);

    const discretionary = curExpenseEvent.filter((expenseEvent) => expenseEvent.isDiscretionary === true);

    // RUN INVEST EVENT
    runInvestStrategy(cashInvestment, irsLimit, year, investments, investStrategy);

    // RUN REBALANCE EVENT
    let types = ["pre-tax", "after-tax", "non-retirement"];
    for (let type of types) {
      let rebalanceStrategy = getRebalanceStrategy(scenario, curRebalanceEvent, type, year);
      // console.log('curRebalanceEvent :>> ', curRebalanceEvent);
      // console.log("rebalanceStrategy :>> ", rebalanceStrategy);
      if (rebalanceStrategy.length != 0) {
        //rebalance(investments, year, rebalanceStrategy, userAge, yearTotals);
      }
    }

    // PRELIMINARIES
    // can differ each year if sampled from distribution
    federalIncomeTax = updateFedIncomeTaxBracket(federalIncomeTax, inflationRate);
    fedDeduction = updateFedDeduction(fedDeduction, inflationRate);
    capitalGains = updateCapitalGains(capitalGains, inflationRate);
    if (stateTax) {
      updateStateIncomeTaxBracket(stateIncomeTaxBracket, inflationRate);
    }

    // adjust for inflation for single if filed jointly
    if (filingStatus == "married") {
      updateFedIncomeTaxBracket(tax.single.federalIncomeTaxRatesBrackets, inflationRate);
      updateFedDeduction(tax.single.standardDeductions, inflationRate);
      updateCapitalGains(tax.single.capitalGainsTaxRates, inflationRate);
      if (stateTax) {
        updateStateIncomeTaxBracket(stateTax.taxDetails[startYearPrev].single.stateIncomeTaxRatesBrackets);
      }
    }
    // retirement account limit
    irsLimit *= 1 + inflationRate;

    // SAVE FOR PREV YEAR
    let allInvestmentsPreTax = investments.filter((investment) => investment.accountTaxStatus.trim().toLowerCase() === "pre-tax");
    for (let preTaxInvestment of allInvestmentsPreTax) {
      sumInvestmentsPreTaxRMD += preTaxInvestment.value;
    }
    console.log("The sum of investments with value pretax (to use in RMD) is: ", sumInvestmentsPreTaxRMD, "as of year: ", year);

    const lookup = Object.fromEntries(investmentTypes.map((type) => [type._id.toString(), type.name]));

    updateYearDataBucket(yearDataBuckets, yearIndex, {
      investments: investments.map((event) => ({
        name: lookup[event.investmentType.toString()] || "Unknown",
        value: event.value,
      })),
      income: curIncomeEvent.map((event) => ({
        name: event.eventSeriesName,
        value: getExpenseAmountInYear(event, year, inflationRate, spouseDeath),
      })),
      discretionary: discretionary.map((event) => ({
        name: event.eventSeriesName,
        value: getExpenseAmountInYear(event, year, inflationRate, spouseDeath),
      })),
      nonDiscretionary: nonDiscretionary.map((event) => ({
        name: event.eventSeriesName,
        value: getExpenseAmountInYear(event, year, inflationRate, spouseDeath),
      })),
      taxes: taxes,
      earlyWithdrawals: yearTotals.curYearEarlyWithdrawals,
    });

    // console.log('investments :>> ', investments);
    logInvestment(investments, year, csvLog, investmentTypes);
    console.log("logInvestment :>> ", csvLog, "for year: ", year);
    prevYearIncome = yearTotals.curYearIncome;
    prevYearSS = yearTotals.curYearSS;
    prevYearEarlyWithdrawals = yearTotals.curYearEarlyWithdrawals;
    prevYearGains = yearTotals.curYearGains;
    yearTotals.curYearIncome = 0;
    yearTotals.curYearSS = 0;
    yearTotals.curYearEarlyWithdrawals = 0;
    yearTotals.curYearGains = 0;
    yearIndex++;
  }
  return yearDataBuckets;
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

async function main(numScenarioTimes, scenarioId, userId) {
  // not sure how to get a value using this, not needed
  var distributions = require("distributions");
  const dataStore = new DataStore();
  await Promise.all([dataStore.populateData(scenarioId, userId)]);

  const csvLog = []; // For user_datetime.csv
  const eventLog = []; // For user_datetime.log

  const { taxData, scenario, stateTax, invest, income, expense, rebalance, investment, investmentType, user } = {
    taxData: dataStore.getData("taxData"),
    scenario: dataStore.getData("scenario"),
    stateTax: dataStore.getData("stateTax"),
    invest: dataStore.getData("invest"),
    income: dataStore.getData("income"),
    expense: dataStore.getData("expense"),
    rebalance: dataStore.getData("rebalance"),
    investment: dataStore.getData("investment"),
    investmentType: dataStore.getData("investmentType"),
    user: dataStore.getData("user"),
  };
  // console.log("scenario: ", scenario);
  // console.log("stateTax :>> ", dataStore.stateTax);
  const startYearPrev = (new Date().getFullYear() - 1).toString();
  //calculate life expectancy
  const { lifeExpectancyUser, lifeExpectancySpouse } = calculateLifeExpectancy(scenario);
  // console.log('lifeExpectancySpouse here :>> ', lifeExpectancySpouse);
  let allYearDataBuckets = [];

  // find the user's state tax data
  // let stateTaxData = stateTax.find((state) => state.state === scenario.stateResident);

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
    const yearDataBuckets = await runSimulation(
      clonedData.scenario,
      clonedData.taxData[0],
      clonedData.stateTax,
      startYearPrev,
      lifeExpectancyUser,
      lifeExpectancySpouse,
      clonedData.investment,
      clonedData.income,
      clonedData.expense,
      clonedData.invest,
      clonedData.rebalance,
      clonedData.investmentType,
      csvLog,
      eventLog
    );
    allYearDataBuckets.push(yearDataBuckets);

    // logs only for the first simulation
    if (x == 0) {
      const userName = user.email.split("@")[0];
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const baseFilename = `${userName}_${timestamp}`;
      const csvFile = path.join(__dirname, "../server/logs", `${baseFilename}.csv`);
      const logFile = path.join(__dirname, "../server/logs", `${baseFilename}.log`);
      // writeCSVLog(csvFile, csvLog);
      // writeEventLog(logFilename, simulationResult.eventLog);
    }
  }
  //console.log("allYearDataBuckets", JSON.stringify(allYearDataBuckets, null, 2));
  const flattenedBuckets = allYearDataBuckets.flat();
  // console.log("flattenedBuckets", flattenedBuckets)

  const { startYear, endYear, data } = buildChartDataFromBuckets(flattenedBuckets, 2025, numScenarioTimes);
  // console.log("DATA", JSON.stringify(data, null, 2));
  // console.log("DATA", data);
  const years = [];
  for (let i = 0; i <= endYear - startYear; i++) {
    years.push({
      year: startYear + i,
      income: data.income[i],
      investments: data.investments[i],
      discretionary: data.discretionary[i],
      nonDiscretionary: data.nonDiscretionary[i],
      taxes: data.taxes[i],
      earlyWithdrawals: data.earlyWithdrawals[i],
    });
  }

  console.log("YEARS", JSON.stringify(years, null, 2));

  // console.log(years);

  return years;
}

// Call the main function to execute everything
// main(1, "67df22db4996aba7bb6e8d73");
//67e084385ca2a5376ad2efd2
// scenario id              user id
// main(1, "67e084385ca2a5376ad2efd2", "67e19c10a1325f92faf9f181");

module.exports = { main };
