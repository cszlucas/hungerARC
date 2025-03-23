const investment = require("../models/investment.js");
const InvestmentType = require("../models/investmentType.js");
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");
const Scenario = require("../models/scenario.js");
const User = require("../models/user.js");
const mongoose = require("mongoose");

// Connect to MongoDB (replace with your actual connection string)
mongoose
  .connect("mongodb://localhost:27017/hungerarc", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const expectedAnnualData = {
  type: "normalPercent",
  mean: 3,
  stdDev: 5,
};

const expectedAnnualPercentage = {
  type: "fixedPercent",
  fixed: 10,
  mean: 0.08,
  stdDev: 0.1,
};

async function createScenario() {
  try {
    // Create and save InvestmentType
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

    const savedInvestmentType1 = await investmentType1.save(); // Wait for the save to complete
    console.log("Investment Type saved ");

    // Now create and save the Investment
    const invest1 = new investment({
      investmentType: savedInvestmentType1._id, // Reference the saved InvestmentType by ObjectId
      value: 100,
      accountTaxStatus: "pre-tax",
    });

    const investment1 = await invest1.save(); // Wait for the save to complete
    console.log("Investment 1 saved ");

    const investmentType2 = new InvestmentType({
      name: "Equity Fund",
      description: "A high-risk investment focusing on stocks.",
      annualReturn: expectedAnnualData,
      expenseRatio: 0.02,
      annualIncome: expectedAnnualPercentage,
      taxability: "taxable",
    });

    const savedInvestmentType2 = await investmentType2.save(); // Wait for the save to complete
    console.log("Investment Type saved ");

    // Now create and save the Investment
    const invest2 = new investment({
      investmentType: savedInvestmentType2._id,
      value: 50,
      accountTaxStatus: "non-tax",
    });

    const investment2 = await invest2.save(); // Wait for the save to complete
    console.log("Investment 2 saved ");

    const annChange = new AnnualChange({
      type: "fixed",
      amount: 5000,
    });

    const annualChange = await annChange.save();

    const incomeEventData = new IncomeEvent({
      eventSeriesName: "income2020-2023",
      description: "Income event series from 2020-2025.",
      startYear: {
        type: "year",
        year: 2020,
      },
      duration: {
        type: "fixedAmt",
        value: 3,
      },
      eventName: "Salary",
      eventDate: new Date("2025-01-01"),
      initialAmount: 50000,
      annualChange: annualChange,
      userPercentage: 0.15,
      inflationAdjustment: true,
      isSocialSecurity: false,
    });

    const incomeEventData2 = new IncomeEvent({
      eventSeriesName: "income2023-2025",
      description: "Income event series from 2023-2025.",
      startYear: {
        type: "year",
        year: 2023,
      },
      duration: {
        type: "fixedAmt",
        value: 8,
      },
      eventName: "Salary",
      eventDate: new Date("2025-01-01"),
      initialAmount: 50000,
      annualChange: annualChange,
      userPercentage: 0.15,
      inflationAdjustment: true,
      isSocialSecurity: false,
    });

    const expenseEventData = new ExpenseEvent({
      eventSeriesName: "Expense 2023-2025",
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
      annualChange: annualChange,
      userPercentage: 0.3,
      inflationAdjustment: true,
      isDiscretionary: true,
    });

    const incomeEvent = await incomeEventData.save();
    const incomeEvent2 = await incomeEventData2.save();
    const expenseEvent = await expenseEventData.save();

    const investStrat1 = new InvestEvent({
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
        [investment1._id]: 30,
        [investment2._id]: 70,
      },
      maxCash: 100,
    });

    const investStrat2 = new InvestEvent({
      eventSeriesName: "Invest 2023-2025",
      description: "Invest event series from 2023-2025.",
      startYear: {
        type: "year",
        year: 2023,
      },
      duration: {
        type: "fixedAmt",
        value: 4,
      },
      type: "glidePath",
      initialPercentages: {
        [investment1._id]: 60,
        [investment2._id]: 40,
      },
      finalPercentages: {
        [investment1._id]: 30,
        [investment2._id]: 70,
      },
      maxCash: 300,
    });

    const rebalanceEventSeries = new RebalanceEvent({
      eventSeriesName: "Rebalance 2023-2025",
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
        [investment1._id]: 60,
        [investment2._id]: 40,
      },
      finalPercentages: {
        [investment1._id]: 30,
        [investment2._id]: 70,
      },
    });

    const investStr1 = await investStrat1.save();
    const investStr2 = await investStrat2.save();
    const rebalance = await rebalanceEventSeries.save();

    const test_scenario = new Scenario({
      name: "My first scenario.",
      filingStatus: "single",
      birthYearUser: 2003,
      lifeExpectancy: {
        type: "fixed",
        fixedAge: 80,
      },
      setOfInvestments: [investment1._id, investment2._id],
      incomeEventSeries: [incomeEvent._id, incomeEvent2._id],
      expenseEventSeries: [expenseEvent._id],
      investEventSeries: [investStr1, investStr2],
      rebalanceEventSeries: [rebalance],
      inflationAssumption: {
        type: "fixed",
        fixedRate: 10, // Fixed inflation rate
      },
      irsLimits: {
        initialAfterTax: 250, // IRS limit for after-tax income
      },
      spendingStrategy: [expenseEvent._id],
      expenseWithdrawalStrategy: [investment1._id, investment2._id],
      rothConversionStrategy: [investment1._id, investment2._id],
      rmdStrategy: [investment1._id, investment2._id],
      optimizerSettings: {
        enabled: true, // Optimizer enabled
        startYear: 2022,
        endYear: 2025,
      },
      financialGoal: 100000, // Financial goal set to $100,000
      stateResident: "NY", // User resides in New York
    });

    const testScenario = await test_scenario.save();
  } catch (err) {
    console.error("Error ", err);
  }
}

createScenario().then(() => {
  console.log("Saved scenario");
});

// const user = new User({
//   googleId: "123",
//   email: "zoe@gmail.com",
//   guest: false,
// });

// user
//   .save()
//   .then(() => console.log("saved successfully!"))
//   .catch((err) => console.error("Error saving user:", err));
