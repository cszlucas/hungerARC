//Events are: income, expense, investStrategy, expenseStrategy
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");

//INCOME EVENTS
exports.incomeEvent = async (req, res) => {
  try {
    const { eventSeriesName, description, startYear, duration, initialAmount, annualChange, userPercentage, inflationAdjustment, isSocialSecurity, baseEventSeries } = req.body;

    const newIncomeEvent = new IncomeEvent({
      eventSeriesName,
      description,
      startYear,
      duration,
      initialAmount,
      annualChange: {
        type: annualChange.type,
        amount: annualChange.amount,
      },
      userPercentage,
      inflationAdjustment,
      isSocialSecurity,
    });

    const savedIncomeEvent = await newIncomeEvent.save();

    res.status(201).json(savedIncomeEvent);
  } catch (err) {
    console.error("Error creating IncomeEvent:", err);
    res.status(500).json({ error: "Failed to create IncomeEvent" });
  }
};

exports.updateIncome = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // Data to update (from the request body)

  try {
    //Update the document by ID
    if (updateData) {
      const result = await IncomeEvent.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData });
    } else if (updateData.annualChange) {
      const result = await AnnualChange.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData.AnnualChange });
    }

    if (result.nModified === 0) {
      // If no documents were modified, return a 404 response
      return res.status(404).json({ message: "No document found to update" });
    }

    // If the update is successful, return a 200 response with the result
    return res.status(200).json({ message: "Document updated successfully", result });
  } catch (err) {
    res.status(500).json({ error: "Error updating", message: err });
  }
};

//EXPENSE EVENTS
exports.expenseEvent = async (req, res) => {
  try {
    const { eventSeriesName, description, startYear, duration, initialAmount, annualChange, userPercentage, inflationAdjustment, isDiscretionary } = req.body;

    const newExpenseEvent = new ExpenseEvent({
      eventSeriesName,
      description,
      startYear,
      duration,
      initialAmount,
      annualChange: {
        type: annualChange.type,
        amount: annualChange.amount,
      },
      userPercentage,
      inflationAdjustment,
      isDiscretionary,
    });

    const savedExpenseEvent = await newExpenseEvent.save();

    res.status(201).json(savedExpenseEvent);
  } catch (err) {
    console.error("Error creating ExpenseEvent:", err);
    res.status(500).json({ error: "Failed to create ExpenseEvent" });
  }
};

exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // Data to update (from the request body)

  try {
    // Update the document by ID
    if (updateData) {
      const result = await ExpenseEvent.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData });
    } else if (updateData.annualChange) {
      const result = await AnnualChange.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData.AnnualChange });
    }

    if (result.nModified === 0) {
      // If no documents were modified, return a 404 response
      return res.status(404).json({ message: "No document found to update" });
    }

    // If the update is successful, return a 200 response with the result
    return res.status(200).json({ message: "Document updated successfully", result });
  } catch (err) {
    res.status(500).json({ error: "Error updating" });
  }
};
