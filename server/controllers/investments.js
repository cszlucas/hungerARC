const { InvestmentType } = require("../models/investmentType.js");

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
    console.error("Error saving InvestmentType:", err);
    res.status(500).json({ error: "Error saving InvestmentType" });
  }
};
