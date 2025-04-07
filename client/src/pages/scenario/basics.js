import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, Backdrop, Fade, Paper
} from "@mui/material";

import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import PageHeader from "../../components/pageHeader";
import CustomInput from "../../components/customInputBox";
import CustomToggle from "../../components/customToggle";
import CustomDropdown from "../../components/customDropDown";
import CustomSave from "../../components/customSaveBtn";
import {
  stackStyles, titleStyles, textFieldStyles, backContinueContainerStyles, buttonStyles, rowBoxStyles,
} from "../../components/styles";
import { AppContext } from "../../context/appContext";

const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const Basics = () => {
  const { currScenario, setCurrScenario, scenarioData, setScenarioData } = useContext(AppContext);
  const {editMode, setEditMode} = useContext(AppContext);

  const [showBackdrop, setShowBackdrop] = useState(false);
  const [errorBackdrop, setErrorBackdrop] = useState(false);
  const navigate = useNavigate();

  // Unified handle input change function
  const handleInputChange = (field, value) => {
    const fieldParts = field.split("."); // Split the field into parts (e.g., "lifeExpectancy.mean")
  
    setCurrScenario((prev) => {
      // Update the nested object
      if (fieldParts.length === 2) {
        const [parent, child] = fieldParts; // 'lifeExpectancy' and 'mean'
        return {
          ...prev,
          [parent]: { // Spread the parent object (lifeExpectancy)
            ...prev[parent],
            [child]: value, // Update the child property (mean)
          },
        };
      }
  
      // For top-level fields (no dot notation)
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Error handling for leaving through Back button
  const handleBackClick = () => {
    setShowBackdrop(false);
    navigate("/scenarios");
  };
  const handleClose = () => {
    setShowBackdrop(false);
  };

  const handleConfirm = () => {
    if (!currScenario.name.trim()) {
      setShowBackdrop(false);
      setErrorBackdrop(true);
    } else {
      setCurrScenario(currScenario);  // Save currScenario before navigating
      setScenarioData(prev => prev.map(item => (item._id === editMode ? currScenario : item)));
      setShowBackdrop(false);
      navigate("/scenarios");
    }
  };
  const handleErrorClose = () => {
    setErrorBackdrop(false);
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>

        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Your Scenario Starts Here
          </Typography>
          <CustomSave label={"Save"}/>
        </Stack>

        <PageHeader />

        {/* Row 1 */}
        <Box sx={rowBoxStyles}>
          <CustomInput
            title="Name of Scenario"
            type="normal"
            value={currScenario.name}
            setValue={(value) => handleInputChange("name", value)}
          />

          <CustomInput
            title="Financial Goal"
            type="number"
            value={currScenario.financialGoal}
            setValue={(value) => handleInputChange("financialGoal", value)}
            inputProps={{ min: 0 }}
          />

          <CustomDropdown
            label="State Residence"
            value={currScenario.stateResident}
            menuItems={states}
            setValue={(value) => handleInputChange("stateResident", value)}
          />

          <CustomToggle
            title="Is the scenario for yourself or with your spouse?"
            labels={["Single","Married"]}
            values={["single", "married"]}
            sideView={false}
            width={100}
            value={currScenario.filingStatus}
            setValue={(value) => handleInputChange("filingStatus", value)}
          />
        </Box>

        {/* Row 2 */}
        <Box sx={rowBoxStyles}>
          <CustomInput
            title="Your Birth Year"
            type="number"
            value={currScenario.birthYearUser}
            setValue={(value) => handleInputChange("birthYearUser", value)}
          />

          <CustomToggle
            title="Your age type"
            labels={["Fixed", "Normal"]}
            values={["fixed", "normal"]}
            sideView={false}
            width={100}
            value={currScenario.lifeExpectancy.type}
            setValue={(value) => handleInputChange("lifeExpectancy.type", value)}
          />

          {currScenario.lifeExpectancy.type === "fixed" ? (
            <CustomInput
              title="Your Life Expectancy"
              type="number"
              value={currScenario.lifeExpectancy.fixedAge}
              setValue={(value) => handleInputChange("lifeExpectancy.fixedAge", value)}
              inputProps={{ min: "0" }}
            />
          ) : (
            <>
              <CustomInput
                title="Mean"
                type="number"
                value={currScenario.lifeExpectancy.mean}
                setValue={(value) => handleInputChange("lifeExpectancy.mean", value)}
                inputProps={{ min: "0" }}
              />
              <CustomInput
                title="Standard Deviation"
                type="number"
                value={currScenario.lifeExpectancy.stdDev}
                setValue={(value) => handleInputChange("lifeExpectancy.stdDev", value)}
                inputProps={{ min: "0" }}
              />
            </>
          )}
        </Box>

        {/* Spouse Row */}
        {currScenario.filingStatus === "married" && (
          <Box sx={rowBoxStyles}>
            <CustomInput
              title="Spouse's Birth Year"
              type="number"
              value={currScenario.spouseBirthYear}
              setValue={(value) => handleInputChange("spouseBirthYear", value)}
              inputProps={{ min: "0" }}
            />

            <CustomToggle
              title="Spouse age type"
              labels={["Fixed","Normal"]}
              values={["fixed", "normal"]}
              sideView={false}
              width={100}
              value={currScenario.spouseSampleAge}
              setValue={(value) => handleInputChange("spouseSampleAge", value)}
            />

            {currScenario.spouseSampleAge === "fixed" ? (
              <CustomInput
                title="Spouse's Life Expectancy"
                type="number"
                value={currScenario.spouseLifeExpectancy}
                setValue={(value) => handleInputChange("spouseLifeExpectancy", value)}
                inputProps={{ min: "0" }}
              />
            ) : (
              <>
                <CustomInput
                  title="Mean"
                  type="number"
                  value={currScenario.spouseMean}
                  setValue={(value) => handleInputChange("spouseMean", value)}
                  inputProps={{ min: "0" }}
                />
                <CustomInput
                  title="Standard Deviation"
                  type="number"
                  value={currScenario.spouseStdDev}
                  setValue={(value) => handleInputChange("spouseStdDev", value)}
                  inputProps={{ min: "0" }}
                />
              </>
            )}
          </Box>
        )}
        
        {/* Row 4 - Inflation Assumptions */}
        <Typography variant="h6" sx={{ fontWeight: "bold", marginTop: 4, marginBottom: 2 }}>
          Inflation Assumptions
        </Typography>

        <Box sx={rowBoxStyles}>
          <CustomToggle
              title="Distribution"
              labels={["Fixed", "Uniform", "Normal"]}
              values={["fixed", "uniform", "normal"]}
              sideView={false}
              width={100}
              value={currScenario.inflationAssumption.type}
              setValue={(value) => handleInputChange("inflationAssumption.type", value)}
          />

          {/* Inflation Value (Conditional) */}
          {currScenario.inflationAssumption.type === "fixed" && (
            <CustomInput 
                title="Value"
                type="number"
                adornment="%"
                value={currScenario.inflationAssumption.fixedRate}
                setValue={(value) => handleInputChange("inflationAssumption.fixedRate", value)}
                inputProps={{ min: "0" }}
            />
          )}
          {currScenario.inflationAssumption.type === "uniform" && (
            <>
              <CustomInput 
                  title="Min"
                  type="number"
                  adornment="%"
                  value={currScenario.inflationAssumption.min}
                  setValue={(value) => handleInputChange("inflationAssumption.min", value)}
                  inputProps={{ min: "0" }}
              />
              <CustomInput 
                  title="Max"
                  type="number"
                  adornment="%"
                  value={currScenario.inflationAssumption.max}
                  setValue={(value) => handleInputChange("inflationAssumption.max", value)}
                  inputProps={{ min: "0" }}
              />
            </>
          )}
          {currScenario.inflationAssumption.type === "normal" && (
            <>
              <CustomInput 
                  title="Mean"
                  type="number"
                  adornment="%"
                  value={currScenario.inflationAssumption.mean}
                  setValue={(value) => handleInputChange("inflationAssumption.mean", value)}
                  inputProps={{ min: "0" }}
              />
              <CustomInput 
                  title="Standard Deviation"
                  type="number"
                  adornment="%"
                  value={currScenario.inflationAssumption.stdDev}
                  setValue={(value) => handleInputChange("inflationAssumption.stdDev", value)}
                  inputProps={{ min: "0" }}
              />
            </>
          )}
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles} onClick={handleBackClick}>
            Back
          </Button>
          <CustomSave label={"Continue"} routeTo={"/scenario/investment_lists"}/>
        </Box>
        
        {/* Backdrop and Fade for confirmation */}
        <Backdrop 
          open={showBackdrop} 
          onClick={handleClose} 
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Fade in={showBackdrop}>
            <Paper 
              elevation={3} 
              sx={{
                padding: 4,
                width: "400px",
                backgroundColor: "white",
                borderRadius: 2,
                textAlign: "center"
              }}
            >
              <Typography variant="h5" sx={{fontWeight: "bold"}} gutterBottom>
                Do you want to save your changes?
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                <Button 
                  variant="contained" 
                  color="error"
                  sx={buttonStyles}
                  onClick={handleClose}
                >
                  No
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary"
                  sx={buttonStyles} 
                  onClick={handleConfirm}
                >
                  Yes
                </Button>
              </Stack>
            </Paper>
          </Fade>
        </Backdrop>

        {/* Separate Backdrop for error message */}
        <Backdrop 
          open={errorBackdrop}
          onClick={handleErrorClose} 
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
        >
          <Fade in={errorBackdrop}>
            <Paper 
              elevation={4} 
              sx={{
                padding: 4,
                width: "350px",
                backgroundColor: "white",
                borderRadius: 2,
                textAlign: "center"
              }}
            >
              <Typography variant="h5" color="error" sx={{fontWeight: "bold"}}>
                Please enter a scenario name before saving.
              </Typography>
            </Paper>
          </Fade>
        </Backdrop>
      </Container>
    </ThemeProvider>
  );
};

export default Basics;
