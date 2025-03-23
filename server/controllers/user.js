const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

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
    res.status(500).json({ message: err, error: err });
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
