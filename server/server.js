const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const Tax = require("./models/tax.js");
const RMD = require("./models/rmd-schema.js");
const { Events } = require("./models/eventSeries.js");
const { scenario } = require("./models/scenario.js");
const { InvestmentType } = require("./models/investmentType.js");
const { ObjectId } = require("mongoose").Types;
const taxId = "67d8912a816a92a8fcb6dd55";

const rmdId = "67da256d6fc3c7abbf1d675d";

const cors = require("cors");
const jwt = require("jsonwebtoken");
const User = require("./models/user.js");
const dotenv = require("dotenv");
const path = require("path");

// Manually load the .env file
dotenv.config({ path: path.resolve(__dirname, "process.env") });

console.log("Loaded JWT_SECRET:", process.env.JWT_SECRET);

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 8080;

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/hungerarc", { useNewUrlParser: true, useUnifiedTopology: true });

app.post("/investmentType", async (req, res) => {
  const { name, description, annualReturn, expenseRatio, annualIncome, taxability } = req.body;

  try {
    const newInvestmentType = new InvestmentType({
      name,
      description,
      annualReturn: {
        type: annualReturn.type,
        fixed: annualReturn.fixed,
        mean: annualReturn.mean,
        stdDev: annualReturn.stdDev,
      },
      expenseRatio,
      annualIncome: {
        type: annualIncome.type,
        fixed: annualIncome.fixed,
        mean: annualIncome.mean,
        stdDev: annualIncome.stdDev,
      },
      taxability,
    });

    const savedInvestmentType = await newInvestmentType.save();
    res.status(201).json(savedInvestmentType);
  } catch (err) {
    console.error("Error saving InvestmentType:", err);
    res.status(500).json({ error: "Error saving InvestmentType" });
  }
});

