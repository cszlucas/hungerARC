const mongoose = require("mongoose");
const Scenario = require("../models/scenario.js");
const Investment = require("../models/investment.js");
const InvestmentType = require("../models/investmentType.js");
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");

const User = require("../models/user.js");
const { ObjectId } = mongoose.Types;
const axios = require("axios");
const { main } = require("../simulation/main.js");

exports.scenario = async (req, res) => {
  const scenarioId = new ObjectId(req.params.id);
  try {
    const scenario = await Scenario.findOne({ _id: scenarioId });
    if (!scenario) {
      return res.status(404).json({ message: "Scenario data not found" });
    }
    res.status(200).json(scenario);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve scenario data", message: err.message });
  }
};

exports.basicInfo = async (req, res) => {
  try {
    console.log("Full req.body:", JSON.stringify(req.body, null, 2));
    if (!req.session.user) res.status(500).json({ message: "Failed to get user session" });
    const userData = req.session.user;
    const user = await User.findOne({ _id: userData._id });
    if (!user) {
      console.log("user not found");
      return res.status(404).json({ message: "User not found" });
    }
    console.log("user", user);
    const { name, filingStatus, financialGoal, inflationAssumption, birthYearUser, lifeExpectancy, stateResident, birthYearSpouse, lifeExpectancySpouse, irsLimit } = req.body;

    const newBasicInfo = new Scenario({
      name,
      filingStatus,
      financialGoal,
      inflationAssumption: {
        type: inflationAssumption.type,
        fixedRate: inflationAssumption.fixedRate,
        mean: inflationAssumption.mean,
        stdDev: inflationAssumption.stdDev,
        min: inflationAssumption.min,
        max: inflationAssumption.max,
      },
      birthYearUser,
      lifeExpectancy: {
        type: lifeExpectancy.type,
        fixedAge: lifeExpectancy.fixedAge,
        mean: lifeExpectancy.mean,
        stdDev: lifeExpectancy.stdDev,
      },
      birthYearSpouse,
      lifeExpectancySpouse: {
        type: lifeExpectancySpouse.type,
        fixedAge: lifeExpectancySpouse.fixedAge,
        mean: lifeExpectancySpouse.mean,
        stdDev: lifeExpectancySpouse.stdDev,
      },
      stateResident,
      irsLimit,
    });

    const savedBasicInfo = await newBasicInfo.save();
    user.scenarios.push(savedBasicInfo._id);
    await user.save();
    console.log("USER SAVED, ", savedBasicInfo);
    res.status(201).json(savedBasicInfo);
  } catch (err) {
    console.error("Error creating scenario:", err.stack);
    res.status(500).json({ error: err.message });
  }
};

exports.updateScenario = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const result = await Scenario.findByIdAndUpdate(new ObjectId(id), { $set: updateData }, { new: true });
    return res.status(200).json({ message: "Scenario updated successfully", scenario: result });
  } catch (err) {
    console.error("Error adding to scenario:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.scenarioInvestments = async (req, res) => {
  try {
    const { investmentIds } = req.body;
    const objectIds = investmentIds.map((id) => new ObjectId(id));
    const investments = await Investment.find({ _id: { $in: objectIds } });
    res.status(200).json(investments);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve investments", message: err.message });
  }
};

exports.deleteScenario = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedScenario = await Scenario.findByIdAndDelete(id);
    if (!deletedScenario) {
      return res.status(404).json({ message: "Scenario not found" });
    }
    res.status(200).json({ message: "Scenario deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete scenario" });
  }
};

exports.importUserData = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(500).json({ message: "Failed to get user session" }); // ✅ added return
    }

    const userData = req.session.user;
    const { investments, investmentTypes, income, expense, invest, rebalance, scenario } = req.body;

    const user = await User.findOne({ _id: userData._id });
    if (!user) {
      console.log("user not found");
      return res.status(404).json({ message: "User not found" });
    }

    await Promise.all([
      ...investments.map((i) => new Investment(i).save()),
      ...investmentTypes.map((i) => new InvestmentType(i).save()),
      ...income.map((e) => new IncomeEvent(e).save()),
      ...expense.map((e) => new ExpenseEvent(e).save()),
      ...invest.map((e) => new InvestEvent(e).save()),
      ...rebalance.map((e) => new RebalanceEvent(e).save()),
    ]);

    const newScenario = await new Scenario(scenario).save();

    user.scenarios.push(scenario._id);
    await user.save();
    console.log("USER SAVED, ", newScenario);
    return res.status(200).json({ message: "Scenario successfully imported", scenario: newScenario });
  } catch (err) {
    console.error("Import error:", err);
    return res.status(500).json({ message: "Server error during import" });
  }
};

exports.simulateScenario = async (req, res) => {
  try {
    const { investmentType, invest, rebalance, expense, income, investment, scenario, exploration, userId, simulationCount = 1 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Run the simulation
    years = await main(investmentType, invest, rebalance, expense, income, investment, scenario, exploration, userId, simulationCount);
    // const { shadedChart, probabilityChart, barChartAverage, barChartMedian } = await main(investmentType, invest, rebalance, expense, income, investment, scenario, exploration, userId, simulationCount, scenarioId);
    // const { shadedChart, probabilityChart, barChartAverage, barChartMedian } = await main(simulationCount, scenarioId, userId);

    // Send results to frontend
    // res.status(200).json({
    //   shadedChart,
    //   probabilityChart,
    //   barChartAverage,
    //   barChartMedian,
    // });
    res.status(200).json({
      years,
    });
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ error: "Simulation failed" });
  }
};
