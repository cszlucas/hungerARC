
function findNormalDistribution(mean, std){
    const u=1-Math.random();
    const v=Math.random();
    const z=Math.sqrt(-2.0*Math.log(u)) * Math.cos(2.0*Math.PI*v);
    return z * std + mean;
}

function findInflation(inflationAssumption){
    if(inflationAssumption.type=="fixedPercent")
      return inflationAssumption.amount;
    else if(inflationAssumption.type=="uniform")
      return Math.random() * (inflationAssumption.uniform.max - inflationAssumption.uniform.min) + inflationAssumption.uniform.min;
    // normal distribution
    else{
      return findNormalDistribution(inflationAssumption.normal.mean, inflationAssumption.normal.std);
    }
}
  
function updateFedIncomeTax(fedIncomeTax,inflationRate){
    fedIncomeTax.forEach((bracket) => {
        bracket.incomeRange[0] *= (1+inflationRate);
        bracket.incomeRange[1] *= (1+inflationRate);
    })
}
  
function updateStateIncomeTax(stateIncomeTax,inflationRate){
   stateIncomeTax.forEach((bracket) => {
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

function findUpperFedTax(curYearFedTaxableIncome, fedIncomeTax){
    for(let taxBracket of fedIncomeTax){
        if(curYearFedTaxableIncome<=taxBracket.incomeRange[1])
            return taxBracket.upperBound;
    }
    return -1;
}

function rothConversion(scenario, year, curYearIncome, curYearSS, fedIncomeTax){
    let curYearFedTaxableIncome=curYearIncome-0.15*curYearSS;
    // upper limit of the tax bracket user is in
    u=findUpperFedTax(curYearFedTaxableIncome, fedIncomeTax);
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
            if(annualChange.type=="fixedAmt"){
                incomeValue+=annualChange.amount;
            }else if(annualChange.type=="fixedPercent"){
                incomeValue*=(1+(annualChange.amount/100));
            }else if(annualChange.type=="uniform"){
                incomeValue+=Math.random() * (annualChange.max - annualChange.min) + annualChange.min;
            // normal distribution
            }else{
                incomeValue+=findNormalDistribution(annualChange.mean, annualChange.std);
            }
            if(incomeEvent.inflationAdjustment)
                incomeValue*=(1+inflationRate);
            // spouse is dead :(
            if(filingStatus=="marriedFilingJointly" && year>scenario.birthYearSpouse+scenario.lifeExpectancySpouse){
                incomeValue*=incomeEvent.userPercentage;
            }
            // is this right?
            cashInvestment+=incomeValue;
            // cashinvesment may have value from previous years, not right
            curYearIncome+=cashInvestment; 
            if(incomeEvent.incomeType=="socialSecurity"){
                curYearSS+=incomeValue; // incomeValue because social security does not apply to cash investments
            }   
        }   
    }
    return {curYearIncome, curYearSS, cashInvestment};
}

function updateInvestmentValues(investments, curYearIncome){
    for (let investment of investments){
        let generatedIncome=0;
        let annualIncome=investment.investmentType.annualIncome;
        let originalValue=investment.value;

        if (annualIncome.type=="fixedAmt"){
            generatedIncome+=annualIncome.amount;
        } else if(annualIncome.type=="fixedPercent"){
            generatedIncome+=investment.value*(annualIncome.amount/100);
        } else if(annualIncome.type=="normalFixed"){
            generatedIncome+=findNormalDistribution(annualIncome.mean, annualIncome.std);
        } else if(annualIncome.type=="normalPercent"){
            generatedIncome+=investment.value*(findNormalDistribution(annualIncome.mean, annualIncome.std)/100);
        } else {
            // Markov processes with geometric Brownian motion
            
        }

        if(investment.accountTaxStatus=="non-retirement" && investment.taxability=="taxable"){
            curYearIncome+=generatedIncome;
        }
        
        // income from dividends and interest are reinvested into the investment
        investment.value+=generatedIncome;

        // change in value
        let annualReturn=investment.investmentType.annualReturn;
        if (annualReturn.type=="fixedAmt"){
            investment.value+=annualReturn.amount;
        } else if(annualReturn.type=="fixedPercent"){
            investment.value+=investment.value*(annualReturn.amount/100);
        } else if(annualReturn.type=="normalFixed"){
            investment.value+=findNormalDistribution(annualReturn.mean, annualReturn.std);
        } else if(annualReturn.type=="normalPercent"){
            investment.value+=investment.value*(findNormalDistribution(annualReturn.mean, annualReturn.std)/100);
        } else {
            // Markov processes with geometric Brownian motion
        
        }

        // average value of investment
        avgValue=(investment.value+originalValue)/2;
        // calculate and subtract expense
        let expenses=(investment.investmentType.expenseRatio/100) * avgValue;
        investment.value-=expenses;
    }
    return {curYearIncome};
}

function runSimulation(scenario){
    // is tax bracket part of the scenario;
    // current year tax

    // previous year
    let annualLimitRetirement=database.annualLimitRetirement;
    let filingStatus=scenario.filingStatus;
    let state=scenario.stateResidence;
    // perhaps set the state to a default value instead?
    let fedIncomeTax, stateIncomeTax, fedDeduction, stateDeduction;
    // previous year's tax
    if(filingStatus == "single"){
        fedIncomeTax=database.tax.single.federalIncomeTaxRatesBrackets;
        fedDeduction=database.tax.single.standardDeduction;
        if(yaml.contains(state))
            stateIncomeTax=yaml.tax.single.stateIncomeTaxRatesBrackets;
            stateDeduction=yaml.tax.single.standardDeduction;
    }
    else{
        fedIncomeTax=database.tax.marriedFilingJointly.federalIncomeTaxRatesBrackets;
        fedDeduction=database.tax.marriedFilingJointly.standardDeduction;
        if(yaml.contains(state))
            stateIncomeTax=yaml.tax.marriedFilingJointly.stateIncomeTaxRatesBrackets;
            stateDeduction=yaml.tax.marriedFilingJointly.standardDeduction;
    }
    
    let currentYear=new Date().getFullYear();
    let incomeEvents=scenario.incomeEvents;
    let userEndYear=scenario.birthYearUser+scenario.lifeExpectancyUser;
    for (let year=currentYear; year<=userEndYear; year++){
        // PRELIMINARIES
        // can differ each year if sampled from distribution
        inflationRate=findInflation(scenario.inflationAssumption)/100;
        // if(year!=currentYear){
        updateFedIncomeTax(fedIncomeTax, inflationRate);
       
        updateFedDeduction(fedDeduction, inflationRate);
        if(stateDeduction){ 
            updateStateDeduction(stateDeduction, inflationRate);
            updateStateIncomeTax(stateIncomeTax, inflationRate);
        };
        // retirement account limits
        annualLimitRetirement*=(1+inflationRate);
     
        let curYearEarlyWithdrawals=0;

        // RUN INCOME EVENTS   
        // purpose of curYearIncome
        let curYearIncome=0;
        let curYearSS=0; 
        let cashInvestment=scenario.investments.cashInvestment;
        ({curYearIncome, curYearSS, cashInvestment}=updateIncomeEvents(incomeEvents, year, userEndYear, inflationRate, filingStatus, scenario, curYearIncome, curYearSS, cashInvestment));

        // PERFORM RMD FOR PREVIOUS YEAR

        // UPDATE INVESTMENT VALUES
        let investments=scenario.investments.investEvents;
        ({curYearIncome}=updateInvestmentValues(investments, curYearIncome));
      
        // RUN ROTH CONVERSION IF ENABLED
        if(scenario.optimizerSettings && year>=scenario.optimizerSettings.startYear && year<=scenario.optimizerSettings.endYear){
            rothConversion(scenario, year, curYearIncome, curYearSS, fedIncomeTax);
        }

        // PAY NON-DISCRETIONARY EXPENSES AND PREVIOUS YEAR TAXES

        // PAY DISCRETIONARY EXPENSES

        // RUN INVEST EVENT

        // RUN REBALANCE EVENT


    } 
  }
