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
router.get("/getInvestStrategy/:id", events.getInvestStrategy);
router.get("/getRebalanceStrategy/:id", events.getRebalanceStrategy);
router.get("/scenario/:id/incomeEvent", events.getAllIncomeEventsByScenario);
router.get("/scenario/:id/expenseEvent", events.getAllExpenseEventsByScenario);
router.get("/scenario/:id/invest", events.getAllInvestEventsByScenario);
router.get("/scenario/:id/rebalance", events.getAllRebalanceEventsByScenario);
router.post("/scenario/:id/incomeEvent", events.createIncomeEvent);
router.post("/updateIncome/:id", events.updateIncome);
router.post("/scenario/:id/expenseEvent", events.createExpenseEvent);
router.post("/updateExpense/:id", events.updateExpense);
router.post("/scenario/:id/investStrategy", events.createInvestStrategy);
router.post("/updateInvestStrategy/:id", events.updateInvestStrategy);
router.post("/scenario/:id/rebalanceStrategy", events.createRebalanceStrategy);
router.post("/updateRebalanceStrategy/:id", events.updateRebalanceStrategy);

// investments
router.get("/getInvestment/:id", investments.getInvestment);
router.get("/scenario/:id/investments", investments.getAllInvestmentsByScenario);
router.get("/scenario/:id/investmentType", investments.getInvestmentTypeByScenario);
router.post("/scenario/:id/investmentType", investments.createInvestmentType);
router.post("/updateInvestmentType/:id", investments.updateInvestmentType);
router.post("/scenario/:id/investment", investments.createInvestment);
router.post("/updateInvestment/:id", investments.updateInvestment);


// scenario
router.get("/scenario/:id", scenario.scenario);
router.post("/basicInfo/user/:id", scenario.basicInfo);
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
router.get("/handleAllRoutes", webscraping.handleAllRoutes);

module.exports = router;
