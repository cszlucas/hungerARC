import { updateYearDataBucket, createYearDataBuckets } from "./charts.js";
import { performRMDs } from "./rmd.js";
import { payNonDiscretionaryExpenses, payDiscretionaryExpenses } from "./expenses.js";
import { runInvestStrategy, rebalance } from "./strategy.js";
import { getCurrentEvent, getStrategy, getRebalanceStrategy, setValues } from "./helper.js";
import { logInvestment } from "./logs.js";
import {
  findInflation,
  updateInvestmentValues,
  updateInflationExpenses,
  updateIncomeEvents,
  updateFedIncomeTaxBracket,
  updateStateIncomeTaxBracket,
  rothConversion,
  updateCapitalGains,
  updateFedDeduction,
} from "./algo.js";
import { getValueInYear } from "./value.js";

async function runSimulation(
  scenario,
  tax,
  stateTax,
  startYearPrev,
  lifeExpectancyUser,
  lifeExpectancySpouse,
  investments,
  incomeEvent,
  expenseEvent,
  investEvent,
  rebalanceEvent,
  investmentTypes,
  csvLog,
  eventLog
) {
  // previous year
  let irsLimit = scenario.irsLimit;
  let filingStatus = scenario.filingStatus;
  let spouseDeath = false;
  let state = scenario.stateResident;
  let federalIncomeTax, stateIncomeTaxBracket, fedDeduction, stateDeduction, capitalGains;
  // previous year's tax
  if (filingStatus == "single") {
    federalIncomeTax = tax.single.federalIncomeTaxRatesBrackets;
    fedDeduction = tax.single.standardDeductions;
    capitalGains = tax.single.capitalGainsTaxRates;
    if (stateTax) {
      stateIncomeTaxBracket = stateTax.taxDetails[startYearPrev].single.stateIncomeTaxRatesBrackets;
      // stateDeduction = stateTax.taxDetails[prevYear].single.standardDeduction;
    }
  } else {
    federalIncomeTax = tax.married.federalIncomeTaxRatesBrackets;
    fedDeduction = tax.married.standardDeductions;
    capitalGains = tax.married.capitalGainsTaxRates;
    if (stateTax) {
      stateIncomeTaxBracket = stateTax.taxDetails[startYearPrev].single.stateIncomeTaxRatesBrackets;
      // stateDeduction = stateTax.taxDetails[prevYear].single.standardDeduction;
    }
  }
  //console.log("capitalGains :>> ", capitalGains);
  let currentYear = new Date().getFullYear();
  let userEndYear = scenario.birthYearUser + lifeExpectancyUser;
  // //save initial value and purchase price of investments
  for (let invest of investments) {
    invest.purchasePrice = invest.value;
  }

  setValues([...incomeEvent, ...expenseEvent, ...investEvent, ...rebalanceEvent]);
  // console.log("incomeEvent :>> ", incomeEvent);
  // console.log("expenseEvent :>> ", expenseEvent);
  // console.log("investEvent :>> ", investEvent);
  // console.log("rebalanceEvent :>> ", rebalanceEvent);
  let sumInvestmentsPreTaxRMD = 0;
  let yearTotals = {
    curYearGains: 0,
    curYearSS: 0,
    curYearIncome: 0,
    curYearEarlyWithdrawals: 0,
  };
  let prevYearIncome = 0;
  let prevYearSS = 0;
  let prevYearEarlyWithdrawals = 0;
  let prevYearGains = 0;
  console.log('investmentTypes :>> ', investmentTypes);
  let cashInvestmentType = investmentTypes.find((inv) => inv.name === "Cash");
  console.log("CASH INVESTMENT TYPE: ", cashInvestmentType);
  console.log('investments :>> ', investments);
  let cashInvestment;
  if (cashInvestmentType) {
    let cashId = cashInvestmentType._id;
    cashInvestment = investments.find((inv) => inv.investmentType === cashId);
    clog("CASH INVESTMENT: ", cashInvestment);
  }

  let yearDataBuckets = createYearDataBuckets(3); //2 is numYears
  let yearIndex = 0;

  //  // SIMULATION LOOP
  // manually adjusted for testing, should be year <= userEndYear !!
  for (let year = currentYear; year <= 2027; year++) {
    console.log("\nSIMULATION YEAR", year);
    if (filingStatus == "married") {
      if (year == scenario.birthYearSpouse + lifeExpectancySpouse) {
        spouseDeath = true;
        filingStatus = "single";
        federalIncomeTax = tax.single.federalIncomeTaxRatesBrackets;
        fedDeduction = tax.single.standardDeductions;
        capitalGains = tax.single.capitalGainsTaxRates;
        if (stateTax) {
          stateIncomeTaxBracket = stateTax.taxDetails[startYearPrev].single.stateIncomeTaxRatesBrackets;
          // stateDeduction = stateTax.taxDetails[prevYear].single.standardDeduction;
        }
      }
    }
    let inflationRate = findInflation(scenario.inflationAssumption) * 0.01;
    let { curIncomeEvent, curExpenseEvent, curInvestEvent, curRebalanceEvent } = getCurrentEvent(year, incomeEvent, expenseEvent, investEvent, rebalanceEvent);
    let { RMDStrategyInvestOrder, withdrawalStrategy, spendingStrategy, investStrategy } = getStrategy(scenario, investments, curExpenseEvent, curInvestEvent, year);

    // RUN INCOME EVENTS
    updateIncomeEvents(incomeEvent, year, userEndYear, inflationRate, filingStatus, scenario, yearTotals, cashInvestment, curIncomeEvent, spouseDeath);
    console.log("after running income event, the curYearIncome is", yearTotals.curYearIncome);

    // PERFORM RMD FOR PREVIOUS YEAR
    const userAge = year - scenario.birthYearUser;
    if (sumInvestmentsPreTaxRMD > 0) {
      await performRMDs(investments, yearTotals, userAge, RMDStrategyInvestOrder, sumInvestmentsPreTaxRMD, year);
    }
    sumInvestmentsPreTaxRMD = 0;

    //  UPDATE INVESTMENT VALUES
    updateInvestmentValues(investments, investmentTypes, yearTotals);

    // find all the investment objects by the roth conversion strategy ids
    let rothConversionStrategyInvestments = [];
    for (let investment of scenario.rothConversionStrategy) {
      let foundInvestment = investments.find((inv) => inv._id === investment);
      if (foundInvestment) {
        rothConversionStrategyInvestments.push(foundInvestment);
      }
    }
    // RUN ROTH CONVERSION IF ENABLED
    if (scenario.optimizerSettings.enabled && year >= scenario.optimizerSettings.startYear && year <= scenario.optimizerSettings.endYear) {
      rothConversion(scenario, year, yearTotals, federalIncomeTax, investmentTypes, investments, rothConversionStrategyInvestments, fedDeduction);
    }

    // account for inflation for expenses that are not in the current year
    updateInflationExpenses(curExpenseEvent, expenseEvent, inflationRate);

    //  PAY NON-DISCRETIONARY EXPENSES AND PREVIOUS YEAR TAXES
    let { nonDiscretionary, taxes } = payNonDiscretionaryExpenses(
      curExpenseEvent,
      cashInvestment,
      prevYearIncome,
      prevYearSS,
      prevYearGains,
      prevYearEarlyWithdrawals,
      federalIncomeTax,
      stateIncomeTaxBracket,
      fedDeduction,
      year,
      userAge,
      capitalGains,
      withdrawalStrategy,
      yearTotals,
      inflationRate,
      spouseDeath
    );

    // PAY DISCRETIONARY EXPENSES
    if (spendingStrategy && spendingStrategy.length != 0) {
      payDiscretionaryExpenses(scenario.financialGoal, cashInvestment, year, userAge, spendingStrategy, withdrawalStrategy, yearTotals, inflationRate, spouseDeath);
    }

    const discretionary = curExpenseEvent.filter((expenseEvent) => expenseEvent.isDiscretionary === true);

    // RUN INVEST EVENT
    if (investStrategy && investStrategy.length != 0) {
      runInvestStrategy(cashInvestment, irsLimit, year, investments, investStrategy);
    }

    // RUN REBALANCE EVENT
    let types = ["pre-tax", "after-tax", "non-retirement"];
    for (let type of types) {
      let rebalanceStrategy = getRebalanceStrategy(scenario, curRebalanceEvent, type, year);
      // console.log('curRebalanceEvent :>> ', curRebalanceEvent);
      if (rebalanceStrategy && rebalanceStrategy.length != 0) {
        rebalance(investments, year, rebalanceStrategy, userAge, yearTotals, type);
      } else {
        console.log("Nothing to rebalance of type: ", type);
      }
    }

    // PRELIMINARIES
    // can differ each year if sampled from distribution
    preliminaries(federalIncomeTax, inflationRate, fedDeduction, capitalGains, stateTax, filingStatus, tax, irsLimit, stateIncomeTaxBracket, startYearPrev);

    // CHARTS
    updateChart(yearDataBuckets, yearIndex, investments, investmentTypes, curIncomeEvent, discretionary, nonDiscretionary, taxes, yearTotals, year, inflationRate, spouseDeath);

    // SAVE FOR PREV YEAR
    ({ prevYearIncome, prevYearSS, prevYearEarlyWithdrawals, prevYearGains, sumInvestmentsPreTaxRMD } = savePrevYr(
      investments,
      investmentTypes,
      year,
      csvLog,
      yearTotals,
      prevYearIncome,
      prevYearSS,
      prevYearEarlyWithdrawals,
      prevYearGains,
      sumInvestmentsPreTaxRMD
    ));
    yearIndex++;
  }
  // console.log('yearDataBuckets :>> ', yearDataBuckets);
  return yearDataBuckets;
}

