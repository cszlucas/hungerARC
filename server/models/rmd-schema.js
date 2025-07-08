const mongoose = require('mongoose');
const path = require("path");
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'), // adjust if .env is in root
});

// Connect to MongoDB (replace with your actual connection string)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("Could not connect to MongoDB", err));

const rmdEntrySchema = new mongoose.Schema({
    age: {
      type: Number,
      required: true,
    },
    distributionPeriod: {
      type: Number,
      required: true,
    },
  });
  
  const rmdSchema = new mongoose.Schema({
    rmd: {
      type: [rmdEntrySchema],  // Array of RMD entries
      required: true,
    },
  });
  
  const RMD = mongoose.model('RMD', rmdSchema);
  module.exports = RMD;

//   const newRMD = new RMD({
//     rmd: [
//       { age: 72, distributionPeriod: 27.4 },
//       { age: 73, distributionPeriod: 26.5 },
//       { age: 74, distributionPeriod: 25.5 },
//     ],
//   });
  
//   newRMD.save()
//     .then(() => console.log("RMD saved successfully!"))
//     .catch((err) => console.error("Error saving RMD:", err));
