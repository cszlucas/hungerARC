
const fs = require('fs');

function writeCSVLog(csvFilename, simulationResult){
    const years = simulationResult.years; // array of years like [2025, 2026,...]
    const firstYearData = simulationResult[0]; // assuming it's not empty
    const investments = Object.keys(firstYearData).filter(key => key !== 'year');
    console.log('investments :>> ', investments);
    // const investments = simulationResult.investments; // ['IRA', '401k', 'Roth']
    const valuesByYear = simulationResult; // assume array of {year: 2025, IRA: 1000, 401k: 2000, Roth: 500}
  
    const header = ['Year', ...investments].join(',');
    const rows = valuesByYear.map((entry) =>
      [entry.year, ...investments.map((inv) => entry[inv])].join(',')
    );
  
    const fullCSV = [header, ...rows].join('\n');
    fs.writeFileSync(csvFilename, fullCSV, 'utf8');
}
function writeEventLog(logFilename, simulationResult){

function writeEventLog(logFilename, simulationResult){

}

function logInvestment(investments, year, csvLog, investmentTypes){
    const csvRow = { year };
    for (const inv of investments) {
      const type = investmentTypes.find(type => type._id === inv.investmentType);
    //   console.log('inv :>> ', inv);
      const columnName = type.name;
      csvRow[columnName] = inv.value;
    }
    csvLog.push(csvRow);
    // console.log('csvLog :>> ', csvLog);
}

module.exports = {
    writeCSVLog,
    writeEventLog,
    logInvestment
};