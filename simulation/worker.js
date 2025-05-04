const { runSimulation } = require('./simulation.js');

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
      currentYear  
    } = input;
    
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
      currentYear
    );
  } catch (error) {
    console.error('Error in worker:', error);
    throw error;
  }
};
