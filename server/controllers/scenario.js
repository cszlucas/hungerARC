const mongoose = require("mongoose");
const Scenario = require("../models/scenario.js");
const Investment = require("../models/investment.js");
const User = require("../models/user.js");
const { ObjectId } = mongoose.Types;
const axios = require("axios");
const { ExpenseEvent } = require("../models/eventSeries.js");
const { main } = require("../../simulation/algo.js");

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
    const user = await User.findOne({ _id: id });
    if (!user) {
      console.log("user not found");
      return res.status(404).json({ message: "user not found" });
    }
    user.scenarios.push(savedBasicInfo._id);
    await user.save();

    res.status(201).json(savedBasicInfo);
  } catch (err) {
    console.error("Error creating scenario:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updateScenario = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const result = await Scenario.findByIdAndUpdate( new ObjectId(id), { $set: updateData }, { new: true });
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
  const { id } = req.params;
  const {
    name, filingStatus, birthYearSpouse, birthYearUser, lifeExpectancy, lifeExpectancySpouse,
    setOfinvestmentTypes, setOfinvestments, income, expense, invest, rebalance,
    inflationAssumption, irsLimit, spendingStrategy, expenseWithdrawalStrategy,
    rmdStrategy, optimizerSettings, rothConversionStrategy, financialGoal, stateResident,
  } = req.body;

  const basicInfoData = {
    name,
    filingStatus, //: maritalStatus === "couple" ? "married" : "single",
    financialGoal,
    inflationAssumption,
    birthYearUser,
    lifeExpectancy,
    birthYearSpouse: birthYearSpouse ?? null,
    lifeExpectancySpouse,
    stateResident,
    irsLimit,
  };

  try {
    const { data: scenarioData } = await axios.post(`http://localhost:8080/basicInfo/user/${id}`, basicInfoData);
    const scenarioId = scenarioData._id;

    const investmentTypeMap = {};
    const investmentMap = {};

    // Handle investment types
    for (const type of setOfinvestmentTypes) {
      formatIssues([type]);
      const { data: res } = await axios.post(`http://localhost:8080/scenario/${scenarioId}/investmentType`, type);
      investmentTypeMap[res.name] = res._id;
    }

    // Handle individual investments
    for (const inv of setOfinvestments) {
      formatIssues([inv]);
      const investmentToCreate = {
        investmentType: investmentTypeMap[inv.investmentType],
        value: inv.value,
        accountTaxStatus: inv.accountTaxStatus,
      };
      const { data: res } = await axios.post(`http://localhost:8080/scenario/${scenarioId}/investment`, investmentToCreate);
      investmentMap[`${inv.investmentType} ${inv.accountTaxStatus}`] = res._id;
    }
    
    // Convert asset allocation to IDs Mappings
    for (const event of invest) {
      if (event?.assetAllocation) {
        event.assetAllocation = await assetAllocationToID(investmentMap, event.assetAllocation);
      }
    }
    for (const event of rebalance) {
      if (event?.rebalanceAllocation) {
        event.rebalanceAllocation = await assetAllocationToID(investmentMap, event.rebalanceAllocation);
      }
    }

    // Event Series Mapping
    const eventSeriesMapNameToId = {};
    const eventMappings = [
      { data: income, route: "incomeEvent" },
      { data: expense, route: "expenseEvent" },
      { data: invest, route: "investStrategy" },
      { data: rebalance, route: "rebalanceStrategy" },
    ];

    // Assign unique IDs and map names
    for (const { data } of eventMappings) {
      formatIssues(data);
      data.forEach(event => {
        event._id = new ObjectId();
        eventSeriesMapNameToId[event.eventSeriesName] = event._id;
      });
    }

    // Submit events
    for (const { data, route } of eventMappings) {
      for (const event of data) {
        if (route === "expenseEvent") { console.log(event);}
        console.log("=====================================");

        event.startYear.refer = eventSeriesMapNameToId[event.startYear.refer] ?? null;
        await axios.post(`http://localhost:8080/scenario/${scenarioId}/${route}`, event);
      }
    }

    // Map strategy names to IDs and update scenario
    const update = await axios.post(`http://localhost:8080/updateScenario/${scenarioId}`, {
      spendingStrategy: await mapStrategyNamesToIds("expense", spendingStrategy),
      expenseWithdrawalStrategy: await mapStrategyNamesToIds("investments", expenseWithdrawalStrategy),
      rmdStrategy: await mapStrategyNamesToIds("investments", rmdStrategy),
      rothConversionStrategy: await mapStrategyNamesToIds("investments", rothConversionStrategy),
      optimizerSettings,
    });

    return res.status(200).json({ scenario: update.data.scenario });
  } catch (error) {
    logAxiosError("importing user data", error);
    return res.status(500).json({ error: error.message });
  }
};

function logAxiosError(context, error) {
  if (error.response) {
    console.error(`Error ${context}:`, error.response.data);
  } else {
    console.error(`Error ${context}:`, error.message);
  }
}

async function assetAllocationToID(investmentMap, assetAllocation) {
  function mapKeysToIds(percentagesObj, nameToIdMap) {
    const result = {};
    for (const [name, value] of Object.entries(percentagesObj)) {
      const id = nameToIdMap[name]; // Use name directly
      if (id) {
        result[id] = value;
      } else {
        console.warn(`No investment ID found for investment type name: ${name}`);
      }
    }
    // console.log(result);
    return result;
  }
  // console.log(assetAllocation.fixedPercentages);
  return {
    ...assetAllocation,
    fixedPercentages: mapKeysToIds(assetAllocation.fixedPercentages || {}, investmentMap),
    initialPercentages: mapKeysToIds(assetAllocation.initialPercentages || {}, investmentMap),
    finalPercentages: mapKeysToIds(assetAllocation.finalPercentages || {}, investmentMap),
  };
}

async function mapStrategyNamesToIds(type, strategyNames) {
  let typeMap = {};

  if (type === "expense") {
    const expenses = await ExpenseEvent.find({
      eventSeriesName: { $in: strategyNames },
    });
    typeMap = expenses.reduce((acc, expense) => {
      acc[expense.eventSeriesName] = expense._id;
      return acc;
    }, {});
    //console.log("expenses", expenses);
  } else if (type === "investments") {
    const investments = await Investment.find().populate("investmentType");

    typeMap = investments.reduce((acc, inv) => {
      const typeName = inv.investmentType?.name; // populated from ref
      const taxStatus = inv.accountTaxStatus;

      if (typeName && taxStatus) {
        const compoundId = `${typeName} ${taxStatus}`;
        acc[compoundId] = inv._id;
      }

      return acc;
    }, {});
  }

  return strategyNames.map((name) => typeMap[name]).filter((id) => id !== undefined);
}

function formatIssues(data) {
  for (const d of data) {
    if (d.startYear?.type === "fixed") {
      d.startYear.type = "fixedAmt";
    }
    if (d.startYear?.type === "startWith") {
      d.startYear.type = "same";
    }
    if (d.duration?.type === "fixed") {
      d.duration.type = "fixedAmt";
    }
    if (d.annualChange?.type === "percent") {
      d.annualChange.type = "percentage";
    }
    if (d.annualChange?.type === "amount") {
      d.annualChange.type = "fixed";
      d.annualChange.amount = 0;
    }
    if (d.annualReturn?.unit === "amount") {
      d.annualReturn.unit = "fixed";
    }
    if (d.annualReturn?.unit === "percent") {
      d.annualReturn.unit = "percentage";
    }
    if (d.annualIncome?.unit === "amount") {
      d.annualIncome.unit = "fixed";
    }
    if (d.annualIncome?.unit === "percent") {
      d.annualIncome.unit = "percentage";
    }
  }
}

exports.simulateScenario = async (req, res) => {
  try {
    const { scenarioId, userId, simulationCount = 1 } = req.query;

    if (!scenarioId || !userId) {
      return res.status(400).json({ error: "Missing scenarioId or userId" });
    }

    // Run the simulation
    const { shadedChart, probabilityChart, barChartAverage, barChartMedian } = await main(simulationCount, scenarioId, userId);

    // Send results to frontend
    res.status(200).json({
      shadedChart,
      probabilityChart,
      barChartAverage,
      barChartMedian,
    });
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ error: "Simulation failed" });
  }
};
