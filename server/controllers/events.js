//Events are: income, expense, investStrategy, expenseStrategy
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");
const { ObjectId } = require("mongoose").Types;

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
  const incomeId = new ObjectId(req.params.id);
  let result;

  try {
    //Update the document by ID
    delete updateData._id;

    if (updateData) {
      result = await IncomeEvent.findOneAndUpdate(
        { _id: incomeId }, // Find document by ID
        { $set: updateData }, // Update fields
        { new: true }
      );
    }

    if (result) {
      return res.status(200).json({ message: "Document updated successfully", result });
    } else {
      return res.status(404).json({ message: "No document found to update" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error updating income", message: err.message });
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
    res.status(500).json({ error: "Failed to create ExpenseEvent", message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // Data to update (from the request body)
  const expenseId = new ObjectId(req.params.id);
  let result;
  delete updateData._id;

  try {
    // Update the document by ID
    if (updateData) {
      result = await ExpenseEvent.findOneAndUpdate({ _id: expenseId }, { $set: updateData }, { new: true });
    }

    if (!result) {
      return res.status(404).json({ message: "No document found to update" });
    }

    return res.status(200).json({ message: "Document updated successfully", result });
  } catch (err) {
    res.status(500).json({ error: "Error updating expense", message: err.message });
  }
};
