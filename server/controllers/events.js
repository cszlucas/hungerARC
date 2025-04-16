//Events are: income, expense, investStrategy, expenseStrategy
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");
const { ObjectId } = require("mongoose").Types;
const Scenario = require("../models/scenario.js");

//INCOME EVENTS

// add a new income event to incomeevent collection
exports.createIncomeEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const { _id, eventSeriesName, description, startYear, duration, initialAmount, annualChange, userPercentage, inflationAdjustment, isSocialSecurity } = req.body;

    console.log(annualChange);
    console.log(annualChange.type);

    // creates a new income event using extracted request body data
    const newIncomeEvent = new IncomeEvent({
      _id: _id ?? new ObjectId(),
      eventSeriesName,
      description,
      startYear,
      duration,
      initialAmount,
      annualChange: {
        type: annualChange.type,
        amount: annualChange.amount,
        distribution: annualChange.distribution,
        mean: annualChange.mean,
        stdDev: annualChange.stdDev,
        min: annualChange.min,
        max: annualChange.max,
      },
      userPercentage,
      inflationAdjustment,
      isSocialSecurity,
    });

    const savedIncomeEvent = await newIncomeEvent.save();
    const scenario = await Scenario.findOne({ _id: id });
    if (!scenario) {
      console.log("Scenario not found");
      return res.status(404).json({ message: "Scenario not found" });
    }
    scenario.incomeEventSeries.push(savedIncomeEvent._id);
    await scenario.save();

    res.status(201).json(savedIncomeEvent);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
};

// update existing income event with changed entries
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

exports.deleteIncomeEvent = async (req, res) => { 
  const { id } = req.params; // income event id
  try {
    const incomeEvent = await IncomeEvent.findByIdAndDelete(id); // delete the income event based on its id
    if (!incomeEvent) {
      return res.status(404).json({ message: "Income event not found" });
    }
    res.status(200).json({ message: "Income event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting income event", message: err.message });
  }
};

//get all income events based on the scenario id
exports.getAllIncomeEventsByScenario = async (req, res) => {
  const { id } = req.params;
  try {
    const scenario = await Scenario.findOne({ _id: id });
    const incomeEventId = scenario.incomeEventSeries; // array of income events belonging to the scenario
    const incomeEvent = await IncomeEvent.find({ _id: { $in: incomeEventId } });
    res.status(200).json(incomeEvent);
  } catch (err) {
    res.status(500).json({ error: "Error getting all income events by scenario" });
  }
};

//EXPENSE EVENTS

// add a new expense event to expenseevent collection
exports.createExpenseEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const { _id, eventSeriesName, description, startYear, duration, initialAmount, annualChange, userPercentage, inflationAdjustment, isDiscretionary } = req.body;

    const newExpenseEvent = new ExpenseEvent({
      _id: _id ?? new ObjectId(),
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
    const scenario = await Scenario.findOne({ _id: id });
    if (!scenario) {
      console.log("Scenario not found");
      return res.status(404).json({ message: "Scenario not found" });
    }
    scenario.expenseEventSeries.push(savedExpenseEvent._id);
    await scenario.save();

    res.status(201).json(savedExpenseEvent);
  } catch (err) {
    res.status(500).json({ error: "Failed to create ExpenseEvent", message: err.message });
  }
};

// update the field(s) in existing expense in mongodb
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

exports.deleteExpenseEvent = async (req, res) => {
  const { id } = req.params; // expense event id
  try {
    const expenseEvent = await ExpenseEvent.findByIdAndDelete(id); // delete the expense event based on its id
    if (!expenseEvent) {
      return res.status(404).json({ message: "Expense event not found" });
    }
    res.status(200).json({ message: "Expense event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting expense event", message: err.message });
  }
};

// INVEST STRATEGY EVENTS

// add a new invest event to investevent collection
exports.createInvestStrategy = async (req, res) => {
  const { id } = req.params;
  const { _id, eventSeriesName, description, startYear, duration, type, assetAllocation, maxCash } = req.body;
  //console.log("create invest strategy");
  //console.log("assetAllocation", assetAllocation);
  try {
    const investEvent = new InvestEvent({
      _id: _id ?? new ObjectId(),
      eventSeriesName,
      description,
      startYear,
      duration,
      type,
      assetAllocation: {
        type: assetAllocation.type,
        fixedPercentages: assetAllocation.fixedPercentages,
        initialPercentages: assetAllocation.initialPercentages,
        finalPercentages: assetAllocation.finalPercentages,
      },  
      maxCash,
    });

    const savedInvestEvent = await investEvent.save(); // save to database
    const scenario = await Scenario.findOne({ _id: id });
    if (!scenario) {
      console.log("Scenario not found");
      return res.status(404).json({ message: "Scenario not found" });
    }
    scenario.investEventSeries.push(savedInvestEvent._id);
    await scenario.save();

    res.status(201).json(savedInvestEvent);
  } catch (err) {
    res.status(500).json({ error: "Failed to create investEvent", message: err.message });
  }
};

