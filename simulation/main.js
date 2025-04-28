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

async function main(numScenarioTimes, scenarioId, userId) {
  // not sure how to get a value using this, not needed
  var distributions = require("distributions");
  const dataStore = new DataStore();
  await Promise.all([dataStore.populateData(scenarioId, userId)]);

  const csvLog = []; // For user_datetime.csv
  const eventLog = []; // For user_datetime.log

<<<<<<< HEAD
//ordering on a set of investments that specifies the order in which
//investments are sold to generate cash.
function payNonDiscretionaryExpenses(
  curExpenseEvent,
  cashInvestment,
  prevYearIncome,
  prevYearSS,
  prevYearGains,
  prevYearEarlyWithdrawals,
  federalIncomeTax,
  stateIncomeTaxBracket,
  fedDeduction,
  year,
  userAge,
  capitalGains,
  withdrawalStrategy,
  yearTotals,
  inflationRate,
  spouseDeath
) {
  console.log("\nPAY NON-DISCRETIONARY EXPENSES");
  const nonDiscretionaryExpenses = curExpenseEvent.filter((expenseEvent) => expenseEvent.isDiscretionary === false);
  //console.log("nonDiscretionaryExpenses ", nonDiscretionaryExpenses);
  let expenseAmt = 0;
  for (let expense of nonDiscretionaryExpenses) {
    expenseAmt += getExpenseAmountInYear(expense, year, inflationRate, spouseDeath);
  }
  const nonDiscretionaryExpenseAmt = expenseAmt;
  const taxes = getTaxes(prevYearIncome, prevYearSS, prevYearGains, prevYearEarlyWithdrawals, federalIncomeTax, stateIncomeTaxBracket, capitalGains, userAge, fedDeduction);
  console.log("nonDiscretionaryExpenses Amt: ", expenseAmt, "and taxes: ", taxes);
  let withdrawalAmt = expenseAmt + taxes;
  console.log("My cash investment: ", cashInvestment.value, "Amount I need to withdraw: ", withdrawalAmt);
  if (cashInvestment.value >= withdrawalAmt) {
    cashInvestment.value -= withdrawalAmt; //use up cash needed
    withdrawalAmt = 0;
    console.log("You paid all your discretionary expenses. My cash investment now: ", cashInvestment.value)
  } else {
    withdrawalAmt -= cashInvestment.value;
    cashInvestment.value = 0; //use up cash
    for (let investment of withdrawalStrategy) {
      if (withdrawalAmt > 0) {
        console.log("Still left to withdraw: ", withdrawalAmt);
        console.log("investment to withdraw from ID:", investment._id, ",type:", investment.accountTaxStatus, ",value:", investment.value);
        const amtPaid = payFromInvestment(withdrawalAmt, investment, userAge, yearTotals);
        withdrawalAmt -= amtPaid;
      } else {
        break;
      }
    }
    if (withdrawalAmt > 0) {
      console.log("You CAN NOT pay your non-discretionary expenses GO TO JAIL-Don't pass go...;A;");
    } else {
      console.log("You paid all your non-discretionary expenses...phew");
    }
  }
  return {
    sumNonDiscretionary: nonDiscretionaryExpenseAmt,
    taxes: taxes
=======
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
>>>>>>> main
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

<<<<<<< HEAD
  const ssTax = taxAmt(prevYearSS * 0.85, federalIncomeRange);

  let earlyWithdrawalTax = 0;
  if (userAge < 59) {
    earlyWithdrawalTax = prevYearEarlyWithdrawals * 0.1;
  }

  const capitalGainsTax = taxAmt(prevYearGains, capitalGains, "capitalGains");

  return federalTax + stateTax + ssTax + earlyWithdrawalTax + capitalGainsTax;
}

function taxAmt(income, taxBracket, type) {
  for (let range of taxBracket) {
    if (income >= range.incomeRange[0] && income <= range.incomeRange[1]) {
      if (type === "capitalGains") {
        return income > 0 ? income * (range.gainsRate / 100) : 0;
      } else {
        return income * (range.taxRate / 100);
      }
    }
  }
  return 0;
}

//spendingStrategy is an ordering on expenses
//withdrawalStrategy is an ordering on investments
function payDiscretionaryExpenses(financialGoal, cashInvestment, year, userAge, spendingStrategy, withdrawalStrategy, yearTotals, inflationRate, spouseDeath) {
  console.log("\nPAY DISCRETIONARY EXPENSES");
  let goalRemaining = financialGoal;
  let expensesPaid = 0;
  for (let expense of spendingStrategy) {
    let expenseVal = getExpenseAmountInYear(expense, year, inflationRate, spouseDeath);
    console.log("Expense:", expense._id, "Amount:", expenseVal, "Cash available:", cashInvestment.value);

    if (cashInvestment.value >= expenseVal) {
      cashInvestment.value -= expenseVal;
      expensesPaid+=expenseVal;
      expenseVal = 0;
      console.log("You paid expense all with cash. Cash investment now is: ", cashInvestment.value);
      continue;
    }

    expenseVal -= cashInvestment.value;
    cashInvestment.value = 0;

    for (let investment of withdrawalStrategy) {
      if (expenseVal <= 0) break;
      console.log("Expense value now is: ", expenseVal);
      if (goalRemaining >= expenseVal) {
        let amtPaid = payFromInvestment(expenseVal, investment, userAge, yearTotals);
        expensesPaid+=amtPaid;
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;
      } else if (goalRemaining > 0) {
        let partialAmt = Math.min(expenseVal, goalRemaining);
        expensesPaid+=partialAmt;
        let amtPaid = payFromInvestment(partialAmt, investment, userAge, yearTotals);
        expenseVal -= amtPaid;
        goalRemaining -= amtPaid;
        console.log("You paid some of the expense and then was forced to stop", expenseVal);
      }
    }

    if (expenseVal > 0) {
      console.log("You were NOT able to pay all your discretionary expenses.");
    } else {
      console.log("You were able to pay all your discretionary expenses without violating your financial goal.");
    }
  }
  return expensesPaid;
}

function payFromInvestment(withdrawalAmt, investment, userAge, yearTotals) {
  if (investment.value == 0) {
    console.log("This investment: ", investment._id, "is already empty", investment.value);
    return 0;
  } else if (investment.value - withdrawalAmt > 0) {
    console.log("subtract needed and keep investment:", investment._id, "type:", investment.accountTaxStatus, "value: ", investment.value);
    updateValues(investment, userAge, yearTotals, true, withdrawalAmt);
    investment.value -= withdrawalAmt;
    console.log("Investment now with value: ", investment.value);
    return withdrawalAmt;
  } else {
    let amountPaid = investment.value;
    console.log("use up investment:", investment._id, "value: ", investment.value, "now with value 0 and move onto next");
    updateValues(investment, userAge, yearTotals, false, amountPaid);
    investment.value = 0;
    return amountPaid;
  }
}

function updateValues(investment, userAge, yearTotals, partial, amountPaid) {
  if (investment.accountTaxStatus === "non-retirement") {
    if (partial) {
      const fractionSold = investment.value > 0 ? amountPaid / investment.value : 0;
      const gain = fractionSold * (investment.value - investment.purchasePrice);
      yearTotals.curYearGains += Math.max(gain, 0);
      investment.purchasePrice -= (1-fractionSold)*investment.purchasePrice;
      console.log("By a fraction update curYearGains:", gain, "purchase price:", investment.purchasePrice);
    } else {
      const gain = investment.value - investment.purchasePrice;
      yearTotals.curYearGains += Math.max(gain, 0);
      investment.purchasePrice -= 0;
      console.log("update curYearGains:", gain, "purchase price:", investment.purchasePrice);
    }
  }

  if (investment.accountTaxStatus === "pre-tax") {
    yearTotals.curYearIncome += amountPaid;
  }

  if ((investment.accountTaxStatus === "pre-tax" || investment.accountTaxStatus === "after-tax") && userAge < 59) {
    yearTotals.curYearEarlyWithdrawals += amountPaid;
  }
}

//Use up excess cash with invest strategy
function runInvestStrategy(cashInvestment, irsLimit, year, investments, investStrategy) {
  console.log("\nINVEST STRATEGY");
  console.log('investStrategy :>> ', investStrategy);
  const strategy = Array.isArray(investStrategy) ? investStrategy[0] : investStrategy;
  console.log('strategy :>> ', strategy);
  console.log("cashInvestment", cashInvestment.value, " maxCash to keep: ", strategy.maxCash);

  const excessCash = cashInvestment.value - strategy.maxCash;
  console.log("The excess cash is (if <0 no money to invest)", excessCash);
  let allocations = [];

  if (excessCash > 0) {
    console.log("The excess cash now is", excessCash);
    if (strategy.assetAllocation.type === "glidePath") {
      allocations = getGlidePathAllocation(
        year,
        strategy.startYear.value,
        strategy.startYear.value + strategy.duration.value,
        strategy.assetAllocation.initialPercentages,
        strategy.assetAllocation.finalPercentages
      );
    } else if (strategy.assetAllocation.type === "fixed") {
      allocations = strategy.assetAllocation.fixedPercentages;
    }
    console.log(allocations);
    const investmentsWithAllocations = allocationIDToObject(allocations, investments);
    const afterTaxRatio = scaleDownRatio("after-tax", investmentsWithAllocations, irsLimit, excessCash);
    console.log("afterTaxRatio: ", afterTaxRatio);

    let totalInvested = 0;
    let excessDueToLimit = 0;

    for (const { investment, percentage } of investmentsWithAllocations) {
      let buyAmt = 0;

      if (investment.accountTaxStatus === "after-tax") {
        buyAmt = excessCash * percentage * afterTaxRatio;
        excessDueToLimit += excessCash * percentage * (1 - afterTaxRatio);
      } else {
        buyAmt = excessCash * percentage;
      }

      investment.purchasePrice += buyAmt;
      investment.value += buyAmt;
      totalInvested += buyAmt;

      console.log("investment", investment._id, "percentage", percentage, "type", investment.accountTaxStatus, "increase purchasePrice by:", buyAmt);
    }

    if (excessCash - totalInvested > 0) {
      console.log("everything else in non-retirement: ", excessDueToLimit);
      buyNonRetirement(investmentsWithAllocations, excessDueToLimit);
    }
  }
}

function allocationIDToObject(allocations, investments) {
  const investmentMap = new Map(investments.map((investment) => [investment._id, investment])); // Create a map for O(1) lookup

  const investmentsWithAllocations = Object.entries(allocations)
    .map(([assetId, percentage]) => {
      const investAllocation = investmentMap.get(assetId); // O(1) lookup

      if (investAllocation) {
        return {
          investment: investAllocation,
          percentage: percentage,
        };
      }

      // Handle missing investment more clearly (e.g., log a warning)
      console.warn(`Warning: Investment with ID ${assetId} not found.`);
      return null;
    })
    .filter((item) => item !== null); // Remove any null entries

  return investmentsWithAllocations;
}

// function getGlidePathAllocation(year, startYear, endYear, initial, final) {
//   const t = (year - startYear) / (endYear - startYear);
//   const allocation = {};
//   for (const asset in initial) {
//     allocation[asset] = initial[asset] + t * (final[asset] - initial[asset]);
//   }

//   return allocation;
// }
function getGlidePathAllocation(year, startYear, endYear, initial, final) {
  const tRaw = (year - startYear) / (endYear - startYear);
  const t = Math.max(0, Math.min(1, tRaw)); // clamp between 0 and 1

  const allocation = {};
  const allAssets = new Set([...Object.keys(initial), ...Object.keys(final)]);

  for (const asset of allAssets) {
    const initVal = initial[asset] || 0;
    const finalVal = final[asset] || 0;
    allocation[asset] = (1 - t) * initVal + t * finalVal;
  }

  return allocation;
}

function buyNonRetirement(investmentsWithAllocations, excessCash) {
  // Filter only non-retirement investments first
  const nonRetirement = investmentsWithAllocations.filter(({ investment }) => investment.accountTaxStatus === "non-retirement");

  // Total their percentage (in case it doesn't sum to 1)
  const totalPercentage = nonRetirement.reduce((sum, { percentage }) => sum + percentage, 0);

  for (const { investment, percentage } of nonRetirement) {
    // Normalize percentage if necessary
    const adjustedPercentage = percentage / totalPercentage;
    const buyAmt = excessCash * adjustedPercentage;
    investment.purchasePrice += buyAmt;
    investment.value += buyAmt;
    console.log("Buying into non-retirement:", investment._id, "purchase:", buyAmt);
  }
}

function scaleDownRatio(type, investmentsWithAllocations, irsLimit, excessCash) {
  let sum = 0;

  for (const { investment, percentage } of investmentsWithAllocations) {
    if (investment.accountTaxStatus === type) {
      sum += percentage * excessCash;
    }
  }
  console.log(`Total intended contribution to '${type}' accounts: $${sum}, IRS limit: $${irsLimit}`);
  if (sum > irsLimit) {
    return irsLimit / sum; // scale down if over irsLimit
  } else {
    return 1; // no scaling needed
  }
}

//rebalance investment allocations of same account tax status based on desired targets specified in rebalance strategy.
function rebalance(investments, year, rebalanceStrategy, userAge, yearTotals) {
  console.log("\nREBALANCE STRATEGY");
  rebalanceStrategy = rebalanceStrategy[0];
  
  let allocations = [];
  if (rebalanceStrategy.rebalanceAllocation.type === "glidePath") {
    console.log("you chose glidepath woohoo");
    allocations = getGlidePathAllocation(
      year,
      rebalanceStrategy.startYear.value,
      rebalanceStrategy.startYear.value + rebalanceStrategy.duration.value,
      rebalanceStrategy.rebalanceAllocation.initialPercentages,
      rebalanceStrategy.rebalanceAllocation.finalPercentages
=======
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
>>>>>>> main
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
