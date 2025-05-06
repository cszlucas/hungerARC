const fs = require("fs");
const path = require("path");
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const timestamp = new Date();
const { log, logFile }= createLogger();

function formatCurrency(val) {
  if (typeof val === "number") {
    return `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  } else {
    return val ?? "";
  }
}
function writeCSVLog(csvFilename, simulationResult) {
  const years = simulationResult.years; // array of years like [2025, 2026,...]
  const firstYearData = simulationResult[0]; // assuming it's not empty
  // console.log("simulationResult");
  console.log("first year data: ");
  console.dir(firstYearData, { depth: null, colors: true });

  // const investments = Object.keys(firstYearData).filter((key) => key !== "year");
  // console.log("investments :>> ", investments);
  // // const investments = simulationResult.investments; // ['IRA', '401k', 'Roth']
  // const valuesByYear = simulationResult; // assume array of {year: 2025, IRA: 1000, 401k: 2000, Roth: 500}

  // const header = ["Year", ...investments].join(",");
  // const rows = valuesByYear.map((entry) => [entry.year, ...investments.map((inv) => entry[inv])].join(","));

  // const fullCSV = [header, ...rows].join("\n");
  // fs.writeFileSync(csvFilename, fullCSV, "utf8");
   // Step 1: Gather all investment names across years
   const investmentNames = new Set();
   for (const yearData of firstYearData) {
     const flatInvestments = (yearData.investments || []).flat();
     flatInvestments.forEach((inv) => {
       if (inv?.name) investmentNames.add(inv.name);
     });
   }
   const headers = ["Year", ...Array.from(investmentNames)];
 
   // Step 2: Build rows
   const rows = firstYearData.map((yearData) => {
     const row = { Year: yearData.year };
     const flatInvestments = (yearData.investments || []).flat();
 
     for (const name of investmentNames) {
      //  const sum = flatInvestments
      //    .filter((inv) => inv.name === name)
      //    .reduce((total, inv) => total + (formatCurrency(inv.value) || 0), 0);
      //  row[name] = sum;
      const investment = flatInvestments.find((inv) => inv.name === name);
      const value = investment?.value ?? 0;
      row[name] = `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
     }
 
     return headers.map((h) => row[h] ?? 0).join(",");
   });
 
   const fullCSV = [headers.join(","), ...rows].join("\n");
   fs.writeFileSync(csvFilename, fullCSV, "utf8");
}
function writeEventLog(logFilename, simulationResult){
}

//function writeEventLog(logFilename, simulationResult) {}

function logInvestment(investments, year, csvLog, investmentTypes) {
  const csvRow = { year };
  for (const inv of investments) {
    const type = investmentTypes.find((type) => type._id === inv.investmentType);
    //   console.log('inv :>> ', inv);
    const columnName = type.name;
    csvRow[columnName] = inv.value;
  }
  csvLog.push(csvRow);
  // console.log('csvLog :>> ', csvLog);
}

function createLogger(timestamp = new Date()) {
  const datetime = timestamp.toISOString().replace(/[:.]/g, '-');
  const filename = `user_${datetime}.log`;
  const logFile = path.join(logDir, filename);

  function log(message) {
    const entry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logFile, entry, 'utf8');
  }

  return { log, logFile };
}


