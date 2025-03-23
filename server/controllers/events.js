//Events are: income, expense, investStrategy, expenseStrategy
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");
const { ObjectId } = require("mongoose").Types;
const Scenario = require("../models/scenario.js");

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

// INVEST STRATEGY EVENTS
exports.investStrategy = async (req, res) => {
  const { eventSeriesName, description, startYear, duration, type, fixedPercentages, initialPercentages, finalPercentages, maxCash } = req.body;
  console.log("here");
  try {

    const investEvent = new InvestEvent({
      eventSeriesName,
      description,
      startYear,
      duration,
      type,
      fixedPercentages,
      initialPercentages,
      finalPercentages,
      maxCash,
    });

    const savedInvestEvent = await investEvent.save();

    res.status(201).json(savedInvestEvent);
  } catch (err) {
    res.status(500).json({ error: "Failed to create investEvent", message: err.message });
  }
};

exports.investStrategy = async (req, res) => {
  const strategyId = new ObjectId(req.params.id);
  try {
    const strategy = await InvestEvent.findOne({ _id: strategyId });
    if (!strategy) {
      return res.status(404).json({ message: "strategy data not found" });
    }
    res.status(200).json(strategy);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve strategy data", message: err.message });
  }
};

// REBALANCE STRATEGY 
exports.rebalanceStrategy = async (req, res) => {
  const { eventSeriesName, description, startYear, duration, type, fixedPercentages, initialPercentages, finalPercentages} = req.body;
  console.log("here");
  try {

    const rebalanceEvent = new RebalanceEvent({
      eventSeriesName,
      description,
      startYear,
      duration,
      type,
      fixedPercentages,
      initialPercentages,
      finalPercentages,
    });

    const savedRebalanceEvent = await rebalanceEvent.save();

    res.status(201).json(savedRebalanceEvent);
  } catch (err) {
    res.status(500).json({ error: "Failed to create rebalanceEvent", message: err.message });
  }
};

exports.rebalanceStrategy = async (req, res) => {
  const strategyId = new ObjectId(req.params.id);
  try {
    const strategy = await RebalanceEvent.findOne({ _id: strategyId });
    if (!strategy) {
      return res.status(404).json({ message: "strategy data not found" });
    }
    res.status(200).json(strategy);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve strategy data", message: err.message });
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
