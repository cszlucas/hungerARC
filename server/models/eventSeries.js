var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var BaseEventSchema = new Schema({
  _scenario: { type: Schema.Types.ObjectId, ref: "Scenario", required: true },
  eventSeriesName: { type: String, required: true },
  eventSeriesDescription: { type: String },
  startYear: {
    type: {
      type: String,
      enum: ["fixedAmt", "normal", "uniform", "year"],
      required: true,
    },
    value: { type: Number },
    mean: { type: Number },
    stdDev: { type: Number },
    min: { type: Number },
    max: { type: Number },
    year: { type: Number },
  },
  duration: {
    type: {
      type: String,
      enum: ["fixedAmt", "normal", "uniform"],
      required: true,
    },
    value: { type: Number },
    mean: { type: Number },
    stdDev: { type: Number },
    min: { type: Number },
    max: { type: Number },
  },
});

var AnnualChange = new Schema({
    type: {
      type: String,
      enum: ["fixed", "percentage"], // Example valid values
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  });
  

var IncomeEventSchema = new Schema({
  ...BaseEventSchema.obj,
  initialAmount: { type: Number, required: true },
  annualChange: { type: AnnualChange },
  userPercentage: { type: Number },
  inflationAdjustment: { type: Boolean },
  // change in code
  isSocialSecurity: { type: Boolean, default: false },
});

var ExpenseEventSchema = new Schema({
  ...BaseEventSchema.obj,
  initialAmount: { type: Number, required: true },
  annualChange: { type: AnnualChange },
  userPercentage: { type: Number },
  inflationAdjustment: { type: Boolean },
  isDiscretionary: { type: Boolean },
});

var AssetAllocationSchema = new Schema({
  type: { type: String, enum: ["fixed", "glidePath"], required: true },
  fixedPercentages: { type: Map, of: Number }, // eg: { 'objectIdBondInvestment': 30, 'objectIdStockInvestment': 70 }
  initialPercentages: { type: Map, of: Number }, // glidePath
  finalPercentages: { type: Map, of: Number }, // glidePath
});

var InvestEventSchema = new Schema({
  ...BaseEventSchema.obj,
  assetAllocation: { type: AssetAllocationSchema },
  maxCash: { type: Number, required: true },
});

var RebalanceEventSchema = new Schema({
  ...BaseEventSchema.obj,
  rebalanceAllocation: { type: AssetAllocationSchema },
});

module.exports = {
  IncomeEvent: mongoose.model("IncomeEvent", IncomeEventSchema),
  ExpenseEvent: mongoose.model("ExpenseEvent", ExpenseEventSchema),
  InvestEvent: mongoose.model("InvestEvent", InvestEventSchema),
  RebalanceEvent: mongoose.model("RebalanceEvent", RebalanceEventSchema),
};
