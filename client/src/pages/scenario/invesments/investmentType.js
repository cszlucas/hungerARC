import axios from "axios";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, Checkbox,
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
    if (id == null) return null;
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
    const fieldParts = field.split("."); // Split the field into parts (e.g., "lifeExpectancy.mean")
  
    setFormValues((prev) => {
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

  const handleSave = async () => {
    // const validKeys = ["name", "description", "expenseRatio", "taxability"];

    // // Hardcoded values for certain keys
    // const hardcodedValues = {
    //   annualReturn: {
    //     type: "normalPercent",
    //     mean: 0.05,
    //     stdDev: 0.1,
    //   },
    //   annualIncome: {
    //     type: "fixedPercent",
    //     fixed: 5,
    //     mean: 0.04,
    //     stdDev: 0.05,
    //   },
    // };

    // const filteredFormValues = Object.keys(formValues)
    //   .filter((key) => validKeys.includes(key)) // Only keep keys that are in the validKeys array
    //   .reduce((obj, key) => {
    //     obj[key] = formValues[key]; // Construct a new object with only valid keys
    //     return obj;
    //   }, {});

    // const finalFormValues = {
    //   ...filteredFormValues,
    //   ...hardcodedValues,
    //   id: new mongoose.Types.ObjectId(),
    // };

    try {
      let response = await axios.post("http://localhost:8080/investmentType", formValues);
      let id = response.data._id;

      handleInputChange("_id", id);
      setCurrInvestmentTypes((prev) => {
        return [...(Array.isArray(prev) ? prev : []), response.data];
      });
      handleAppendInScenario("setOfInvestmentTypes", response.data);
      console.log("Data successfully saved:", response.data);
      alert("Investment Type has been added");
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

            <Stack direction="row" spacing={2}>
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
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2, mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                  Taxability
                </Typography>
                <Checkbox 
                  checked={formValues.taxability} 
                  onChange={(value) => {
                    console.log(formValues.taxability);
                    handleInputChange("taxability", value.target.checked);
                  }}/>
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
                labels={["Fixed", "Percentage"]}
                values={["fixed", "percentage"]}
                sideView={true}
                width={100}
                value={formValues.annualReturn.unit}
                setValue={(value) => {
                  handleInputChange("annualReturn.unit", value);
                }}
              />
              {/* Distribution Toggle */}
              <CustomToggle
                title="Distribution"
                labels={["Fixed", "Normal"]}
                values={["fixed", "normal"]}
                sideView={true}
                width={100}
                value={formValues.annualReturn.type}
                setValue={(value) => {
                  handleInputChange("annualReturn.type", value);
                }}
              />
              {/* Conditional Inputs */}
              {formValues.annualReturn.type === "fixed" && (
                <CustomInput
                  title="Value"
                  type="number"
                  adornment={formValues.annualReturn.unit == "fixed" ? "$" : "%"}
                  value={formValues.annualReturn.value}
                  setValue={(value) => {
                    handleInputChange("annualReturn.value", value);
                  }}
                />
              )}
              {formValues.annualReturn.type === "normal" && (
                <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
                  <CustomInput
                    title="Mean"
                    type="number"
                    adornment={formValues.annualReturn.unit == "fixed" ? "$" : "%"}
                    value={formValues.annualReturn.mean}
                    setValue={(value) => {
                      handleInputChange("annualReturn.mean", value);
                    }}
                  />
                  <CustomInput
                    title="Variance"
                    type="number"
                    adornment={formValues.annualReturn.unit == "fixed" ? "$" : "%"}
                    value={formValues.annualReturn.stdDev}
                    setValue={(value) => {
                      handleInputChange("annualReturn.stdDev", value);
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
                labels={["Fixed", "Percentage"]}
                values={["fixed", "percentage"]}
                sideView={true}
                width={100}
                value={formValues.annualIncome.unit}
                setValue={(value) => {
                  handleInputChange("annualIncome.unit", value);
                }}
              />
              {/* Distribution Toggle */}
              <CustomToggle
                title="Distribution"
                labels={["Fixed", "Normal"]}
                values={["fixed", "normal"]}
                sideView={true}
                width={100}
                value={formValues.annualIncome.type}
                setValue={(value) => {
                  handleInputChange("annualIncome.type", value);
                }}
              />
              {/* Conditional Inputs */}
              {formValues.annualIncome.type === "fixed" && (
                <CustomInput
                  title="Value"
                  type="number"
                  adornment={formValues.annualIncome.unit == "fixed" ? "$" : "%"}
                  value={formValues.annualIncome.value}
                  setValue={(value) => {
                    handleInputChange("annualIncome.value", value);
                  }}
                />
              )}
              {formValues.annualIncome.type === "normal" && (
                <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
                  <CustomInput
                    title="Mean"
                    type="number"
                    adornment={formValues.annualIncome.unit == "fixed" ? "$" : "%"}
                    value={formValues.annualIncome.mean}
                    setValue={(value) => {
                      handleInputChange("annualIncome.mean", value);
                    }}
                  />
                  <CustomInput
                    title="Variance"
                    type="number"
                    adornment={formValues.annualIncome.unit == "fixed" ? "$" : "%"}
                    value={formValues.annualIncome.stdDev}
                    setValue={(value) => {
                      handleInputChange("annualIncome.stdDev", value);
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
