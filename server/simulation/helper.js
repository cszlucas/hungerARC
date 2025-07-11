//This file ensures objects delivered in correct format and for current year. Ex: uniform/normal
let globalRand = Math.random; // fallback

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
    //console.log("INVEST EVENT",JSON.stringify(event, null, 2));
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
    if (event.startYear.calculated == undefined) {
      let startYr = startYear(event, events);
      event.startYear.calculated = startYr;
    }
    if (event.duration.calculated == undefined) {
      let dur = duration(event);
      event.duration.calculated = dur;
    }
  }
}

function setGlobalRand(r) {
  globalRand = r;
}

function randomNormal(mean, stdDev) {
  // console.log("Using mulberry32 (custom PRNG):");
  // for (let i = 0; i < 5; i++) {
  //   console.log(globalRand()); // Should produce a fixed sequence
  // }

  // // Now log the values from Math.random() for comparison
  // console.log("\nUsing Math.random():");
  // for (let i = 0; i < 5; i++) {
  //   console.log(Math.random()); // This should be different each time
  // }
  // Using Box-Muller Transform with seeded PRNG
  let u = globalRand();
  let v = globalRand();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  //console.log('u :>> ', u);
  //console.log('v :>> ', v);
  //console.log('z :>> ', z);
  //console.log("mean: ", typeof mean);
  // console.log("stdev", typeof stdDev);
  //   console.log('mean+z*stdDev :>> ', mean+z*stdDev);
  return mean + z * stdDev;
}

function randomUniform(min, max) {
  return min + globalRand() * (max - min);
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
  const safeMapById = (ids=[], collection, label, e) => {
    return ids
      .map((id) => {
        const item = collection.find((entry) => entry._id === id);
        if (!item) {
          console.log(`Warning: ${e} ID "${id}" not part of strategy: ${label}.`);
          console.log(collection);
        }
        return item;
      })
      .filter(Boolean);
  };
  const RMDStrategyInvestOrder = safeMapById(scenario.rmdStrategy, investments, "RMD Strategy Investment", "RMD collection");
  const withdrawalStrategy = safeMapById(scenario.expenseWithdrawalStrategy, investments, "Withdrawal Strategy Investment", "investment collection");
  const spendingStrategy = safeMapById(scenario.spendingStrategy, curExpenseEvent, "Spending Strategy Expense", "expense collection");

  const investStrategy = investEvent.filter(
    (invest) => scenario.investEventSeries.includes(invest._id) && invest.startYear?.calculated <= year && year <= invest.startYear?.calculated + invest.duration?.calculated
  );

  //console.log("helper invest strategy: " + investStrategy);
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

function formatToNumber(obj) {
  const numberFields = new Set([
    "initialAmount",
    "userPercentage",
    "value",
    "calculated",
    "min",
    "max",
    "amount",
    "mean",
    "stdDev",
    "expenseRatio",
    "maxCash",
    "purchasePrice",
    "fixedPercentages",
    "initialPercentages",
    "finalPercentages",
    "fixedPercentages",
    "initialPercentages",
    "finalPercentages",
    "range",
    "userPercentage",
    "lower",
    "upper",
    "steps",
    "fixedAge",
    "startYear",
    "endYear",
    "fixedRate",
    "birthYearUser",
    "financialGoal",
    "irsLimit",
    "birthYearSpouse",
  ]);

  //'fixedPercentages', 'initialPercentages', 'finalPercentages'
  const booleanFields = new Set(["inflationAdjustment", "isSocialSecurity", "isDiscretionary", "enabled"]);

  function recurse(o) {
    if (Array.isArray(o)) {
      return o.map(recurse);
    } else if (o && typeof o === "object") {
      for (const key in o) {
        if (numberFields.has(key)) {
          if (typeof o[key] === "object" && o[key] !== null) {
            // Map-like object: convert all values
            for (const subKey in o[key]) {
              const num = Number(o[key][subKey]);
              if (!isNaN(num)) o[key][subKey] = num;
            }
          } else {
            const num = Number(o[key]);
            if (!isNaN(num)) o[key] = num;
          }
        } else if (booleanFields.has(key)) {
          o[key] = o[key] === "true";
        } else if (typeof o[key] === "object" && o[key] !== null) {
          o[key] = recurse(o[key]); // recurse deeper
        }
      }
    }
    return o;
  }

  return recurse(obj);
}

module.exports = {
  getCurrentEvent,
  getStrategy,
  getRebalanceStrategy,
  setValues,
  randomNormal,
  randomUniform,
  formatToNumber,
  setGlobalRand,
  mulberry32,
};