// retrieve the invest event based on the id
exports.getInvestStrategy = async (req, res) => {
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

// update field(s) of existing invest event
exports.updateInvestStrategy = async (req, res) => {
  const strategyId = new ObjectId(req.params.id);
  const updateData = req.body; // Data to update (from the request body)
  let result;
  delete updateData._id;
  try {
    if (updateData) {
      result = await InvestEvent.findOneAndUpdate({ _id: strategyId }, { $set: updateData }, { new: true });
    }

    if (!result) {
      return res.status(404).json({ message: "No document found to update" });
    }

    return res.status(200).json({ message: "Document updated successfully", result });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve strategy data", message: err.message });
  }
};

exports.deleteInvestEvent = async (req, res) => { 
  const { id } = req.params; // invest event id
  try {
    const investEvent = await InvestEvent.findByIdAndDelete(id); // delete the invest event based on its id
    if (!investEvent) {
      return res.status(404).json({ message: "Invest event not found" });
    }
    res.status(200).json({ message: "Invest event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting invest event", message: err.message });
  }
};

// REBALANCE STRATEGY

// add a new rebalance event to rebalanceevent collection
exports.createRebalanceStrategy = async (req, res) => {
  const { id } = req.params;
  const { _id, eventSeriesName, description, startYear, duration, taxStatus, rebalanceAllocation } = req.body;

  try {
    const rebalanceEvent = new RebalanceEvent({
      _id: _id ?? new ObjectId(),
      eventSeriesName,
      description,
      startYear,
      duration,
      taxStatus,
      rebalanceAllocation: {
        type: rebalanceAllocation.type,  
        initialPercentages: rebalanceAllocation.initialPercentages,  
        finalPercentages: rebalanceAllocation.finalPercentages,  
        fixedPercentages: rebalanceAllocation.fixedPercentages,  
      },
    });

    const savedRebalanceEvent = await rebalanceEvent.save();
    const scenario = await Scenario.findOne({ _id: id });
    if (!scenario) {
      console.log("Scenario not found");
      return res.status(404).json({ message: "Scenario not found" });
    }
    scenario.rebalanceEventSeries.push(savedRebalanceEvent._id);
    await scenario.save();

    res.status(201).json(savedRebalanceEvent);
  } catch (err) {
    res.status(500).json({ error: "Failed to create rebalanceEvent", message: err.message });
  }
};

// retrieve the rebalance event based on its id
exports.getRebalanceStrategy = async (req, res) => {
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

// update existing rebalance event
exports.updateRebalanceStrategy = async (req, res) => {
  const strategyId = new ObjectId(req.params.id);
  const updateData = req.body; // Data to update (from the request body)
  let result;
  delete updateData._id;
  try {
    if (updateData) {
      result = await RebalanceEvent.findOneAndUpdate({ _id: strategyId }, { $set: updateData }, { new: true });
    }

    if (!result) {
      return res.status(404).json({ message: "No document found to update" });
    }

    return res.status(200).json({ message: "Document updated successfully", result });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve Rebalance strategy data", message: err.message });
  }
};

exports.deleteRebalanceEvent = async (req, res) => {
  const { id } = req.params; // rebalance event id
  try {
    const rebalanceEvent = await RebalanceEvent.findByIdAndDelete(id); // delete the rebalance event based on its id
    if (!rebalanceEvent) {
      return res.status(404).json({ message: "Rebalance event not found" });
    }
    res.status(200).json({ message: "Rebalance event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting rebalance event", message: err.message });
  }
};

// retrieve array of rebalance events object belonging to a scenario
exports.getAllRebalanceEventsByScenario = async (req, res) => {
  const { id } = req.params;
  try {
    const scenario = await Scenario.findOne({ _id: id }); // find the scenario based on its id
    const rebalanceEventId = scenario.rebalanceEventSeries;
    const rebalanceEvent = await RebalanceEvent.find({ _id: { $in: rebalanceEventId } });
    res.status(200).json(rebalanceEvent);
  } catch (err) {
    res.status(500).json({ error: "Error getting all rebalance events by scenario" });
  }
};

// retrieve array of invest events object belonging to a scenario
exports.getAllInvestEventsByScenario = async (req, res) => {
  const { id } = req.params;
  try {
    const scenario = await Scenario.findOne({ _id: id });
    const investEventId = scenario.investEventSeries;
    const investEvent = await InvestEvent.find({ _id: { $in: investEventId } });
    res.status(200).json(investEvent);
  } catch (err) {
    res.status(500).json({ error: "Error getting all invest events by scenario" });
  }
};

// retrieve array of expense events object belonging to a scenario
exports.getAllExpenseEventsByScenario = async (req, res) => {
  const { id } = req.params;
  try {
    const scenario = await Scenario.findOne({ _id: id });
    const expenseEventId = scenario.expenseEventSeries;
    const expenseEvent = await ExpenseEvent.find({ _id: { $in: expenseEventId } });
    res.status(200).json(expenseEvent);
  } catch (err) {
    res.status(500).json({ error: "Error getting all expense events by scenario" });
  }
};
