import React, { useContext, createContext, useState, useEffect } from "react";
import axios from "axios"; // Ensure axios is installed
import { AuthContext } from "./authContext";

// Create Context
export const AppContext = createContext();

const initialState = [
  {
    id: 1,
    name: "Base Scenario",
    filingStatus: "single",
    birthYearUser: 1990,
    lifeExpectancy: {
      type: "fixed",
      fixedAge: 85,
    },

    // scenarioId <- tells the program what scenario the user editing
    // Scenario'sSetOfInvestments: <- fetch(scenarioId, investments))
    
    setOfInvestments: [],
    incomeEventSeries: [],
    expenseEventSeries: [],
    investEventSeries: [],
    rebalanceEventSeries: [],
    inflationAssumption: {
      type: "fixed",
      fixedRate: 2.5, // Default fixed inflation rate in %
    },
    spendingStrategy: [],
    expenseWithdrawalStrategy: [],
    rothConversionStrategy: [],
    rmdStrategy: [],
    optimizerSettings: {
      enabled: true,
      startYear: 2024,
      endYear: 2050,
    },
    financialGoal: 500000, // Default financial goal of $500,000
    stateResident: "NY",
  },
  {
    id: 2,
    name: "Optimistic Growth Scenario",
    filingStatus: "married",
    birthYearUser: 1985,
    lifeExpectancy: {
      type: "fixed",
      fixedAge: 90,
    },
    setOfInvestments: [
      { type: "stocks", percentage: 70 },
      { type: "bonds", percentage: 30 },
    ],
    incomeEventSeries: [{ year: 2025, amount: 80000 }],
    expenseEventSeries: [{ year: 2025, amount: 40000 }],
    investEventSeries: [{ year: 2025, amount: 20000 }],
    rebalanceEventSeries: [],
    inflationAssumption: {
      type: "fixed",
      fixedRate: 3.0, // Higher inflation rate for an optimistic scenario
    },
    spendingStrategy: [],
    expenseWithdrawalStrategy: [],
    rothConversionStrategy: [],
    rmdStrategy: [],
    optimizerSettings: {
      enabled: true,
      startYear: 2025,
      endYear: 2060,
    },
    financialGoal: 1000000, // Higher financial goal of $1M
    stateResident: "CA",
  },
];

const defaultInfo = {
  "name": "",
  "person": "Myself",
  "financialGoal": "",
  "residence": "",
  "birthYear": "",
  "lifeExpectancy": { "type": "fixed", "fixedAge": "" },
  "startYear": "",
  "endYear": "",
  "expenseEventSeries": [],
  "expenseWithdrawalStrategy": [],
  "incomeEventSeries": [],
  "inflationAssumption": { "type": "fixed", "fixedRate": "" },
  "investEventSeries": [],
  "irsLimits": { "initialAfterTax": "" },
  "optimizerSettings": { "enabled": false, "startYear": "", "endYear": "" },
  "rebalanceEventSeries": [],
  "rmdStrategy": [],
  "rothConversionStrategy": [],
  "setOfInvestmentTypes": [],
  "setOfInvestments": [],
  "spendingStrategy": [],
  "__v": 0,
  "_id": ""
};

function transformScenario(input) {
  return {
      // Scenario basic Info
      id: input._id,
      name: input.name || "",
      person: "Myself",
      financialGoal: input.financialGoal || "",
      residence: input.stateResident || "",
      birthYear: input.birthYearUser || "",
      lifeExpectancy: input.lifeExpectancy?.fixedAge || "",
      spouseBirthYear: "", // Not present in input
      spouseLifeExpectancy: "", // Not present in input
      yourSampleAge: "fixed",
      spouseSampleAge: "fixed",
      yourMean: "",
      yourStdDev: "",
      spouseMean: "",
      spouseStdDev: "",
      inflationType: input.inflationAssumption?.type || "none",
      inflationValue: input.inflationAssumption?.fixedRate || "",
      inflationMean: "",
      inflationStdDev: "",
      inflationMin: "",
      inflationMax: "",

      // Investment lists
      investments: input.setOfInvestments || [],
      investmentTypes: input.investmentTypes || [],

      // Event Series
      incomeEvents: input.incomeEventSeries || [],
      expenseEvents: input.expenseEventSeries || [],
      investEvents: input.investEventSeries || [],
      rebalanceEvents: input.rebalanceEventSeries || [],

      // Strategies
      spendingStrategy: input.spendingStrategy || [],
      expenseWithdrawalStrategy: input.expenseWithdrawalStrategy || [],
      rothConversionStrategy: input.rothConversionStrategy || [],
      rmdStrategy: input.rmdStrategy || [],

      // Roth conversion optimizer
      isRothOptimizer: input.optimizerSettings?.enabled || false,
      startYear: input.optimizerSettings?.startYear || "",
      endYear: input.optimizerSettings?.endYear || ""
  };
}