app.post("/basicInfo", async (req, res) => {
  try {
    const { name, filingStatus, financialGoal, inflationAssumption, birthYearUser, lifeExpectancy, stateResident } = req.body;

    const newBasicInfo = new scenario({
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
    console.error("Error creating basic info:", err);
    res.status(500).json({ error: "Failed to create basic info" });
  }
});

app.post("/incomeEvent", async (req, res) => {
  try {
    const { initialAmount, annualChange, userPercentage, inflationAdjustment, isSocialSecurity } = req.body;

    const newIncomeEvent = new Events.IncomeEvent({
      initialAmount,
      annualChange: {
        type: annualChange.type,
        amount: annualChange.amount,
      },
      userPercentage,
      inflationAdjustment,
      isSocialSecurity,
    });

    const savedIncomeEvent = await newIncomeEvent.save();

    res.status(201).json(savedIncomeEvent);
  } catch (err) {
    console.error("Error creating IncomeEvent:", err);
    res.status(500).json({ error: "Failed to create IncomeEvent" });
  }
});

app.post("/expenseEvent", async (req, res) => {
  try {
    const { initialAmount, annualChange, userPercentage, inflationAdjustment, isDiscretionary } = req.body;

    const newExpenseEvent = new Events.ExpenseEvent({
      initialAmount,
      annualChange: {
        type: annualChange.type,
        amount: annualChange.amount,
      },
      userPercentage,
      inflationAdjustment,
      isDiscretionary,
    });

    const savedExpenseEvent = await newExpenseEvent.save();

    res.status(201).json(savedExpenseEvent);
  } catch (err) {
    console.error("Error creating ExpenseEvent:", err);
    res.status(500).json({ error: "Failed to create ExpenseEvent" });
  }
});

app.get('/tax', async (req, res) => {
  try {
    const tax = await taxes.find();
    res.status(200).json(tax);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tax data' }); 
  }
});

app.get('/scenario', async (req, res) => {
  try {
    const tax = await scenario.find();
    res.status(200).json(tax);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve scenario data' }); 
  }
});

// Web scraping route
app.get("/standardDeductions", async (req, res) => {
  try {
    const response = await axios.get("https://www.irs.gov/publications/p17#en_US_2024_publink1000283782");
    const $ = cheerio.load(response.data);

    const targetLink = $('.table a[name="en_US_2024_publink1000283782"]');
    console.log("Found target link:", targetLink.text());

    if (targetLink.length > 0) {
      // Navigate to the sibling or parent elements to find the table
      targetLink
        .closest(".table") // Find the closest .table div
        .find(".table-contents tbody tr") // Select rows within tbody of the table-contents
        .each((rowIndex, row) => {
          $(row)
            .find("td")
            .each((colIndex, cell) => {
              const cellText = $(cell).text();
              if (colIndex == 1 && rowIndex == 1) {
                const cleanedCell = cellText.replace(/[\$,]/g, "");
                Tax.updateOne({ _id: new ObjectId(taxId) }, { $set: { "single.standardDeductions": Number(cleanedCell) } })
                  .then((doc) => console.log("Saved Tax Document:", doc))
                  .catch((err) => console.error("Error Saving Document:", err));
              } else if (colIndex == 1 && rowIndex == 2) {
                const cleanedCell = cellText.replace(/[\$,]/g, "");
                Tax.updateOne({ _id: new ObjectId(taxId) }, { $set: { "married.standardDeductions": Number(cleanedCell) } })
                  .then((doc) => console.log("Saved Tax Document:", doc))
                  .catch((err) => console.error("Error Saving Document:", err));
              }

              console.log(`Row ${rowIndex + 1}, Column ${colIndex + 1}: ${cellText}`);
            });
        });
    } else {
      console.log("Target link not found. Please check the selector.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while scraping data.");
  }
});

app.get("/incomeSingle", async (req, res) => {
  try {
    const response = await axios.get("https://www.irs.gov/filing/federal-income-tax-rates-and-brackets");
    const $ = cheerio.load(response.data);
    const targetParagraph = $('p:contains("For a single taxpayer, the rates are:")');
    const newIncomeRanges = [];
    const newTaxRates = [];

    const targetLink = targetParagraph.next("table");
    //console.log("Found target link:", targetLink.text());

    if (targetLink.length > 0) {
      // Navigate to the sibling or parent elements to find the table
      targetLink
        .find("tbody tr") // Select rows within tbody of the table-contents
        .each((rowIndex, row) => {
          cleanedRate = null;
          startRange = null;
          endRange = null;
          $(row)
            .find("td")
            .each((colIndex, cell) => {
              const cellText = $(cell).text().trim();
              //console.log(`Row ${rowIndex}, Column ${colIndex}: ${cellText}`);
              if (colIndex === 0) {
                // Assuming the rate is in column 0
                cleanedRate = cellText.replace(/[\%,]/g, ""); // Remove percent sign and commas
              } else if (colIndex === 1) {
                startRange = cellText.replace(/[\$,]/g, ""); // Remove dollar signs and commas
              } else if (colIndex === 2) {
                endRange = cellText.replace(/[\$,]/g, ""); // Remove dollar signs and commas
              }
            });

          // Once all the columns for a row are processed, update the document in MongoDB
          if (cleanedRate && startRange && endRange) {
            console.log(`Rate ${cleanedRate}, start ${startRange}, end ${endRange}`);
            // Convert the cleaned rate, startRange, and endRange into numbers
            const rateNum = Number(cleanedRate);
            const startRangeNum = Number(startRange);
            if (endRange == "And up") {
              endRange = 1000000000;
            }
            const endRangeNum = Number(endRange);
            newIncomeRanges.push([startRangeNum, endRangeNum]);
            newTaxRates.push(rateNum);
            // Now, update the MongoDB document for the correct tax bracket
          }
        });
      Tax.updateOne(
        { _id: new ObjectId(taxId) },
        {
          $set: {
            "single.federalIncomeTaxRatesBrackets": newIncomeRanges.map((range, index) => ({
              incomeRange: range,
              taxRate: newTaxRates[index],
            })),
          },
        }
      )
        .then((result) => {
          console.log("All income ranges and tax rates updated successfully:", result);
        })
        .catch((err) => {
          console.error("Error updating income ranges and tax rates:", err);
        });
    } else {
      console.log("Target link not found. Please check the selector.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while scraping data.");
  }
});

app.get("/incomeMarried", async (req, res) => {
  try {
    const response = await axios.get("https://www.irs.gov/filing/federal-income-tax-rates-and-brackets");
    const $ = cheerio.load(response.data);
    const newIncomeRanges = [];
    const newTaxRates = [];

    const aTag = $('a:contains("Married filing jointly or qualifying surviving spouse")');
    const targetLink = aTag.closest("div").next("div").find("table");
    console.log("Found target link:", targetLink.text());

    if (targetLink.length > 0) {
      // Navigate to the sibling or parent elements to find the table
      targetLink
        .find("tbody tr") // Select rows within tbody of the table-contents
        .each((rowIndex, row) => {
          cleanedRate = null;
          startRange = null;
          endRange = null;
          $(row)
            .find("td")
            .each((colIndex, cell) => {
              const cellText = $(cell).text().trim();
              console.log(`Row ${rowIndex}, Column ${colIndex}: ${cellText}`);
              if (colIndex === 0) {
                // Assuming the rate is in column 0
                cleanedRate = cellText.replace(/[\%,]/g, ""); // Remove percent sign and commas
              } else if (colIndex === 1) {
                startRange = cellText.replace(/[\$,]/g, ""); // Remove dollar signs and commas
              } else if (colIndex === 2) {
                endRange = cellText.replace(/[\$,]/g, ""); // Remove dollar signs and commas
              }
            });

          // Once all the columns for a row are processed, update the document in MongoDB
          if (cleanedRate && startRange && endRange) {
            console.log(`Rate ${cleanedRate}, start ${startRange}, end ${endRange}`);
            // Convert the cleaned rate, startRange, and endRange into numbers
            const rateNum = Number(cleanedRate);
            const startRangeNum = Number(startRange);
            if (endRange == "And up") {
              endRange = 1000000000;
            }
            const endRangeNum = Number(endRange);
            newIncomeRanges.push([startRangeNum, endRangeNum]);
            newTaxRates.push(rateNum);
            // Now, update the MongoDB document for the correct tax bracket
          }
        });
      Tax.updateOne(
        { _id: new ObjectId(taxId) },
        {
          $set: {
            "married.federalIncomeTaxRatesBrackets": newIncomeRanges.map((range, index) => ({
              incomeRange: range,
              taxRate: newTaxRates[index],
            })),
          },
        }
      )
        .then((result) => {
          console.log("All income ranges and tax rates updated successfully:", result);
        })
        .catch((err) => {
          console.error("Error updating income ranges and tax rates:", err);
        });
    } else {
      console.log("Target link not found. Please check the selector.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while scraping data.");
  }
});

app.post("/auth/google", async (req, res) => {
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
});

app.get("/capitalGains", async (req, res) => {
  try {
    const response = await axios.get("https://www.irs.gov/taxtopics/tc409");
    const $ = cheerio.load(response.data);
    const incomeRanges = [];

    const pTags = $('p:contains("A capital gains rate of")');

    pTags.each((rateIndex, pTag) => {
      //goes through each rate
      const rateText = $(pTag).find("b").first().text();
      const rateNum = rateText.replace(/[\%,]/g, "");
      console.log("Rate: ", rateNum, rateText);

      // Find the corresponding <ul> of income ranges
      const targetLink = $(pTag).next("ul");

      targetLink.find("li").each((index, li) => {
        //goes through bullets for specific rate
        let stats = null;
        if (index == 0) {
          stats = "single";
        } else if ((rateIndex == 0 && index == 1) || (rateIndex == 1 && index == 2)) {
          stats = "married";
        }
        const rangeText = $(li).text().trim();
        const regex = /[\$]([\d,]+)/g;
        const matches = rangeText.match(regex);

        if (matches && stats != null) {
          // Clean the ranges and push them into the incomeRanges array
          const cleanedRanges = matches.map((match) => match.replace(/[\,\$]/g, ""));
          console.log("Income Range: ", cleanedRanges); // Log the income ranges
          incomeRanges.push({
            rate: rateNum,
            ranges: cleanedRanges,
            status: stats,
          });
        }
      });
    });

    console.log("Rates and Income Ranges: ", incomeRanges);

    incomeRanges.forEach((range) => {
      console.log(range);
      Tax.updateOne(
        {
          _id: new ObjectId(taxId),
          [`${range.status}.capitalGainsTaxRates`]: {
            $not: { $elemMatch: { gainsRate: range.rate } },
          }, // Check if rate doesn't exist
        },
        {
          $push: {
            [`${range.status}.capitalGainsTaxRates`]: {
              incomeRange: range.ranges,
              gainsRate: range.rate,
            },
          },
        }
      )
        .then((result) => {
          console.log("Data inserted successfully", result);
        })
        .catch((error) => {
          console.error("Error inserting data:", error);
        });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while scraping data.");
  }
});

app.get("/rmd", async (req, res) => {
  try {
    const response = await axios.get("https://www.irs.gov/publications/p590b#en_US_2023_publink100090310");
    const $ = cheerio.load(response.data);

    const targetLink = $('.table a[name="en_US_2023_publink100090310"]');
    const rmds = [];
    let age = "";
    let distPeriod = "";

    if (targetLink.length > 0) {
      // Navigate to the sibling or parent elements to find the table
      targetLink
        .closest(".table") // Find the closest .table div
        .find(".table-contents tbody tr") // Select rows within tbody of the table-contents
        .each((rowIndex, row) => {
          $(row)
            .find("td")
            .each((colIndex, cell) => {
              if ((rowIndex > 4 && rowIndex < 29) || (rowIndex == 29 && colIndex == 0) || (rowIndex == 29 && colIndex == 1)) {
                let cellText = $(cell).text().trim();
                if (rowIndex == 28 && colIndex == 2) {
                  const regex = /(\d[\d,]*)/;
                  const match = cellText.match(regex);
                  cellText = parseInt(match[1].replace(/,/g, ""), 10);
                }
                if (colIndex % 2 == 0) {
                  age = cellText;
                } else {
                  distPeriod = cellText;
                  rmds.push({
                    age: Number(age),
                    distributionPeriod: Number(distPeriod),
                  });
                }
                //console.log(`Row ${rowIndex}, Column ${colIndex}: ${cellText}`);
              }
            });
        });
      console.log("RMD: ", rmds);
      rmds.forEach((rmd) => {
        RMD.updateOne(
          {
            _id: new ObjectId(rmdId),
            // "rmd.age": { $ne: rmd.age }, // Check if age doesn't already exist
          },
          {
            $push: {
              rmd: {
                age: rmd.age,
                distributionPeriod: rmd.distributionPeriod,
              },
            },
          }
        )
          .then((doc) => console.log("Saved RMD Document:", doc))
          .catch((err) => console.error("Error Saving RMD Document:", err));
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while scraping data.");
  }
});

// Save scraped data to MongoDB
//   await Data.insertMany(scrapedData);

//   res.send('Scraping and saving data completed!');
// } catch (error) {
//   console.error(error);
//   res.status(500).send('An error occurred while scraping data.');

// const fs = require('fs');
// const yaml = require('js-yaml');
// const { MongoClient } = require('mongodb');

// async function run() {
//   try {
//     // Connect to MongoDB
//     const client = new MongoClient(url);
//     await client.connect();
//     console.log("Connected to MongoDB server");

//     const db = client.db(dbName);
//     const collection = db.collection('your_collection');

//     // Load and parse the YAML file
//     const stateTaxes = fs.readFileSync('state-taxes.yaml', 'utf8');
//     const data = yaml.load(stateTaxes);

//     // Insert parsed data into MongoDB collection
//     await stateTaxes.insertOne(data);
//     }

//     console.log("Data inserted successfully!");

//     // Close the connection
//     await client.close();
//   } catch (err) {
//     console.error("Error:", err.stack);
//   }
// }

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
