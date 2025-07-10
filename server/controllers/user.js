const User = require("../models/user");
const multer = require("multer");
const yaml = require("js-yaml");
const StateTax = require("../models/stateTax");

const upload = multer({ storage: multer.memoryStorage() });

exports.auth = async (req, res) => {
  const { googleId, email, guest } = req.body;
  // console.log("Received data:", { googleId, email, guest });

  try {
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = new User({ googleId, email, guest, lastLogin: Date.now() });
      await user.save();
      console.log("User saved!");
    } else {
      user.lastLogin = Date.now();
      await user.save();
    }

    req.session.user = user;

    res.json(req.session.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.guestAuth = (req, res) => {
  const guestUser = {
    email: "Guest@hungerArc.com",
    guest: true,
    scenarios: [],
    stateYaml: [],
  };
  req.session.user = guestUser;
  res.json(guestUser);
};

exports.sessionCheck = (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("session-id");
    res.json({ message: "Logged out" });
  });
};

exports.scenarios = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: "Failed to get user session" });
    }

    const userData = req.session.user;
    const user = await User.findById(userData._id).populate("scenarios");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.scenarios);
  } catch (error) {
    console.error("Error fetching user scenarios:", error.message);
    return res.status(500).json({ error: "Server error while fetching scenarios" });
  }
};

exports.uploadStateTaxYaml = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const yamlContent = req.file.buffer.toString("utf8");
      const data = yaml.load(yamlContent);
      parsedData = parseUserYaml(data);
      const newTax = new StateTax(parsedData);
      await newTax.save();
      const { id } = req.body;
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $push: { stateYaml: newTax._id } }, // assuming 'scenario' is an array
        { new: true }
      );

      if (!updatedUser) return res.status(404).json({ error: "User not found" });

      res.status(200).json({ message: "State tax uploaded", data: newTax });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Invalid YAML or server error" });
    }
  },
];

function parseUserYaml(data) {
  const state = data; // assuming `data` looks like { name: { ... } }

  const taxDetails = {};
  Object.keys(state.taxDetails).forEach((year) => {
    taxDetails[year] = {
      single: {
        stateIncomeTaxRatesBrackets: state.taxDetails[year].single[0].stateIncomeTaxRatesBrackets,
        standardDeduction: state.taxDetails[year].single[1].standardDeduction,
      },
      married: {
        stateIncomeTaxRatesBrackets: state.taxDetails[year].married[0].stateIncomeTaxRatesBrackets,
        standardDeduction: state.taxDetails[year].married[1].standardDeduction,
      },
    };
  });

  return {
    state: state.name,
    operation: state.operation,
    taxDetails: taxDetails,
  };
}
