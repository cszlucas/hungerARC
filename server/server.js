// const express = require("express");
// const axios = require("axios");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");
// const session = require("express-session");
// const MongoStore = require("connect-mongo");
// const parseYaml = require("./importStateYaml.js");

// // Manually load the .env file
// dotenv.config({ path: path.resolve(__dirname, "process.env") });
// // console.log("Loaded SESSION_SECRET:", process.env.SESSION_SECRET);

// const app = express();
// const PORT = 8080;

// // --- MIDDLEWARE ---
// app.use(cors({
//   origin: "http://localhost:3000", // React frontend
//   credentials: true               // allow cookies
// }));

// app.use(express.json());

// // --- SESSION SETUP ---

// // --- MONGOOSE CONNECTION ---

// if (process.env.NODE_ENV !== 'test') {
//   app.use(session({
//     name: "session-id",
//     secret: "WE HUNGER",
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({
//       mongoUrl: "mongodb://localhost:27017/hungerarc",
//       collectionName: "sessions",
//       ttl: 7 * 24 * 60 * 60, // 1 week
//     }),
//     cookie: {
//       httpOnly: true,
//       secure: false,
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
//     }
//   }));

//   mongoose.connect("mongodb://localhost:27017/hungerarc", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   }).then(() => {
//     console.log("Connected to MongoDB");
//    // const yamlPath = path.join(__dirname, "stateYaml/states.yml");
//   //parseYaml(yamlPath); // preload tax data
//   }).catch((err) => {
//     console.error("MongoDB connection error:", err);
//   });

//   const routes = require('./routes.js');
//   app.use('/', routes);
//   app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
//   });
// } else{

//   console.log("your testing jest");
//   const mockSession = (req, res, next) => {
//     req.session = { user: { _id: testUser._id } };
//     next();
//   };
//   app.use(mockSession);
//   const routes = require('./routes.js');
//   app.use('/', routes);

//   // if (sessionMiddleware) {
//   //     app.use(sessionMiddleware);
//   //   } else {
//   //     app.use(session({
//   //       name: "session-id",
//   //       secret: "WE",
//   //       resave: false,
//   //       saveUninitialized: false,
//   //       store: MongoStore.create({
//   //         mongoUrl: "mongodb://localhost:27017/hungerarc",
//   //         collectionName: "sessions",
//   //         ttl: 7 * 24 * 60 * 60,
//   //       }),
//   //       cookie: {
//   //         httpOnly: true,
//   //         secure: false,
//   //         sameSite: "strict",
//   //         maxAge: 7 * 24 * 60 * 60 * 1000,
//   //       }
//   //     }));
//   //   }

// }

// // --- ROUTES ---

// // --- SERVER START ---
// // app.listen(PORT, () => {
// //   console.log(`Server is running on http://localhost:${PORT}`);
// // });

// module.exports = app;

const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const parseYaml = require("./importStateYaml.js");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"), // adjust if .env is in root
});

console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
try {
  require("mongodb");
  console.log("✅ MongoDB module is installed");
} catch (err) {
  console.error("❌ MongoDB module is NOT installed");
}

const app = express();
const PORT = 8080;

const routes = require("./routes.js");

// --- MONGOOSE CONNECTION ---

if (process.env.NODE_ENV !== "test") {
  // --- MIDDLEWARE ---
  const allowedOrigins = [process.env.FRONTEND_TESTING, process.env.FRONTEND_URI];

  console.log('Incoming request origin:', origin);
  console.log('Allowed origins:', allowedOrigins);

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());

  // --- SESSION SETUP ---
  app.use(
    session({
      name: "session-id",
      secret: "WE HUNGER",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: "sessions",
        ttl: 7 * 24 * 60 * 60, // 1 week
      }),
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    })
  );

  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB");
      // const yamlPath = path.join(__dirname, "stateYaml/states.yml");
      //parseYaml(yamlPath); // preload tax data
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });

  // --- ROUTES ---
  // const routes = require('./routes.js');
  app.use("/", routes);

  // --- SERVER START ---
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
} else {
  console.log("your testing jest");

  const allowedOrigins = [process.env.FRONTEND_TESTING, process.env.FRONTEND_URI];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());
  const mockSession = (req, res, next) => {
    req.session = { user: { _id: testUser._id } };
    next();
  };

  app.use(mockSession);

  app.use("/", routes);
}

module.exports = app;

// const dotenv = require("dotenv");
// const mongoose = require("mongoose");
// const createApp = require("./app");

// dotenv.config({ path: "./process.env" });

// const PORT = 8080;
// const app = createApp();

// if (process.env.NODE_ENV !== "test") {
//   mongoose.connect("mongodb://localhost:27017/hungerarc", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   }).then(() => {
//     console.log("Connected to MongoDB");
//   }).catch((err) => {
//     console.error("MongoDB connection error:", err);
//   });

//   app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
//   });
// }

// module.exports = app;
