const StateTax = require("../importStateYaml.js");
const Tax = require("../models/tax.js");

//IRS TAX
exports.tax = async (req, res) => {
  try {
    const tax = await Tax.findOne();
    if (!tax) {
      return res.status(404).json({ message: "Tax data not found" });
    }
    res.status(200).json(tax);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve tax data", message: err.message });
  }
};

//STATE TAX
exports.statetax = async (req, res) => {
  const stateName = req.params.state;
  try {
    const stateTax = await StateTax.findOne({ state: stateName });
    if (!stateTax) {
      return res.status(404).json({ message: "State tax data not found" });
    }
    res.status(200).json(stateTax);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve state tax data", message: err.message });
  }
};
