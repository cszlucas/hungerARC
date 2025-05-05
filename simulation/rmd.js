import RMD from "../server/models/rmd-schema.js";
import { logFinancialEvent, printInvestments, printStrategy } from "./logs.js";
import structuredClone from "structured-clone";
import { v4 as uuidv4 } from "uuid";

//RMDStrategyInvestOrder is an ordering on investments in pre-tax retirement accounts.
async function performRMDs(investments, yearTotals, userAge, RMDStrategyInvestOrder, sumInvestmentsPreTaxRMD, year) {
  console.log("Perform RMD");
  if (RMDStrategyInvestOrder.length == 0) {
    logFinancialEvent({
      year: year,
      type: "rmd",
      description: "There are no pretax investments."
    });
  }
  if (userAge >= 74 && RMDStrategyInvestOrder != null) {
    //console.log("\nRMDs\nUser age", userAge, "and sum of pre-tax values from prev year is", sumInvestmentsPreTaxRMD);

    const match = await RMD.findOne({ "rmd.age": userAge }, { "rmd.$": 1 });
    if (!match || !match.rmd || !match.rmd[0]) {
      console.error("RMD data not found for age:", userAge);
    }

    const distributionPeriod = match.rmd[0].distributionPeriod;
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
          transferInvestment(preTaxInvest, allInvestmentsNonRetirement, rmdCount, investments, year);
          preTaxInvest.value -= rmdCount;
          //console.log("can perform rmd all this round. The old pretax investment", preTaxInvest._id, " now has", preTaxInvest.value);
          break;
        } else {
          transferInvestment(preTaxInvest, allInvestmentsNonRetirement, preTaxInvest.value, investments, year);
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
function transferInvestment(preTaxInvest, allInvestmentsNonRetirement, amountTransfer, investments, year) {
  let nonRetirementMap = new Map(allInvestmentsNonRetirement.map((investment) => [investment.investmentType, investment]));
  let nonRetirementInvestment = nonRetirementMap.get("preTaxInvest.investmentType");

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
      _id: uuidv4(),
      ...structuredClone(preTaxInvest),
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
  }
}

export { performRMDs };
