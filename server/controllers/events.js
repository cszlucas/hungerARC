//Events are: income, expense, investStrategy, expenseStrategy
const { Events } = require("../models/eventSeries.js");
const Scenario = require("../models/scenario.js");
const { IncomeEvent } = require("../models/eventSeries.js");
const { ExpenseEvent } = require("../models/eventSeries.js");

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

//getAllIncomeEvents based on scenarioId
exports.getAllIncomeEventsByScenario = async(req, res)=>{
   const { id } = req.params;
    try{
      const scenario = await Scenario.findOne({ _id: id });
      const incomeEventId = scenario.incomeEventSeries;
      const incomeEvent = await IncomeEvent.find({ _id: { $in: incomeEventId } });
      res.status(200).json(incomeEvent);
  } catch(err){
    res.status(500).json({ error: "Error getting all income events by scenario" });
  }
}



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

exports.getAllExpenseEventsByScenario = async(req, res)=>{
  const { id } = req.params;
   try{
     const scenario = await Scenario.findOne({ _id: id });
     const expenseEventId = scenario.expenseEventSeries;
     const expenseEvent = await ExpenseEvent.find({ _id: { $in: expenseEventId } });
     res.status(200).json(expenseEvent);
 } catch(err){
   res.status(500).json({ error: "Error getting all income events by scenario" });
 }
}
