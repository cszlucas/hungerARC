import React, { useContext, createContext, useState, useEffect } from "react";
import axios from "axios"; // Ensure axios is installed
import { AuthContext } from "./authContext";

// Create Context
export const AppContext = createContext();

export const defaultInfo = {
  "name": "",
  "filingStatus": "single",
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

// Function to retrieve initial scenarios from localStorage or fetch from backend
export const getInitialState = async (user) => {
  try {
      // Check if scenario data already exists in localStorage
      const storedScenarios = JSON.parse(localStorage.getItem("scenarioData"));
      if (storedScenarios) {
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

      if (response.data) {
          console.log("Scenarios fetched from backend:", response.data);
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
      console.log(data);

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
  console.log("Reading from local storage first!");
  const [scenarioData, setScenarioData] = useState(readStateFromLS("scenarioData"));

  const [editMode, setEditMode] = useState(readStateFromLS("edit"));
  const [currScenario, setCurrScenario] = useState(readStateFromLS("currentScenario"));
  const [eventEditMode, setEventEditMode] = useState(readStateFromLS("editEvent")); // this will contain a tuple ex: (income, {some random id})

  const [currInvestments, setCurrInvestments] = useState(readStateFromLS("currentInvestments"));
  const [currInvestmentTypes, setCurrInvestmentTypes] = useState(readStateFromLS("currentInvestmentType"));
  const [takenTaxStatusAccounts, setTakenTaxStatusAccounts] = useState(readStateFromLS("takenTaxStatusAccounts"));

  const [currIncome, setCurrIncome] = useState(readStateFromLS("currentIncome"));  // incomeEvents[],    // income event series
  const [currExpense, setCurrExpense] = useState(readStateFromLS("currentExpense"));   // expenseEvents[],   // expense event series
  const [currInvest, setCurrInvest] = useState(readStateFromLS("currentInvest"));  // investEvents[],    // invest event series
  const [currRebalance, setCurrRebalance] = useState(readStateFromLS("currentRebalance"));   // rebalanceEvents[], // rebalance event series
  

  const { user } = useContext(AuthContext);
  
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
      

      if (editMode !== "new" && editMode !== null) {
        setCurrScenario(getScenarioById(editMode));

        // Wait for each function to resolve before setting state
        const investments = await retrieveScenarioData(editMode, "investments");
        const income = await retrieveScenarioData(editMode, "incomeEvent");
        const expenses = await retrieveScenarioData(editMode, "expenseEvent");
        const invest = await retrieveScenarioData(editMode, "invest");
        const rebalance = await retrieveScenarioData(editMode, "rebalance");
        const investmentTypes = await retrieveScenarioData(editMode, "investmentType");

        const takenTaxStatusAccounts = {};

        for (let i = 0; i < investments.length; i++) {
          const type = investments[i].investmentType;
          const status = investments[i].accountTaxStatus;

          if (takenTaxStatusAccounts[type]) { takenTaxStatusAccounts[type].push(status); } 
          else { takenTaxStatusAccounts[type] = [status]; }
        }


        setCurrInvestments(investments);
        setCurrIncome(income);
        setCurrExpense(expenses);
        setCurrInvest(invest);
        setCurrRebalance(rebalance);
        setCurrInvestmentTypes(investmentTypes);
        setTakenTaxStatusAccounts(takenTaxStatusAccounts);
      } 

      localStorage.setItem("edit", JSON.stringify(editMode));
    };

    loadScenarioData();
  }, [editMode]); // This triggers on reload even if editMode doesnt changes

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
    console.log(eventEditMode);
  }, [eventEditMode]);

  useEffect(() => {
    if (takenTaxStatusAccounts) localStorage.setItem("takenTaxStatusAccounts", JSON.stringify(takenTaxStatusAccounts));
  }, [takenTaxStatusAccounts]);

  // console.log("Current scenarios:", scenarioData);

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
      currInvestmentTypes, setCurrInvestmentTypes,
      takenTaxStatusAccounts, setTakenTaxStatusAccounts,
    }}>
        {children}
    </AppContext.Provider>
  );
};