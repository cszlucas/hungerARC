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

//After All Simulations — Build Chart Data
function buildChartDataFromBuckets(buckets, startYear, numScenarioTimes) {
  const numYears = buckets.length / numScenarioTimes; // Number of years in each bucket
  const endYear = startYear + numYears - 1;
  console.log("endYear :>> ", endYear);
  const data = {
    startYear: startYear,
    endYear: endYear,
    income: [],
    investments: [],
    discretionary: [],
    nonDiscretionary: [],
    taxes: [],
    earlyWithdrawals: [],
    metGoal: [],
  };

  const yearBuckets = Array.from({ length: numYears }, () => ({
    income: [],
    investments: [],
    discretionary: [],
    nonDiscretionary: [],
    taxes: [],
    earlyWithdrawals: [],
    metGoal: [],
  }));

  for (let i = 0; i < buckets.length; i++) {
    const yearIndex = i % numYears;
    const bucket = buckets[i];

    yearBuckets[yearIndex].income.push(...bucket.income);
    yearBuckets[yearIndex].investments.push(...bucket.investments);
    yearBuckets[yearIndex].discretionary.push(...bucket.discretionary);
    yearBuckets[yearIndex].nonDiscretionary.push(...bucket.nonDiscretionary);
    yearBuckets[yearIndex].taxes.push(...bucket.taxes);
    yearBuckets[yearIndex].earlyWithdrawals.push(...bucket.earlyWithdrawals);
    yearBuckets[yearIndex].metGoal.push(...bucket.metGoal);
  }

  for (const bucket of yearBuckets) {
    data.income.push(bucket.income);
    data.investments.push(bucket.investments);
    data.discretionary.push(bucket.discretionary);
    data.nonDiscretionary.push(bucket.nonDiscretionary);
    data.taxes.push(bucket.taxes);
    data.earlyWithdrawals.push(bucket.earlyWithdrawals);
    data.metGoal.push(bucket.metGoal);
  }
  // console.log('data :>> ', data);
  // console.log('yearBuckets :>> ', yearBuckets);
  return { startYear, endYear, data };
}

module.exports = {
  buildChartDataFromBuckets,
  updateYearDataBucket,
  createYearDataBuckets,
};
