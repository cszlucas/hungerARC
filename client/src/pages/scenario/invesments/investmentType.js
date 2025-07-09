import axios from "axios";
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, Checkbox, Alert } from "@mui/material";

import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";
import { useAlert } from "../../../context/alertContext";

import { backContinueContainerStyles, buttonStyles, rowBoxStyles } from "../../../components/styles";

import { ObjectId } from "bson";

const InvestmentType = () => {
  const { editMode, eventEditMode, setEventEditMode, currInvestmentTypes, setCurrInvestmentTypes, setCurrScenario } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const navigate = useNavigate();

  /**
   * Utility to retrieve an investment type object by its ID
   */
  const getInvestmentTypeById = (id) => {
    if (!id) return null;
    return Array.isArray(currInvestmentTypes) ? currInvestmentTypes.find((item) => item?._id === id) || null : null;
  };

  /**
   * Initialize form with existing data (edit) or default values (new)
   */
  const [formValues, setFormValues] = useState(
    getInvestmentTypeById(eventEditMode) || {
      name: "",
      description: "",
      expenseRatio: "",
      taxability: true,
      annualReturn: {
        unit: "fixed",
        type: "fixed",
        value: "",
        mean: "",
        stdDev: "",
      },
      annualIncome: {
        unit: "fixed",
        type: "fixed",
        value: "",
        mean: "",
        stdDev: "",
      },
    }
  );

  /**
   * Generic form input handler for nested and top-level keys
   */
  const handleInputChange = (field, value) => {
    const parts = field.split(".");
    setFormValues((prev) => {
      if (parts.length === 2) {
        const [parent, child] = parts;
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Handles the enabling or disabling the save button
  const [disable, setDisable] = useState(true);
  useEffect(() => {
    function checkValidNum(eventValue) {
      return eventValue >= 0 && typeof eventValue === "number" && !isNaN(eventValue);
    }
    let expression =
      formValues.name &&
      checkValidNum(formValues.expenseRatio) &&
      (formValues.annualReturn.type !== "fixed" || checkValidNum(formValues.annualReturn.value)) &&
      (formValues.annualReturn.type !== "normal" || (checkValidNum(formValues.annualReturn.mean) && checkValidNum(formValues.annualReturn.stdDev))) &&
      (formValues.annualIncome.type !== "fixed" || checkValidNum(formValues.annualIncome.value)) &&
      (formValues.annualIncome.type !== "normal" || (checkValidNum(formValues.annualIncome.mean) && checkValidNum(formValues.annualIncome.stdDev)));

    setDisable(!expression);
  }, [formValues]);

  /**
   * Save handler for new and existing investment types
   */
  const handleSave = async () => {
    let id = eventEditMode;

    if (id === "new" && formValues.name.toLowerCase() === "cash") {
      showAlert('You cannot name an investment-type account "Cash."', "error");
      return;
    }

    /**
     * Handles state update after adding a new investment type locally
     */
    const handleUpdates = (formData, editing = false) => {
      if (editing) {
        setCurrInvestmentTypes((prev) =>
          prev.map((it) => {
            if (it._id === formData._id) return formData;
            return it;
          })
        );
        return;
      }

      setCurrScenario((prev) => ({
        ...prev,
        ["setOfInvestmentTypes"]: [...(prev["setOfInvestmentTypes"] || []), formData._id],
      }));
      setCurrInvestmentTypes((prev) => [...(Array.isArray(prev) ? prev : []), formData]);
    };

    try {
      if (!user.guest) {
        // For non-guest users, sync with server
        if (id === "new") {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/scenario/${editMode}/investmentType`, formValues);
          handleUpdates(response.data);
        } else {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/updateInvestmentType/${id}`, formValues);
          handleUpdates(response.data.result, true);
        }
      } else {
        // For guest users, generate local ID and update only local state
        if (id === "new") {
          formValues._id = new ObjectId().toHexString();
          handleUpdates(formValues);
        } else {
          handleUpdates(formValues, true);
        }
      }

      // Reset edit mode on save
      setEventEditMode(null);
      navigate("/scenario/investment_lists");
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

        {/* Main Input Form Container */}
        <Box sx={rowBoxStyles}>
          {/* Left Panel - Basic Info */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CustomInput title="Name" value={formValues.name} setValue={(value) => handleInputChange("name", value)} />
            <CustomInput title="Description (Optional)" type="multiline" value={formValues.description} setValue={(value) => handleInputChange("description", value)} />
            <CustomInput
              title="Expense Ratio"
              type="number"
              value={formValues.expenseRatio}
              setValue={(value) => handleInputChange("expenseRatio", value)}
              inputProps={{
                step: "any",
                min: "0",
                max: "1",
              }}
            />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                Taxability
              </Typography>
              <Checkbox checked={formValues.taxability} onChange={(e) => handleInputChange("taxability", e.target.checked)} />
            </Stack>
          </Box>

          {/* Center Panel - Annual Return */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
              Expected Annual Return:
            </Typography>
            <Box sx={{ flex: 1, minWidth: "270px", marginTop: 1 }}>
              <CustomToggle
                title="Amount"
                labels={["Fixed", "Percentage"]}
                values={["fixed", "percentage"]}
                sideView={true}
                width={100}
                value={formValues.annualReturn.unit}
                setValue={(value) => handleInputChange("annualReturn.unit", value)}
              />
              <CustomToggle
                title="Distribution"
                labels={["Fixed", "Normal"]}
                values={["fixed", "normal"]}
                sideView={true}
                width={100}
                value={formValues.annualReturn.type}
                setValue={(value) => handleInputChange("annualReturn.type", value)}
              />
              {formValues.annualReturn.type === "fixed" ? (
                <CustomInput
                  title="Value"
                  type="number"
                  adornment={formValues.annualReturn.unit === "fixed" ? "$" : "%"}
                  value={formValues.annualReturn.value}
                  setValue={(value) => handleInputChange("annualReturn.value", value)}
                  inputProps={{ min: "0" }}
                />
              ) : (
                <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
                  <CustomInput
                    title="Mean"
                    type="number"
                    adornment={formValues.annualReturn.unit === "fixed" ? "$" : "%"}
                    value={formValues.annualReturn.mean}
                    setValue={(value) => handleInputChange("annualReturn.mean", value)}
                    inputProps={{ min: "0" }}
                  />
                  <CustomInput
                    title="Variance"
                    type="number"
                    adornment={formValues.annualReturn.unit === "fixed" ? "$" : "%"}
                    value={formValues.annualReturn.stdDev}
                    setValue={(value) => handleInputChange("annualReturn.stdDev", value)}
                    inputProps={{ min: "0" }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* Right Panel - Annual Income */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
              Expected Annual Income:
            </Typography>
            <Box sx={{ flex: 1, minWidth: "270px", marginTop: 1 }}>
              <CustomToggle
                title="Amount"
                labels={["Fixed", "Percentage"]}
                values={["fixed", "percentage"]}
                sideView={true}
                width={100}
                value={formValues.annualIncome.unit}
                setValue={(value) => handleInputChange("annualIncome.unit", value)}
              />
              <CustomToggle
                title="Distribution"
                labels={["Fixed", "Normal"]}
                values={["fixed", "normal"]}
                sideView={true}
                width={100}
                value={formValues.annualIncome.type}
                setValue={(value) => handleInputChange("annualIncome.type", value)}
              />
              {formValues.annualIncome.type === "fixed" ? (
                <CustomInput
                  title="Value"
                  type="number"
                  adornment={formValues.annualIncome.unit === "fixed" ? "$" : "%"}
                  value={formValues.annualIncome.value}
                  setValue={(value) => handleInputChange("annualIncome.value", value)}
                  inputProps={{ min: "0" }}
                />
              ) : (
                <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
                  <CustomInput
                    title="Mean"
                    type="number"
                    adornment={formValues.annualIncome.unit === "fixed" ? "$" : "%"}
                    value={formValues.annualIncome.mean}
                    setValue={(value) => handleInputChange("annualIncome.mean", value)}
                    inputProps={{ min: "0" }}
                  />
                  <CustomInput
                    title="Variance"
                    type="number"
                    adornment={formValues.annualIncome.unit === "fixed" ? "$" : "%"}
                    value={formValues.annualIncome.stdDev}
                    setValue={(value) => handleInputChange("annualIncome.stdDev", value)}
                    inputProps={{ min: "0" }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Bottom Control Buttons */}
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
            }}
            disabled={disable}
          >
            Save
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default InvestmentType;
