

//zoe figure out year factor
function performRMDs(scenario, RMDStrategyInvestOrder, currYearIncome, currYear){
  userAge = currYear - scenario.birthYearUser
  if(userAge>=73 && RMDStrategyInvestOrder!=null){ //at least one pretax investment in previous year
      distributionPeriod = rmdTable({"age": userAge}).distributionPeriod
      allInvestmentsPreTax = db.investments.query({"scenario_id": scenario.id, "accountTaxStatus": "pre-tax retirement"})
      allInvestmentsAfterTax = db.investments.query({"scenario_id": scenario.id, "accountTaxStatus": "after-tax retirement"})
      sumInvestmentsPreTax = 0
      for (let preTaxInvestment in allInvestmentsPreTax){
        sumInvestmentsPreTax += preTaxInvestment.value
      }
      rmd = sumInvestmentsPreTax / distributionPeriod
      currYearIncome += rmd

      rmdCount = rmd
      for( let preTaxInvest in getRMDStrategyOrder){
        if(rmdCount>0){

          if ( preTaxInvest.value - rmdCount >= 0 ){ //able to accomplish rmd with this investment, keep some of old investment and transfer new
            transferInvestment(preTaxInvest, allInvestmentsAfterTax, rmdCount)
            preTaxInvest.value -= rmdCount
            break
          } else { //not able to accomplish rmd with this investment, transfer all of old investment and go to next investment in strategy order
            transferInvestment(preTaxInvest, allInvestmentsAfterTax, preTaxInvest.value)
            rmdCount -= preTaxInvest.value
            remove(preTaxInvest)
          }
        }
    }
  }
}


function transferInvestment(preTaxInvest, allInvestmentsAfterTax, amountTransfer){
  foundMatch = false
  for(let afterTaxInvestment in allInvestmentsAfterTax){

    if(afterTaxInvestment.investmentType == preTaxInvest.investmentType && afterTaxInvestment.accountTaxStatus == preTaxInvest.accountTaxStatus){ 
      //able to add to a current afterTaxInvestment
      foundMatch = true
      afterTaxInvestment.value += amountTransfer
    }
  }

  if(!foundMatch){//create new after tax investment in memory with transferred amount
    investment = {
      "investmentType": invest.investmentType,
      "value": amountTransfer,
      "accountTaxStatus": "after-tax retirement"
    }
  }  
}



function payNonDiscretionaryExpenses(scenario, cashInvestment, currYearIncome, currYearSS, curYearGains, curYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, ssRange){

  nonDiscretionaryExpenses = db.scenario.query({"_id": scenario.id, "expenseEvents.discretionary": false})
  withdrawalStrategy =  db.scenario.query({"_id": scenario.id}).expenseWithdrawalStrategy
  withdrawalAmt = (sumAmt(nonDiscretionaryExpenses) + getTaxes(currYearIncome, currYearSS, curYearGains, curYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, ssRange))
  
  if (cashInvestment-withdrawalAmt >= 0){ //can pay from cash investment
    cashInvestment-=withdrawalAmt
  }
  else{ //get money from investments
    for(let investment in withdrawalStrategy){
        if(withdrawalAmt>0){
            withdrawalAmt -= payFromInvestment(withdrawalAmt, investment, userAge)
        }
    }
  }
}

function payDiscretionaryExpenses(scenario, cashInvestment){
    spendingStrategy = db.scenario.query({"_id": scenario.id}).spendingStrategy
    withdrawalStrategy =  db.scenario.query({"_id": scenario.id}).expenseWithdrawalStrategy
	for(let expense in spendingStrategy){
        if (cashInvestment-expense.value >= 0){ //can pay from cash investment
            cashInvestment-=expense.value
            expense.value = 0
            continue
        }
		for(let investment in withdrawalStrategy){
            if(expense.value>0 && (scenario.financialGoal - expense.value >=0 )){
                expense.value-=payFromInvestment(expense.value, investment, userAge)
            }else if(expense.value>0 && (scenario.financialGoal - expense.value <0 )){ //only pay as much as does not violate financial goal
                expense.value-=payFromInvestment((expense.value-scenario.financialGoal), investment, userAge)
            }
        }
        if(expense.value>0){
            console.log("You were not able to pay all your discretionary expenses.")
        }
    }
}



