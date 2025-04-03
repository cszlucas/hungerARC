const axios = require("axios");
const { BaseEventSeries, IncomeEvent, ExpenseEvent, InvestEvent, RebalanceEvent, AnnualChange } = require("../models/eventSeries.js");
const InvestmentType = require("../models/investmentType.js");
const Investment = require("../models/investment.js");
const { ObjectId } = require("mongoose");

async function Income() {
  try {
    const incomeEventData = new IncomeEvent({
      eventSeriesName: "income1980-2000",
      description: "Income event series from 2020-2025.",
      startYear: {
        type: "year",
        year: 1980,
      },
      duration: {
        type: "fixedAmt",
        value: 20,
      },
      eventName: "Salary",
      eventDate: new Date("2025-01-01"),
      initialAmount: 50000,
      annualChange: {
        type: "fixed",
        amount: 5000,
      },
      userPercentage: 0.15,
      inflationAdjustment: false,
      isSocialSecurity: false,
    });

    // const response = await axios.post("http://localhost:8080/incomeEvent", incomeEventData);

    const incomeEventData2 = new IncomeEvent({
      eventSeriesName: "income1970-2000",
      description: "Income events series from 1990-2000.",
      startYear: {
        type: "year",
        year: 1970,
      },
      duration: {
        type: "fixedAmt",
        value: 10,
      },
      eventName: "Salary",
      eventDate: new Date("2025-01-01"),
      initialAmount: 500,
      annualChange: {
        type: "fixed",
        amount: 25,
      },
      userPercentage: 0.15,
      inflationAdjustment: false,
      isSocialSecurity: false,
    });

    // const update = await axios.post("http://localhost:8080/updateIncome/67df3c2523356bddab87a00e", incomeEventData2);
    // console.log("Anything?", update.data);
  } catch (error) {
    console.error("Error fetching income:", error);
  }
}

async function Expense() {
  try {
    const expenseEventData = new ExpenseEvent({
      eventSeriesName: "Expense 1980-1990",
      description: "Expense event series from 2023-2025.",
      startYear: {
        type: "year",
        year: 2023,
      },
      duration: {
        type: "fixedAmt",
        value: 4,
      },
      eventName: "Rent",
      eventDate: new Date("2025-01-01"),
      initialAmount: 1200,
      annualChange: {
        type: "fixed",
        amount: 5000,
      },
      userPercentage: 0.3,
      inflationAdjustment: true,
      isDiscretionary: true,
    });

    // const response = await axios.post("http://localhost:8080/expenseEvent", expenseEventData);

    const expenseEventData2 = new ExpenseEvent({
      eventSeriesName: "Expense 2003-1990",
      description: "Expense event series from 2023-2025.",
      startYear: {
        type: "year",
        year: 2023,
      },
      duration: {
        type: "fixedAmt",
        value: 10,
      },
      eventName: "Rent",
      eventDate: new Date("1990-01-01"),
      initialAmount: 1200,
      annualChange: {
        type: "fixed",
        amount: 5000,
      },
      userPercentage: 0.3,
      inflationAdjustment: true,
      isDiscretionary: true,
    });

    // const update = await axios.post("http://localhost:8080/updateExpense/67df55b6e8d21a88223976e0", expenseEventData2);
  } catch (error) {
    console.error("Error fetching income:", error);
  }
}

async function Investments() {
  try {
    const investmentType1 = new InvestmentType({
      name: "Bond Fund",
      description: "A conservative investment type focused on bonds.",
      annualReturn: {
        type: "normalPercent",
        mean: 0.05,
        stdDev: 0.1,
      },
      expenseRatio: 0.01,
      annualIncome: {
        type: "fixedPercent",
        fixed: 5,
        mean: 0.04,
        stdDev: 0.05,
      },
      taxability: "tax-deferred",
    });

    //const type = await axios.post("http://localhost:8080/investmentType", investmentType1);

    // const invest1 = new Investment({
    //   investmentType: type.data._id,
    //   value: 100,
    //   accountTaxStatus: "pre-tax",
    // });
    // const inv = await axios.get("http://localhost:8080/getInvestment/67df68e520abee9d9188b03e");
    // console.log(inv.data);

    //const inv = await axios.post("http://localhost:8080/investment", invest1);

    const investmentType22 = new InvestmentType({
      name: "Equity Fund",
      description: "A high-risk investment focusing on stocks.",
      annualReturn: {
        type: "normalPercent",
        mean: 0.05,
        stdDev: 0.1,
      },
      expenseRatio: 0.02,
      annualIncome: {
        type: "fixedPercent",
        fixed: 5,
        mean: 0.04,
        stdDev: 0.05,
      },
      taxability: "taxable",
    });

    // const type2 = await axios.post("http://localhost:8080/investmentType", investmentType22);

    // Now create and save the Investment
    // const invest2 = new Investment({
    //   investmentType: type2.data._id,
    //   value: 50,
    //   accountTaxStatus: "non-tax",
    // });

    // const inv2 = await axios.post("http://localhost:8080/investment", invest2);

    //UPDATE

    // const investmentType2 = new InvestmentType({
    //   name: "Bond Fund",
    //   description: "idk.",
    //   annualReturn: {
    //     type: "normalPercent",
    //     mean: 0.05,
    //     stdDev: 0.1,
    //   },
    //   expenseRatio: 0.01,
    //   annualIncome: {
    //     type: "fixedPercent",
    //     fixed: 5,
    //     mean: 10,
    //     stdDev: 0.05,
    //   },
    //   taxability: "tax-deferred",
    // });

    // const update = await axios.post("http://localhost:8080/updateInvestmentType/67df68e520abee9d9188b03a", investmentType2);

    // const invest2 = new Investment({
    //   investmentType: update.data._id, // Reference the saved InvestmentType by ObjectId
    //   value: 10,
    //   accountTaxStatus: "non-tax",
    // });

    // const updateInvest = await axios.post("http://localhost:8080/updateInvestment/67df68e520abee9d9188b03e", invest2);
  } catch (error) {
    console.error("Error updating:", error);
  }
}

