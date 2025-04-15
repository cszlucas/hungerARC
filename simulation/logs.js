

function writeCSVLog(csvFilename, simulationResult){
    const years = simulationResult.years; // array of years like [2025, 2026,...]
    const investments = simulationResult.investments; // ['IRA', '401k', 'Roth']
    const valuesByYear = simulationResult.valuesByYear; // assume array of {year: 2025, IRA: 1000, 401k: 2000, Roth: 500}
  
    const header = ['Year', ...investments].join(',');
    const rows = valuesByYear.map((entry) =>
      [entry.year, ...investments.map((inv) => entry[inv])].join(',')
    );
  
    const fullCSV = [header, ...rows].join('\n');
    fs.writeFileSync(csvFilename, fullCSV, 'utf8');
}
function writeEventLog(logFilename, simulationResult.eventLog){

}

function logInvestment(investments, year, csvLog){
    const csvRow = { year };
    for (const inv of investments) {
      csvRow[inv.name] = inv.value;
    }
    csvLog.push(csvRow);
}

module.exports = {
    writeCSVLog,
    writeEventLog,
    logInvestment
};