function payFromInvestment(withdrawalAmt, investment, userAge, curYearGains, curYearIncome, curYearEarlyWithdrawals){
    if (investment.value - withdrawalAmt > 0){ //subtract needed and keep investment
        if(investment.accountTaxStatus!="pre-tax retirement"){
            capitalGain = withdrawalAmt * (investment.value - investment.purchasePrice)
            curYearGains+=capitalGain
        }
        investment.value-=withdrawalAmt
        return withdrawalAmt
    }else{ //use up this investment "sell" and move onto next
        if(investment.accountTaxStatus!="pre-tax retirement"){
            capitalGain = investment.value - investment.purchasePrice
            curYearGains+=capitalGain
        }if(investment.accountTaxStatus=="pre-tax retirement"){
            curYearIncome-=investment.value 
        }if((investment.accountTaxStatus=="pre-tax retirement" || investment.accountTaxStatus=="after-tax retirement") && userAge<59){
            curYearEarlyWithdrawals+=investment.value
        }
        remove(investment)
        return investment.value
    }
}

function sumAmt(events){
  sum = 0
  for(let event in events){
    sum += event.value
  }
  return sum
}

 //calculate tax income and ss prices
function getTaxes(currYearIncome, currYearSS, curYearGains, currYearEarlyWithdrawals, federalIncomeRange, stateIncomeRange, ssRange){
  //federal income tax
  federalTax = taxAmt(currYearIncome, federalIncomeRange)
  //state income tax
  stateTax = taxAmt(currYearIncome, stateIncomeRange)
  //social security (ss) income tax
  ssTax = taxAmt(currYearSS*.85, ssRange)
  //capital gains tax
  capitalGainsTax = taxAmt(curYearGains)
  //early withdrawal tax
  earlyWithdrawalTax = taxAmt(currYearEarlyWithdrawals)
  return (federalTax+stateTax+ssTax+capitalGainsTax+earlyWithdrawalTax)
}

function taxAmt(income, ranges){
  for(let range in ranges){
    if(income>=range[0]&&income<=range[1]){
      return income*range.rate
    }
  }
}

	
function runInvestStrategy(scenario, cashInvestment, IRSLimits){ //run invest event strategy for current year
    investStrategy = db.invest_strategy.assetAllocation.query({"_scenario_id": scenario.id})
    excessCash = investStrategy.maxCash - cashInvestment
	  if (excessCash > 0){
      preTaxLimits = taxAmt(excessCash, IRSLimits)
      afterTaxLimits = taxAmt()
      preTaxRatio = scaleDownRatio("pre-tax retirement", investStrategy, preTaxLimits, excessCash)
      afterTaxRatio = scaleDownRatio("after-tax retirement", investStrategy, afterTaxLimits, excessCash) 
     
		  for(let investment in investStrategy){
        buyAmt = 0
        if(investment.accountTaxStatus=="pre-tax retirement"){
          buyAmt = (excessCash * investment.value) * preTaxRatio
        }else if(investment.accountTaxStatus=="after-tax retirement"){
          buyAmt = (excessCash * investment.value) * afterTaxRatio
        }
        investment.purchasePrice+=buyAmt
      }

      if(excessCash-buyAmt>0){ //everything else in non-retirement
        buyNonRetirement(investStrategy, excessCash-buyAmt)
      }

  }
}

buyNonRetirement(investStrategy, excessCash){
  for(let investment in investStrategy){
    buyAmt = 0
    if(investment.accountTaxStatus=="non-retirement"){
      buyAmt = excessCash* (investment.percentage / excessCash)
      investment.purchasePrice+=buyAmt
    }
  }
}

function scaleDownRatio(type, investStrategy, limit, excessCash){
  sum=0
  for(let investment in investStrategy){
    if(investment.accountTaxStatus==type){
      sum+=(investment.percentage * excessCash)
    }
  }
  if(sum > limit){
    return limit/sum
  }else{
    return investment.percentage
  }
}

function rebalance(scenario, curYearGains){
	rebalanceStrategy = db.rebalance.assetAllocation.query({"_scenario_id": scenario.id})

  for(let investment in rebalanceStrategy){
    sum = sumAmt(investment)
    target = sum*investment.percentage 
    if(investment.value > target){ //sell
      sellAmt=investment.value-target
      if(investment.taxAccountStatus!="pre-tax retirement"){
        if(investment.value-sellAmt<=0){ //sell entire investment
          curYearGains+=investment.value-investment.purchasePrice
          remove(investment)
        }else{//sell part of investment
          curYearGains+=(sellAmt*(investment.value-investment.purchasePrice))
          investment.value-=sellAmt
        }
      }
    }else if(investment.value < target){//buy some of investment
      buyAmt=target-investment.value
      investment.purchasePrice+=buyAmt
    }
  }

}
