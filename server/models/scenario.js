var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var scenarioSchema = new Schema({
  name: { type: String },
  filingStatus: { type: String },
  birthYearUser: { type: Number },
  lifeExpectancy: {
    type: {
      type: String,
      // percentage
      enum: ["fixed", "normal", ""],
    },
    fixedAge: { type: Number },
    mean: { type: Number },
    stdDev: { type: Number },
  },
  birthYearSpouse: { type: Number },
  lifeExpectancySpouse: {
    type: {
      type: String,
      // percentage
      enum: ["fixed", "normal", ""],
    },
    fixedAge: { type: Number },
    mean: { type: Number },
    stdDev: { type: Number },
  },
  setOfinvestmentTypes: [{ type: Schema.Types.ObjectId, ref: "InvestmentType" }],
  setOfInvestments: [{ type: Schema.Types.ObjectId, ref: "Investment" }],
  incomeEventSeries: [{ type: Schema.Types.ObjectId, ref: "IncomeEvent" }],
  expenseEventSeries: [{ type: Schema.Types.ObjectId, ref: "ExpenseEvent" }],
  investEventSeries: [{ type: Schema.Types.ObjectId, ref: "InvestEvent" }],
  rebalanceEventSeries: [{ type: Schema.Types.ObjectId, ref: "RebalanceEvent" }],
  inflationAssumption: {
    type: {
      type: String,
      // all is a percentage
      enum: ["fixed", "normal", "uniform", ""],
    },
    fixedRate: { type: Number },
    mean: { type: Number },
    stdDev: { type: Number },
    min: { type: Number },
    max: { type: Number },
  },
  irsLimit: { type: Number },
  spendingStrategy: [{ type: Schema.Types.ObjectId, ref: "ExpenseEvent" }],
  expenseWithdrawalStrategy: [{ type: Schema.Types.ObjectId, ref: "Investment" }],
  rothConversionStrategy: [{ type: Schema.Types.ObjectId, ref: "Investment" }],
  rmdStrategy: [{ type: Schema.Types.ObjectId, ref: "Investment" }],
  optimizerSettings: {
    enabled: { type: Boolean },
    startYear: { type: Number },
    endYear: { type: Number },
  },
  // key is the user id
  sharedSettings: {
    type: Map,
    of: {
      type: String,
      enum: ["read-only", "read-write"],
    },
  },
  financialGoal: { type: Number, default: 0 },
  stateResident: { type: String },
});

module.exports = mongoose.model("Scenario", scenarioSchema);
