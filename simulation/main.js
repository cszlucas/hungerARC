const mongoose = require("mongoose");
const StateTax = require("../server/models/stateTax.js");
const Tax = require("../server/models/tax.js");
const User = require("../server/models/user.js");
const { buildChartDataFromBuckets, exploreData, chartData } = require("./charts.js");
const { calculateLifeExpectancy } = require("./algo.js");
const { runSimulation } = require("./simulation.js");
const path = require("path");
const { formatToNumber } = require("./helper.js");
const { getEvent, scenarioExplorationUpdate, generateParameterCombinations } = require("./exploration.js");

class DataStore {
  constructor() {
    this.taxData = this.stateTax = this.scenario = this.investment = this.income = this.expense = this.rebalance = this.invest = this.investmentType = this.user = {};
  }
  async populateData(userId, residence) {
    try {
      const tax = await Tax.find();
      this.taxData = tax;
      const user = await User.findById(userId);
      this.user = user;
      const stateTaxAll = await StateTax.find();

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

      // const investmentType = await InvestmentType.find({
      //   _id: { $in: scenario.setOfInvestmentTypes },
      // });
      // this.investmentType = investmentType;
    } catch (err) {
      console.log("Error while populating data:", err);
    }
  }

  getData(property) {
    return this[property];
  }
}

async function main(investmentType, invest, rebalance, expense, income, investment, scenario, exploration, userId, numScenarioTimes) {
  //console.log("exploration",JSON.stringify(exploration, null, 2));
  // not sure how to get a value using this, not needed
  var distributions = require("distributions");
  const dataStore = new DataStore();
  await Promise.all([dataStore.populateData(userId, scenario.stateResident)]);
  //console.log("our scenario \n\n", dataStore);

  const csvLog = []; // For user_datetime.csv
  const eventLog = []; // For user_datetime.log

  const { taxData, stateTax, user } = {
    taxData: dataStore.getData("taxData"),
    stateTax: dataStore.getData("stateTax"),
    user: dataStore.getData("user"),
  };

  // change numbers from string to number
  formatToNumber(income);
  formatToNumber(expense);
  formatToNumber(rebalance);
  formatToNumber(invest);
  formatToNumber(investment);
  investment.purchasePrice = 0;
  formatToNumber(investmentType);
  formatToNumber(exploration);

  const startYearPrev = (new Date().getFullYear() - 1).toString();
  //calculate life expectancy
  const { lifeExpectancyUser, lifeExpectancySpouse } = calculateLifeExpectancy(scenario);
  let currentYear = new Date().getFullYear();
  // console.log('lifeExpectancySpouse here :>> ', lifeExpectancySpouse);

  let explorationData = { parameter: [], values: [] };
  let type = [];
  let lowerBound = [];
  let upperBound = [];
  let stepSize = [];
  let dataExplore = [];
  let explore;
  let foundData = [];
  let parameter = [];
  let combinations;
  const typeToData = {
    Income: income,
    Expense: expense,
    Invest: invest,
    Rebalance: rebalance,
  };

  let duration = 1;
  console.log("exploration :>> ", exploration);
  if (exploration && exploration.length >= 1) {
    combinations = generateParameterCombinations(exploration);
    console.log("COMBINATIONS: ", combinations);
    duration = combinations.length;
    for (let i = 0; i < exploration.length; i++) {
      type[i] = exploration[i].type;
      lowerBound[i] = Number(exploration[i].range.lower);
      upperBound[i] = Number(exploration[i].range.upper);
      stepSize[i] = Number(exploration[i].range.steps);
      dataExplore[i] = exploration[i].data;
      parameter[i] = exploration[i].parameter;
      explorationData.parameter[i] = parameter[i];
    }
  }

  let isFirstIteration = true;
  //return;
  for (let i = 0; i < duration; i++) {
    let allYearDataBuckets = [];
    if (exploration) {
      console.log(`\nRUNNING ${numScenarioTimes} simulation/s total for combination ${combinations[i]}: at current combination: ${i+1}.\n`);
      if (isFirstIteration) {
        foundData = exploration.map((spec) => {
          const dataArray = typeToData[spec.type]; // expense, income, etc.
          return getEvent(dataArray, spec.data);   // get matching object
        });
        isFirstIteration = false;
      }

      scenarioExplorationUpdate(foundData, parameter, combinations[i]);
      // console.log("DID IT CHANGE",JSON.stringify(expense, null, 2));
      // console.log("DID IT CHANGE",JSON.stringify(invest, null, 2));

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
    if (exploration && exploration.length >= 1) {
      explore = exploreData(allYearDataBuckets, explorationData, combinations[i], currentYear);
    } else {
      let years = chartData(allYearDataBuckets, numScenarioTimes);
      //console.log("YEARS", JSON.stringify(years, null, 2));
      return years;
    }
  }

  if (exploration && exploration.length >= 1) {
    //console.log("EXPLORE", JSON.stringify(explore, null, 2));
    return explore;
  }
}

// Call the main function to execute everything
// main(1, "67df22db4996aba7bb6e8d73");
//67e084385ca2a5376ad2efd2
// scenario id              user id
// main(1, "67e084385ca2a5376ad2efd2", "67e19c10a1325f92faf9f181");

module.exports = { main };
