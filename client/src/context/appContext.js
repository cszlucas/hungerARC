import React, { useContext, createContext, useState, useEffect } from "react";
import axios from "axios"; // Ensure axios is installed
import { AuthContext } from "./authContext";

// Create Context
export const AppContext = createContext();

export const defaultInfo = {
  "name": "",
  "filingStatus": "single",
  "financialGoal": "",
  "stateResident": "New York",
  "birthYearUser": "",
  "lifeExpectancy": { "type": "fixed", "fixedAge": "" },
  "birthYearSpouse": "",
  "lifeExpectancySpouse": { "type": "fixed", "fixedAge": "" },
  "expenseEventSeries": [],
  "expenseWithdrawalStrategy": [],
  "incomeEventSeries": [],
  "inflationAssumption": { "type": "fixed", "fixedRate": "" },
  "investEventSeries": [],
  "irsLimit": "",
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

      // console.log("Fetching scenarios for user:", userId);
      // Fetch scenarios from the backend
      const response = await axios.get(`http://localhost:8080/user/${userId}/scenarios`); // Adjust API route

      if (response.data) {
          // console.log("Scenarios fetched from backend:", response.data);
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
  if (key_value === "edit") console.log(JSON.parse(storedState));
  return storedState ? JSON.parse(storedState) : null;
};

const retrieveScenarioData = async (scenarioId, dataType) => {
  try {
      const validTypes = ["investments", "incomeEvent", "expenseEvent", "invest", "rebalance", "investmentType"];
      
      const validTypesMap = {
        "investments": "currentInvestments", 
        "incomeEvent": "currentIncome",
        "expenseEvent": "currentExpense",
        "invest": "currentInvest",
        "rebalance": "currentRebalance",
        "investmentType": "currentInvestmentType",
      };

      if (!validTypes.includes(dataType)) {
          console.error(`Invalid data type: ${dataType}`);
          return;
      }
      
      const response = await axios.get(`http://localhost:8080/scenario/${scenarioId}/${dataType}`);
      const data = response.data || [];
      localStorage.setItem(`${validTypesMap[dataType]}`, JSON.stringify(data));
      
      return data;
  } catch (error) {
      console.error(`Error retrieving ${dataType}:`, error);
  }
};

// Helper function to capitalize the first letter of the data type
const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

// Context Provider Component
export const AppProvider = ({ children }) => {
  // console.log("Reading from local storage first!");
  const [scenarioData, setScenarioData] = useState(readStateFromLS("scenarioData"));

  const [editMode, setEditMode] = useState(readStateFromLS("edit"));
  const [currScenario, setCurrScenario] = useState(readStateFromLS("currentScenario"));
  const [eventEditMode, setEventEditMode] = useState(readStateFromLS("editEvent")); // this will contain a tuple ex: (income, {some random id})

  const [currInvestments, setCurrInvestments] = useState(readStateFromLS("currentInvestments") || []);
  const [currInvestmentTypes, setCurrInvestmentTypes] = useState(readStateFromLS("currentInvestmentType") || []);
  const [takenTaxStatusAccounts, setTakenTaxStatusAccounts] = useState(readStateFromLS("takenTaxStatusAccounts") || []);

  const [currIncome, setCurrIncome] = useState(readStateFromLS("currentIncome") || []);  // incomeEvents[],    // income event series
  const [currExpense, setCurrExpense] = useState(readStateFromLS("currentExpense") || []);   // expenseEvents[],   // expense event series
  const [currInvest, setCurrInvest] = useState(readStateFromLS("currentInvest") || []);  // investEvents[],    // invest event series
  const [currRebalance, setCurrRebalance] = useState(readStateFromLS("currentRebalance") || []);   // rebalanceEvents[], // rebalance event series
  
  const [tempExploration, setTempExploration] = useState(readStateFromLS("tempExploration") || []); 
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchData = async () => {
      const data = await getInitialState(user);  // Await the resolved data
      setScenarioData(data);  // Set the resolved data, not the Promise
    };
    if (user) { fetchData(); }
  }, [user]);  // Trigger a refetch when user changes
  
  useEffect(() => {
    localStorage.setItem("edit", JSON.stringify(editMode));
  
    const loadScenarioData = async () => {
      if (!editMode || editMode === "new" || user.guest) return;
  
      const getScenarioById = (id) => scenarioData?.find((scenario) => scenario._id === id) || null;
  
      const scenario = getScenarioById(editMode);
      setCurrScenario(scenario);
  
      const dataTypes = [
        { key: "investments", setter: setCurrInvestments },
        { key: "incomeEvent", setter: setCurrIncome },
        { key: "expenseEvent", setter: setCurrExpense },
        { key: "invest", setter: setCurrInvest },
        { key: "rebalance", setter: setCurrRebalance },
        { key: "investmentType", setter: setCurrInvestmentTypes },
      ];
  
      const results = await Promise.all(
        dataTypes.map(({ key }) => retrieveScenarioData(editMode, key))
      );
  
      results.forEach(({ key, setter }, i) => dataTypes[i].setter(results[i]));
  
      const investments = results[0];
      console.log(investments);
  
      const takenTaxStatusAccounts = investments.reduce((acc, inv) => {
        const { investmentType: type, accountTaxStatus: status } = inv;
        if (!acc[type]) acc[type] = [];
        acc[type].push(status);
        return acc;
      }, {});
  
      setTakenTaxStatusAccounts(takenTaxStatusAccounts);
      setTempExploration([]);
    };
  
    loadScenarioData();
  }, [editMode]);  

  useEffect(() => {
    localStorage.setItem("scenarioData", JSON.stringify(scenarioData));
  }, [scenarioData]);

  useEffect(() => {
    localStorage.setItem("currentScenario", JSON.stringify(currScenario));
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
    localStorage.setItem("editEvent", JSON.stringify(eventEditMode));
  }, [eventEditMode]);

  useEffect(() => {
    if (takenTaxStatusAccounts) localStorage.setItem("takenTaxStatusAccounts", JSON.stringify(takenTaxStatusAccounts));
  }, [takenTaxStatusAccounts]);

  useEffect(() => {
    if (tempExploration) localStorage.setItem("tempExploration", JSON.stringify(tempExploration));
  }, [tempExploration]);
  

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
      tempExploration, setTempExploration,
    }}>
        {children}
    </AppContext.Provider>
  );
};