// routes for getting user scenario ids 
// routes for getting user scenario event series and if empty send an object for that event series back

// Function to retrieve initial scenarios from localStorage or fetch from backend
export const getInitialState = async (user) => {
  try {
      // Check if scenario data already exists in localStorage
      const storedScenarios = JSON.parse(localStorage.getItem("scenarioData"));
      if (storedScenarios) {
          console.log("Using cached scenarios from localStorage:", storedScenarios);
          return storedScenarios; // Return cached scenarios if available
      }
      // Retrieve user ID from localStorage
      const userId = user._id;
      if (!userId) {
          console.error("User ID not found in localStorage.");
          return []; // Return an empty list if no user ID
      }

      console.log("Fetching scenarios for user:", userId);
      // Fetch scenarios from the backend
      const response = await axios.get(`http://localhost:8080/user/${userId}/scenarios`); // Adjust API route
      console.log("response: ");
      console.log(response);

      if (response.data) {
          console.log("Scenarios fetched from backend:", response.data);
          // const transformedScenarios = response.data.map(transformScenario); // Transform each scenario
          // localStorage.setItem("scenarioData", JSON.stringify(transformedScenarios)); // Cache in localStorage
          // return transformedScenarios;
          localStorage.setItem("scenarioData", JSON.stringify(response.data));
          return response.data;
      }

      return []; // Return empty if no data
  } catch (error) {
      console.error("Error fetching scenarios:", error);
      return []; // Return empty if an error occurs
  }
};

const readStateFromLS = (key_value) => {
  const storedState = localStorage.getItem(key_value);
  return storedState ? JSON.parse(storedState) : null;
};

const retrieveScenarioData = async (scenarioId, dataType) => {
  try {
      const validTypes = ["investments", "incomeEvent", "expenseEvent", "invest", "rebalance", "investmentType"];
      
      if (!validTypes.includes(dataType)) {
          console.error(`Invalid data type: ${dataType}`);
          return;
      }

      const response = await axios.get(`http://localhost:8080/scenario/${scenarioId}/${dataType}`);
      const data = response.data || [];
      localStorage.setItem(`current${capitalizeFirstLetter(dataType)}`, JSON.stringify(data));

      console.log(`Data for ${dataType} stored in localStorage.`);
      return data;
  } catch (error) {
      console.error(`Error retrieving ${dataType}:`, error);
  }
};

// Helper function to capitalize the first letter of the data type
const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

