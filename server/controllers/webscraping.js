let taxId;
let rmdId;
const RMD = require("../models/rmd-schema.js");
const Tax = require("../models/tax.js");
const cheerio = require("cheerio");
const { ObjectId } = require("mongoose").Types;
const axios = require("axios");

exports.handleAllRoutes = async (req, res) => {
  try {
    const newTaxData = new Tax({
      year: 2025,
      single: {
        federalIncomeTaxRatesBrackets: [
          { incomeRange: [0, 0], taxRate: 0 },
          { incomeRange: [0, 0], taxRate: 0 },
        ],
        standardDeductions: 0,
        capitalGainsTaxRates: [
          { incomeRange: [0, 0], gainsRate: 0 },
          { incomeRange: [0, 0], gainsRate: 0 },
        ],
      },
    });
    const savedTaxData = await newTaxData.save();
    taxId = savedTaxData._id;

    const newRMD = new RMD({
      rmd: [{ age: 0, distributionPeriod: 0 }],
    });

    const savedRMD = await newRMD.save();
    rmdId = savedRMD._id;
    console.log("The RMD id: ", rmdId);

    const standardDeductions = await exports.standardDeductions(req, res);
    const incomeMarried = await exports.incomeMarried(req, res);
    const incomeSingle = await exports.incomeSingle(req, res);
    const capitalGains = await exports.capitalGains(req, res);
    const rmd = await exports.rmd(req, res);

    // Aggregate all results into one response
    res.status(200).json({
      standardDeductions,
      incomeMarried,
      incomeSingle,
      capitalGains,
      rmd,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while fetching data", mymessage: error.message });
  }
};

//TAXES
exports.standardDeductions = async (req, res) => {
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
};

exports.incomeSingle = async (req, res) => {
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
};

exports.incomeMarried = async (req, res) => {
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
};

exports.capitalGains = async (req, res) => {
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
};

//RMD
exports.rmd = async (req, res) => {
  try {
    const response = await axios.get("https://www.irs.gov/publications/p590b#en_US_2023_publink100090310");
    const $ = cheerio.load(response.data);

    const targetLink = $('.table a[name="en_US_2024_publink100090310"]');
    const rmds = [];
    let age = "";
    let distPeriod = "";

    if (targetLink.length > 0) {
      console.log("hello");
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
                console.log(`Row ${rowIndex}, Column ${colIndex}: ${cellText}`);
              }
            });
        });
      console.log("RMD: ", rmds);
      console.log("The id: ", rmdId);
      rmds.forEach((rmd) => {
        RMD.updateOne(
          {
            _id: rmdId,
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
    console.log(targetLink.length);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while scraping data.");
  }
};
