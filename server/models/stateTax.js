// Import Mongoose
const mongoose = require('mongoose');

// Connect to MongoDB (replace with your actual connection string)
// mongoose.connect('mongodb://localhost:27017/hungerarc', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log("Connected to MongoDB"))
// .catch((err) => console.error("Could not connect to MongoDB", err));

const stateTaxSchema=new mongoose.Schema({
    state: String,
    operation: String,
    taxDetails: {
      type: Map,
      of: {
        single: {
          stateIncomeTaxRatesBrackets: Array,
          standardDeduction: Number,
        },
        married: {
          stateIncomeTaxRatesBrackets: Array,
          standardDeduction: Number,
        }
      }
    }
});

const StateTax=mongoose.model("StateTax",stateTaxSchema);
module.exports = StateTax;