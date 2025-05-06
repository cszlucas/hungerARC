const StateTax = require("../importStateYaml.js");
const Tax = require("../models/tax.js");
const User = require("../models/user.js");
const State = require("../models/stateTax.js");

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


exports.getStateTax = async (req, res) => {
  // console.log("getStateTax", req.params.id);
  if (!req.session.user) res.status(500).json({ message: "Failed to get user session" });
  const userData = req.session.user;
  
  try {
    let userStates = []
    if (userData && userData._id) {
      const user = await User.findById( userData._id );
      if (user) {
        userStates = await State.find(
          { _id: { $in: user.stateYaml } }
        ).select('_id state'); // only select _id and name
      }
    }

    const additionalStates = await State.find({ 
      state: { $in: ['New York', 'New Jersey', 'Connecticut'] }
    }).select('_id state');

    // Merge the two lists and remove duplicates based on _id
    const combinedStatesMap = new Map();

    [...userStates, ...additionalStates].forEach(state => {
      combinedStatesMap.set(state._id.toString(), state);
    });

    const combinedStates = Array.from(combinedStatesMap.values());

    res.status(200).json(combinedStates);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve state tax data", message: err.message });
  }
}
