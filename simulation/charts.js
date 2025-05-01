function createYearDataBuckets(numYears, startYear) {
  const buckets = [];
  for (let i = 0; i < numYears; i++) {
    buckets.push({
      year: startYear + i,  // Add year to each bucket
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
function updateYearDataBucket(buckets, index, { investments, income, discretionary, nonDiscretionary, taxes, earlyWithdrawals }) {
  buckets[index].investments.push(investments);
  buckets[index].income.push(income);
  buckets[index].discretionary.push(discretionary);
  buckets[index].nonDiscretionary.push(nonDiscretionary);
  buckets[index].taxes.push(taxes);
  buckets[index].earlyWithdrawals.push(earlyWithdrawals);
}

//After All Simulations — Build Chart Data
function buildChartDataFromBuckets(buckets, startYear, numScenarioTimes) {
  const numYears = buckets.length / numScenarioTimes; // Number of years in each bucket
  const endYear = startYear + numYears - 1;
  console.log("endYear :>> ", endYear);
  const data = {
    income: [],
    investments: [],
    discretionary: [],
    nonDiscretionary: [],
    taxes: [],
    earlyWithdrawals: [],
  };

  const yearBuckets = Array.from({ length: numYears }, () => ({
    income: [],
    investments: [],
    discretionary: [],
    nonDiscretionary: [],
    taxes: [],
    earlyWithdrawals: [],
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
  }

  for (const bucket of yearBuckets) {
    data.income.push(bucket.income);
    data.investments.push(bucket.investments);
    data.discretionary.push(bucket.discretionary);
    data.nonDiscretionary.push(bucket.nonDiscretionary);
    data.taxes.push(bucket.taxes);
    data.earlyWithdrawals.push(bucket.earlyWithdrawals);
  }
  // console.log('data :>> ', data);
  // console.log('yearBuckets :>> ', yearBuckets);
  return { startYear, endYear, data };
}

function exploreData(allYearDataBuckets, explorationData, paramValueCombo, year) {
  // Create simulations in desired format
  //console.log("DATA", JSON.stringify(allYearDataBuckets, null, 2));
  const simulations = allYearDataBuckets.map((simulation) =>
    simulation.map((yearData) => ({
      year: yearData.year,
      investment: yearData.investments,
    }))
  );

  explorationData.values.push({
    value: paramValueCombo, // e.g., [20, 100]
    simulations,
  });

  return explorationData;
}

function chartData(allYearDataBuckets, numScenarioTimes) {
  //console.log("allYearDataBuckets", JSON.stringify(allYearDataBuckets, null, 2));
  const flattenedBuckets = allYearDataBuckets.flat();
  // console.log("flattenedBuckets", flattenedBuckets)

  const { startYear, endYear, data } = buildChartDataFromBuckets(flattenedBuckets, 2025, numScenarioTimes);
  // console.log("DATA", JSON.stringify(data, null, 2));
  // console.log("DATA", data);
  const years = [];
  for (let i = 0; i <= endYear - startYear; i++) {
    years.push({
      year: startYear + i,
      income: data.income[i],
      investments: data.investments[i],
      discretionary: data.discretionary[i],
      nonDiscretionary: data.nonDiscretionary[i],
      taxes: data.taxes[i],
      earlyWithdrawals: data.earlyWithdrawals[i],
    });
  }
  return years;
}


module.exports = {
  buildChartDataFromBuckets,
  updateYearDataBucket,
  createYearDataBuckets,
  exploreData,
  chartData
};
