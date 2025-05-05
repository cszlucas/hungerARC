import React, { useState, useContext, useEffect } from "react";
import { 
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, Alert,
} from "@mui/material";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import PageHeader from "../../components/pageHeader";
import {
  stackStyles, titleStyles, textFieldStyles, backContinueContainerStyles, buttonStyles, rowBoxStyles,
} from "../../components/styles";  // Import your modular styles
import CustomInput from "../../components/customInputBox";
import CustomShare from "../../components/customShareBtn";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/appContext";
import { AuthContext } from "../../context/authContext";
import { useAlert } from "../../context/alertContext";

import axios from "axios";
import { exportToYAML } from "./import-export/export";
import DimensionalExploration from "../explore";
// import investment from "../../../../server/models/investment";


const RunSimulation = () => {
  const [numSimulations, setNumSimulations] = useState("1");
  const {currScenario, currInvestmentTypes, currInvestments, currIncome, currExpense, currInvest, currRebalance, tempExploration} = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [unfilledError, setUnfilledError] = useState(false);
  const [minMaxError, setMinMaxError] = useState(false);

  const handleExport = () => {
    exportToYAML({
      currScenario,
      currInvestmentTypes,
      currInvestments,
      currIncome,
      currExpense,
      currInvest,
      currRebalance
    });
  };

  const navigate = useNavigate();

  const getChartData = async () => {
    try {
      const rmdData = await axios.get("http://localhost:8080/runSimulation");
      
      const entireFormData = {
        investmentType: currInvestmentTypes,
        investment: currInvestments,
        expense: currExpense,
        income: currIncome,
        invest: currInvest,
        rebalance: currRebalance,
        scenario: currScenario,
        exploration: tempExploration,
        simulationCount: numSimulations,
        rmd: rmdData,
        userId: user.guest ? "guest" : user._id 
      };

      // console.log(entireFormData);
      const response = await axios.get("http://localhost:8080/runSimulation", {
        params: entireFormData,
      });

      if (tempExploration.length == 0)
      {
        navigate("/charts", {
          state: { chartData: response.data }
        });
      }
      else if (tempExploration.length == 1)
      {
        navigate("/ode", {
          state: { chartData: response.data }
        });
      }
      else
      {
        navigate("/tde", {
          state: { chartData: response.data }
        });
      }
  
      // return response.data; // optional: just return the data, not the whole Axios response
    } catch (error) {
      console.error("Error fetching simulation data:", error);
      throw error; // rethrow if you want to handle it outside
    }
  };

  const checkForErrors = () => {
    let flag = false;
    function checkValidNum(eventValue) {
      return eventValue >= 0 && typeof eventValue === "number" && !isNaN(eventValue);
    }

    const validInputs = currScenario.name
      && checkValidNum(currScenario.financialGoal)
      && currScenario.stateResident
      && checkValidNum(currScenario.birthYearUser) 
      && (currScenario.lifeExpectancy.type !== "fixed" 
        || checkValidNum(currScenario.lifeExpectancy.fixedAge))
      && (currScenario.lifeExpectancy.type !== "normal" 
        || (checkValidNum(currScenario.lifeExpectancy.mean) && checkValidNum(currScenario.lifeExpectancy.stdDev)))
      && (currScenario.filingStatus !== "married" 
        || (checkValidNum(currScenario.birthYearSpouse) 
          && (currScenario.lifeExpectancySpouse.type !== "fixed" 
            || checkValidNum(currScenario.lifeExpectancySpouse.fixedAge))
          && (currScenario.lifeExpectancySpouse.type !== "normal" 
            || (checkValidNum(currScenario.lifeExpectancySpouse.mean) && checkValidNum(currScenario.lifeExpectancySpouse.stdDev)))))
      && checkValidNum(currScenario.irsLimit)
      && (currScenario.inflationAssumption.type !== "fixed" || checkValidNum(currScenario.inflationAssumption.fixedRate))
      && (currScenario.inflationAssumption.type !== "normal" 
        || (checkValidNum(currScenario.inflationAssumption.mean) && checkValidNum(currScenario.inflationAssumption.stdDev)))
      && (currScenario.inflationAssumption.type !== "uniform" 
        || (checkValidNum(currScenario.inflationAssumption.min) && checkValidNum(currScenario.inflationAssumption.max)));
    
    if (!validInputs) {
      showAlert("All of Scenario's basic info must be filled.", "error");
      flag = true;
    }
    
    if (currScenario.inflationAssumption.type === "uniform" 
    && (checkValidNum(currScenario.inflationAssumption.min) && checkValidNum(currScenario.inflationAssumption.max)
    && currScenario.inflationAssumption.min > currScenario.inflationAssumption.max)) {
      showAlert("Inflation Assumpation Min is greater then Max.", "error");
      flag = true;
    }

    if (tempExploration.length === 2 && (tempExploration[0].type === "Roth Optimizer Flag" || tempExploration[1] === "Roth Optimizer Flag")) {
      showAlert("2-Dimensional Exploration can not contain non-numeric parameters (e.g., Roth Conversion Optimizer).", "error");
      flag = true;
    }
    return flag;
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>
        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Congratulations on completing your scenario!
          </Typography>

          {/* Use marginLeft: auto to push the Box to the right */}
          <Box direction="row" spacing={2} sx={{ display: "flex", gap: 2, marginLeft: "auto", marginTop: 2 }}>
            <CustomShare/>

            <Button
              variant="contained"
              sx={{
                ...buttonStyles,
                backgroundColor: "#c98bc0", // Custom background color for Export button
                "&:hover": {
                  backgroundColor: "#a67a99", // Optionally set hover color
                },
              }}
              onClick={handleExport}
            >
              Export
            </Button>

            <Button
              variant="contained"
              sx={{
                ...buttonStyles,
                backgroundColor: "#61afc9", // Custom background color for Save & Exit button
                "&:hover": {
                  backgroundColor: "#59a8c2", // Optionally set hover color
                },
              }}
              onClick={() => navigate("/scenario/scenarios")}
            >
              Save & Exit
            </Button>
          </Box>
        </Stack>

        <PageHeader />

        {/* Stack for title and save button */}
        <Box sx={rowBoxStyles} justifyContent="space-between">
          <Box>
            <Typography variant="h5" sx={{fontWeight: "bold", mb: 3}}>
              Simulation
            </Typography>
            <CustomInput
              title='Number of times to run'
              type='number'
              value={numSimulations}
              setValue={setNumSimulations}
              inputProps={{ min: "1" }}
            />
          </Box>
          <Box>
            <DimensionalExploration/>
          </Box>
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles}
            onClick={() => navigate("/scenario/strategies")}
          >
            Back
          </Button>
          <Button variant="contained" color="secondary" sx={buttonStyles}
            onClick={() => {
              if (!checkForErrors()) getChartData();
            }}
          >
            Run Simulation
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default RunSimulation;
