// app.js
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const routes = require('./routes');

function createApp({ sessionMiddleware } = {}) {

  const app = express();

  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
  }));

  app.use(express.json());

  // Allow test to inject a fake session middleware
  if (sessionMiddleware) {
    app.use(sessionMiddleware);
  } else {
    app.use(session({
      name: "session-id",
      secret: "WE",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: "mongodb://localhost:27017/hungerarc",
        collectionName: "sessions",
        ttl: 7 * 24 * 60 * 60,
      }),
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    }));
  }

  app.use('/', routes);

  return app;
}

module.exports = createApp;
