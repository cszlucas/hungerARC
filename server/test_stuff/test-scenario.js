const investment = require("../models/investment.js");
const InvestmentType = require("../models/investmentType.js");
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

const incomeEventData = {
  eventName: "Salary",
  eventDate: new Date("2025-01-01"),
  initialAmount: 50000,
  annualChange: {
    type: "percent",
    value: 0.05,
    percent: true,
  },
  userPercentage: 0.15,
  inflationAdjustment: true,
  isSocialSecurity: false,
};

const expenseEventData = {
  eventName: "Rent",
  eventDate: new Date("2025-01-01"),
  initialAmount: 1200,
  annualChange: {
    type: "fixed",
    value: 50,
    percent: false,
  },
  userPercentage: 0.3,
  inflationAdjustment: true,
  isDiscretionary: true,
};

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

// async function createInvestment() {
//   try {
//     // Create and save InvestmentType
//     const investmentType1 = new InvestmentType({
//       name: "Bond Fund",
//       description: "A conservative investment type focused on bonds.",
//       annualReturn: {
//         type: "normalPercent",
//         mean: 0.05,
//         stdDev: 0.1,
//       },
//       expenseRatio: 0.01,
//       annualIncome: {
//         type: "fixedPercent",
//         fixed: 5,
//         mean: 0.04,
//         stdDev: 0.05,
//       },
//       taxability: "tax-deferred",
//     });

//     const savedInvestmentType1 = await investmentType1.save(); // Wait for the save to complete
//     console.log("Investment Type saved ");

//     // Now create and save the Investment
//     const invest1 = new investment({
//       investmentType: savedInvestmentType1._id, // Reference the saved InvestmentType by ObjectId
//       value: 100,
//       accountTaxStatus: "pre-tax",
//     });

//     const savedInvestment1 = await invest1.save(); // Wait for the save to complete
//     console.log("Investment 1 saved ");

//     const investmentType2 = new InvestmentType({
//       name: "Equity Fund",
//       description: "A high-risk investment focusing on stocks.",
//       annualReturn: expectedAnnualData,
//       expenseRatio: 0.02,
//       annualIncome: expectedAnnualPercentage,
//       taxability: "taxable",
//     });

//     const savedInvestmentType2 = await investmentType2.save(); // Wait for the save to complete
//     console.log("Investment Type saved ");

//     // Now create and save the Investment
//     const invest2 = new investment({
//       investmentType: savedInvestmentType2._id,
//       value: 50,
//       accountTaxStatus: "non-tax",
//     });

//     const savedInvestment2 = await invest2.save(); // Wait for the save to complete
//     console.log("Investment 2 saved ");
//   } catch (err) {
//     console.error("Error ", err);
//   }
// }

// // Call the function and handle the returned investment
// createInvestment().then(() => {
//   console.log("Saved Investment outside of block");
// });


async function createEventSeries() {
  try {
    // Create and save InvestmentType
    const eventSeries = new EventSeries({
      eventSeriesName: "First event series",
      description: "First event series why.",
      startYear: {
        ""
      }
    });

  } catch (err) {
    console.error("Error ", err);
  }
}

// Call the function and handle the returned investment
createEventSeries().then(() => {
  console.log("Saved event series");
});

// const test_scenario = new Scenario({
//   name: "My first scenario.",
//   filingStatus: "single",
//   birthYearUser: 2003,
//   lifeExpectancy: {
//     type: "fixed",
//     fixedAge: 80,
//   },
//   setOfInvestments: [investment1, investment2],
//   incomeEventSeries: [incomeEventData],
//   expenseEventSeries: [expenseEventData],
//   investEventSeries: [investment2, investment1],
//   inflationAssumption: {
//     type: "fixed",
//     fixedRate: 10, // Fixed inflation rate
//   },
//   irsLimits: {
//     initialAfterTax: 250, // IRS limit for after-tax income
//   },
//   spendingStrategy: [expenseEventData],
//   expenseWithdrawalStrategy: [investment1, investment2],
//   rothConversionStrategy: [investment1, investment2],
//   rmdStrategy: [investment1, investment2],
//   optimizerSettings: {
//     enabled: true, // Optimizer enabled
//     startYear: 2022,
//     endYear: 2025,
//   },
//   financialGoal: 100000, // Financial goal set to $100,000
//   stateResident: "NY", // User resides in New York
// });

// investmentType1
//   .save()
//   .then(() => console.log("saved successfully!"))
//   .catch((err) => console.error("Error saving scenario:", err));

// const user = new User({
//   googleId: "123",
//   email: "zoe@gmail.com",
//   guest: false,
// });

// user
//   .save()
//   .then(() => console.log("saved successfully!"))
//   .catch((err) => console.error("Error saving user:", err));
