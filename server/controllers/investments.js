const InvestmentType = require("../models/investmentType.js");
const Investment = require("../models/investment.js");
const { ObjectId } = require("mongoose").Types;
const Scenario = require("../models/scenario.js");

exports.investmentType = async (req, res) => {
  const { name, description, annualReturn, expenseRatio, annualIncome, taxability } = req.body;

  try {
    const newInvestmentType = new InvestmentType({
      name,
      description,
      annualReturn: {
        type: annualReturn.type,
        fixed: annualReturn.fixed,
        mean: annualReturn.mean,
        stdDev: annualReturn.stdDev,
      },
      expenseRatio,
      annualIncome: {
        type: annualIncome.type,
        fixed: annualIncome.fixed,
        mean: annualIncome.mean,
        stdDev: annualIncome.stdDev,
      },
      taxability,
    });

    const savedInvestmentType = await newInvestmentType.save();

    res.status(201).json(savedInvestmentType);
  } catch (err) {
    res.status(500).json({ error: "Error saving Investment type", message: err.message });
  }
};

exports.investment = async (req, res) => {
  const { investmentType, value, accountTaxStatus } = req.body;

  try {
    const invest = new Investment({
      investmentType,
      value,
      accountTaxStatus,
    });

    const investment = await invest.save();
    console.log("Investment saved ");

    res.status(201).json(investment);
  } catch (err) {
    res.status(500).json({ error: "Error saving Investment", message: err.message });
  }
};

exports.updateInvestmentType = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // Data to update (from the request body)
  const investId = new ObjectId(req.params.id);
  let result;
  delete updateData._id;

  try {
    if (updateData) {
      result = await InvestmentType.findOneAndUpdate({ _id: investId }, { $set: updateData }, { new: true });
    }

    if (!result) {
      return res.status(404).json({ message: "No document found to update" });
    }

    return res.status(200).json({ message: "Document updated successfully", result });
  } catch (err) {
    console.error("Error updating Investment:", err);
    res.status(500).json({ error: "Error updating Investment" });
  }
};

exports.updateInvestment = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // Data to update (from the request body)
  const investId = new ObjectId(req.params.id);
  let result;
  delete updateData._id;

  try {
    if (updateData) {
      result = await Investment.findOneAndUpdate({ _id: investId }, { $set: updateData }, { new: true });
    }

    if (!result) {
      return res.status(404).json({ message: "No document found to update" });
    }

    return res.status(200).json({ message: "Document updated successfully", result });
  } catch (err) {
    console.error("Error updating Investment:", err);
    res.status(500).json({ error: "Error updating Investment" });
  }
};

// getAllInvestments based on scenarioId
exports.getAllInvestmentsByScenario = async (req, res) => {
  const { id } = req.params;
  try {
    const scenario = await Scenario.findOne({ _id: id });
    const investmentIds = scenario.setOfInvestments;
    const investments = await Investment.find({ _id: { $in: investmentIds } });
    res.status(200).json(investments);
  } catch (err) {
    res.status(500).json({ error: "Failed to get all investments by scenario" });
  }
};

exports.getInvestment = async (req, res) => {
  const investId = new ObjectId(req.params.id);
  try {
    const investType = await Investment.findOne({ _id: investId });

    if (!investType) {
      return res.status(404).json({ message: "Investment data not found" });
    }
    res.status(200).json(investType);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve Investment data", message: err.message });
  }
};
