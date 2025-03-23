const { InvestmentType } = require("../models/investmentType.js");
const Scenario = require("../models/scenario.js");
const Investment = require("../models/investment.js");

exports.investment = async (req, res) => {
  const { name, description, annualReturn, expenseRatio, annualIncome, taxability, value, accountTaxStatus } = req.body;

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

    const invest = new investment({
      investmentType: savedInvestmentType._id,
      value,
      accountTaxStatus,
    });

    const investment = await invest.save();
    console.log("Investment saved ");

    res.status(201).json(savedInvestmentType);
  } catch (err) {
    console.error("Error saving Investment:", err);
    res.status(500).json({ error: "Error saving Investment" });
  }
};

exports.updateInvestment = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // Data to update (from the request body)

  try {
    // Update the document by ID
    if (updateData.investmentType) {
      const result = await InvestmentType.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData.investmentType });
    } else if (updateData) {
      const result = await Investment.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData });
    }

    if (result.nModified === 0) {
      // If no documents were modified, return a 404 response
      return res.status(404).json({ message: "No document found to update" });
    }

    // If the update is successful, return a 200 response with the result
    return res.status(200).json({ message: "Document updated successfully", result });
  } catch (err) {
    console.error("Error updating Investment:", err);
    res.status(500).json({ error: "Error updating Investment" });
  }
};

// getAllInvestments based on scenarioId
exports.getAllInvestmentsByScenario = async (req, res) => {
  const { id } = req.params;
  try{
    const scenario = await Scenario.findOne({ _id: id });
    const investmentIds = scenario.setOfInvestments;
    const investments = await Investment.find({ _id: { $in: investmentIds } });
    res.status(200).json(investments);
  }catch(err){
    res.status(500).json({ error: "Failed to get all investments by scenario" });
  }

}