// Context Provider Component
export const AppProvider = ({ children }) => {
  const [scenarioData, setScenarioData] = useState(readStateFromLS("scenarioData"));
  const [editMode, setEditMode] = useState(readStateFromLS("edit"));
  const [eventEditMode, setEventEditMode] = useState(readStateFromLS("editEvent")); // this will contain a tuple ex: (income, {some random id})
  
  //individual events
  const [currScenario, setCurrScenario] = useState(readStateFromLS("currentScenario"));
  // const [indieInvest, setIndieInvest] = useState(readStateFromLS('indieInvest'));
  // const [indieIncome, setIndieIncome] = useState(readStateFromLS('indieIncome'));
  // const [indieExpense, setIndieExpense] = useState(readStateFromLS('indieExpense'));
  // const [indieRebalance, setIndieRebalance] = useState(readStateFromLS('indieRebalance'));
  const { user } = useContext(AuthContext);

  //all stuff:
  console.log("reading from local storage for event series!!!");
  const [currInvestments, setCurrInvestments] = useState(readStateFromLS("currentInvestments"));
  const [currIncome, setCurrIncome] = useState(readStateFromLS("currentIncome"));  // incomeEvents[],    // income event series
  const [currExpense, setCurrExpense] = useState(readStateFromLS("currentExpense"));   // expenseEvents[],   // expense event series
  const [currInvest, setCurrInvest] = useState(readStateFromLS("currentInvest"));  // investEvents[],    // invest event series
  const [currRebalance, setCurrRebalance] = useState(readStateFromLS("currentRebalance"));   // rebalanceEvents[], // rebalance event series
  const [currInvestmentTypes, setCurrInvestmentTypes] = useState(readStateFromLS("currentInvestmentType"));

  // console.log(transformScenario(initialState[0]));
  
  useEffect(() => {
    const fetchData = async () => {
      const data = await getInitialState(user);  // Await the resolved data
      setScenarioData(data);  // Set the resolved data, not the Promise
    };
    if (user) { fetchData(); }
  }, [user]);  // Trigger a refetch when user changes
  
  useEffect(() => {
    const getScenarioById = (id) => {
        for (let i = 0; i < scenarioData.length; i++) {
            if (scenarioData[i]._id == id) {
                return scenarioData[i]; // Return the found scenario
            }
        }
        return null; // Return null if not found
    };

    const loadScenarioData = async () => {
        // console.log(scenarioData);
        localStorage.setItem("edit", JSON.stringify(editMode));

        if (editMode !== "new" && editMode !== null) {
            setCurrScenario(getScenarioById(editMode));

            // Wait for each function to resolve before setting state
            const investments = await retrieveScenarioData(editMode, "investments");
            const income = await retrieveScenarioData(editMode, "incomeEvent");
            const expenses = await retrieveScenarioData(editMode, "expenseEvent");
            const invest = await retrieveScenarioData(editMode, "invest");
            const rebalance = await retrieveScenarioData(editMode, "rebalance");
            const investmentTypes = await retrieveScenarioData(editMode, "investmentType");

            console.log(income);
            console.log(expenses);
            console.log(rebalance);
            console.log(invest);

            setCurrInvestments(investments);
            setCurrIncome(income);
            setCurrExpense(expenses);
            setCurrInvest(invest);
            setCurrRebalance(rebalance);
            setCurrInvestmentTypes(investmentTypes);
        }
        else
        {
          setCurrScenario(defaultInfo);
          setCurrInvestments([]);
          setCurrIncome([]);
          setCurrExpense([]);
          setCurrInvest([]);
          setCurrRebalance([]);
          setCurrInvestmentTypes([]);
        }
    };

    loadScenarioData();
}, [editMode]);


  // useEffect(() => {
  //   switch (eventEditMode.type) {
  //     case "Income":
          
  //         break;
  //     case "Expense":
  //         dayName = "Monday";
  //         break;
  //     case "Invest":
  //         dayName = "Tuesday";
  //         break;
  //     case "Rebalance":
  //         dayName = "Wednesday";
  //         break;
  //     default:
  //         dayName = "Invalid day";
  // }

  // }, [eventEditMode]);

  useEffect(() => {
    // Load user data from localStorage
    console.log("changing current scenario");
    //console.log(currScenario.expenseWithdrawalStrategy);
    localStorage.setItem("currentScenario", JSON.stringify(currScenario));
  }, [currScenario]);

  useEffect(() => {
    // Load user data from localStorage
    console.log("oop this got all scenarios got changed");
    localStorage.setItem("scenarioData", JSON.stringify(scenarioData));
  }, [scenarioData]);


  useEffect(() => {
    if (currScenario) localStorage.setItem("currentScenario", JSON.stringify(currScenario));
  }, [currScenario]);

  useEffect(() => {
      if (currInvestments) localStorage.setItem("currentInvestments", JSON.stringify(currInvestments));
  }, [currInvestments]);

  useEffect(() => {
      if (currIncome) localStorage.setItem("currentIncome", JSON.stringify(currIncome));
  }, [currIncome]);

  useEffect(() => {
      if (currExpense) localStorage.setItem("currentExpense", JSON.stringify(currExpense));
  }, [currExpense]);

  useEffect(() => {
      if (currInvest) localStorage.setItem("currentInvest", JSON.stringify(currInvest));
  }, [currInvest]);

  useEffect(() => {
      if (currRebalance) localStorage.setItem("currentRebalance", JSON.stringify(currRebalance));
  }, [currRebalance]);

  useEffect(() => {
      if (currInvestmentTypes) localStorage.setItem("currentInvestmentType", JSON.stringify(currInvestmentTypes));
  }, [currInvestmentTypes]);

  useEffect(() => {
    if (eventEditMode) localStorage.setItem("editEvent", JSON.stringify(eventEditMode));
  }, [eventEditMode]);

  console.log("Current scenarios:", scenarioData);

  return (
    <AppContext.Provider value={{ 
      scenarioData, setScenarioData, 
      editMode, setEditMode,
      eventEditMode, setEventEditMode,
      currScenario, setCurrScenario,
      currInvestments, setCurrInvestments, 
      currIncome, setCurrIncome,
      currExpense, setCurrExpense,
      currInvest, setCurrInvest,
      currRebalance, setCurrRebalance,
      currInvestmentTypes, setCurrInvestmentTypes
    }}>
        {children}
    </AppContext.Provider>
  );
};