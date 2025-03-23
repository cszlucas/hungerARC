const express = require("express");
const router = express.Router();
const user = require("./controllers/user.js");
const events = require("./controllers/events.js");
const investments = require("./controllers/investments.js");
const scenario = require("./controllers/scenario.js");
const tax = require("./controllers/tax.js");
const webscraping = require("./controllers/webscraping.js");

// user
router.get("/user/:id/scenarios", user.scenarios);
router.post("/auth/google", user.auth);

// events
router.get("/investStrategy/:id", events.investStrategy);
router.get("/rebalanceStrategy/:id", events.rebalanceStrategy);
router.post("/incomeEvent", events.incomeEvent);
router.post("/updateIncome/:id", events.updateIncome);
router.post("/expenseEvent", events.expenseEvent);
router.post("/updateExpense/:id", events.updateExpense);
router.post("/investStrategy", events.investStrategy);
router.post("/rebalanceStrategy", events.rebalanceStrategy);
router.get("/scenario/:id/incomeEvent", events.getAllIncomeEventsByScenario);
router.get("/scenario/:id/expenseEvent", events.getAllExpenseEventsByScenario);

// investments
router.get("/investmentType/:id", investments.investmentType);
router.post("/investmentType", investments.investmentType);
router.post("/investment", investments.investment);
router.post("/updateInvestment/:id", investments.updateInvestment);
router.post("/updateInvestmentType/:id", investments.updateInvestmentType);
router.get("/scenario/:id/investments", investments.getAllInvestmentsByScenario);

// scenario
router.get("/scenario/:id", scenario.scenario);
router.post("/basicInfo", scenario.basicInfo);
router.post("/updateScenario/:id", scenario.updateScenario);
router.post("/scenarioInvestments", scenario.scenarioInvestments);


//tax
router.get("/tax", tax.tax);
router.get("/statetax/:state", tax.statetax);

//webscraping
router.get("/standardDeductions", webscraping.standardDeductions);
router.get("/incomeSingle", webscraping.incomeSingle);
router.get("/incomeMarried", webscraping.incomeMarried);
router.get("/capitalGains", webscraping.capitalGains);
router.get("/rmd", webscraping.rmd);

module.exports = router;
