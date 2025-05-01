//This file ensures objects delivered in correct format and for current year. Ex: uniform/normal
const seed = 12345;
const rand = mulberry32(seed);

function getCurrentEvent(year, incomeEvent = [], expenseEvent = [], investEvent = [], rebalanceEvent = []) {
  let curIncomeEvent = [];
  let curExpenseEvent = [];
  let curInvestEvent = [];
  let curRebalanceEvent = [];

  for (let event of incomeEvent) {
    if (year >= event.startYear.calculated && year <= event.startYear.calculated + event.duration.calculated) {
      curIncomeEvent.push(event);
    }
  }

  for (let event of expenseEvent) {
    if (year >= event.startYear.calculated && year <= event.startYear.calculated + event.duration.calculated) {
      curExpenseEvent.push(event);
    }
  }

  for (let event of investEvent) {
    if (year >= event.startYear.calculated && year <= event.startYear.calculated + event.duration.calculated) {
      curInvestEvent.push(event);
    }
  }

  for (let event of rebalanceEvent) {
    if (year >= event.startYear.calculated && year <= event.startYear.calculated + event.duration.calculated) {
      curRebalanceEvent.push(event);
    }
  }

  return {
    curIncomeEvent,
    curExpenseEvent,
    curInvestEvent,
    curRebalanceEvent,
  };
}

function startYear(event, relatedEvents) {
  const type = event.startYear.type;
  if (type === "fixedAmt") {
    return event.startYear.value;
  } else if (type === "normal") {
    const { mean, stdDev } = event.startYear;
    return Math.round(randomNormal(mean, stdDev));
  } else if (type === "uniform") {
    const { min, max } = event.startYear;
    return Math.floor(randomUniform(min, max));
  } else if (type === "same") {
    return refEvents(event, relatedEvents);
  } else if (type === "after") {
    return refEvents(event, relatedEvents) + 1;
  }
  return null; // fallback if type is not recognized
}

function refEvents(event, relatedEvents) {
  const refEventID = event.startYear.refer;
  if (!refEventID) {
    throw new Error("Missing reference event ID for 'same' startYear type.");
  }
  const refEvent = relatedEvents.find((e) => e._id === refEventID);
  if (!refEvent) {
    throw new Error(`Referenced event with ID "${refEventID}" not found.`);
  }
  if (refEvent.startYear.calculated !== undefined) {
    return refEvent.startYear.calculated;
  }
  // If the referenced event hasn't been assigned yet, recursively calculate it
  refEvent.startYear.calculated = startYear(refEvent, relatedEvents);
  return refEvent.startYear.calculated;
}

function setValues(events) {
  //run once per simulation
  for (let event of events) {
    let startYr = startYear(event, events);
    event.startYear.calculated = startYr;
    let dur = duration(event);
    event.duration.calculated = dur;
  }
}

function randomNormal(mean, stdDev) {
  // Using Box-Muller Transform with seeded PRNG
  let u = rand();
  let v = rand();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  console.log('u :>> ', u);
  console.log('v :>> ', v);
  console.log('z :>> ', z);
  console.log("mean: ", typeof mean);   
console.log("stdev", typeof stdDev); 
  console.log('mean+z*stdDev :>> ', mean+z*stdDev);
  return mean + z * stdDev;
}

function randomUniform(min, max) {
  return min + rand() * (max - min);
}

function mulberry32(seed) {
  return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function duration(event) {
  const type = event.duration.type;
  if (type === "fixedAmt") {
    return event.duration.value;
  } else if (type === "normal") {
    const { mean, stdDev } = event.duration;
    return Math.max(0, Math.round(randomNormal(mean, stdDev))); // prevent negative duration
  } else if (type === "uniform") {
    const { min, max } = event.duration;
    return Math.floor(randomUniform(min, max));
  }

  return null; // unknown duration type
}

function getStrategy(scenario, investments, curExpenseEvent, investEvent, year) {
  // Helper: safely map by ID and filter out unfound items
  const safeMapById = (ids, collection, label) => {
    return ids
      .map((id) => {
        const item = collection.find((entry) => entry._id === id);
        if (!item) {
          console.warn(`Warning: ${label} ID "${id}" not found in collection.`);
          console.log(collection);
        }
        return item;
      })
      .filter(Boolean);
  };
  const RMDStrategyInvestOrder = safeMapById(scenario.rmdStrategy, investments, "RMD Strategy Investment");
  const withdrawalStrategy = safeMapById(scenario.expenseWithdrawalStrategy, investments, "Withdrawal Strategy Investment");
  const spendingStrategy = safeMapById(scenario.spendingStrategy, curExpenseEvent, "Spending Strategy Expense");

  const investStrategy = investEvent.filter(
    (invest) => scenario.investEventSeries.includes(invest._id) && invest.startYear?.calculated <= year && year <= invest.startYear?.calculated + invest.duration?.calculated
  );
  
  console.log("helper invest strategy: " + investStrategy);
  return {
    RMDStrategyInvestOrder,
    withdrawalStrategy,
    spendingStrategy,
    investStrategy,
  };
}

function getRebalanceStrategy(scenario, rebalanceEvent, type, year) {
  const rebalanceStrategy = rebalanceEvent.filter(
    (rebStrategy) =>
      scenario.rebalanceEventSeries.includes(rebStrategy._id) &&
      rebStrategy.startYear?.calculated <= year &&
      rebStrategy.startYear?.calculated + rebStrategy.duration?.calculated &&
      rebStrategy.taxStatus === type
  );
  return rebalanceStrategy;
}

module.exports = {
  getCurrentEvent,
  getStrategy,
  getRebalanceStrategy,
  setValues,
  randomNormal,
  randomUniform,
};
