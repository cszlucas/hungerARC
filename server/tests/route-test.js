const axios = require("axios");
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");
const InvestmentType = require("../models/investmentType.js");
const Investment = require("../models/investment.js");
const { ObjectId } = require("mongoose");

const scenarioId = "833f3c2523356bddab87a833";

async function Income(dynamicId) {
  try {
    const incomeEventData = new IncomeEvent({
      eventSeriesName: "income1980-2000",
      description: "Income event series from 2020-2025.",
      startYear: {
        type: "year",
        year: 1980,
      },
      duration: {
        type: "fixedAmt",
        value: 20,
      },
      eventName: "Salary",
      eventDate: new Date("2025-01-01"),
      initialAmount: 50000,
      annualChange: {
        type: "fixed",
        amount: 5000,
      },
      userPercentage: 0.15,
      inflationAdjustment: false,
      isSocialSecurity: false,
    });

    const response = await axios.post(`http://localhost:8080/scenario/${scenarioId}/incomeEvent`, incomeEventData);

    const incomeEventData2 = new IncomeEvent({
      ...response.data,
      eventSeriesName: "updated Income",
      initialAmount: 500,
    });

    const update = await axios.post("http://localhost:8080/updateIncome/${dynamicId}", incomeEventData2);
    console.log(update.data);
  } catch (error) {
    console.error("Error fetching income:", error);
  }
}

async function Expense(dynamicId) {
  try {
    const expenseEventData = new ExpenseEvent({
      eventSeriesName: "Expense 1980-1990",
      description: "Expense event series from 2023-2025.",
      startYear: {
        type: "year",
        year: 2023,
      },
      duration: {
        type: "fixedAmt",
        value: 4,
      },
      eventName: "Rent",
      eventDate: new Date("2025-01-01"),
      initialAmount: 1200,
      annualChange: {
        type: "fixed",
        amount: 5000,
      },
      userPercentage: 0.3,
      inflationAdjustment: true,
      isDiscretionary: true,
    });

    const response = await axios.post(`http://localhost:8080/scenario/${scenarioId}/expenseEvent`, expenseEventData);

    const expenseEventData2 = new ExpenseEvent({
      ...response.data,
      eventSeriesName: "updated Expense",
      initialAmount: 500,
    });

    const update = await axios.post("http://localhost:8080/updateExpense/${dynamicId}", expenseEventData2);
  } catch (error) {
    console.error("Error fetching expense:", error);
  }
}

async function Investments(dynamicId) {
  try {
    const investmentType1 = new InvestmentType({
      name: "Bond Fund",
      description: "A conservative investment type focused on bonds.",
      annualReturn: {
        type: "normalPercent",
        mean: 0.05,
        stdDev: 0.1,
      },
      expenseRatio: 0.01,
      annualIncome: {
        type: "fixedPercent",
        fixed: 5,
        mean: 0.04,
        stdDev: 0.05,
      },
      taxability: "pre-tax",
    });

    const responseType = await axios.post(`http://localhost:8080/scenario/${scenarioId}/investmentType`, investmentType1);

    const invest1 = new Investment({
      investmentType: responseType.data._id,
      value: 100,
      accountTaxStatus: "pre-tax",
    });

    const responseInvestment = await axios.post(`http://localhost:8080/scenario/${scenarioId}/investment`, invest1);

    //UPDATE

    const investmentType2 = new InvestmentType({
      ...responseType.data,
      name: "Horse Fund",
      taxability: "non-tax",
    });

    const update = await axios.post(`http://localhost:8080/updateInvestmentType/${dynamicId}`, investmentType2);

    const invest2 = new Investment({
      ...responseInvestment.data,
      value: 10,
      accountTaxStatus: "non-tax",
    });

    const updateInvest = await axios.post(`http://localhost:8080/updateInvestment/${dynamicId}`, invest2);

    // const investmentType22 = new InvestmentType({
    //   name: "Equity Fund",
    //   description: "A high-risk investment focusing on stocks.",
    //   annualReturn: {
    //     type: "normalPercent",
    //     mean: 0.05,
    //     stdDev: 0.1,
    //   },
    //   expenseRatio: 0.02,
    //   annualIncome: {
    //     type: "fixedPercent",
    //     fixed: 5,
    //     mean: 0.04,
    //     stdDev: 0.05,
    //   },
    //   taxability: "taxable",
    // });

    // const type2 = await axios.post("http://localhost:8080/investmentType", investmentType22);

    // Now create and save the Investment
    // const invest2 = new Investment({
    //   investmentType: type2.data._id,
    //   value: 50,
    //   accountTaxStatus: "non-tax",
    // });

    // const inv2 = await axios.post("http://localhost:8080/investment", invest2);
  } catch (error) {
    console.error("Error updating Investments", error);
  }
}

