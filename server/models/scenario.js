var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var scenarioSchema = new Schema({
  name: { type: String, required: true },
  filingStatus: { type: String, required: true },
  birthYearUser: { type: Number, required: true },
  lifeExpectancy: {
    type: {
      type: String,
      // percentage
      enum: ["fixed", "normal"],
      required: true,
    },
    fixedAge: { type: Number },
    mean: { type: Number },
    stdDev: { type: Number },
  },
  setOfInvestments: [{ type: Schema.Types.ObjectId, ref: "Investment" }],
  setOfInvestmentTypes: [{ type: Schema.Types.ObjectId, ref: "InvestmentType" }],
  incomeEventSeries: [{ type: Schema.Types.ObjectId, ref: "IncomeEvent" }],
  expenseEventSeries: [{ type: Schema.Types.ObjectId, ref: "ExpenseEvent" }],
  investEventSeries: [{ type: Schema.Types.ObjectId, ref: "InvestEvent" }],
  rebalanceEventSeries: [{ type: Schema.Types.ObjectId, ref: "RebalanceEvent" }],
  inflationAssumption: {
    type: {
      type: String,
      // percentage
      enum: ["fixed", "normal", "uniform"],
      required: true,
    },
    fixedRate: { type: Number },
    mean: { type: Number },
    stdDev: { type: Number },
    min: { type: Number },
    max: { type: Number },
  },
  irsLimits: {
    initialAfterTax: { type: Number, required: true },
  },
  spendingStrategy: { type: Schema.Types.ObjectId, ref: "ExpenseEvent" },
  expenseWithdrawalStrategy: { type: Schema.Types.ObjectId, ref: "Investment" },
  rothConversionStrategy: { type: Schema.Types.ObjectId, ref: "Investment" },
  rmdStrategy: { type: Schema.Types.ObjectId, ref: "Investment" },
  optimizerSettings: {
    enabled: { type: Boolean, required: true },
    startYear: { type: Number },
    endYear: { type: Number },
  },
  // key is the user id
  sharedSettings: {
    type: Map,
    of: {
      type: String,
      enum: ["read-only", "read-write"],
      required: false, // Ensures each value is required
    },
  },
  financialGoal: { type: Number, default: 0 },
  stateResident: { type: String, required: true },
});

module.exports = mongoose.model("Scenario", scenarioSchema);
