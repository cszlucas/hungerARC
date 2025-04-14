const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const multer = require("multer");
const yaml = require("js-yaml");
const StateTax = require("../models/StateTax");

const upload = multer({ storage: multer.memoryStorage() });

exports.auth = async (req, res) => {
  // mongoose.connection.on("connected", () => console.log("MongoDB is connected ✅"));
  // mongoose.connection.on("error", (err) => console.error("MongoDB connection error ❌:", err));
  const { googleId, email, guest } = req.body;
  console.log("Received data:", { googleId, email, guest });
  try {
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    console.log(user);

    if (!user) {
      user = new User({ googleId, email, guest, lastLogin: Date.now() });
      console.log(user);
      await user.save();
      console.log("user saved!");
    } else {
      user.lastLogin = Date.now();
      await user.save();
    }

    // Generate JWT token
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ user, token });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.scenarios = async (req, res) => {
  const { id } = req.params; // Get user ID from route parameters

  try {
    // Find the user by ID and populate the scenarios array
    const user = await User.findById(id).populate('scenarios');

    if (!user) {
      return res.status(404).json({ error: 'User not found' }); // Handle if no user is found
    }

    res.status(200).json(user.scenarios); // Send back the populated scenarios
  } catch (error) {
    console.error('Error fetching user scenarios:', error.message);
    res.status(500).json({ error: 'Server error while fetching scenarios' }); // Handle server errors
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

function parseUserYaml(data){
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