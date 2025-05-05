const fs = require("fs");
const yaml = require("js-yaml");
const StateTax = require("./models/stateTax");

const mongoose = require("mongoose");

// mongoose
//   .connect("mongodb://localhost:27017/hungerarc", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("Could not connect to MongoDB", err));

exports.createStateTaxes = async (filePath) => {
  try {
    console.log("in here");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(fileContents);
    const stateTax = data.states.map((state) => {
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
    });

    await StateTax.insertMany(stateTax);
    console.log("state tax is in db");
  } catch (error) {
    console.log("error in parsing yaml file: ", error);
  }
};

// module.exports = parseYaml;
