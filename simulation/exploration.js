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

function getEvent(listData, data) {
  const e = listData.find((item) => item._id === data._id);
  if (e) {
    //console.log("Event found:", e);
    return e;
  } else {
    console.log("Event not found.");
    return null;
  }
}

function scenarioExplorationUpdate(foundData, parameter, value) {
  for (let d = 0; d< parameter.length; d++) {
    if (parameter[d] == "Start Year") {
      foundData[d].startYear.calculated += value[d];
    } else if (parameter[d] == "Duration") {
      foundData[d].duration.calculated += value[d];
    } else if (parameter[d] == "Initial Amount") {
      foundData[d].initialAmount += value[d];
    } else if (parameter[d] == "Asset Allocation") {
      if (foundData[d].assetAllocation.fixedPercentages.length != 0) {
        // Fixed allocation
        foundData[d].assetAllocation.fixedPercentages[0].value += value[d];
        foundData[d].assetAllocation.fixedPercentages[1].value += 100 - foundData[d].assetAllocation.fixedPercentages[0].value;
      } else if (foundData[d].assetAllocation.initialPercentages.length != 0) {
        // Glide Path allocation
        foundData[d].assetAllocation.initialPercentages[0].value += value[d];
        foundData[d].assetAllocation.initialPercentages[1].value = 100 - foundData[d].assetAllocation.initialPercentages[0].value;
      }
    }
  }
}

module.exports = { getEvent, scenarioExplorationUpdate, generateParameterCombinations };
