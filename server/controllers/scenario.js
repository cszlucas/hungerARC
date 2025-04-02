const mongoose = require("mongoose");
const Scenario = require("../models/scenario.js");
const Investment = require("../models/investment.js");
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
    const { name, filingStatus, financialGoal, inflationAssumption, birthYearUser, lifeExpectancy, stateResident } = req.body;
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
      stateResident,
    });

    const savedBasicInfo = await newBasicInfo.save();
    const user = await User.findOne({ _id: id });
    if (!user) {
      console.log("user not found");
      return res.status(404).json({ message: "user not found" });
    }
    user.push(savedBasicInfo._id);
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
