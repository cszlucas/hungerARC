const mongoose = require("mongoose");
const StateTax = require("../server/models/stateTax.js");
const Tax = require("../server/models/tax.js");
const Scenario = require("../server/models/scenario");
const Investment = require("../server/models/investment");
const InvestmentType = require("../server/models/investmentType");
const User = require("../server/models/user.js");
const { buildChartDataFromBuckets } = require("./charts.js");
const { IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent } = require("../server/models/eventSeries");
const { calculateLifeExpectancy } = require("./algo.js");
const { runSimulation } = require("./simulation.js");
const path = require("path");

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

function scenarioExploration(foundData, parameter, value) {
  if (parameter == "Start Year" || parameter == "Duration") {
    foundData.startYear.calculated += value;
  } else if (parameter == "Initial Amount") {
    foundData.initialAmount += value;
  } else if (parameter == "Asset Allocation") {
    if (foundData.assetAllocation.fixedPercentages.length != 0) {
      // Fixed allocation
      foundData.assetAllocation.fixedPercentages[0].value += value;
      foundData.assetAllocation.fixedPercentages[1].value += 100 - foundData.assetAllocation.fixedPercentages[0].value;
    } else if (foundData.assetAllocation.initialPercentages.length != 0) {
      // Glide Path allocation
      foundData.assetAllocation.initialPercentages[0].value += value;
      foundData.assetAllocation.initialPercentages[1].value = 100 - foundData.assetAllocation.initialPercentages[0].value;
    }
  }
  return foundData;
}

function getEvent(type, data) {
  const id = data._id;
  let collection;
  if (type === "Income") {
    collection = incomeevents;
  } else if (type === "Expense") {
    collection = expenseevents;
  } else if (type === "Invest") {
    collection = investevents;
  } else if (type === "Rebalance") {
    collection = rebalanceevents;
  }
  const event = collection.find((item) => item._id === id);
  if (event) {
    console.log("Event found:", event);
    return event;
  } else {
    console.log("Event not found.");
    return null;
  }
}

//   investmentType: currInvestmentTypes,
// invest: currInvest,
// rebalance: currRebalance,
// expense: currExpense,
// income: currIncome,
// investment: currInvestments,
// scenario: currScenario,
// exploration: tempExploration,
// userId: user._id,
// simulationCount: numSimulations,

async function main(investmentType2, invest2, rebalance2, expense2, income2, investment2, scenario2, exploration, userId, numScenarioTimes, scenarioId) {
  console.log("exploration", exploration);
  // not sure how to get a value using this, not needed
  var distributions = require("distributions");
  const dataStore = new DataStore();
  await Promise.all([dataStore.populateData(scenarioId, userId)]);
  //console.log("our scenario \n\n", dataStore);

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

  //default values if no scenario exploration
  let oneScenarioExploration=false;
  let lowerBound = 1;
  let upperBound = 1;
  let stepSize = 1;
  let isFirstIteration = true;
  for (let value = lowerBound; value <= upperBound; value += stepSize) {
   // console.log(`Running ${numScenarioTimes} simulations for ${parameter}: ${value}`);
    if (oneScenarioExploration) {
      let foundData;
      if (isFirstIteration) {
        foundData = getEvent(type, data._id);
        isFirstIteration = false;
      }

      scenarioExploration(foundData, parameter, value);
    }
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
  console.log("whyyy");
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