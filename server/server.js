const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
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

const routes = require('./routes.js');
app.use('/', routes); 

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