async function Users() {
  try {
    const scenarios = await axios.get("http://localhost:8080/user/67df2402ff2657feabd8c721/scenarios");
    console.log(scenarios.data);
  } catch (error) {
    console.error("Error updating:", error);
  }
}

async function InvestStrategy(dynamicId) {
  try {
    const investStrategy1 = new InvestEvent({
      eventSeriesName: "Invest 2020-2023",
      description: "Invest event series from 2020-2023.",
      startYear: {
        type: "year",
        year: 2020,
      },
      duration: {
        type: "fixedAmt",
        value: 1,
      },
      type: "fixed",
      fixedPercentages: {
        ["67df68e520abee9d9188b03a"]: 30,
        ["67df7a358d16d4c00df75a72"]: 70,
      },
      maxCash: 100,
    });

    const response = await axios.post(`http://localhost:8080/scenario/${scenarioId}/investStrategy`, investStrategy1);

    const updateInvestStrategy1 = new InvestEvent({
      ...response.data,
      eventSeriesName: "updated invest strategy",
      maxCash: 500,
    });

    const update = await axios.post(`http://localhost:8080/updateInvestStrategy/${dynamicId}`, updateInvestStrategy1);

    // const strategy = await axios.get("http://localhost:8080/investStrategy/67df7b20e2d1899f44c74079");
    // console.log(strategy.data);
  } catch (error) {
    console.error("Error invest strategy:", error);
  }
}

async function RebalanceStrategy(dynamicId) {
  try {
    const reb = new RebalanceEvent({
      eventSeriesName: "Rebalance 2023",
      description: "Rebalance event series 2023-2025",
      startYear: {
        type: "year",
        year: 2023,
      },
      duration: {
        type: "fixedAmt",
        value: 2,
      },
      type: "glidePath",
      initialPercentages: {
        ["67df68e520abee9d9188b03a"]: 60,
        ["67df7a358d16d4c00df75a72"]: 40,
      },
      finalPercentages: {
        ["67df68e520abee9d9188b03a"]: 30,
        ["67df7a358d16d4c00df75a72"]: 70,
      },
    });

    const response = await axios.post(`http://localhost:8080/scenario/${scenarioId}/rebalanceStrategy`, reb);

    const updateRebalanceStrategy = new RebalanceEvent({
      ...response.data,
      eventSeriesName: "Rebalance Updated",
      startYear: {
        type: "year",
        year: 2025,
      },
    });

    const update = await axios.post(`http://localhost:8080/updateRebalanceStrategy/${dynamicId}`, updateRebalanceStrategy);

    // const getStrategy = await axios.get("http://localhost:8080/rebalanceStrategy/67df7ff9bbddccb6af92219e");
    // console.log(getStrategy.data);
  } catch (error) {
    console.error("Error updating RebalanceStrategy:", error);
  }
}

async function Scenario() {
  try {
    const scenario = await axios.get("http://localhost:8080/scenario/67df22db4996aba7bb6e8d73");
    // console.log(scenario.data);
    const modifiedScenario = {
      ...scenario.data, // Copy all original properties
      name: "My fourth scenario", // Modify the attribute
    };
    const updateScenario = await axios.post("http://localhost:8080/updateScenario/67df22db4996aba7bb6e8d73", modifiedScenario);
    console.log(updateScenario.data);
  } catch (error) {
    console.error("Error updating:", error);
  }
}

//Income();
//Expense();
//Investments();
//Users();
//InvestStrategy();
//RebalanceStrat();
//Scenario();

module.exports = { Income, Expense, InvestStrategy, RebalanceStrategy, Investments, Scenario };