function preliminaries(federalIncomeTax, inflationRate, fedDeduction, capitalGains, stateTax, filingStatus, tax, irsLimit, stateIncomeTaxBracket, startYearPrev) {
  // can differ each year if sampled from distribution
  federalIncomeTax = updateFedIncomeTaxBracket(federalIncomeTax, inflationRate);
  fedDeduction = updateFedDeduction(fedDeduction, inflationRate);
  capitalGains = updateCapitalGains(capitalGains, inflationRate);
  if (stateTax) {
    updateStateIncomeTaxBracket(stateIncomeTaxBracket, inflationRate);
  }

  // adjust for inflation for single if filed jointly
  if (filingStatus == "married") {
    updateFedIncomeTaxBracket(tax.single.federalIncomeTaxRatesBrackets, inflationRate);
    updateFedDeduction(tax.single.standardDeductions, inflationRate);
    updateCapitalGains(tax.single.capitalGainsTaxRates, inflationRate);
    if (stateTax) {
      updateStateIncomeTaxBracket(stateTax.taxDetails[startYearPrev].single.stateIncomeTaxRatesBrackets);
    }
  }
  // retirement account limit
  irsLimit *= 1 + inflationRate;
}

function updateChart(yearDataBuckets, yearIndex, investments, investmentTypes, curIncomeEvent, discretionary, nonDiscretionary, taxes, yearTotals, year, inflationRate, spouseDeath) {
  const lookup = Object.fromEntries(investmentTypes.map((type) => [type._id.toString(), type.name]));

  updateYearDataBucket(yearDataBuckets, yearIndex, {
    investments: investments.map((event) => ({
      name: lookup[event.investmentType.toString()] ? `${lookup[event.investmentType.toString()]} (${event.accountTaxStatus})` : "Unknown",
      value: event.value,
    })),
    income: curIncomeEvent.map((event) => ({
      name: event.eventSeriesName,
      value: getValueInYear(event, year, inflationRate, spouseDeath),
    })),
    discretionary: discretionary.map((event) => ({
      name: event.eventSeriesName,
      value: getValueInYear(event, year, inflationRate, spouseDeath),
    })),
    nonDiscretionary: nonDiscretionary.map((event) => ({
      name: event.eventSeriesName,
      value: getValueInYear(event, year, inflationRate, spouseDeath),
    })),
    taxes: taxes,
    earlyWithdrawals: yearTotals.curYearEarlyWithdrawals,
  });
}

