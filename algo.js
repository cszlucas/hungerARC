
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

function findUpperFedTaxBracket(curYearFedTaxableIncome, fedIncomeTaxBracket){
    for(let taxBracket of fedIncomeTaxBracket){
        if(curYearFedTaxableIncome<=taxBracket.incomeRange[1])
            return taxBracket.upperBound;
    }
    return -1;
}

function rothConversion(scenario, year, curYearIncome, curYearSS, fedIncomeTaxBracket){
    let curYearFedTaxableIncome=curYearIncome-0.15*curYearSS;
    // upper limit of the tax bracket user is in
    u=findUpperFedTaxBracket(curYearFedTaxableIncome, fedIncomeTaxBracket);
    // roth conversation amount
    rc=u-curYearFedTaxableIncome;
    // transfer from pre-tax to after-tax retirement
    for (let investment of scenario.rothConversionStrategyOrderPreTax){
        if(investment.accountTaxStatus=="pre-tax retirement" && rc>0){
            if(rc>=investment.value){
                rc-=investment.value;
                investment.accountTaxStatus="after-tax retirement";
            }else{
                investment.value-=rc;
                // create new after tax investment in memory with transferred amount
                scenario.investments.push({
                    "investmentType": investment.investmentType,
                    "value": rc,
                    "accountTaxStatus": "after-tax retirement"
                });
                rc=0;
            }
        }
    }
    curYearIncome+=rc;
    if(year-user.birthYearUser<59){
        curYearEarlyWithdrawals+=rc;
    }
}

function updateIncomeEvents(incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment){
    for (let incomeEvent of incomeEvents){
        if(incomeEvent.startYear>=year && incomeEvent.endYear<=userEndYear){
            let annualChange=incomeEvent.annualChange;
            let incomeValue=incomeEvent.value;
        
            // update by annual change in amount
            if(annualChange.type=="fixed"){
                incomeValue+=annualChange.amount;
            }else if(annualChange.type=="percentage"){
                incomeValue*=(1+annualChange.amount);
            }else if(annualChange.type=="uniform"){
                incomeValue+=Math.random() * (annualChange.max - annualChange.min) + annualChange.min;
            // normal distribution
            }else{
                const u=1-Math.random();
                const v=Math.random();
                const z=Math.sqrt(-2.0*Math.log(u)) * Math.cos(2.0*Math.PI*v);
                incomeValue+=z * annualChange.mean.std + annualChange.mean;
            }
            if(incomeEvent.inflationAdjustment)
                incomeValue*=(1+inflationRate);
            // spouse is dead :(
            if(filingStatus=="marriedFilingJointly" && year>scenario.birthYearSpouse+scenario.lifeExpectancySpouse){
                incomeValue*=incomeEvent.userPercentage;
            }
            // is this right?
            cashInvestment+=incomeValue;
            curYearIncome+=cashInvestment; 
            if(incomeEvent.incomeType=="socialSecurity"){
                curYearSS+=incomeValue; // incomeValue because social security does not apply to cash investments
            }   
        }   
    }
    return {curYearIncome, curYearSS, cashInvestment};
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
    let incomeEvents=scenario.incomeEvents;
    let userEndYear=scenario.birthYearUser+scenario.lifeExpectancyUser;
    let investments=db.investments.query({"scenario_id": scenario.id});
    //save initial value and purchase price of investments
    for(let investment in investments){
        investment.purchasePrice = investment.value
    }

    for (let year=currentYear; year<=userEndYear; year++){
        // PRELIMINARIES
        // can differ each year if sampled from distribution
        inflationRate=findInflation(scenario.inflationAssumption);
        // if(year!=currentYear){
        federalIncomeTax = updateFedIncomeTaxBracket(fedIncomeTaxBracket, inflationRate);
       
        fedDeduction=updateFedDeduction(fedDeduction, inflationRate);
        if(stateDeduction){ 
            stateDeduction = updateStateDeduction(stateDeduction, inflationRate);
            stateIncomeTax = updateStateIncomeTaxBracket(stateIncomeTaxBracket, inflationRate);
        }
        // retirement account limits
        annualLimitRetirement*=(1+inflationRate);
        

        // RUN INCOME EVENTS   
        let curYearIncome=0;
        let curYearSS=0; 
        let curYearEarlyWithdrawals = 0;
        let curYearGains = 0;
        let cashInvestment=scenario.investments.cashInvestment;
        ({curYearIncome, curYearSS, cashInvestment}=updateIncomeEvents(incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment));

        // PERFORM RMD FOR PREVIOUS YEAR
        performRMDs(scenario, RMDStrategyInvestOrder, currYearIncome, currYear)
        // UPDATE INVESTMENT VALUES
        
        // RUN ROTH CONVERSION IF ENABLED
        if(scenario.optimizerSettings && year>=scenario.optimizerSettings.startYear && year<=scenario.optimizerSettings.endYear){
            rothConversion(scenario, year, curYearIncome, curYearSS, fedIncomeTaxBracket);
        }

        // PAY NON-DISCRETIONARY EXPENSES AND PREVIOUS YEAR TAXES
        payNonDiscretionaryExpenses(scenario, cashInvestment, currYearIncome, currYearSS, curYearGains, curYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, ssRange)
        // PAY DISCRETIONARY EXPENSES
        payDiscretionaryExpenses(scenario, cashInvestment)
        // RUN INVEST EVENT
        runInvestStrategy(scenario, cashInvestment, IRSLimits)
        // RUN REBALANCE EVENT
        rebalance(scenario, curYearGains)

    } 
  }
