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


function formatGroupedStackedBarChart(mergedData, startYear) {

  const chartData = [];
  
  // Define categories for the chart
  const categories = [
    { key: "investments", type: "investment" },
    { key: "income", type: "income" },
    { key: "discretionary", type: "expense", name: "Discretionary" },
    { key: "nonDiscretionary", type: "expense", name: "Non-Discretionary" },
    { key: "taxes", type: "expense", name: "Taxes" },
    { key: "earlyWithdrawals", type: "income", name: "Early Withdrawals" },
  ];

  // Check if mergedData is correctly defined and has the required keys
  if (!mergedData || !Array.isArray(mergedData.income)) {
    console.error("Error: mergedData or mergedData.income is missing or not an array");
    return [];  // Return an empty array or handle the error gracefully
  }

  const numYears = mergedData.income.length;  // Get the number of years (assumes mergedData is structured properly)

  for (let i = 0; i < numYears; i++) {
    const year = startYear + i;

    for (const { key, type, name } of categories) {
      const value = mergedData[key]?.[i] ?? 0;  // Safely access the value at index i

      if (value !== 0) {  // Only add if value is non-zero
        chartData.push({
          year,
          type,
          name: name || key,  // Use custom name if available, else use the key
          value,
        });
      }
    }
  }

  return chartData;
}



//After All Simulations — Build Chart Data
function buildChartDataFromBuckets(buckets, startYear, numScenarioTimes) {
  const numYears = buckets.length / numScenarioTimes; // Number of years in each bucket
  const endYear = startYear + numYears - 1;
  console.log('endYear :>> ', endYear);
  const data = {
    income: {
      average: [],
      median: [],
    },
    investments: {
      average: [],
      median: [],
    },
    discretionary: {
      average: [],
      median: [],
    },
    nonDiscretionary: {
      average: [],
      median: [],
    },
    taxes: {
      average: [],
      median: [],
    },
    earlyWithdrawals: {
      average: [],
      median: [],
    },
    metGoal: {
      average: [],
    },
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
    data.income.average.push(average(bucket.income));
    data.income.median.push(median(bucket.income));

    data.investments.average.push(average(bucket.investments));
    data.investments.median.push(median(bucket.investments));

    data.discretionary.average.push(average(bucket.discretionary));
    data.discretionary.median.push(median(bucket.discretionary));

    data.nonDiscretionary.average.push(average(bucket.nonDiscretionary));
    data.nonDiscretionary.median.push(median(bucket.nonDiscretionary));

    data.taxes.average.push(average(bucket.taxes));
    data.taxes.median.push(median(bucket.taxes));

    data.earlyWithdrawals.average.push(average(bucket.earlyWithdrawals));
    data.earlyWithdrawals.median.push(median(bucket.earlyWithdrawals));

    data.metGoal.average.push(average(bucket.metGoal));
  }
  // console.log('data :>> ', data);
  // console.log('yearBuckets :>> ', yearBuckets);
  return { startYear, endYear, data };
}



module.exports = {
  buildChartDataFromBuckets,
  updateYearDataBucket,
  createYearDataBuckets,
  formatGroupedStackedBarChart
};
