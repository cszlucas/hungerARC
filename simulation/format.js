//This file ensures objects delivered in correct format and for current year. Ex: uniform/normal

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

function startYear(event, relatedEvents) {
  const type = event.startYear.type;

  if (type === "fixedAmt") {
    return event.startYear.year;
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

function setValues(events) {
  //run once per simulation
  for (let event of events) {
    let startYr = startYear(event, events);
    event.startYear.calculated = startYr;
    let dur = duration(event);
    event.duration.calculated = dur;
  }
}

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

function randomNormal(mean, stdDev) {
  // Using Box-Muller Transform
  let u = Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

function randomUniform(min, max) {
  return min + Math.random() * (max - min);
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

function getStrategy(scenario, investments, expenses, investEvent, year, type) {
  // Helper: safely map by ID and filter out unfound items
  const safeMapById = (ids, collection, label) => {
    return ids
      .map((id) => {
        const item = collection.find((entry) => entry._id === id);
        if (!item) {
          console.warn(`Warning: ${label} ID "${id}" not found in collection.`);
        }
        return item;
      })
      .filter(Boolean);
  };

  const RMDStrategyInvestOrder = safeMapById(scenario.rmdStrategy, investments, "RMD Strategy Investment");
  const withdrawalStrategy = safeMapById(scenario.expenseWithdrawalStrategy, investments, "Withdrawal Strategy Investment");
  const spendingStrategy = safeMapById(scenario.spendingStrategy, expenses, "Spending Strategy Expense");

  const investStrategy = investEvent.filter(
    (invest) => scenario.investEventSeries.includes(invest._id) && invest.startYear?.calculated <= year && year <= invest.startYear?.calculated + invest.duration?.calculated
  );

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
