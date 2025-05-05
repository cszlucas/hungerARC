const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const parseYaml = require("./importStateYaml.js");

// Manually load the .env file
dotenv.config({ path: path.resolve(__dirname, "process.env") });
// console.log("Loaded SESSION_SECRET:", process.env.SESSION_SECRET);

const app = express();
const PORT = 8080;

// --- MIDDLEWARE ---
app.use(cors({
  origin: "http://localhost:3000", // React frontend
  credentials: true               // allow cookies
}));

app.use(express.json());

// --- SESSION SETUP ---
app.use(session({
  name: "session-id",
  secret: "WE HUNGER",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb://localhost:27017/hungerarc",
    collectionName: "sessions",
    ttl: 7 * 24 * 60 * 60, // 1 week
  }),
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  }
}));

// --- MONGOOSE CONNECTION ---

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect("mongodb://localhost:27017/hungerarc", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log("Connected to MongoDB");
   // const yamlPath = path.join(__dirname, "stateYaml/states.yml");
  //parseYaml(yamlPath); // preload tax data
  }).catch((err) => {
    console.error("MongoDB connection error:", err);
  });
} else{
  console.log("your testing jest");
}

// --- ROUTES ---
const routes = require('./routes.js');
app.use('/', routes);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; 