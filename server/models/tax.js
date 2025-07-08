// Import Mongoose
const mongoose = require('mongoose');

const path = require("path");
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'), // adjust if .env is in root
});

// Connect to MongoDB (replace with your actual connection string)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("Could not connect to MongoDB", err));

// Define the schema for federal income tax brackets
const federalIncomeTaxBracketSchema = new mongoose.Schema({
  incomeRange: {
    type: [Number],  // Array with two numbers representing the range
    required: true
  },
  taxRate: {
    type: Number,  // Tax rate for this income range
    required: true
  }
});

// Define the schema for capital gains tax rates
const capitalGainsTaxRateSchema = new mongoose.Schema({
  incomeRange: {
    type: [Number],  // Array with two numbers representing the range
    required: true
  },
  gainsRate: {
    type: Number,  // Capital gains tax rate
    required: true
  }
});

// Define the schema for the single tax details (for a specific year)
const singleTaxSchema = new mongoose.Schema({
  federalIncomeTaxRatesBrackets: [federalIncomeTaxBracketSchema],  // Array of tax brackets
  standardDeductions: {
    type: Number,  // Standard deduction for the year
    required: true
  },
  capitalGainsTaxRates: [capitalGainsTaxRateSchema]  // Array of capital gains tax rates
});

// Define the schema for the married tax details (for a specific year)
const marriedTaxSchema = new mongoose.Schema({
    federalIncomeTaxRatesBrackets: [federalIncomeTaxBracketSchema],  // Array of tax brackets
    standardDeductions: {
      type: Number,  // Standard deduction for the year
      required: true
    },
    capitalGainsTaxRates: [capitalGainsTaxRateSchema]  // Array of capital gains tax rates
  });

// Define the schema for the main document
const taxSchema = new mongoose.Schema({
  year: {
    type: Number,  // Year for the tax details
    required: true
  },
  single: singleTaxSchema,  // Single tax information for this year
  married: marriedTaxSchema
});

// Create a model for the Tax document
const Tax = mongoose.model('Tax', taxSchema);
module.exports = Tax;


// // Example: Creating a new document based on the schema
// const newTaxData = new Tax({
//   year: 2025,
//   single: {
//     federalIncomeTaxRatesBrackets: [
//       { incomeRange: [0, 0], taxRate: 100 },
//       { incomeRange: [11601, 47150], taxRate: 12 },
//       // Add other brackets as needed...
//     ],
//     standardDeductions: 14600,
//     capitalGainsTaxRates: [
//       { incomeRange: [0, 47025], gainsRate: 0 },
//       { incomeRange: [47025, 518900], gainsRate: 15 },
//       // Add other capital gains brackets as needed...
//     ]
//   }
// });

// // Save the new tax data to the database
// newTaxData.save()
//   .then(() => console.log('Tax data for 2025 has been saved successfully!'))
//   .catch((err) => console.error('Error saving tax data:', err));