function savePrevYr(investments, investmentTypes, year, csvLog, yearTotals, prevYearIncome, prevYearSS, prevYearEarlyWithdrawals, prevYearGains, sumInvestmentsPreTaxRMD) {
  let allInvestmentsPreTax = investments.filter((investment) => investment.accountTaxStatus.trim().toLowerCase() === "pre-tax");
  for (let preTaxInvestment of allInvestmentsPreTax) {
    sumInvestmentsPreTaxRMD += preTaxInvestment.value;
  }
  //console.log("The sum of investments with value pretax (to use in RMD) is: ", sumInvestmentsPreTaxRMD, "as of year: ", year);

  // console.log('investments :>> ', investments);
  logInvestment(investments, year, csvLog, investmentTypes);
  //console.log("logInvestment :>> ", csvLog, "for year: ", year);
  prevYearIncome = yearTotals.curYearIncome;
  prevYearSS = yearTotals.curYearSS;
  prevYearEarlyWithdrawals = yearTotals.curYearEarlyWithdrawals;
  prevYearGains = yearTotals.curYearGains;
  yearTotals.curYearIncome = 0;
  yearTotals.curYearSS = 0;
  yearTotals.curYearEarlyWithdrawals = 0;
  yearTotals.curYearGains = 0;
  return { prevYearIncome, prevYearSS, prevYearEarlyWithdrawals, prevYearGains, sumInvestmentsPreTaxRMD };
}

export { runSimulation };
