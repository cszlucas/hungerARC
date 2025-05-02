function generateParameterCombinations(explorations) {
  const ranges = explorations.map((e) => {
    const lower = Number(e.range.lower);
    const upper = Number(e.range.upper);
    const step = Number(e.range.steps);
    const values = [];

    for (let val = lower; val <= upper; val += step) {
      values.push(val);
    }

    return values;
  });

  // Cartesian product of all ranges
  return cartesianProduct(...ranges);
}

function cartesianProduct(...arrays) {
  return arrays.reduce((acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])), [[]]);
}

function getEvent(dataArray, data) {
  return dataArray.find((event) => event._id === data._id);
}

function scenarioExplorationUpdate(foundData, parameter, value) {
  for (let d = 0; d < parameter.length; d++) {
    if (parameter[d] == "Start Year") {
      foundData[d].startYear.calculated = value[d];
    } else if (parameter[d] == "Duration") {
      foundData[d].duration.calculated = value[d];
    } else if (parameter[d] == "Initial Amount") {
      foundData[d].initialAmount = value[d];
    } else if (parameter[d] == "Asset Allocation") {
      const allocation = foundData[d].assetAllocation;

      if (allocation.fixedPercentages && allocation.fixedPercentages.length !== 0) {
        allocation.fixedPercentages[0].value = value[d];
        allocation.fixedPercentages[1].value = 100 - allocation.fixedPercentages[0].value;
      } else if (allocation.initialPercentages && Object.keys(allocation.initialPercentages).length !== 0) {
        const keys = Object.keys(allocation.initialPercentages);
        const v = value[d]; 

        allocation.initialPercentages[keys[0]] = v;
        allocation.initialPercentages[keys[1]] = 1 - v;
      }
    }
  }
}

module.exports = { getEvent, scenarioExplorationUpdate, generateParameterCombinations };
