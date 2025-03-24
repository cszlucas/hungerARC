const axios = require("axios");
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");
const Scenario = require("../models/scenario.js");
const InvestmentType = require("../models/investmentType.js");
const Investment = require("../models/investment.js");
const { ObjectId } = require("mongoose");

async function baseScenario() {
  try {
    const baseScenario = new Scenario({
      name: "My happy scenario.",
      filingStatus: "single",
      financialGoal: 300000,
      inflationAssumption: {
        type: "fixed",
        fixedRate: 10, // Fixed inflation rate
      },
      birthYearUser: 2003,
      lifeExpectancy: {
        type: "fixed",
        fixedAge: 80,
      },
      stateResident: "NY",
    });

    const scenario = await axios.post("http://localhost:8080/basicInfo", baseScenario);
    console.log(scenario.data._id);
    return scenario.data;
  } catch (error) {
    console.error("Error fetching income:", error);
  }
}

async function Income(scenarioId) {
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

    // const incomeEventData2 = new IncomeEvent({
    //   ...response.data,
    //   eventSeriesName: "updated Income",
    //   initialAmount: 500,
    // });

    // const update = await axios.post("http://localhost:8080/updateIncome/${dynamicId}", incomeEventData2);
    // console.log(update.data);

  } catch (error) {
    console.error("Error fetching income:", error);
  }
}

//const scenario = baseScenario();
const scenarioId = "67e0b7dc0de0ec503315d62f";
//Income(scenarioId);
