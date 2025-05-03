const { randomNormal, randomUniform } = require("./helper.js");

//since the income/events don't have value property
function getValueInYear(event, year, inflationRate, spouseDeath) {
  const { initialAmount, annualChange, inflationAdjustment, startYear, duration } = event;
  let startSimYear = new Date().getFullYear();
  const yearsSinceStart = year - startSimYear;
  const yearsActive = year - startYear.calculated;
  // Apply inflation to base amount only if inflationAdjustment is true
  let amount = inflationAdjustment ? initialAmount * Math.pow(1 + inflationRate, yearsSinceStart) : initialAmount;

  // Account for if spouse is out of simulation
  if (spouseDeath) {
    amount *= event.userPercentage * 0.01;
  }

  console.log('duration.calculated :>> ', duration.calculated);
  // Only apply expected change if event is active in this year
  if (yearsActive >= 0 && yearsActive < duration.calculated && yearsSinceStart >= 0) {
    // for (let i = 0; i < yearsActive; i++) {
      let change = 0;

      switch (annualChange.distribution) {
        case "none":
          amount += annualChange.type === "percentage" ? amount * (annualChange.amount ?? 0) * 0.01 : annualChange.amount ?? 0;
          break;

        case "normal":
          change = randomNormal(annualChange.mean, annualChange.stdDev);
          amount += annualChange.type === "percentage" ? amount * change * 0.01 : change;
          break;

        case "uniform":
          change = randomUniform(annualChange.min, annualChange.max);
          amount += annualChange.type === "percentage" ? amount * change * 0.01 : change;
          break;

        default:
          break;
      }
    // }
  }
  //  else {
    // If not in active years, set amount to 0
    // amount = 0;
  // }
  return amount;
}

module.exports = {
  getValueInYear,
};
