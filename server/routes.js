const express = require("express");
const router = express.Router();
const user = require("./controllers/user.js");
const events = require("./controllers/events.js");
const investments = require("./controllers/investments.js");
const scenario = require("./controllers/scenario.js");
const tax = require("./controllers/tax.js");
const webscraping = require("./controllers/webscraping.js");
const stateTax = require("./importStateYaml.js");

// user
router.get("/user/scenarios", user.scenarios);
router.post("/auth/google", user.auth);
router.post("/auth/guest", user.guestAuth);
router.get("/auth/session", user.sessionCheck);
router.post("/auth/logout", user.logout);
router.post("/uploadStateTaxYaml", user.uploadStateTaxYaml);

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
router.post("/deleteIncome/:id", events.deleteIncomeEvent);
router.post("/deleteExpense/:id", events.deleteExpenseEvent);
router.post("/deleteInvest/:id", events.deleteInvestEvent);
router.post("/deleteRebalance/:id", events.deleteRebalanceEvent);

// investments
router.get("/getInvestment/:id", investments.getInvestment);
router.get("/scenario/:id/investments", investments.getAllInvestmentsByScenario);
router.get("/scenario/:id/investmentType", investments.getInvestmentTypeByScenario);
router.post("/scenario/:id/investmentType", investments.createInvestmentType);
router.post("/updateInvestmentType/:id", investments.updateInvestmentType);
router.post("/scenario/:id/investment", investments.createInvestment);
router.post("/updateInvestment/:id", investments.updateInvestment);
router.post("/deleteInvestment/:id", investments.deleteInvestment);
router.post("/deleteInvestmentType/:id", investments.deleteInvestmentType);

// scenario
router.get("/scenario/:id", scenario.scenario);
router.post("/basicInfo/", scenario.basicInfo);
router.post("/updateScenario/:id", scenario.updateScenario);
router.post("/scenarioInvestments", scenario.scenarioInvestments);
router.post("/deleteScenario/:id", scenario.deleteScenario);
router.post("/importScenario/", scenario.importUserData);
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
router.post("/statetax", stateTax.createStateTaxes);

// simulation
router.get("/runSimulation", scenario.simulateScenario);

module.exports = router;
