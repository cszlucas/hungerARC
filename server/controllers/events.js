//Events are: income, expense, investStrategy, expenseStrategy
const { Events } = require("../models/eventSeries.js");

//INCOME EVENTS
exports.incomeEvent = async (req, res) => {
  try {
    const { initialAmount, annualChange, userPercentage, inflationAdjustment, isSocialSecurity } = req.body;

    const newIncomeEvent = new Events.IncomeEvent({
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
