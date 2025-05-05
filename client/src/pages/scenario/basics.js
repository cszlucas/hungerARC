import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box,
} from "@mui/material";

import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import PageHeader from "../../components/pageHeader";
import CustomInput from "../../components/customInputBox";
import CustomToggle from "../../components/customToggle";
import CustomDropdown from "../../components/customDropDown";
import CustomSave from "../../components/customSaveBtn";
import {
  stackStyles, titleStyles, backContinueContainerStyles, buttonStyles, rowBoxStyles,
} from "../../components/styles";
import { AppContext } from "../../context/appContext";

const states = ["California", "Colorado", "Connecticut", "Delaware", "Hawaii", "Massachusetts", "New Jersey", "New York", "Texas"];

const Basics = () => {
  const { currScenario, setCurrScenario } = useContext(AppContext);
  const navigate = useNavigate();

  // General handler for updating values in nested or top-level fields
  const handleInputChange = (field, value) => {
    const keys = field.split(".");
    setCurrScenario((prev) => {
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleBackClick = () => {
    navigate("/scenarios");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>

        {/* Title and Save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Your Scenario Starts Here
          </Typography>
          <CustomSave label="Save" />
        </Stack>

        <PageHeader />

        {/* Basic Scenario Details */}
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
            adornment="$"
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
            labels={["Single", "Married"]}
            values={["single", "married"]}
            sideView={false}
            width={100}
            value={currScenario.filingStatus}
            setValue={(value) => handleInputChange("filingStatus", value)}
          />
        </Box>

        {/* User Demographics and Life Expectancy */}
        <Box sx={rowBoxStyles}>
          <CustomDropdown
            label="Your Birth Year"
            value={currScenario.birthYearUser}
            setValue={(value) => handleInputChange("birthYearUser", value)}
            menuItems={Array.from({ length: new Date().getFullYear() - 1925 + 1 }, (_, i) => 1925 + i)}
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
              inputProps={{ min: 0, max: 150 }}
            />
          ) : (
            <>
              <CustomInput
                title="Mean"
                type="number"
                value={currScenario.lifeExpectancy.mean}
                setValue={(value) => handleInputChange("lifeExpectancy.mean", value)}
                inputProps={{ min: 0, max: 100 }}
              />
              <CustomInput
                title="Standard Deviation"
                type="number"
                value={currScenario.lifeExpectancy.stdDev}
                setValue={(value) => handleInputChange("lifeExpectancy.stdDev", value)}
                inputProps={{ min: 0, max: 60 }}
              />
            </>
          )}
        </Box>

        {/* Spouse Inputs if Married */}
        {currScenario.filingStatus === "married" && (
          <Box sx={rowBoxStyles}>
            <CustomDropdown
              label="Spouse's Birth Year"
              value={currScenario.birthYearSpouse}
              setValue={(value) => handleInputChange("birthYearSpouse", value)}
              menuItems={Array.from({ length: new Date().getFullYear() - 1925 + 1 }, (_, i) => 1925 + i)}
            />

            <CustomToggle
              title="Spouse age type"
              labels={["Fixed", "Normal"]}
              values={["fixed", "normal"]}
              sideView={false}
              width={100}
              value={currScenario.lifeExpectancySpouse.type}
              setValue={(value) => handleInputChange("lifeExpectancySpouse.type", value)}
            />

            {currScenario.lifeExpectancySpouse.type === "fixed" ? (
              <CustomInput
                title="Spouse's Life Expectancy"
                type="number"
                value={currScenario.lifeExpectancySpouse.fixedAge}
                setValue={(value) => handleInputChange("lifeExpectancySpouse.fixedAge", value)}
                inputProps={{ min: 0, max: 150 }}
              />
            ) : (
              <>
                <CustomInput
                  title="Mean"
                  type="number"
                  value={currScenario.lifeExpectancySpouse.mean}
                  setValue={(value) => handleInputChange("lifeExpectancySpouse.mean", value)}
                  inputProps={{ min: 0, max: 100 }}
                />
                <CustomInput
                  title="Standard Deviation"
                  type="number"
                  value={currScenario.lifeExpectancySpouse.stdDev}
                  setValue={(value) => handleInputChange("lifeExpectancySpouse.stdDev", value)}
                  inputProps={{ min: 0, max: 50 }}
                />
              </>
            )}
          </Box>
        )}

        <CustomInput
          title="IRS Limit"
          type="number"
          adornment="$"
          value={currScenario.irsLimit}
          setValue={(value) => handleInputChange("irsLimit", value)}
          inputProps={{ min: 0 }}
        />

        {/* Inflation Assumptions */}
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

          {/* Render inflation fields based on selected type */}
          {currScenario.inflationAssumption.type === "fixed" && (
            <CustomInput
              title="Value"
              type="number"
              adornment="%"
              value={currScenario.inflationAssumption.fixedRate}
              setValue={(value) => handleInputChange("inflationAssumption.fixedRate", value)}
              inputProps={{ min: 0 }}
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
                inputProps={{ min: 0 }}
              />
              <CustomInput
                title="Max"
                type="number"
                adornment="%"
                value={currScenario.inflationAssumption.max}
                setValue={(value) => handleInputChange("inflationAssumption.max", value)}
                inputProps={{ min: 0 }}
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
                inputProps={{ min: 0 }}
              />
              <CustomInput
                title="Standard Deviation"
                type="number"
                adornment="%"
                value={currScenario.inflationAssumption.stdDev}
                setValue={(value) => handleInputChange("inflationAssumption.stdDev", value)}
                inputProps={{ min: 0 }}
              />
            </>
          )}
        </Box>

        {/* Navigation buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles} onClick={handleBackClick}>
            Back
          </Button>
          <CustomSave label="Continue" routeTo="/scenario/investment_lists" />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Basics;
