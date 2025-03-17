const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const Tax = require("./schema.js");
const { ObjectId } = require("mongoose").Types;
const taxId = "67d8912a816a92a8fcb6dd55";
const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/hungerarc", { useNewUrlParser: true, useUnifiedTopology: true });

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
                const cleanedCell = cellText.replace(/[\$,]/g, '');
                Tax.updateOne({ _id: new ObjectId(taxId) }, { $set: { "single.standardDeductions": Number(cleanedCell) } })
                  .then((doc) => console.log("Saved Tax Document:", doc))
                  .catch((err) => console.error("Error Saving Document:", err));
              } else if (colIndex == 1 && rowIndex == 2) {
                const cleanedCell = cellText.replace(/[\$,]/g, '');
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
