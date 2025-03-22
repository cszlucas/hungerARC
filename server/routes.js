const express = require("express");
const router = express.Router();
const authentication = require("./controllers/authentication.js");
const events = require("./controllers/events.js");
const investments = require("./controllers/investments.js");
const scenario = require("./controllers/scenario.js");
const tax = require("./controllers/tax.js");
const webscraping = require("./controllers/webscraping.js");

// authentication
router.post("/auth/google", authentication.auth);

// events
router.post("/incomeEvent", events.incomeEvent);
router.post("/expenseEvent", events.expenseEvent);

// investments
router.post("/investmentType", investments.investmentType);

// scenario
router.get("/scenario/:id", scenario.scenario);
router.post("/basicInfo", scenario.basicInfo);

//tax
router.get("/tax", tax.tax);
router.get("/statetax", tax.statetax);

//webscraping
router.get("/standardDeductions", webscraping.standardDeductions);
router.get("/incomeSingle", webscraping.incomeSingle);
router.get("/incomeMarried", webscraping.incomeMarried);
router.get("/capitalGains", webscraping.capitalGains);
router.get("/rmd", webscraping.rmd);

module.exports = router;
