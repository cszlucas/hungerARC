const fs = require("fs");
const path = require("path");
const { getValueInYear } = require("./value.js");

function writeCSVLog(csvFilename, simulationResult) {
  const years = simulationResult.years; // array of years like [2025, 2026,...]
  const firstYearData = simulationResult[0]; // assuming it's not empty
  const investments = Object.keys(firstYearData).filter((key) => key !== "year");
  console.log("investments :>> ", investments);
  // const investments = simulationResult.investments; // ['IRA', '401k', 'Roth']
  const valuesByYear = simulationResult; // assume array of {year: 2025, IRA: 1000, 401k: 2000, Roth: 500}

  const header = ["Year", ...investments].join(",");
  const rows = valuesByYear.map((entry) => [entry.year, ...investments.map((inv) => entry[inv])].join(","));

  const fullCSV = [header, ...rows].join("\n");
  fs.writeFileSync(csvFilename, fullCSV, "utf8");
}
function writeEventLog(logFilename, simulationResult){
}

function writeEventLog(logFilename, simulationResult) {}

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

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, "user_datetime.log");
fs.appendFileSync(logFile, "Hello, this is a test log.\n", "utf8");

function logFinancialEvent({ year, type, description, amount, details = {} }) {
  if (amount !== undefined) {
    const formattedAmount = typeof amount === "number" ? `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : amount;
    line += ` - ${formattedAmount}.`;
  }

  let line = `[${year}] ${type.toUpperCase()} | `;

  switch (type.toLowerCase()) {
    case "income":
    case "invest":
      line += formatStrategy(description, details, "invest");
      break;
    case "roth conversion":
      if (details.from && details.to) {
        line += ` of "${details.from}" to "${details.to}"`;
      }
      break;

    case "rebalance":
      line += formatStrategy(description, details, "rebalance");
      break;

    case "rmd": {
      const rmdAmount = details.amount ?? amount;
      let formattedAmount = "";

      if (typeof rmdAmount === "number") {
        formattedAmount = `$${rmdAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      } else {
        formattedAmount = rmdAmount ?? "";
      }

      if (formattedAmount) line += `RMD amount - ${formattedAmount}`;
      if (description) line += ` | ${description}`;
      if (details.userAge) line += ` at age ${details.userAge}`;
      if (details.rmdCount !== undefined) line += `${details.rmdCount} of RMD left to withdraw`;
      if (details.amountTransfer) {
        line += ` Transferred "${details.amountTransfer} from pretax investment to non-retirement.`;
      }
      if (details.preTaxInvestmentID) {
        line += ` from [preTaxInvestment ID: ${details.preTaxInvestmentID}] of  `;
        if (details.preTaxInvestmentValue !== undefined) {
          const val = typeof details.preTaxInvestmentValue === "number" ? `$${details.preTaxInvestmentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : details.preTaxInvestmentValue;
          line += ` (value: ${val})`;
        }
      }
      if (details.nonRetirementInvestmentID) {
        line += ` from [nonRetirementInvestment ID: ${details.nonRetirementInvestmentID}] of `;
        if (details.nonRetirementInvestmentValue !== undefined) {
          const val =
            typeof details.nonRetirementInvestmentValue === "number"
              ? `$${details.nonRetirementInvestmentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              : details.nonRetirementInvestmentValue;
          line += ` (value: ${val})`;
        }
      }
      break;
    }
    case "discretionary":
    case "non-discretionary": {
      line += formatNonDiscretionaryDetails(details, amount, description);
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

function formatNonDiscretionaryDetails(details, amount, description = "") {
  const expenseAmount = details.amount ?? amount;

  const formatCurrency = (val) => (typeof val === "number" ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : val ?? "");

  let line = "";

  const formattedAmount = formatCurrency(expenseAmount);
  if (description) line += `${description}\n`;
  if (formattedAmount) line += `Amount you need to pay in Non-discretionary expenses - ${formattedAmount}.`;

  if (details.taxes) {
    line += `Amount owed in taxes: "${formatCurrency(details.taxes)}"`;
  }
  if (details.cash) {
    line += `Amount of cash you have to spend: "${formatCurrency(details.cash)}".`;
  }
  if (details.withdrawalAmt) {
    line += `Amount you need to withdraw: "${formatCurrency(details.withdrawalAmt)}".`;
  }
  if (details.investmentID) {
    line += `Investment to withdraw from ID "${details.investmentID}" with value "${formatCurrency(details.investmentValue)}".`;
  }
  if (details?.type && details?.ID && details?.Value) {
    const valueFormatted = formatCurrency(details.Value);
    line += ` ${details.type.toUpperCase()} ID: ${details.ID} | Value: ${valueFormatted}`;
  }
  return line;
}

function formatStrategy(description, details, type) {
  let line = "";
  //console.log("details: ", details);
  const formatCurrency = (val) => (typeof val === "number" ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : val ?? "");
  const formatPercentage = (val) => `${(val * 100).toFixed(2)}%`;
  if (description) line += `${description}\n`;
  if (details.cash) {
    line += `Amount of cash you have to spend: "${formatCurrency(details.cash)}".`;
  }
  if (details.excessCash) {
    line += `Excess cash: "${formatCurrency(details.excessCash)}".`;
  }
  if (details.irsLimit) {
    line += `IRS Limit: "${formatCurrency(details.irsLimit)}".`;
  }
  if (details.afterTaxRatio) {
    line += `After tax ratio: "${formatCurrency(details.afterTaxRatio)}".`;
  }
  if (details.type === "initial") {
    line += `Initial investment ID: ${details.ID}, percentage: ${formatPercentage(details.Value)}.`;
  } else if (details.type === "final") {
    line += `Final investment ID: ${details.ID}, percentage: ${formatPercentage(details.Value)}.`;
  } else if (details.type === "fixed") {
    line += `Fixed investment ID: ${details.ID}, percentage: ${formatPercentage(details.Value)}.`;
  } else if (details.type === "calculated") {
    line += `Glide path calculated investment ID: ${details.ID}, percentage: ${formatPercentage(details.Value)}.`;
  } else if (details.type === "investments" && details.Value) {
    line += `${details.type.toUpperCase()} | Investment ID: ${details.ID}, value: ${formatCurrency(details.Value)}.`;
  } else if (details.excessCash) {
    line += `After ${type} the excess cash to distribute to non-retirement accounts that were in the allocation is: ${formatCurrency(details.excessCash)}.`;
  } else if (details.type === "investments" && details.purchasePrice) {
    line += `${details.type.toUpperCase()} | ${details.tax_status} Investment ID: ${details.ID}, purchased: ${formatCurrency(details.purchasePrice)}.`;
  }
  if (details.tax_status) {
    line += `The investments are of type: ${details.tax_status}`;
  }

  return line;
}

function printInvestments(investments, year, type, detailsType) {
  for (investment of investments) {
    //console.log("inn ", investment, type);
    logFinancialEvent({
      year: year,
      type: type,
      details: {
        type: detailsType,
        ID: investment._id,
        Value: investment.value,
      },
    });
  }
}

function printEvents(events, year, type, detailsType, inflationRate, spouseDeath) {
  for (e of events) {
    logFinancialEvent({
      year: year,
      type: type,
      details: {
        type: detailsType,
        ID: e._id,
        Value: getValueInYear(e, year, inflationRate, spouseDeath),
      },
    });
  }
}

function printStrategy(allocations, type, detailsType, year, calculated) {
  console.log("ALLOCATIONS ..", allocations);

  const logDetails = (subType, key, value) =>
    logFinancialEvent({
      year: year,
      type: type,
      details: { type: subType, ID: key, Value: value },
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
  printStrategy,
};
