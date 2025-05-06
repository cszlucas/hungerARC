import { logFinancialEvent, printInvestments, printStrategy } from "./logs.js";
import structuredClone from "structured-clone";
import { ObjectId } from "mongodb";

//RMDStrategyInvestOrder is an ordering on investments in pre-tax retirement accounts.
async function performRMDs(investments, yearTotals, userAge, RMDStrategyInvestOrder, sumInvestmentsPreTaxRMD, year, withdrawalStrategy, rmdObj){
  console.log("Perform RMD", sumInvestmentsPreTaxRMD, RMDStrategyInvestOrder, userAge);
  //console.log(rmdObj);
  if (RMDStrategyInvestOrder.length == 0) {
    logFinancialEvent({
      year: year,
      type: "rmd",
      description: "There are no pretax investments.",
    });
  }
  if (userAge >= 74 && RMDStrategyInvestOrder != null) {
    console.log("\nRMDs\nUser age", userAge, "and sum of pre-tax values from prev year is", sumInvestmentsPreTaxRMD);

    //console.log("object ", rmdObj);
    const rmdArray = rmdObj.rmd;
    const match = rmdArray.find((entry) => entry.age === userAge);
    if (!match) {
      console.error("RMD data not found for age:", userAge);
      return;
    }

    const distributionPeriod = match.distributionPeriod;
    const allInvestmentsNonRetirement = investments.filter((investment) => investment.accountTaxStatus.trim().toLowerCase() === "non-retirement");

    let rmd = sumInvestmentsPreTaxRMD / distributionPeriod;
    yearTotals.curYearIncome += rmd;
    let rmdCount = rmd;
    logFinancialEvent({
      year: year,
      type: "rmd",
      details: {
        amount: rmdCount,
      },
    });
    printInvestments(RMDStrategyInvestOrder, year, "rmd", "investments");
    for (let preTaxInvest of RMDStrategyInvestOrder) {
      if (rmdCount > 0) {
        //console.log("The rmd count: ", rmdCount, "and the pretax investment", preTaxInvest._id, "has value:", preTaxInvest.value);
        if (preTaxInvest.value - rmdCount >= 0) {
          transferInvestment(preTaxInvest, allInvestmentsNonRetirement, rmdCount, investments, year, withdrawalStrategy);
          preTaxInvest.value -= rmdCount;
          //console.log("can perform rmd all this round. The old pretax investment", preTaxInvest._id, " now has", preTaxInvest.value);
          break;
        } else {
          transferInvestment(preTaxInvest, allInvestmentsNonRetirement, preTaxInvest.value, investments, year, withdrawalStrategy);
          rmdCount -= preTaxInvest.value;
          preTaxInvest.value = 0;
          //console.log("can NOT pay all this round. Transfer all of pretax investment. The rmd amount left to transfer: ", rmdCount);
        }
      } else {
        //console.log("RMD transferred");
        printInvestments(RMDStrategyInvestOrder, year, "rmd", "investments");
        logFinancialEvent({
          year: year,
          type: "rmd",
          description: "All RMD transferred.",
        });
        break;
      }
    }
  }
}

// from the pretax account to non-retirement accounts
function transferInvestment(preTaxInvest, allInvestmentsNonRetirement, amountTransfer, investments, year, withdrawalStrategy) {
  //console.log("allInvestmentsNonRetirement", allInvestmentsNonRetirement);
  //console.log("preTaxInvest", preTaxInvest);
  let nonRetirementMap = new Map(allInvestmentsNonRetirement.map((investment) => [investment.investmentType, investment]));
  let nonRetirementInvestment = nonRetirementMap.get(preTaxInvest.investmentType);
  //console.log("nonRetirementMap", nonRetirementMap);
  //console.log("nonRetirementInvestment", nonRetirementInvestment);

  if (nonRetirementInvestment) {
    // console.log("able to add value: ", amountTransfer, "to a current afterTaxInvestment ", nonRetirementInvestment._id, "of value", nonRetirementInvestment.value);
    logFinancialEvent({
      year: year,
      type: "rmd",
      description: "Add amount to old non-retirement investment",
      details: {
        amountTransfer: amountTransfer,
        nonRetirementInvestmentID: nonRetirementInvestment._id,
      },
    });
    nonRetirementInvestment.value += amountTransfer;
  } else {
    //console.log("create a new non-retirement investment with value: ", amountTransfer);
    let newInvestment = {
      ...structuredClone(preTaxInvest),
      _id: new ObjectId(), // 🔄 Mongo-style ID
      value: amountTransfer,
      accountTaxStatus: "non-retirement",
    };

    logFinancialEvent({
      year: year,
      type: "rmd",
      description: "Add amount to new non-retirement investment",
      details: {
        amountTransfer: amountTransfer,
        nonRetirementInvestmentID: newInvestment._id,
      },
    });

    investments.push(newInvestment);
    withdrawalStrategy.push(newInvestment._id);
  }
}

export { performRMDs };
