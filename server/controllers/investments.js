const InvestmentType = require("../models/investmentType.js");
const Investment = require("../models/investment.js");
const { ObjectId } = require("mongoose").Types;
const Scenario = require("../models/scenario.js");

exports.createInvestmentType = async (req, res) => {
  const { id } = req.params;
  const { name, description, annualReturn, expenseRatio, annualIncome, taxability } = req.body;

  try {
    const newInvestmentType = new InvestmentType({
      name,
      description,
      annualReturn: {
        type: annualReturn.type,
        unit: annualReturn.unit,
        value: annualReturn.value,
        mean: annualReturn.mean,
        stdDev: annualReturn.stdDev,
      },
      expenseRatio,
      annualIncome: {
        type: annualIncome.type,
        unit: annualReturn.unit,
        value: annualIncome.value,
        mean: annualIncome.mean,
        stdDev: annualIncome.stdDev,
      },
      taxability,
    });

    const savedInvestmentType = await newInvestmentType.save();
    const scenario = await Scenario.findOne({ _id: id });
    if (!scenario) {
      console.log("Scenario not found");
      return res.status(404).json({ message: "Scenario not found" });
    }
    scenario.setOfInvestmentTypes.push(savedInvestmentType._id);
    await scenario.save();

    res.status(201).json(savedInvestmentType);
  } catch (err) {
    res.status(500).json({ error: "Error saving Investment type", message: err.message });
  }
};

exports.createInvestment = async (req, res) => {
  const { id } = req.params;
  const { investmentType, value, accountTaxStatus } = req.body;

  try {
    const invest = new Investment({
      investmentType,
      value,
      accountTaxStatus,
    });

    const investment = await invest.save();
    const scenario = await Scenario.findOne({ _id: id });
    if (!scenario) {
      console.log("Scenario not found");
      return res.status(404).json({ message: "Scenario not found" });
    }
    scenario.setOfInvestments.push(investment._id);
    await scenario.save();
    // console.log("Investment saved ");

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

    if (!scenario) {
      return res.status(404).json({ error: "Scenario not found" });
    }

    const investmentIds = scenario.setOfInvestments || [];
    const investments = await Investment.find({ _id: { $in: investmentIds } });
    res.status(200).json(investments);
  } catch (err) {
    console.error("Error in getAllInvestmentsByScenario:", err);
    res.status(500).json({ error: "Failed to get all investments by scenario" });
  }
};


exports.getInvestmentTypeByScenario = async (req, res) => {
  const { id } = req.params;
  try{
    const scenario = await Scenario.findOne({ _id: id });
    const investmentTypeIds = scenario.setOfInvestmentTypes;
    const investmentTypes = await InvestmentType.find({ _id: { $in: investmentTypeIds } });
    res.status(200).json(investmentTypes);
  }catch(err){
    res.status(500).json({ error: "Failed to get all investments type by scenario" });
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

exports.deleteInvestment = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedInvestment = await Investment.findByIdAndDelete(id);
    if (!deletedInvestment) {
      return res.status(404).json({ message: "Investment not found" });
    }
    res.status(200).json({ message: "Investment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete investment" });
  }
}

exports.deleteInvestmentType = async (req, res) => {  
  const { id } = req.params;
  try {
    const deletedInvestmentType = await InvestmentType.findByIdAndDelete(id);
    if (!deletedInvestmentType) {
      return res.status(404).json({ message: "Investment type not found" });
    }
    res.status(200).json({ message: "Investment type deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete investment type" });
  }
}