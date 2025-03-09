
function findInflation(inflationAssumption){
    if(inflationAssumption.fixedPercentage)
      // in decimal form already
      return inflationAssumption.fixedPercentage.fixedValue;
    else if(inflationAssumption.uniform)
      return Math.random() * (inflationAssumption.uniform.max - inflationAssumption.uniform.min) + inflationAssumption.uniform.min;
    // normal distribution
    else{
      const u=1-Math.random();
      const v=Math.random();
      const z=Math.sqrt(-2.0*Math.log(u)) * Math.cos(2.0*Math.PI*v);
      return z * inflationAssumption.normal.mean.std + inflationAssumption.normal.mean;
    }
}
  
function updateFedIncomeTaxBracket(fedIncomeTaxBracket,inflationRate,){
    fedIncomeTaxBracket.forEach((bracket) => {
        bracket.incomeRange[0] *= (1+inflationRate);
        bracket.incomeRange[1] *= (1+inflationRate);
    })
}
  
function updateStateIncomeTaxBracket(stateIncomeTaxBracket,inflationRate){
   stateIncomeTaxBracket.forEach((bracket) => {
        bracket.incomeRange[0] *= (1+inflationRate);
        bracket.incomeRange[1] *= (1+inflationRate);
    })
}

function updateFedDeduction(fedDeduction,inflationRate){
    fedDeduction *= (1+inflationRate);
}

function updateStateDeduction(stateDeduction,inflationRate){
    stateDeduction *= (1+inflationRate);
}

function runSimulation(scenario){
    // is tax bracket part of the scenario;
    // current year tax

    // previous year
    let annualLimitRetirement=database.annualLimitRetirement;
    let filingStatus=scenario.filingStatus;
    let state=scenario.stateResidence;
    // perhaps set the state to a default value instead?
    let fedIncomeTaxBracket, stateIncomeTaxBracket, fedDeduction, stateDeduction;
    // previous year's tax
    if(filingStatus == "single"){
        fedIncomeTaxBracket=database.tax.single.federalIncomeTaxRatesBrackets;
        fedDeduction=database.tax.single.standardDeduction;
        if(yaml.contains(state))
            stateIncomeTaxBracket=yaml.tax.single.stateIncomeTaxRatesBrackets;
            stateDeduction=yaml.tax.single.standardDeduction;
    }
    else{
        fedIncomeTaxBracket=database.tax.marriedFilingJointly.federalIncomeTaxRatesBrackets;
        fedDeduction=database.tax.marriedFilingJointly.standardDeduction;
        if(yaml.contains(state))
            stateIncomeTaxBracket=yaml.tax.marriedFilingJointly.stateIncomeTaxRatesBrackets;
            stateDeduction=yaml.tax.marriedFilingJointly.standardDeduction;
    }
    
    let currentYear=new Date().getFullYear();
    
    
    for (let year=currentYear; year<=userEndYear; year++){
        // PRELIMINARIES
        // can differ each year if sampled from distribution
        inflationRate=findInflation(scenario.inflationAssumption);
        // if(year!=currentYear){
        updateFedIncomeTaxBracket(fedIncomeTaxBracket, inflationRate);
       
        updateFedDeduction(fedDeduction, inflationRate);
        if(stateDeduction){ 
            updateStateDeduction(stateDeduction, inflationRate);
            updateStateIncomeTaxBracket(stateIncomeTaxBracket, inflationRate);
        };
        // retirement account limits
        annualLimitRetirement*=(1+inflationRate);
        
        // Run income events
        

    } 
  }