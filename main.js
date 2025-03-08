

//zoe figure out year factor
function performRMDs(scenario, rothWithdrawal,RMDStrategyInvestOrder, allInvestments, currYear){
  userAge = time.Now.Year() - scenario.birthYearUser
  if userAge>=73 && RMDStrategyInvestOrder!=null: //at least one pretax investment in previous year
      distributionPeriod = rmdTable(“age”: userAge).distributionPeriod
      allInvestmentsPreTax = db.investments.query("scenario_id": scenario.id, “accountTaxStatus”: “pre-tax retirement”, "year": currYear-1)
      allInvestmentsAfterTax = db.investments.query("scenario_id": scenario.id, “accountTaxStatus”: “after-tax retirement”)
      sumInvestmentsPreTax = 0
      for (let preTaxInvestment in allInvestmentsPreTax){ //get sum of all pretax investments from previous year
        sumInvestmentsPreTax += preTaxInvestment.value
      }
      rmd = sumInvestmentsPreTax / distributionPeriod
      currYearIncome += rmd

      rmdCount = rmd
      for each preTaxInvest in getRMDStrategyOrder:
        if rmdCount>0
        
          if ( preTaxInvest.value - rmdCount >= 0 ) //able to accomplish rmd with this investment, keep some of old investment and transfer new
            transferInvestment(preTaxInvest, allInvestmentsAfterTax, rmdCount)
            preTaxInvest.value -= rmdCount
            break
          else //not able to accomplish rmd with this investment, transfer all of old investment and go to next investment in strategy order
            transferInvestment(preTaxInvest, allInvestmentsAfterTax, preTaxInvest.value)
            rmdCount -= preTaxInvest.value
            preTaxInvest.value = 0
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
  paymentAmt = getExpensesAndTaxes(nonDiscretionaryExpenses, scenario)
  if (cashInvestment-paymentAmt >= 0){ //can pay from cash investment
    cashInvestment-=paymentAmt
  }
  else{ //get money from investments
    for(let investment in withdrawalStrategy){
        if(paymentAmt>0){
            paymentAmt -= transferMoney(paymentAmt, investment)
        }
    }
  }
}


function transferMoney(paymentAmt, investment){
    if (investment.value - paymentAmt >= 0){ //can pay all with this investment
        return paymentAmt
    }else{ //use up this investment and move onto next
        if(investment.accountTaxStatus!="pre-tax retirement"){
            capitalGain = investment.value - getPurchasePrice() //Zoe create this
        }
        return investment.value
    }
}



function getExpensesAndTaxes(nonDiscretionaryExpenses, scenario){
  sum = 0
  for(let expense in nonDiscretionaryExpenses){ //expenses
    sum += expense.value
  }
  //Taxes below
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
    
	


