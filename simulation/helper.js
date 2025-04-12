const {randomNormal,randomUniform } = require("./format.js");

function getExpenseAmountInYear(event, year, inflationRate = 0.02) {
  const { initialAmount, annualChange, inflationAdjustment, startYear, duration } = event;
  let startSimYear = new Date().getFullYear();
  const yearsSinceStart = year-startSimYear;
  const yearsActive = year - startYear.calculated;

  // Apply inflation to base amount only if inflationAdjustment is true
  let amount = inflationAdjustment ? initialAmount * Math.pow(1 + inflationRate, yearsSinceStart) : initialAmount;

  // Only apply expected change if event is active in this year
  if (yearsActive >= 0 && yearsActive < duration.calculated && yearsSinceStart>=0) {
    for (let i = 0; i < yearsActive; i++) {
      let change = 0;

      switch (annualChange.type) {
        case "fixedAmt":
          amount += annualChange.value;
          break;

        case "fixedPercent":
          amount *= 1 + annualChange.value;
          break;

        case "normal":
          change = randomNormal(annualChange.mean, annualChange.stdDev);
          amount += annualChange.unit === "percent" ? amount * change : change;
          break;

        case "uniform":
          change = randomUniform(annualChange.min, annualChange.max);
          amount += annualChange.unit === "percent" ? amount * change : change;
          break;

        default:
          break;
      }
    }
  } else {
    // If not in active years, set amount to 0
    amount = 0;
  }

  return amount;
}

module.exports = {
  getExpenseAmountInYear,
};
