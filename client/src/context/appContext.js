import React, { createContext, useState, useEffect } from "react";
import axios from "axios"; // Ensure axios is installed

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
  // Scenario basic Info
  name: '',
  person: 'Myself', 
  financialGoal: '',
  residence: '',  
  birthYear: '', 
  lifeExpectancy: '', 
  spouseBirthYear: '',
  spouseLifeExpectancy: '',
  yourSampleAge: 'Custom',
  spouseSampleAge: 'Custom',
  yourMean: '',
  yourStdDev: '',
  spouseMean: '',
  spouseStdDev: '',
  inflationType: 'None',
  inflationValue: '', 
  inflationMean: '', 
  inflationStdDev: '',
  inflationMin: '',
  inflationMax: '',

  // investment lists
  investments: [],

  // Event Series
  incomeEvents: [],    // income event series
  expenseEvents: [],   // expense event series
  investEvents: [],    // invest event series
  rebalanceEvents: [], // rebalance event series

  // Strategies
  spendingStrategy: [],
  expenseWithdrawalStrategy: [],
  rothConversionStrategy: [],
  rmdStrategy: [],

  // roth conversion optimizer:
  isRothOptimizer: false,
  startYear: '',
  endYear: ''
};

function transformScenario(input) {
  return {
      // Scenario basic Info
      name: input.name || '',
      person: 'Myself',
      financialGoal: input.financialGoal || '',
      residence: input.stateResident || '',
      birthYear: input.birthYearUser || '',
      lifeExpectancy: input.lifeExpectancy?.fixedAge || '',
      spouseBirthYear: '', // Not present in input
      spouseLifeExpectancy: '', // Not present in input
      yourSampleAge: 'Custom',
      spouseSampleAge: 'Custom',
      yourMean: '',
      yourStdDev: '',
      spouseMean: '',
      spouseStdDev: '',
      inflationType: input.inflationAssumption?.type || 'None',
      inflationValue: input.inflationAssumption?.fixedRate || '',
      inflationMean: '',
      inflationStdDev: '',
      inflationMin: '',
      inflationMax: '',

      // Investment lists
      investments: input.setOfInvestments || [],

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
      startYear: input.optimizerSettings?.startYear || '',
      endYear: input.optimizerSettings?.endYear || ''
  };
}

// routes for getting user scenario ids 
// routes for getting user scenario event series and if empty send an object for that event series back

// Function to retrieve initial scenarios from localStorage or fetch from backend
const getInitialState = () => {
  try {
    // Check if scenario data already exists in localStorage
    const storedScenarios = JSON.parse(localStorage.getItem("scenarioData"));
    if (storedScenarios) {
      console.log("Using cached scenarios from localStorage:", storedScenarios);
      return storedScenarios; // Return cached scenarios if available
    }

    // Retrieve user ID from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?._id;

    if (!userId) {
      console.error("User ID not found in localStorage.");
      return []; // Return an empty list if no user ID
    }

    console.log("Fetching scenarios for user:", userId);

    // Fetch scenarios from the backend synchronously (IIFE + promise handling)
    (async () => {
      try {
        const response = await axios.get(`http://localhost:8080/user/${userId}/scenarios`); // Adjusted API route

        if (response.data) {
          console.log("Scenarios fetched from backend:", response.data);
          localStorage.setItem("scenarioData", JSON.stringify(response.data)); // Cache in localStorage
        }
      } catch (error) {
        console.error("Error fetching scenarios from backend:", error);
      }
    })();

    return []; // Temporarily return an empty list until fetch completes
  } catch (error) {
    console.error("Error retrieving scenarios:", error);
    return []; // Return empty list if an error occurs
  }
};

const getInitialEditState = () => {
  const storedEditMode = localStorage.getItem("editMode");
  return storedEditMode ? JSON.parse(storedEditMode) : null;
}


// Context Provider Component
export const AppProvider = ({ children }) => {
  const [scenarioData, setScenarioData] = useState(getInitialState);
  const [editMode, setEditMode] = useState(getInitialEditState);
  // const [editMode, setEditMode] = useState(1);
  const [basicInfo, setBasicInfo] = useState(null);
  // const [loading, setLoading] = useState(false); // To track API request
  //edit mode (set scenario id)
  console.log(transformScenario(initialState[0]));
  //PUT THIS SOMEWHERE FOR EDITING:
  // const { setEditMode } = useContext(AppContext);

  // const startEditing = (scenarioId) => {
  //     setEditMode({ scenarioId });
  // };

  useEffect(() => {
    // Load user data from localStorage
    localStorage.setItem("edit", JSON.stringify(editMode));
  }, [editMode]);



  // (basic info based on editMode)
  // useEffect(() => {
  //   if (editMode && editMode.scenarioId) {
  //       const timeout = setTimeout(() => {
  //           setBasicInfo(defaultBasicInfo);
  //           localStorage.setItem("basics", JSON.stringify(defaultBasicInfo)); // Save defaults in localStorage
  //       }, 5000);

  //       axios.get(`/api/scenarios/basics/${editMode.scenarioId}`)
  //           .then(response => {
  //               if (response.data && Object.keys(response.data).length > 0) {
  //                   setBasicInfo(response.data);
  //                   localStorage.setItem("basics", JSON.stringify(response.data)); // Store in localStorage
  //               } else {
  //                   setBasicInfo(defaultBasicInfo);
  //                   localStorage.setItem("basics", JSON.stringify(defaultBasicInfo)); // Store defaults in localStorage
  //               }
  //           })
  //           .catch(() => {
  //               setBasicInfo(defaultBasicInfo);
  //               localStorage.setItem("basics", JSON.stringify(defaultBasicInfo)); // Store defaults in localStorage
  //           })
  //           .finally(() => {
  //               clearTimeout(timeout);
  //           });
  //   } else {
  //       console.log("editMode is null");
  //       setBasicInfo(defaultBasicInfo);
  //       localStorage.setItem("basics", JSON.stringify(defaultBasicInfo)); // Reset in localStorage
  //   }
  // }, [editMode]);

  console.log("Current scenarios:", scenarioData);

  return (
    <AppContext.Provider value={{ editMode, setEditMode, basicInfo, setBasicInfo, scenarioData, setScenarioData}}>
      {children}
    </AppContext.Provider>
  );
};