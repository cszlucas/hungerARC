const Scenario = require("../models/scenario.js");
const { ObjectId } = require("mongoose").Types;

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
    const { name, filingStatus, financialGoal, inflationAssumption, birthYearUser, lifeExpectancy, stateResident } = req.body;

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

    res.status(201).json(savedBasicInfo);
  } catch (err) {
    console.error("Error creating scenario:", err);
    res.status(500).json({ error: "Failed to create scenario" });
  }
};

exports.scenario = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    await Scenario.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updateData });
  } catch (err) {
    console.error("Error adding to scenario:", err);
    res.status(500).json({ error: "Failed to add to scenario" });
  }
};

