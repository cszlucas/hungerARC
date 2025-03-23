//Events are: income, expense, investStrategy, expenseStrategy
const { Events } = require("../models/eventSeries.js");

//INCOME EVENTS
exports.incomeEvent = async (req, res) => {
  try {
    const { initialAmount, annualChange, userPercentage, inflationAdjustment, isSocialSecurity, baseEventSeries } = req.body;

    const newIncomeEvent = new Events.IncomeEvent({
      baseEventSeries,
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
    // Update the document by ID
    if (updateData) {
      const result = await Events.IncomeEvent.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData });
    } else if (updateData.annualChange) {
      const result = await Events.AnnualChange.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData.AnnualChange });
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

//EXPENSE EVENTS
exports.expenseEvent = async (req, res) => {
  try {
    const { initialAmount, annualChange, userPercentage, inflationAdjustment, isDiscretionary } = req.body;

    const newExpenseEvent = new Events.ExpenseEvent({
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
      const result = await Events.ExpenseEvent.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData });
    } else if (updateData.annualChange) {
      const result = await Events.AnnualChange.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData.AnnualChange });
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
