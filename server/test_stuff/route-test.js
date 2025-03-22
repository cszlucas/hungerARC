const axios = require("axios");
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");

async function Income() {
  try {
    // const incomeEventData = new IncomeEvent({
    //   eventSeriesName: "income1980-2000",
    //   description: "Income event series from 2020-2025.",
    //   startYear: {
    //     type: "year",
    //     year: 1980,
    //   },
    //   duration: {
    //     type: "fixedAmt",
    //     value: 20,
    //   },
    //   eventName: "Salary",
    //   eventDate: new Date("2025-01-01"),
    //   initialAmount: 50000,
    //   annualChange: {
    //     type: "fixed",
    //     amount: 5000,
    //   },
    //   userPercentage: 0.15,
    //   inflationAdjustment: false,
    //   isSocialSecurity: false,
    // });

    // const response = await axios.post("http://localhost:8080/incomeEvent", incomeEventData);

    const incomeEventData2 = new IncomeEvent({
      eventSeriesName: "income1990-2000",
      description: "Income event series from 1990-2000.",
      startYear: {
        type: "year",
        year: 1990,
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
        amount: 5000,
      },
      userPercentage: 0.15,
      inflationAdjustment: false,
      isSocialSecurity: false,
    });

    const update = await axios.post("http://localhost:8080/updateIncome/67df3c2523356bddab87a00e", incomeEventData2);
    console.log("Anything?", update.data);

  } catch (error) {
    console.error("Error fetching income:", error);
  }
}

Income();


