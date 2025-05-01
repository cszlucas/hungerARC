const mongoose = require("mongoose");
const StateTax = require("../server/models/stateTax.js");
const Tax = require("../server/models/tax.js");
const Scenario = require("../server/models/scenario");
const Investment = require("../server/models/investment");
const InvestmentType = require("../server/models/investmentType");
const User = require("../server/models/user.js");
const { buildChartDataFromBuckets, exploreData, chartData } = require("./charts.js");
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

function getEvent(listData, data) {
  const e = listData.find((item) => item._id === data._id);
  if (e) {
    //console.log("Event found:", e);
    return e;
  } else {
    console.log("Event not found.");
    return null;
  }
}

async function main(investmentType2, invest2, rebalance2, expense2, income2, investment2, scenario2, exploration, userId, numScenarioTimes, scenarioId) {
  //console.log("exploration",JSON.stringify(exploration, null, 2));
  // not sure how to get a value using this, not needed
  var distributions = require("distributions");
  const dataStore = new DataStore();
  await Promise.all([dataStore.populateData(scenarioId, userId)]);
  //console.log("our scenario \n\n", dataStore);

  const csvLog = []; // For user_datetime.csv
  const eventLog = []; // For user_datetime.log
  const explorationData = {
    parameter: [],
    values: [],
  };
  let explore;

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
  let currentYear = new Date().getFullYear();
  // console.log('lifeExpectancySpouse here :>> ', lifeExpectancySpouse);

  // find the user's state tax data
  // let stateTaxData = stateTax.find((state) => state.state === scenario.stateResident);

  //default values if no scenario exploration
  let oneScenarioExploration = false;
  let type = "";
  let lowerBound = 1;
  let upperBound = 1;
  let stepSize = 1;
  let dataExplore;
  let foundData;
  let parameter;
  if (exploration.length == 1) {
    oneScenarioExploration = true;
    type = exploration[0].type;
    lowerBound = Number(exploration[0].range.lower);
    upperBound = Number(exploration[0].range.upper);
    stepSize = Number(exploration[0].range.steps);
    dataExplore = exploration[0].data;
    parameter = exploration[0].parameter;
    explorationData.parameter[0] = parameter;
  }

  let isFirstIteration = true;
  //return;
  for (let i = lowerBound; i <= upperBound; i += stepSize) {
    console.log(
      `\nRUNNING ${numScenarioTimes} simulation/s total for parameter ${parameter}: lower bound: ${lowerBound}, and upper bound: ${upperBound} and step size is: ${stepSize}, at current step size VALUE: ${i}.\n`
    );
    let allYearDataBuckets = [];
    if (oneScenarioExploration) {
      if (isFirstIteration) {
        foundData = getEvent(income2, dataExplore);
        isFirstIteration = false;
      }

      scenarioExploration(foundData, parameter, stepSize);
    }
    for (let x = 0; x < numScenarioTimes; x++) {
      console.log(`ON SIMULATION NUMBER: ${x + 1}\n`);
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

      //console.log("income", income);
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
        eventLog,
        currentYear
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
    if (oneScenarioExploration) {
      explore = exploreData(allYearDataBuckets, explorationData, [i], currentYear);
    }
  }
  if (!oneScenarioExploration) {
    let years = chartData(allYearDataBuckets, numScenarioTimes);
    console.log("YEARS", JSON.stringify(years, null, 2));
    return years;
  } else {
    console.log("EXPLORE", JSON.stringify(explore, null, 2));
    return; //explorationData;
  }
}


// Call the main function to execute everything
// main(1, "67df22db4996aba7bb6e8d73");
//67e084385ca2a5376ad2efd2
// scenario id              user id
// main(1, "67e084385ca2a5376ad2efd2", "67e19c10a1325f92faf9f181");

module.exports = { main };
