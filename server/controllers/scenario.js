const mongoose = require("mongoose");
const Scenario = require("../models/scenario.js");
const Investment = require("../models/investment.js");
const User = require("../models/user.js");
const { ObjectId } = mongoose.Types;
const axios = require("axios");
const { main } = require('../../simulation/algo.js');

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
  const { id } = req.params; //user id
  console.log("Received request with ID:", req.params.id);
  try {
    const { name, filingStatus, financialGoal, inflationAssumption, birthYearUser, lifeExpectancy, stateResident, birthYearSpouse, lifeExpectancySpouse, irsLimit } = req.body;
    console.log("why");
    console.log("Request body:", req.body);
    const newBasicInfo = new Scenario({
      name,
      filingStatus,
      financialGoal,
      inflationAssumption: {
        type: inflationAssumption.inflationAssumptionType,
        fixedRate: inflationAssumption.fixedRate,
        mean: inflationAssumption.mean,
        stdDev: inflationAssumption.stdDev,
        min: inflationAssumption.min,
        max: inflationAssumption.max,
      },
      birthYearUser,
      lifeExpectancy: {
        type: lifeExpectancy.lifeExpectancyType,
        fixedAge: lifeExpectancy.fixedAge,
        mean: lifeExpectancy.mean,
        stdDev: lifeExpectancy.stdDev,
      },
      birthYearSpouse,
      lifeExpectancySpouse: {
        type: lifeExpectancySpouse.lifeExpectancyType,
        fixedAge: lifeExpectancySpouse.fixedAge,
        mean: lifeExpectancySpouse.mean,
        stdDev: lifeExpectancySpouse.stdDev,
      },
      stateResident,
      irsLimit,
    });

    const savedBasicInfo = await newBasicInfo.save();
    const user = await User.findOne({ _id: id });
    if (!user) {
      console.log("user not found");
      return res.status(404).json({ message: "user not found" });
    }
    user.scenarios.push(savedBasicInfo._id);
    await user.save();

    res.status(201).json(savedBasicInfo);
  } catch (err) {
    console.error("Error creating scenario:", err);
    res.status(500).json({ error: "Failed to create scenario" });
  }
};

exports.updateScenario = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const result = await Scenario.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    return res.status(200).json({ message: "Scenario updated successfully" });
  } catch (err) {
    console.error("Error adding to scenario:", err);
    res.status(500).json({ error: "Failed to add to scenario" });
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
  const { id } = req.params; //user id
  const {
    name,
    maritalStatus,
    birthYearSpouse,
    birthYearUser,
    lifeExpectancy,
    lifeExpectancySpouse,
    setOfinvestmentTypes,
    setOfinvestments,
    income,
    expense,
    invest,
    rebalance,
    inflationAssumption,
    irsLimit,
    spendingStrategy,
    expenseWithdrawalStrategy,
    rmdStrategy,
    optimizerSettings,
    rothConversionStrategy,
    financialGoal,
    stateResident,
  } = req.body;

  const basicInfoData = {
    name: name,
    filingStatus: maritalStatus === "couple" ? "couple" : "single",
    financialGoal: financialGoal,
    inflationAssumption: inflationAssumption,
    birthYearUser: birthYearUser,
    lifeExpectancy: lifeExpectancy,
    birthYearSpouse: birthYearSpouse ?? null,
    lifeExpectancySpouse: lifeExpectancySpouse,
    stateResident: stateResident,
    irsLimit: irsLimit,
  };

  try {
    const response = await axios.post(`http://localhost:3000/basicInfo/user/${id}`, {
      basicInfoData: basicInfoData,
    });

    let scenarioId = response._id;

    const eventMappings = [
      { data: income, route: "incomeEvent" },
      { data: expense, route: "expenseEvent" },
      { data: invest, route: "investStrategy" },
      { data: rebalance, route: "rebalanceStrategy" },
      { data: setOfinvestments, route: "investment" },
      { data: setOfinvestmentTypes, route: "investmentType" },
    ];

    for (const { data, route } of eventMappings) {
      for (const event of data ?? []) {
        try {
          await createEvent(route, scenarioId, event);
        } catch (error) {
          console.error(`Error creating ${route}:`, error.message);
        }
      }
    }

    await axios.post(`http://localhost:3000/scenario/${scenarioId}/update`, {
      spendingStrategy: spendingStrategy,
      expenseWithdrawalStrategy: expenseWithdrawalStrategy,
      rmdStrategy: rmdStrategy,
      rothConversionStrategy: rothConversionStrategy,
      optimizerSettings: optimizerSettings,
    });

    res.status(200).json({
      message: "User data imported successfully",
      scenario: response.data,
    });
  } catch (error) {
    console.error("Import failed:", error);
    res.status(500).json({ error: "Import failed" });
  }
};


exports.simulateScenario = async (req, res) => {
  try {
    const { scenarioId, userId, simulationCount = 1 } = req.query;

    if (!scenarioId || !userId) {
      return res.status(400).json({ error: 'Missing scenarioId or userId' });
    }

    // Run the simulation
    const {
      shadedChart,
      probabilityChart,
      barChartAverage,
      barChartMedian,
    } = await main(simulationCount, scenarioId, userId);

    // Send results to frontend
    res.status(200).json({
      shadedChart,
      probabilityChart,
      barChartAverage,
      barChartMedian,
    });
  } catch (err) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: 'Simulation failed' });
  }
}