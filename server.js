const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/webscraper', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema and model for storing scraped data
const DataSchema = new mongoose.Schema({
  title: String,
  content: String,
});
const Data = mongoose.model('Data', DataSchema);

// Web scraping route
app.get('/scrape', async (req, res) => {
  try {
    const response = await axios.get('https://example.gov');
    const $ = cheerio.load(response.data);

    const scrapedData = [];
    $('selector').each((index, element) => { // Replace 'selector' with the actual HTML element selector
      const title = $(element).find('title-selector').text(); // Replace 'title-selector' with the actual title selector
      const content = $(element).find('content-selector').text(); // Replace 'content-selector' with the actual content selector
      scrapedData.push({ title, content });
    });

    // Save scraped data to MongoDB
    await Data.insertMany(scrapedData);

    res.send('Scraping and saving data completed!');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while scraping data.');
  }
});


const fs = require('fs');
const yaml = require('js-yaml');
const { MongoClient } = require('mongodb');


async function run() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(url);
    await client.connect();
    console.log("Connected to MongoDB server");

    const db = client.db(dbName);
    const collection = db.collection('your_collection');

    // Load and parse the YAML file
    const stateTaxes = fs.readFileSync('state-taxes.yaml', 'utf8');
    const data = yaml.load(stateTaxes);

    // Insert parsed data into MongoDB collection
    await stateTaxes.insertOne(data);
    }

    console.log("Data inserted successfully!");

    // Close the connection
    await client.close();
  } catch (err) {
    console.error("Error:", err.stack);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

