const Scenario = require("../server/models/scenario");
const mongoose = require("mongoose");

// Connect to MongoDB (replace with your actual connection string)
mongoose
  .connect("mongodb://localhost:27017/hungerarc", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const test_scenario = new Scenario({
  name: "My first scenario.",
  filingStatus: "single",
  birthYearUser: 2003,
  lifeExpectancy: {
    type: "fixed",
    fixedAge: 80,
  },
  inflationAssumption: {
    type: "fixed",
    fixedRate: 10, // Fixed inflation rate
  },
  irsLimits: {
    initialAfterTax: 250, // IRS limit for after-tax income
  },
  optimizerSettings: {
    enabled: true, // Optimizer enabled
    startYear: 2022,
    endYear: 2025,
  },
  financialGoal: 100000, // Financial goal set to $100,000
  stateResident: "NY", // User resides in New York
});


test_scenario
  .save()
  .then(() => console.log("saved successfully!"))
  .catch((err) => console.error("Error saving scenario:", err));
