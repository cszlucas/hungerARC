const axios = require("axios");
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");
const InvestmentType = require("../models/investmentType.js");
const Investment = require("../models/investment.js");

async function Income() {
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

    // const response = await axios.post("http://localhost:8080/incomeEvent", incomeEventData);

    const incomeEventData2 = new IncomeEvent({
      eventSeriesName: "income1970-2000",
      description: "Income events series from 1990-2000.",
      startYear: {
        type: "year",
        year: 1970,
      },
      duration: {
        type: "fixedAmt",
        value: 10,
      },
      eventName: "Salary",
      eventDate: new Date("2025-01-01"),
      initialAmount: 500,
      annualChange: {
        type: "fixed",
        amount: 25,
      },
      userPercentage: 0.15,
      inflationAdjustment: false,
      isSocialSecurity: false,
    });

    // const update = await axios.post("http://localhost:8080/updateIncome/67df3c2523356bddab87a00e", incomeEventData2);
    // console.log("Anything?", update.data);
  } catch (error) {
    console.error("Error fetching income:", error);
  }
}

async function Expense() {
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

    // const response = await axios.post("http://localhost:8080/expenseEvent", expenseEventData);

    const expenseEventData2 = new ExpenseEvent({
      eventSeriesName: "Expense 2003-1990",
      description: "Expense event series from 2023-2025.",
      startYear: {
        type: "year",
        year: 2023,
      },
      duration: {
        type: "fixedAmt",
        value: 10,
      },
      eventName: "Rent",
      eventDate: new Date("1990-01-01"),
      initialAmount: 1200,
      annualChange: {
        type: "fixed",
        amount: 5000,
      },
      userPercentage: 0.3,
      inflationAdjustment: true,
      isDiscretionary: true,
    });

    // const update = await axios.post("http://localhost:8080/updateExpense/67df55b6e8d21a88223976e0", expenseEventData2);
  } catch (error) {
    console.error("Error fetching income:", error);
  }
}

async function Investments() {
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
      taxability: "tax-deferred",
    });

    //const type = await axios.post("http://localhost:8080/investmentType", investmentType1);

    // const invest1 = new Investment({
    //   investmentType: type.data._id,
    //   value: 100,
    //   accountTaxStatus: "pre-tax",
    // });

    //const inv = await axios.post("http://localhost:8080/investment", invest1);

    //UPDATE

    const investmentType2 = new InvestmentType({
      name: "Bond Fund",
      description: "idk.",
      annualReturn: {
        type: "normalPercent",
        mean: 0.05,
        stdDev: 0.1,
      },
      expenseRatio: 0.01,
      annualIncome: {
        type: "fixedPercent",
        fixed: 5,
        mean: 10,
        stdDev: 0.05,
      },
      taxability: "tax-deferred",
    });

    // const update = await axios.post("http://localhost:8080/updateInvestmentType/67df68e520abee9d9188b03a", investmentType2);

    // const invest2 = new Investment({
    //   investmentType: update.data._id, // Reference the saved InvestmentType by ObjectId
    //   value: 10,
    //   accountTaxStatus: "non-tax",
    // });

    // const updateInvest = await axios.post("http://localhost:8080/updateInvestment/67df68e520abee9d9188b03e", invest2);
  } catch (error) {
    console.error("Error updating:", error);
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

//Income();
//Expense();
//Investments();
//Users();
