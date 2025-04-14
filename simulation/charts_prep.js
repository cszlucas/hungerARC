function average(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function createYearDataBuckets(numYears) {
  const buckets = [];
  for (let i = 0; i < numYears; i++) {
    buckets.push({
      investments: [],
      income: [],
      discretionary: [],
      nonDiscretionary: [],
      taxes: [],
      earlyWithdrawals: [],
      metGoal: [], // used for line chart probabilities
    });
  }
  return buckets;
}

//During each year of a simulation, call this helper to push values into the appropriate bucket:
function updateYearDataBucket(buckets, index, { investments, income, discretionary, nonDiscretionary, taxes, earlyWithdrawals, metGoal }) {
  buckets[index].investments.push(investments);
  buckets[index].income.push(income);
  buckets[index].discretionary.push(discretionary);
  buckets[index].nonDiscretionary.push(nonDiscretionary);
  buckets[index].taxes.push(taxes);
  buckets[index].earlyWithdrawals.push(earlyWithdrawals);
  buckets[index].metGoal.push(metGoal); // 1 or 0
}

function mergeYearData(simulationRun) {
  const merged = {
    investments: [],
    income: [],
    discretionary: [],
    nonDiscretionary: [],
    taxes: [],
    earlyWithdrawals: [],
    metGoal: [],
  };

  for (const yearData of simulationRun) {
    merged.investments.push(yearData.investments[0]);
    merged.income.push(yearData.income[0]);
    merged.discretionary.push(yearData.discretionary[0]);
    merged.nonDiscretionary.push(yearData.nonDiscretionary[0]);
    merged.taxes.push(yearData.taxes[0]);
    merged.earlyWithdrawals.push(yearData.earlyWithdrawals[0]);
    merged.metGoal.push(yearData.metGoal[0]);
  }

  return merged;
}

//After All Simulations — Build Chart Data
function buildChartDataFromBuckets(buckets, startYear) {
  const shadedChart = {
    startYear,
    endYear: startYear + buckets.length - 1,
    investments: [],
    income: [],
    medianDiscretionary: [],
    medianNonDiscretionary: [],
    taxes: [],
    curYearEarlyWithdrawals: [],
  };

  const lineChart = {
    startYear,
    endYear: startYear + buckets.length - 1,
    probabilities: [],
  };

  for (const bucket of buckets) {
    shadedChart.investments.push(average(bucket.investments));
    shadedChart.income.push(average(bucket.income));
    shadedChart.medianDiscretionary.push(median(bucket.discretionary));
    shadedChart.medianNonDiscretionary.push(median(bucket.nonDiscretionary));
    shadedChart.taxes.push(average(bucket.taxes));
    shadedChart.curYearEarlyWithdrawals.push(average(bucket.earlyWithdrawals));

    const successRate = average(bucket.metGoal); // between 0 and 1
    lineChart.probabilities.push(successRate);
  }

  return { shadedChart, lineChart };
}

module.exports = {
  buildChartDataFromBuckets,
  updateYearDataBucket,
  createYearDataBuckets,
  mergeYearData
};
