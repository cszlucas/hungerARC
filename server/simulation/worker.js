const { runSimulation } = require('./simulation.js');
const { createLogger } = require('./logs');
const {mulberry32} = require("./helper.js");

module.exports = async function ({ simId }) {
  // const log = createLogger(userId ?? simId);

  // log(`Simulation ${simId} started.`);

  // Simulated work
  await new Promise((res) => setTimeout(res, Math.random() * 1000));

 // log(`Simulation ${simId} completed.`);
};


module.exports = async function(input) {
  //console.log("Inside Worker, currentYear:", input.currentYear);
  try {
    const {
      scenario,
      taxData,
      stateTax,
      startYearPrev,
      lifeExpectancyUser,
      lifeExpectancySpouse,
      investment,
      income,
      expense,
      invest,
      rebalance,
      investmentType,
      csvLog,
      currentYear,
      seed,
      rmd,
      x,
      user
    } = input;
    
    const rand = mulberry32(seed); 

    return await runSimulation(
      scenario,
      taxData,
      stateTax,
      startYearPrev,
      lifeExpectancyUser,
      lifeExpectancySpouse,
      investment,
      income,
      expense,
      invest,
      rebalance,
      investmentType,
      csvLog,
      currentYear,
      rand,
      rmd,
      x,
      user
    );
  } catch (error) {
    console.error('Error in worker:', error);
    throw error;
  }
};
