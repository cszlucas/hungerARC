

//zoe figure out year factor
function performRMDs(scenario, RMDStrategyInvestOrder, currYear){
  userAge = time.Now.Year() - scenario.birthYearUser
  if(userAge>=73 && RMDStrategyInvestOrder!=null){ //at least one pretax investment in previous year
      distributionPeriod = rmdTable("age": userAge).distributionPeriod
      allInvestmentsPreTax = db.investments.query("scenario_id": scenario.id, "accountTaxStatus": "pre-tax retirement": "year": currYear-1)
      allInvestmentsAfterTax = db.investments.query("scenario_id": scenario.id, "accountTaxStatus": "after-tax retirement")
      sumInvestmentsPreTax = 0
      for (let preTaxInvestment in allInvestmentsPreTax){ //get sum of all pretax investments from previous year
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
            preTaxInvest.value = 0
          }
        }
    }
  }
}


function transferInvestment(preTaxInvest, allInvestmentsAfterTax, amountTransfer){
  foundMatch = false
  for(let afterTaxInvestment in allInvestmentsAfterTax){ //see if afterTax investment already exists that I can add to
    if(afterTaxInvestment.investmentType == preTaxInvest.investmentType && afterTaxInvestment.accountTaxStatus == preTaxInvest.accountTaxStatus){ // ??able to add to a current aftertaxInvestment
      foundMatch = true
      afterTaxInvestment.value += amountTransfer
    }
  }

  if(!foundMatch){//create new after tax investment with transferred amount
    investment = {
      "investmentType": invest.investmentType,
      "value": amountTransfer,
      "accountTaxStatus": "after-tax retirement"
    }
  }  
}



function payNonDiscretionaryExpenses(scenario, previousYearTax,cashInvestment){
  nonDiscretionaryExpenses = db.scenario.query({"_id": scenario.id, expenseEvents.discretionary: false})
  withdrawalStrategy =  db.scenario.query({"_id": scenario.id}).expenseWithdrawalStrategy
  paymentAmt = (getExpenses(nonDiscretionaryExpenses) + getTaxes(scenario))
  if (cashInvestment-paymentAmt >= 0){ //can pay from cash investment
    cashInvestment-=paymentAmt
  }
  else{ //get money from investments
    for(let investment in withdrawalStrategy){
        if(paymentAmt>0){
            paymentAmt -= transferMoneyFromInvestment(paymentAmt, investment, userAge)
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
                expense.value-=transferMoneyFromInvestment(expense.value, investment, userAge)
            }else if(expense.value>0 && (scenario.financialGoal - expense.value <0 )){ //only pay as much as does not violate financial goal
                expense.value-=transferMoneyFromInvestment((expense. value-scenario.financialGoal), investment, userAge)
            }
        }
        if(expense.value>0){
            console.log("You were not able to pay all your discretionary expenses.")
        }
    }
}



function transferMoneyFromInvestment(paymentAmt, investment, userAge){
    if (investment.value - paymentAmt > 0){ //can pay all with this investment, what about break even?
        if(investment.accountTaxStatus!="pre-tax retirement"){
            capitalGain = paymentAmt * (investment.value - getPurchasePrice())
        }if(investment.accountTaxStatus=="pre-tax retirement"){
            currYearIncome-=paymentAmt
        }if((investment.accountTaxStatus=="pre-tax retirement" || investment.accountTaxStatus=="after-tax retirement") && userAge<59){
            currYearEarlyWithdrawals-=paymentAmt
        }
        investment.value-=paymentAmt
        return paymentAmt
    }else{ //use up this investment and move onto next
        if(investment.accountTaxStatus!="pre-tax retirement"){
            capitalGain = investment.value - getPurchasePrice() //Zoe create this. Purchase price = sum of the amounts of purchases of the investment plus initial value at start of simulation.
        }if(investment.accountTaxStatus=="pre-tax retirement"){
            currYearIncome-=investment.value
        }if((investment.accountTaxStatus=="pre-tax retirement" || investment.accountTaxStatus=="after-tax retirement") && userAge<59){
            currYearEarlyWithdrawals-=investment.value
        }
        investment.value = 0
        return investment.value
    }
}

function getExpenses(expenses){
  sum = 0
  for(let expense in expenses){ //expenses
    sum += expense.value
  }
  return sum
}


function getTaxes(scenario){
  sum = 0
  if (scenario.single == true){
    tax = db.tax.single.query({"income": scenario.currYearIncome})
  } else {
    tax = db.tax.married.query({"income": scenario.currYearIncome})
  }
  inflation = findInflation(prevYear) //Is the inflation separate for federal, state, single, married?? capital gains
  federalTax = tax.incomeTax.federal * (1 + inflation)
  stateTax = incomeTax.state * (1 + inflation)
  ss = tax.ssTax * (1 + inflation)
  capitalGains = prevCurrYearGains * (1 + inflation) //Can't be negative?
  earlyWithdrawalTax = getEarlyWithdrawalTax(year-1) //Zoe need to create this. Is the rate for this stored in db?
  sum += (federalTax+stateTax+ss+capitalGains+earlyWithdrawalTax)
  return sum
}
    
	
function runInvestStrategy(scenario, year, inflationAmt,cashInvestment){ //run invest event strategy for current year
    investStrategy = db.invest_strategy.assetAllocation.query({"_scenario_id": scenario.id, "startYear": year})
    excessCash = investStrategy.maxCash - cashInvestment
	  if (excessCash > 0){
      preTaxLimits = scenario.irsLimits.initialPreTax.query({"_scenario_id": scenario.id})
      afterTaxLimits = scenario.irsLimits.initialAfterTax.query({"_scenario_id": scenario.id})
      preTaxAdjustedLimits = findInflation(preTaxLimits, year)
      afterTaxAdjustedLimits = findInflation(afterTaxLimits, year)
      preTaxRatio = scaleDownRatio("pre-tax retirement", investStrategy, preTaxAdjustedLimits, excessCash)
      afterTaxRatio = scaleDownRatio("after-tax retirement", investStrategy, afterTaxAdjustedLimits, excessCash) 
      nonRetirementRatio = figureOut()
     
		  for(let investment in investStrategy){
			  
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
    return 0
  }
}