function logFinancialEvent({ year, type, description, amount, details = {} }) {
  // console.log('INCOME TESTING :>> ');
  // console.log('type :>> ', type);
  // console.log('description :>> ', description);

  let line = `[${year}] ${type.toUpperCase()} | `;

  if (amount !== undefined) {
    const formattedAmount = typeof amount === "number" ? `$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : amount;
    line += ` - ${formattedAmount}.`;
  }


  switch (type.toLowerCase()) {
    case "income":
      line += formatIncome(details, amount, description);
      break;
    case "invest": {
      line += formatStrategy(description, details, "invest");
      break;
    }
    case "investment": {
      line += formatInvestment(description, details);
      break;
    }
    case "roth conversion": {
      if (details.from && details.to) {
        line += ` of "${details.from}" to "${details.to}"`;
      }
      line += formatRoth(description, details);
      break;
    }
    case "rebalance": {
      line += formatStrategy(description, details, "rebalance");
      break;
    }
    case "rmd": {
      const rmdAmount = details.amount ?? amount;

      const formatDollar = (val) => (typeof val === "number" ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : val ?? "");

      let formattedAmount = formatDollar(rmdAmount);

      if (formattedAmount) line += `RMD amount - ${formattedAmount}. `;
      if (details.incomeAmount!=undefined) line += `Previous year's income amount - ${formatDollar(details.incomeAmount)} `;
      if (details.userAge) line += `at age ${details.userAge}`;
      if (details.amountTransfer!=undefined) {
        line += `Transferred "${details.amountTransfer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}" from pretax investment to non-retirement. `;
      }
      line += formatStrategy(description, details, "rmd");

      if (details.nonRetirementInvestmentID) {
        line += `[nonRetirementInvestment ID: ${details.nonRetirementInvestmentID}]`;
      }

      break;
    }
    case "discretionary":
    case "non-discretionary": {
      line += formatNonDiscretionaryDetails(details, amount, description);
      break;
    }
    case "simulationinfo": {
      if (description) line += `${description}`;
      break;
    }
    default:
      if (Object.keys(details).length) {
        line += ` - Details: ${JSON.stringify(details)}`;
      }
  }

  // Add a newline and write to file
  fs.appendFileSync(logFile, line + "\n", "utf8");
}

function formatIncome(details, amount, description = "") { 
  // details: {
  //   type: detailsType,
  //   ID: e._id,
  //   name: e.eventSeriesName,
  //   value: e.initialAmount
  let line = "";
  const formatCurrency = (val) => (typeof val === "number" ? `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : val ?? "");

  if (description) line += `${description}`;
  // console.log('description :>> ', description);
  // console.log('detail :>> ', details);
  if (Object.keys(details).length > 0){ 
    line += ` Name: ${details.name}, ID: ${details.ID},  Value: ${formatCurrency(details.value)}.`;
  }
  // console.log('line :>> ', line);
  return line;
}

function formatInvestment(description, details){
  let line = "";
  const formatCurrency = (val) => (typeof val === "number" ? `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : val ?? "");

  if (description) line += `${description}`;
  if (Object.keys(details).length > 0){ 
    if(details.type == "investments"){
      line += `Investment ID: ${details.ID}, value: ${formatCurrency(details.value)}, taxType: ${details.taxStatus}.`;
    } else if(details.type == "curYearIncome"){
      line += `${details.type.toUpperCase()} | Investment ID: ${details.ID}, taxType: ${details.taxStatus}.`;
    }
  }
  // console.log('line :>> ', line);
  return line;
}

function formatRoth(description, details) {
  let line = "";
  if (description) line += `${description}`;
  return line;
}

function formatNonDiscretionaryDetails(details, amount, description = "") {
  const expenseAmount = details.amount ?? amount;

  const formatCurrency = (val) => (typeof val === "number" ? `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : val ?? "");

  let line = "";

  const formattedAmount = formatCurrency(expenseAmount);
  if (description) line += `${description}.`;
  if (formattedAmount) line += `Amount you need to pay in Non-discretionary expenses - ${formattedAmount}.`;

  if (details.taxes!=undefined) {
    line += `Amount owed in taxes: "${formatCurrency(details.taxes)}"`;
  }
  if (details.cash != undefined) {
    line += `Amount of cash you have to spend: "${formatCurrency(details.cash)}".`;
  }
  if (details.investmentID) {
    line += `Investment to withdraw from ID "${details.investmentID}" with value "${formatCurrency(details.investmentValue)}".`;
  }
  if (details?.type && details?.ID && details?.value!=undefined) {
    const valueFormatted = formatCurrency(details.value);
    line += ` ${details.type.toUpperCase()} ID: ${details.ID} | Value: ${valueFormatted}`;
    if(details.taxStatus!=undefined){
      line+=` type: ${details.taxStatus}`;
    }
  }
  return line;
}

function formatStrategy(description, details, type) {
  let line = "";
  //console.log("DETAILS: ", details, type);
  const formatCurrency = (val) => (typeof val === "number" ? `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : val ?? "");
  const formatPercentage = (val) => `${(val * 100).toFixed(2)}%`;
  if (description) line += `${description}`;
  if (details.cash!=undefined) {
    line += `Amount of cash you have to spend: "${formatCurrency(details.cash)}".`;
  }
  if (details.excessCash!=undefined) {
    line += `Excess cash: "${formatCurrency(details.excessCash)}".`;
  }
  if (details.maxCash!=undefined) {
    line += `Maximum cash to keep: "${formatCurrency(details.maxCash)}".`;
  }
  if (details.irsLimit!=undefined) {
    line += `IRS Limit: "${formatCurrency(details.irsLimit)}".`;
  }
  if (details.afterTaxRatio!=undefined) {
    line += `After tax ratio: ${details.afterTaxRatio}.`;
  }
  if (details.type === "initial") {
    line += `Initial investment ID: ${details.ID}, percentage: ${formatPercentage(details.value)}.`;
  } else if (details.type === "final") {
    line += `Final investment ID: ${details.ID}, percentage: ${formatPercentage(details.value)}.`;
  } else if (details.type === "fixed") {
    line += `Fixed investment ID: ${details.ID}, percentage: ${formatPercentage(details.value)}.`;
  } else if (details.type === "calculated") {
    line += `Glide path calculated investment ID: ${details.ID}, percentage: ${formatPercentage(details.value)}. Glide path started year: ${details.start} and ends in year: ${details.end}`;
  } else if (details.type === "investments" && details.value != undefined) {
    line += `${details.type.toUpperCase()} | Investment ID: ${details.ID}, value: ${formatCurrency(details.value)}, taxType: ${details.taxStatus}.`;
  } else if (details.type === "investments" && details.purchasePrice != undefined) {
    line += `${details.type.toUpperCase()} | ${details.taxStatus} Investment ID: ${details.ID}, purchased: ${formatCurrency(details.purchasePrice)}.`;
  } else if (details.taxStatus) {
    line += `The investments are of type: ${details.taxStatus}`;
  }

  return line;
}

