
import { saveAs } from "file-saver";
import yaml from "js-yaml";


const invesmentIdtoNameMap = {};


/**
 * Converts a generic distribution object into a standardized internal format.
 * Supports fixed, normal, and uniform distributions with appropriate defaults.
 */
function buildDistribution(dist) {
  if (dist.type === "fixed") {
    return { type: "fixed", value: parseFloat(dist.value) || 0 };
  } else if (dist.type === "normal") {
    return {
      type: "normal",
      mean: parseFloat(dist.mean) || 0,
      stdev: parseFloat(dist.stdDev) || 0,
    };
  } else if (dist.type === "uniform") {
    return {
      type: "uniform",
      lower: parseFloat(dist.lower) || 0,
      upper: parseFloat(dist.upper) || 0,
    };
  }
  // Fallback to a fixed zero value if the distribution type is unrecognized
  return { type: "fixed", value: 0 };
}

/**
 * Resolves a MongoDB ObjectId for an investment type to its human-readable name.
 * Falls back to the raw ID if a match is not found.
 */
function resolveInvestmentTypeName(id, investmentTypes) {
  const match = investmentTypes.find(t => t._id === id);
  return match ? match.name : id;
}

/**
 * Constructs a readable label for an investment, combining its type and tax status.
 *  Example: "S&P 500 pre-tax"
 * It also stores a mapping of ids to name ids called invesmentIdtoNameMap
 */
function buildReadableInvestmentId(investment, investmentTypes) {
  const name = resolveInvestmentTypeName(investment.investmentType, investmentTypes);
  const nameId = `${name} ${investment.accountTaxStatus}`;
  invesmentIdtoNameMap[investment._id] = nameId;
  return nameId;
}

/**
 * Converts a start or duration field into a normalized internal format.
 * Supports fixed values, distributions (normal/uniform), and references to events.
 */
function convertStartOrDuration(field, idToNameMap) {
  if (field.type === "same" || field.type === "after") {
    console.log("ID: " + field.refer);
    console.log(idToNameMap);
  }
  
  if (!field || !field.type) { return { type: "fixed", value: 0 }; }  // Default for undefined or malformed input

  const { type, value, mean, stdDev, min, max, refer } = field;

  if (type === "fixedAmt" || type === "fixed") {
    return { type: "fixed", value: parseFloat(value) };
  } else if (type === "normal") {
    return { type: "normal", mean: parseFloat(mean), stdev: parseFloat(stdDev) };
  } else if (type === "uniform") {
    return { type: "uniform", lower: parseFloat(min), upper: parseFloat(max) };
  } else if (type === "same") {
    return { type: "startWith", eventSeries: idToNameMap[refer] || "Not Found" };
  } else if (type === "after") {
    return { type: "startAfter", eventSeries: idToNameMap[refer] || "Not Found" }; 
  }

  // Fallback for unrecognized types
  return { type: "fixed", value: 0 };
}

/**
 * Converts an annual change object into a normalized format with distribution info.
 * Supports both amount and percent-based changes, with optional variability.
 */
function convertAnnualChange(change) {
  if (!change || !change.type) {
    return {
      changeAmtOrPct: "amount",
      changeDistribution: { type: "fixed", value: 0 },
    };
  }

  const { type, amount, distribution, mean, stdDev, min, max } = change;
  const changeAmtOrPct = type === "percent" ? "percent" : "amount";

  // Default to fixed change unless a distribution is specified
  let changeDistribution = { type: "fixed", value: parseFloat(amount) || 0 };
  
  if (distribution === "normal") {
    changeDistribution = {
      type: "normal",
      mean: parseFloat(mean),
      stdev: parseFloat(stdDev),
    };
  } else if (distribution === "uniform") {
    changeDistribution = {
      type: "uniform",
      lower: parseFloat(min),
      upper: parseFloat(max),
    };
  }

  return { changeAmtOrPct, changeDistribution };
}