async function Users() {
  try {
    const scenarios = await axios.get("http://localhost:8080/user/67df2402ff2657feabd8c721/scenarios");
    console.log(scenarios.data);
  } catch (error) {
    console.error("Error updating:", error);
  }
}

async function InvestStrat() {
  try {
    const strategy1 = new InvestEvent({
      eventSeriesName: "Invest 2020-2023",
      description: "Invest event series from 2020-2023.",
      startYear: {
        type: "year",
        year: 2020,
      },
      duration: {
        type: "fixedAmt",
        value: 1,
      },
      type: "fixed",
      fixedPercentages: {
        ["67df68e520abee9d9188b03e"]: 30,
        ["67df7a358d16d4c00df75a72"]: 70,
      },
      maxCash: 20,
    });

    const savedStrategy1 = await axios.post("http://localhost:8080/scenario/67e0b7dc0de0ec503315d62f/investStrategy", strategy1);
  

    const investStrategyUpdate = new InvestEvent({
      eventSeriesName: "Invest Updated",
      description: "Invest Updated from 2020-2023.",
      startYear: {
        type: "year",
        year: 2020,
      },
      duration: {
        type: "fixedAmt",
        value: 1,
      },
      type: "fixed",
      fixedPercentages: {
        ["67df68e520abee9d9188b03a"]: 50,
        ["67df7a358d16d4c00df75a72"]: 50,
      },
      maxCash: 100,
    });

    // const stratUpdate = await axios.post("http://localhost:8080/updateInvestStrategy/67e0231960ef0d6621b94d5e", investStrategyUpdate);

    // const strategy = await axios.get("http://localhost:8080/getInvestStrategy/67e0231960ef0d6621b94d5e");
    // console.log(strategy.data);
  } catch (error) {
    console.error("Error updating:", error);
  }
}

async function RebalanceStrat() {
  try {

    const newAssetAllocation = ({
      type: 'glidePath',
      initialPercentages: {
        ["67df68e520abee9d9188b03a"]: .60,
        ["67df7a358d16d4c00df75a72"]: .40,
      },
      finalPercentages: {
        ["67df68e520abee9d9188b03a"]: .30,
        ["67df7a358d16d4c00df75a72"]: .70,
      }
    });

    const reb = new RebalanceEvent({
      eventSeriesName: "Rebalance Zoe",
      description: "Rebalance event series 2023-2025",
      startYear: {
        type: "year",
        year: 2023,
      },
      duration: {
        type: "fixedAmt",
        value: 2,
      },
      taxStatus: "non-retirement",
      rebalanceAllocation: {
        type: newAssetAllocation.type,  // Use the type from the request
        initialPercentages: newAssetAllocation.initialPercentages,
        finalPercentages: newAssetAllocation.finalPercentages,
      },
    });

    const strategy = await axios.post("http://localhost:8080/scenario/67e0b7dc0de0ec503315d62f/rebalanceStrategy", reb);

    // const rebUpdate = new RebalanceEvent({
    //   eventSeriesName: "Rebalance update",
    //   description: "Rebalance update 2023-2025",
    //   startYear: {
    //     type: "year",
    //     year: 2023,
    //   },
    //   duration: {
    //     type: "fixedAmt",
    //     value: 2,
    //   },
    //   taxStatus: "non-retirement",
    //   type: "glidePath",
    //   initialPercentages: {
    //     ["67df68e520abee9d9188b03a"]: 60,
    //     ["67df7a358d16d4c00df75a72"]: 40,
    //   },
    //   finalPercentages: {
    //     ["67df68e520abee9d9188b03a"]: 30,
    //     ["67df7a358d16d4c00df75a72"]: 70,
    //   },
    // });

    // const strategy = await axios.post("http://localhost:8080/updateRebalanceStrategy/67e0256ecfc4989ce1dcf568", rebUpdate);

    // const getStrategy = await axios.get("http://localhost:8080/getRebalanceStrategy/67e0256ecfc4989ce1dcf568");
    // console.log(getStrategy.data);
  } catch (error) {
    console.error("Error updating:", error);
  }
}

//Income();
//Expense();
//Investments();
//Users();
//InvestStrat();
RebalanceStrat();
