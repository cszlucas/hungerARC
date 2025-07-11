// app.js
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const routes = require("./routes");

function createApp({ sessionMiddleware } = {}) {
  const app = express();

  try {
    require("mongoose");
    console.log("✅ Mongoose module is installed in app.js");
  } catch (err) {
    console.error("❌ Mongoose module is NOT installed in app.js");
  }

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1); // Required for secure cookies on Heroku, Render, etc.
  }

  const allowedOrigins = [process.env.FRONTEND_TESTING, process.env.FRONTEND_URI, process.env.FRONTEND_ORIGIN];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.error("Blocked by CORS:", origin);
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());

  // Allow test to inject a fake session middleware
  if (sessionMiddleware) {
    app.use(sessionMiddleware);
  } else {
    app.use(
      session({
        name: "session-id",
        secret: "WE",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: process.env.MONGO_URI,
          collectionName: "sessions",
          ttl: 7 * 24 * 60 * 60,
        }),
        cookie: {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      })
    );
  }

  app.use("/", routes);

  return app;
}

module.exports = createApp;
