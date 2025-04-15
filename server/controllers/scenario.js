const mongoose = require("mongoose");
const Scenario = require("../models/scenario.js");
const Investment = require("../models/investment.js");
const User = require("../models/user.js");
const { ObjectId } = mongoose.Types;
const axios = require("axios");
const { ExpenseEvent } = require("../models/eventSeries.js");

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
  try {
    const { name, filingStatus, financialGoal, inflationAssumption, birthYearUser, lifeExpectancy, stateResident, birthYearSpouse, lifeExpectancySpouse, irsLimit } = req.body;
    console.log("why");
    console.log("inflation", lifeExpectancy);
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
    console.error("Error creating scenario:", err.message);
    res.status(500).json({ error: err.message });
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
  const { id } = req.params; //user id
  const {
    name,
    maritalStatus,
    birthYearSpouse,
    birthYearUser,
    lifeExpectancy,
    setOfinvestmentTypes,
    setOfinvestments,
    income,
    expense,
    invest,
    rebalance,
    inflationAssumption,
    afterTaxContributionLimit,
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
    lifeExpectancy: lifeExpectancy[0],
    birthYearSpouse: birthYearSpouse ?? null,
    lifeExpectancySpouse: lifeExpectancy[1],
    stateResident: stateResident,
    irsLimit: afterTaxContributionLimit,
  };

  try {
    const response = await axios.post(`http://localhost:8080/basicInfo/user/${id}`, basicInfoData);

    console.log(response.data);
    let scenarioId = response.data._id;
    console.log("scenarioId", scenarioId);

    const eventMappings = [
      { data: income, route: "incomeEvent" },
      { data: expense, route: "expenseEvent" },
      { data: invest, route: "investStrategy" },
      { data: rebalance, route: "rebalanceStrategy" },
    ];

    for (const { data, route } of eventMappings) {
      try {
        console.log("data", data);

        formatIssues(data);

        await axios.post(`http://localhost:8080/scenario/${scenarioId}/${route}`, data[0]);
      } catch (error) {
        if (error.response) {
          console.error(`Error creating ${route}:`, error.response.data);
        } else {
          console.error(`Error creating ${route}:`, error.message);
        }
      }
    }

    const inv = [
      { data: setOfinvestmentTypes, route: "investmentType" },
      { data: setOfinvestments, route: "investment" },
    ];

    let typeMap = {};

    for (const { data: rawData, route } of inv) {
      const data = Array.isArray(rawData) ? rawData : [rawData];

      formatIssues(data);

      try {
        for (const x of data) {
          if (route === "investmentType") {
            console.log("posting to investmentType:", x);
            const response = await axios.post(`http://localhost:8080/scenario/${scenarioId}/${route}`, x);
            //console.log("response:", response.data);
            typeMap[response.data.name] = response.data._id;
            console.log("type id: ", typeMap[response.data.name]);
          }
        }

        if (route === "investment") {
          console.log("data.map", data);

          // Loop through each investment and send them one at a time
          for (const inv of data) {
            // Check if the investment type exists in typeMap
            console.log("mapping investmentType:", inv.investmentType, "->", typeMap[inv.investmentType]);

            const investmentToCreate = {
              investmentType: typeMap[inv.investmentType], // Map to ObjectId
              value: inv.value,
              accountTaxStatus: inv.accountTaxStatus,
            };

            // Now post each investment individually
            try {
              const response = await axios.post(`http://localhost:8080/scenario/${scenarioId}/${route}`, investmentToCreate);
              console.log("Investment created:", response.data); // Full response for each investment
            } catch (error) {
              console.error("Error creating investment:", error);
            }
          }
        }
      } catch (error) {
        if (error.response) {
          console.error(`Error creating ${route}:`, error.response.data);
        } else {
          console.error(`Error creating ${route}:`, error.message);
        }
      }
    }
    try {
      const expenseWithdrawalStrategyIds = await mapStrategyNamesToIds("investments", expenseWithdrawalStrategy);
      const RMDStrategyIds = await mapStrategyNamesToIds("investments", rmdStrategy);
      //console.log("spendingStrategy", spendingStrategy);
      const spendingStrategyIds = await mapStrategyNamesToIds("expense", spendingStrategy);
      const rothStrategy = await mapStrategyNamesToIds("investments", rothConversionStrategy);
      console.log("expenseWithdrawalStrategyIds", expenseWithdrawalStrategyIds);
      console.log("RMDStrategyIds", RMDStrategyIds);
      console.log("spendingStrategyIds", spendingStrategyIds);
      console.log("rothStrategy", rothStrategy);

      await axios.post(`http://localhost:8080/updateScenario/${scenarioId}`, {
        spendingStrategy: spendingStrategyIds,
        expenseWithdrawalStrategy: expenseWithdrawalStrategyIds,
        rmdStrategy: RMDStrategyIds,
        rothConversionStrategy: rothStrategy,
        optimizerSettings: optimizerSettings,
        // Include other strategies if needed
      });
    } catch (error) {
      if (error.response) {
        console.error(`Error creating:`, error.response.data);
      } else {
        console.error(`Error creating:`, error.message);
      }
    }
  } catch (error) {
    console.error("Import failed:", error);
    res.status(500).json({ error: error.message });
  }
};

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
    // if (d.name === "cash") {
    //   d.name = "cash2";
    // }
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
