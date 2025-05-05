const StateTax = require("../server/models/stateTax.js");
const Tax = require("../server/models/tax.js");
const User = require("../server/models/user.js");
const { exploreData, chartData } = require("./charts.js");
const { calculateLifeExpectancy } = require("./algo.js");
const path = require("path");
const { formatToNumber } = require("./helper.js");
const { getEvent, scenarioExplorationUpdate, generateParameterCombinations } = require("./exploration.js");
const { logFinancialEvent } = require("./logs.js");
const Piscina = require("piscina");
let numSimulations;
const timestamp = new Date();
const piscina = new Piscina({
  filename: path.resolve(__dirname, "./worker.js"),
});
//console.log(`Active threads: ${piscina.threads.length}`);
(async () => {
  for (let i = 0; i < numSimulations; i++) {
    await piscina.run({ simId: i });
  }
})();

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
      console.log("this.stateTax", this.stateTax);
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

  const dataStore = new DataStore();
  await Promise.all([dataStore.populateData(userId, scenario.stateResident)]);
  //console.log("our scenario \n\n", dataStore);
  numSimulations = numScenarioTimes;

  const csvLog = []; // For user_datetime.csv
  const eventLog = []; // For user_datetime.log

  const { taxData, stateTax, user } = {
    taxData: dataStore.getData("taxData"),
    stateTax: dataStore.getData("stateTax"),
    user: dataStore.getData("user"),
  };

  // console.log("income", income);
  // console.dir(scenario, { depth: null });
  // console.dir(income, { depth: null });
  // change numbers from string to number
  formatToNumber(income);
  formatToNumber(expense);
  formatToNumber(rebalance);
  formatToNumber(invest);
  formatToNumber(investment);
  investment.purchasePrice = 0;
  formatToNumber(investmentType);
  formatToNumber(exploration);
  formatToNumber(scenario);
  // console.log("scenario");
  console.dir(scenario, { depth: null });


  const startYearPrev = (new Date().getFullYear() - 1).toString();
  //calculate life expectancy
  const { lifeExpectancyUser, lifeExpectancySpouse } = calculateLifeExpectancy(scenario);
 // console.log("lifeExpectancyUser", lifeExpectancyUser);
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
  // console.log("exploration :>> ", exploration);
  let rothExploration;
  if (exploration && exploration.length) {
    for (let i = 0; i < exploration.length; i++) {
      if (exploration[i].type == "Roth Optimizer Flag") {
        rothExploration = exploration[i];
        exploration.splice(i, 1); // remove the Roth Optimizer Flag from exploration array
        break;
      }
    }
    if (rothExploration) {
      // console.log("scenario before roth :>> ", scenario);
      scenarioExplorationUpdate(scenario, ["Roth Optimizer Flag"], [rothExploration.data.optimizerSettings]);
      // console.log("scenario after roth :>> ", scenario);
    }
  }

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
      explorationData.parameter[i] = `${type[i]} ${parameter[i]}`;
    }
  }

  let isFirstIteration = true;
  //return;
  for (let i = 0; i < duration; i++) {
    const workerInputs = [];
    if (exploration && exploration.length >= 1) {
      logFinancialEvent({
        year: "Explore",
        type: "simulationInfo",
        description: `You chose explore dimension #${exploration.length}. RUNNING ${numScenarioTimes} simulation/s total for combination ${combinations[i]}: at current combination: ${i + 1}. `,
      });
      console.log(`\nRUNNING ${numScenarioTimes} simulation/s total for combination ${combinations[i]}: at current combination: ${i + 1}.\n`);
      console.log("INCOME HERE, ", income);
      if (isFirstIteration) {
        foundData = exploration.map((spec) => {
          console.log("spec type :>> ", spec.type);
          // if (spec.type != "Roth Optimizer Flag"){
          console.log("spec :>> ", spec);
          const dataArray = typeToData[spec.type]; // expense, income, etc.
          console.log("dataArray HERE :>> ", dataArray);
          return getEvent(dataArray, spec.data); // get matching object
          // } else{
          // console.log("spec roth :>> ", spec);
          // return spec.data;
          // }
        });
        isFirstIteration = false;
      }
      scenarioExplorationUpdate(foundData, parameter, combinations[i]);
      //console.log("DID IT CHANGE",JSON.stringify(expense, null, 2));
      // console.log("DID IT CHANGE",JSON.stringify(invest, null, 2));
    }
    const singleTaxData = taxData[0];

    for (let x = 0; x < numScenarioTimes; x++) {
      logFinancialEvent({
        year: "Simulation",
        type: "simulationInfo",
        description: `ON SIMULATION NUMBER: ${x + 1}.`,
      });
      console.log(`ON SIMULATION NUMBER: ${x + 1}\n`);
      
      const clonedData = JSON.parse(
        JSON.stringify({
          scenario,
          taxData: singleTaxData,
          stateTax,
          startYearPrev,
          lifeExpectancyUser,
          lifeExpectancySpouse,
          investment,
          income,
          expense,
          invest,
          rebalance,
          investmentType,
          csvLog,
          currentYear,
        })
      );

      workerInputs.push(clonedData);

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
    const allSimulationResults = await Promise.all(workerInputs.map((input) => piscina.run(input)));
    //console.log("allSimulationResults", JSON.stringify(allSimulationResults));

    if (exploration && exploration.length >= 1) {
      explore = exploreData(allSimulationResults, explorationData, combinations[i], currentYear);
    } else {
      let years = chartData(allSimulationResults, numScenarioTimes);
      console.log("YEARS", JSON.stringify(years, null, 2));
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
