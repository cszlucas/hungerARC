var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// common fields for all event series, will be populated into event series schema
var BaseEventSchema = new Schema({
  eventSeriesName: { type: String },
  eventSeriesDescription: { type: String },
  startYear: {
    type: {
      type: String,
      // will be either one of these fields
      enum: ["fixedAmt", "normal", "uniform", "same", "after", ""],
    },
    value: { type: Number },
    mean: { type: Number },
    stdDev: { type: Number },
    min: { type: Number },
    max: { type: Number },
    refer:  { type: Schema.Types.ObjectId},
  },
  duration: {
    type: {
      type: String,
      enum: ["fixedAmt", "normal", "uniform", ""],
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
    enum: ["fixed", "percentage", ""],
  },
  distribution: {
    type: String,
    enum: ["none", "normal", "uniform", ""],
  },
  amount: { type: Number, },
  mean: { type: Number },
  stdDev: { type: Number },
  min: { type: Number },
  max: { type: Number },
});

var IncomeEventSchema = new Schema({
  ...BaseEventSchema.obj, // populate the fields from base event schema
  initialAmount: { type: Number },
  annualChange: { type: AnnualChange },
  userPercentage: { type: Number },
  inflationAdjustment: { type: Boolean },
  isSocialSecurity: { type: Boolean, default: false },
});

var ExpenseEventSchema = new Schema({
  ...BaseEventSchema.obj,
  initialAmount: { type: Number },
  annualChange: { type: AnnualChange },
  userPercentage: { type: Number },
  inflationAdjustment: { type: Boolean },
  isDiscretionary: { type: Boolean },
});

var AssetAllocationSchema = new Schema({
  type: { type: String, enum: ["fixed", "glidePath"] },

  fixedPercentages: {
    type: Map,
    of: Number,
  },

  initialPercentages: {
    type: Map,
    of: Number,
    validate: [
      {
        validator: function (value) {
          if (this.type === "glidePath" && value) {
            const sum = [...value.values()].reduce((acc, num) => acc + num, 0);
            return sum === 1;
          }
          return true;
        },
        message: "For 'glidePath', initialPercentages must sum to 1 (100%).",
      },
    ],
  },

  finalPercentages: {
    type: Map,
    of: Number,
    validate: [
      {
        validator: function (value) {
          if (this.type === "glidePath" && value) {
            const sum = [...value.values()].reduce((acc, num) => acc + num, 0);
            return sum === 1;
          }
          return true;
        },
        message: "For 'glidePath', finalPercentages must sum to 1 (100%).",
      },
    ],
  },
});

var InvestEventSchema = new Schema({
  ...BaseEventSchema.obj,
  assetAllocation: { type: AssetAllocationSchema },
  maxCash: { type: Number, required: true },
});

var RebalanceEventSchema = new Schema({
  ...BaseEventSchema.obj,
  taxStatus: { type: String },
  assetAllocation: { type: AssetAllocationSchema },
});

// export mongoose model for difference event series and annual change
module.exports = {
  BaseEventSeries: mongoose.model("BaseEventSeries", BaseEventSchema),
  IncomeEvent: mongoose.model("IncomeEvent", IncomeEventSchema),
  ExpenseEvent: mongoose.model("ExpenseEvent", ExpenseEventSchema),
  InvestEvent: mongoose.model("InvestEvent", InvestEventSchema),
  RebalanceEvent: mongoose.model("RebalanceEvent", RebalanceEventSchema),
  AnnualChange: mongoose.model("AnnualChange", AnnualChange),
};