function printInvestments(investments, year, type, detailsType) {
  if (investments.length == 0) {
    logFinancialEvent({
      year: year,
      type: type,
      description: "There are no more investments of this strategy.",
    });
  } else {
    for (const investment of investments) {
      logFinancialEvent({
        year: year,
        type: type,
        details: {
          type: detailsType,
          ID: investment._id,
          value: investment.value,
          taxStatus: investment.accountTaxStatus,
        },
      });
    }
  }
}


function printIncomeEvents(events, year, type, detailsType, inflationRate, spouseDeath) {
  console.log('INCOME LOG events :>> ', events);
  if (events.length == 0) {
    logFinancialEvent({
      year: year,
      type: type,
      description: `There are no more events of type ${type} this year.`,
    });
  } else {
    for (e of events) {
      logFinancialEvent({
        year: year,
        type: type,
        details: {
          type: detailsType,
          ID: e._id,
          name: e.eventSeriesName,
          value: e.initialAmount
        },
      });
    }
  }
}

function printEvents(events, year, type, detailsType, inflationRate, spouseDeath) {
  if (events.length == 0) {
    logFinancialEvent({
      year: year,
      type: type,
      description: `There are no more events of type ${type} this year.`,
    });
  } else {
    for (e of events) {
      logFinancialEvent({
        year: year,
        type: type,
        details: {
          type: detailsType,
          ID: e._id,
          value: e.initialAmount,
          // value: getValueInYear(e, year, inflationRate, spouseDeath),
        },
      });
    }
  }
}

function printStrategy(allocations, type, year, calculated, start, end) {
  //console.log("ALLOCATIONS ..", allocations);

  const logDetails = (subType, key, value) =>
    logFinancialEvent({
      year: year,
      type: type,
      details: { type: subType, ID: key, value: value, start: start, end: end },
    });

  if (calculated) {
    Object.entries(allocations).forEach(([key, value]) => {
      logDetails("calculated", key, value);
    });
  } else if (allocations.type === "glidePath") {
    Object.entries(allocations.initialPercentages).forEach(([key, value]) => {
      logDetails("initial", key, value);
    });

    Object.entries(allocations.finalPercentages).forEach(([key, value]) => {
      logDetails("final", key, value);
    });
  } else if (allocations.fixedPercentages && Object.keys(allocations.fixedPercentages).length > 0) {
    Object.entries(allocations.fixedPercentages).forEach(([key, value]) => {
      logDetails("fixed", key, value);
    });
  }
}

module.exports = {
  writeCSVLog,
  writeEventLog,
  logInvestment,
  logFinancialEvent,
  printInvestments,
  printEvents,
  printIncomeEvents,
  printStrategy,
  createLogger,
};
