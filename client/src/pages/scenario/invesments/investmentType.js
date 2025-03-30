import axios from "axios";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, 
  ToggleButton, ToggleButtonGroup, Select, MenuItem 
} from "@mui/material";

import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import CustomDropdown from "../../../components/customDropDown";
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import { 
  textFieldStyles, numFieldStyles, backContinueContainerStyles, buttonStyles, rowBoxStyles 
} from "../../../components/styles";
import { AppContext } from "../../../context/appContext";

const mongoose = require("mongoose");

const InvestmentType = () => {
  const { currInvestments, setCurrInvestments, currInvestmentTypes, setCurrInvestmentTypes, setCurrScenario } = useContext(AppContext);
  const { eventEditMode } = useContext(AppContext);

  const getInvestmentTypeById = (id) => {
    if (Array.isArray(currInvestmentTypes) && currInvestmentTypes.length > 0) {
      for (let i = 0; i < currInvestmentTypes.length; i++) {
        // Ensure each item has the _id property before comparing
        if (currInvestmentTypes[i] && currInvestmentTypes[i]._id == id) {
          return currInvestmentTypes[i]; // Return the found scenario
        }
      }
    } 
    return null; // Return null if not found
  };

  const handleAppendInScenario = (key, newValue) => {
    setCurrScenario((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newValue]  // Append to the specified key
    }));
  };

  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(getInvestmentTypeById(eventEditMode) || 
    {
      name: "",
      description: "",
      expenseRatio: "", //fixed percentage
      taxability: false, // tax-exempt or taxable
      annualReturn: {
        unit: "fixed",
        type: "fixed",
        fixed: "",
        mean: "",
        stdDev: "",
      },
      annualIncome: {
        unit: "fixed",
        type: "fixed",
        fixed: "",
        mean: "",
        stdDev: "",
      },
    }
  );

  const handleInputChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const validKeys = ["name", "description", "expenseRatio", "taxability"];

    // Hardcoded values for certain keys
    const hardcodedValues = {
      annualReturn: {
        type: "normalPercent",
        mean: 0.05,
        stdDev: 0.1,
      },
      annualIncome: {
        type: "fixedPercent",
        fixed: 5,
        mean: 0.04,
        stdDev: 0.05,
      },
    };

    const filteredFormValues = Object.keys(formValues)
      .filter((key) => validKeys.includes(key)) // Only keep keys that are in the validKeys array
      .reduce((obj, key) => {
        obj[key] = formValues[key]; // Construct a new object with only valid keys
        return obj;
      }, {});

    const finalFormValues = {
      ...filteredFormValues,
      ...hardcodedValues,
      id: new mongoose.Types.ObjectId(),
    };

    try {
      let response;
      console.log("here", finalFormValues);

      response = await axios.post("http://localhost:8080/investmentType", finalFormValues);
      let id = response.data._id;

      handleInputChange("_id", id);
      setCurrInvestmentTypes((prev) => {
        return [...(Array.isArray(prev) ? prev : []), response.data];
      });
      handleAppendInScenario("setOfInvestmentTypes", response.data);
      console.log("Data successfully saved:", response.data);
      alert("Save data");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data!");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ marginTop: 6, marginBottom: 2 }}>
          <Typography variant="h2" component="h1" sx={{ fontWeight: "bold" }}>
            Investment Types
          </Typography>
        </Stack>

        <PageHeader />

        <Box sx={rowBoxStyles}>
          {/* First Box with Inputs */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CustomInput title="Name" value={formValues.name} setValue={(value) => handleInputChange("name", value)} />

            <CustomInput title="Description (Optional)" type="multiline" value={formValues.description} setValue={(value) => handleInputChange("description", value)} />

            <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
              <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                  Expense Ratio
                </Typography>
                <TextField
                  variant="outlined"
                  type="number"
                  inputProps={{
                    step: "any", // Allows decimal values
                    min: "0", // Prevents negative numbers (optional)
                  }}
                  value={formValues.expenseRatio || ""} // Ensure the value is a string or number
                  onChange={(event) => handleInputChange("expenseRatio", event.target.value)} // Get the value from the event
                  sx={numFieldStyles}
                />
              </Box>
              <CustomDropdown
                label="Taxability"
                value={formValues.taxability}
                setValue={(value) => handleInputChange("taxability", value)}
                menuItems={["Taxable", "Tax-Deferred", "Tax-Free"]}
                textFieldStyles={textFieldStyles}
              />
            </Stack>
          </Box>

          {/* Expected Annual Return */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
              Expected Annual Return:
            </Typography>
            <Box sx={{ flex: 1, minWidth: "270px", marginTop: 1 }}>
              {/* Amount Toggle */}
              <CustomToggle
                title="Amount"
                values={["Fixed", "Percentage"]}
                sideView={true}
                width={100}
                value={formValues.returnAmountType}
                setValue={(value) => {
                  handleInputChange("returnAmountType", value);
                }}
              />
              {/* Distribution Toggle */}
              <CustomToggle
                title="Distribution"
                values={["Fixed", "Normal"]}
                sideView={true}
                width={100}
                value={formValues.returnDistributionType}
                setValue={(value) => {
                  handleInputChange("returnDistributionType", value);
                }}
              />
              {/* Conditional Inputs */}
              {formValues.returnDistributionType === "Fixed" && (
                <CustomInput
                  title="Value"
                  type="number"
                  adornment={formValues.returnAmountType == "Fixed" ? "$" : "%"}
                  value={formValues.returnValue}
                  setValue={(value) => {
                    handleInputChange("returnValue", value);
                  }}
                />
              )}
              {formValues.returnDistributionType === "Normal" && (
                <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
                  <CustomInput
                    title="Mean"
                    type="number"
                    adornment={formValues.returnAmountType == "Fixed" ? "$" : "%"}
                    value={formValues.returnMean}
                    setValue={(value) => {
                      handleInputChange("returnMean", value);
                    }}
                  />
                  <CustomInput
                    title="Variance"
                    type="number"
                    adornment={formValues.returnAmountType == "Fixed" ? "$" : "%"}
                    value={formValues.returnStdDev}
                    setValue={(value) => {
                      handleInputChange("returnStdDev", value);
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* Expected Annual Income */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
              Expected Annual Income:
            </Typography>
            <Box sx={{ flex: 1, minWidth: "270px", marginTop: 1 }}>
              {/* Amount Toggle */}
              <CustomToggle
                title="Amount"
                values={["Fixed", "Percentage"]}
                sideView={true}
                width={100}
                value={formValues.incomeAmountType}
                setValue={(value) => {
                  handleInputChange("incomeAmountType", value);
                }}
              />
              {/* Distribution Toggle */}
              <CustomToggle
                title="Distribution"
                values={["Fixed", "Normal"]}
                sideView={true}
                width={100}
                value={formValues.incomeDistributionType}
                setValue={(value) => {
                  handleInputChange("incomeDistributionType", value);
                }}
              />
              {/* Conditional Inputs */}
              {formValues.incomeDistributionType === "Fixed" && (
                <CustomInput
                  title="Value"
                  type="number"
                  adornment={formValues.incomeAmountType == "Fixed" ? "$" : "%"}
                  value={formValues.incomeValue}
                  setValue={(value) => {
                    handleInputChange("incomeValue", value);
                  }}
                />
              )}
              {formValues.incomeDistributionType === "Normal" && (
                <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
                  <CustomInput
                    title="Mean"
                    type="number"
                    adornment={formValues.incomeAmountType == "Fixed" ? "$" : "%"}
                    value={formValues.incomeMean}
                    setValue={(value) => {
                      handleInputChange("incomeMean", value);
                    }}
                  />
                  <CustomInput
                    title="Variance"
                    type="number"
                    adornment={formValues.incomeAmountType == "Fixed" ? "$" : "%"}
                    value={formValues.incomeStdDev}
                    setValue={(value) => {
                      handleInputChange("incomeStdDev", value);
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles} onClick={() => navigate("/scenario/investment_lists")}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            sx={buttonStyles}
            onClick={() => {
              handleSave();
              navigate("/scenario/investment_lists");
            }}
          >
            Add
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default InvestmentType;