/**
 * Converts investment allocation keys (raw MongoDB ObjectIds) to user-friendly strings.
 * This makes allocation maps easier to read in a UI or exported format.
 */
function convertAllocationKeys(allocationObj, currInvestments, currInvestmentTypes) {
  if (!allocationObj) return {};

  const result = {};
  for (const rawId in allocationObj) {
    const inv = currInvestments.find(i => i._id === rawId);
    const readableId = inv ? buildReadableInvestmentId(inv, currInvestmentTypes) : rawId;
    result[readableId] = allocationObj[rawId];
  }
  return result;
}



export function exportToYAML({
  currScenario,
  currInvestmentTypes,
  currInvestments,
  currIncome,
  currExpense,
  currInvest,
  currRebalance,
}) {
  const {
    setOfInvestmentTypes,
    setOfInvestments,
    incomeEventSeries,
    expenseEventSeries,
    investEventSeries,
    rebalanceEventSeries,
    _id,
    __v,
    ...filteredScenario
  } = currScenario;

  const eventSeriesIdtoNameMap = Object.fromEntries([...(currIncome || []), ...(currExpense || []), ...(currInvest || []), ...(currRebalance || [])].map(e => [e._id, e.eventSeriesName]));

  const yamlObject = {
    name: filteredScenario.name || "Retirement Planning Scenario",
    maritalStatus: filteredScenario.filingStatus === "single" ? "individual" : "couple",
    birthYears: [filteredScenario.birthYearUser, filteredScenario.birthYearSpouse],
    lifeExpectancy: [filteredScenario.lifeExpectancy, filteredScenario.lifeExpectancySpouse],
    investmentTypes: currInvestmentTypes.map(t => ({
      name: t.name,
      description: t.description,
      returnAmtOrPct: t.annualReturn.unit,
      returnDistribution: buildDistribution(t.annualReturn),
      expenseRatio: parseFloat(t.expenseRatio),
      incomeAmtOrPct: t.annualIncome.unit,
      incomeDistribution: buildDistribution(t.annualIncome),
      taxability: t.taxability,
    })),
    investments: currInvestments.map(inv => {
      const name = resolveInvestmentTypeName(inv.investmentType, currInvestmentTypes);
      const readableId = buildReadableInvestmentId(inv, currInvestmentTypes);
      return {
        investmentType: name,
        value: inv.value,
        taxStatus: inv.accountTaxStatus,
        id: readableId,
      };
    }),
    eventSeries: [
      ...(currIncome || []).filter(e => e?.startYear && e?.duration).map(e => {
        const { changeAmtOrPct, changeDistribution } = convertAnnualChange(e.annualChange);
        return {
          name: e.eventSeriesName,
          start: convertStartOrDuration(e.startYear, eventSeriesIdtoNameMap),
          duration: convertStartOrDuration(e.duration),
          type: "income",
          initialAmount: parseFloat(e.initialAmount),
          changeAmtOrPct,
          changeDistribution,
          inflationAdjusted: e.inflationAdjustment,
          userFraction: parseFloat(e.userPercentage),
          socialSecurity: e.isSocialSecurity,
        };
      }),
      ...(currExpense || []).filter(e => e?.startYear && e?.duration).map(e => {
        const { changeAmtOrPct, changeDistribution } = convertAnnualChange(e.annualChange);
        return {
          name: e.eventSeriesName,
          start: convertStartOrDuration(e.startYear, eventSeriesIdtoNameMap),
          duration: convertStartOrDuration(e.duration),
          type: "expense",
          initialAmount: parseFloat(e.initialAmount),
          changeAmtOrPct,
          changeDistribution,
          inflationAdjusted: e.inflationAdjustment,
          userFraction: parseFloat(e.userPercentage),
          discretionary: e.isDiscretionary,
        };
      }),
      ...(currInvest || []).filter(e => e?.startYear && e?.duration && e?.assetAllocation).map(e => {
        const isGlide = e.assetAllocation.type === "glidePath";
        const allocation = convertAllocationKeys(
          isGlide ? e.assetAllocation.initialPercentages ?? {} : e.assetAllocation.fixedPercentages ?? {},
          currInvestments,
          currInvestmentTypes
        );
    
        const allocation2 = isGlide
          ? convertAllocationKeys(e.assetAllocation.finalPercentages ?? {}, currInvestments, currInvestmentTypes)
          : undefined;
        
        return {
          name: e.eventSeriesName,
          start: convertStartOrDuration(e.startYear, eventSeriesIdtoNameMap),
          duration: convertStartOrDuration(e.duration),
          type: "invest",
          assetAllocation: allocation,
          ...(isGlide && { glidePath: true }),
          ...(isGlide && { assetAllocation2: allocation2 }),
          ...(e.maxCash !== undefined && { maxCash: parseFloat(e.maxCash) }),
        };
      }),
      ...(currRebalance || []).filter(e => e?.startYear && e?.duration && e?.rebalanceAllocation).map(e => {
        const isGlide = e.rebalanceAllocation.type === "glidePath";
        const allocation = convertAllocationKeys(
          isGlide ? e.rebalanceAllocation.initialPercentages ?? {} : e.rebalanceAllocation.fixedPercentages ?? {},
          currInvestments,
          currInvestmentTypes
        );
    
        const allocation2 = isGlide
          ? convertAllocationKeys(e.rebalanceAllocation.finalPercentages ?? {}, currInvestments, currInvestmentTypes)
          : undefined;
        
        return {
          name: e.eventSeriesName,
          start: convertStartOrDuration(e.startYear, eventSeriesIdtoNameMap),
          duration: convertStartOrDuration(e.duration),
          type: "rebalance",
          assetAllocation: allocation,
          ...(isGlide && { glidePath: true }),
          ...(isGlide && { assetAllocation2: allocation2 }),
        };
      })
    ],
    inflationAssumption: filteredScenario.inflationAssumption,
    afterTaxContributionLimit: filteredScenario.irsLimits?.initialAfterTax || 7000,
    spendingStrategy: (filteredScenario.spendingStrategy || []).map(id => {
      const match = currExpense.find(e => e._id === id);
      return match ? match.eventSeriesName : id;
    }),      
    expenseWithdrawalStrategy: (filteredScenario.expenseWithdrawalStrategy || []).map(id => {
      // const inv = currInvestments.find(i => i._id === id);
      // return inv ? buildReadableInvestmentId(inv, currInvestmentTypes) : id;
      return invesmentIdtoNameMap[id] || "Not Found";
    }),
    RMDStrategy: (filteredScenario.rmdStrategy || []).map(id => {
      // const inv = currInvestments.find(i => i._id === id);
      // return inv ? buildReadableInvestmentId(inv, currInvestmentTypes) : id;
      return invesmentIdtoNameMap[id] || "Not Found";
    }),
    RothConversionOpt: filteredScenario.optimizerSettings?.enabled || false,
    RothConversionStart: filteredScenario.optimizerSettings?.startYear,
    RothConversionEnd: filteredScenario.optimizerSettings?.endYear,
    RothConversionStrategy: (filteredScenario.rothConversionStrategy || []).map(id => {
      // const inv = currInvestments.find(i => i._id === id);
      // return inv ? buildReadableInvestmentId(inv, currInvestmentTypes) : id;
      return invesmentIdtoNameMap[id] || "Not Found";
    }),
    financialGoal: filteredScenario.financialGoal,
    residenceState: filteredScenario.stateResident || "NY",
  };

  const yamlStr = yaml.dump(yamlObject, { lineWidth: -1 });
  const fileName = `${currScenario.name?.replace(/\s+/g, "_").toLowerCase() || "scenario"}.yaml`;
  const blob = new Blob([yamlStr], { type: "text/yaml;charset=utf-8" });
  saveAs(blob, fileName);
}