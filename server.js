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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
