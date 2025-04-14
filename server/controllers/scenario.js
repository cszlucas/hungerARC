const mongoose = require("mongoose");
const Scenario = require("../models/scenario.js");
const Investment = require("../models/investment.js");
const User = require("../models/user.js");
const { ObjectId } = mongoose.Types;

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
  const {
    name,
    maritalStatus,
    birthYears,
    lifeExpectancy,
    lifeExpectancySpouse,
    setOfinvestmentTypes: frontendInvestmentTypes,
    setOfinvestments: frontendInvestments,
    income,
    expense,
    invest,
    rebalance,
    inflationAssumption,
    irsLimit,
    spendingStrategy,
    expenseWithdrawalStrategy,
    rmdStrategy: RMDStrategy,
    optimizerSettings,
    rothConversionStrategy: RothConversionStrategy,
    financialGoal,
    stateResident: residenceState,
  } = req.body;

  const basicInfoData = {
    name,
    filingStatus: maritalStatus === "couple" ? "couple" : "single",
    financialGoal,
    inflationAssumption,
    birthYearUser: birthYears[0],
    lifeExpectancy,
    birthYearSpouse: birthYears[1] ?? null,
    lifeExpectancySpouse,
    stateResident: residenceState,
    irsLimit,
  };

  try {
    let scenario = await handleBasicInfo(id, basicInfoData);
    let id = scenario._id;

    for (const event of income ?? []) {
      await createIncomeEvent(id, event);
    }

    for (const event of expense ?? []) {
      await createExpenseEvent(id, event);
    }

    for (const event of invest ?? []) {
      await createInvestStrategy(id, event);
    }

    for (const event of rebalance ?? []) {
      await createRebalanceStrategy(id, event);
    }

    for (const investment of frontendInvestments ?? []) {
      await createInvestment(id, investment);
    }

    for (const type of frontendInvestmentTypes ?? []) {
      await createInvestmentType(id, type);
    }

    await updateScenario(id, {
      spendingStrategy: spendingStrategy,
      expenseWithdrawalStrategy: expenseWithdrawalStrategy,
      rmdStrategy: RMDStrategy,
      rothConversionStrategy: RothConversionStrategy,
      optimizerSettings: optimizerSettings,
    });

    res.status(200).json({
      message: "User data imported successfully",
      scenario: scenario,
    });
  } catch (error) {
    console.error("Import failed:", error);
    res.status(500).json({ error: "Import failed" });
  }
};
