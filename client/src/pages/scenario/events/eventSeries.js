import React, { useState, useContext, useEffect } from "react";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, 
  Box, List, ListItem, ListItemText, 
  IconButton,
} from "@mui/material";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import {
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, 
  backContinueContainerStyles, textFieldStyles, toggleButtonGroupStyles
} from "../../../components/styles";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete"; 
import CustomDropdown from "../../../components/customDropDown"; 
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";

import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";

//const EventSeries = ({ formValues, handleInputChange }) => {
const EventSeries = () => {
  const { editMode, eventEditMode, setEventEditMode, currIncome, setCurrIncome, currExpense, currInvest, currRebalance } = useContext(AppContext);
  
  const eventSeriesMap = {};
  function addToMap(arr, source) {
    if (Array.isArray(arr)) {
      for (const event of arr) {
        if (event?._id) {
          eventSeriesMap[event._id] = {
            source,
            eventSeriesName: event.eventSeriesName,
            startYear: event.startYear
          };
        }
      }
    }
  }
  addToMap(currIncome, 'income');
  addToMap(currExpense, 'expense');
  addToMap(currInvest, 'invest');
  addToMap(currRebalance, 'rebalance');

  const [formValues, setFormValues] = useState({
    _id:"",
    eventSeriesName: "",
    description: "",
    startYear: {
        type: "fixedAmt",
        value: "",
        mean: "",
        stdDev: "",
        min: "",
        max: "",
        eventSeriesId: ""
    },
    duration: {
        type: "fixedAmt",
        value: "",
        mean: "",
        stdDev: "",
        min: "",
        max: ""
    },});
    
    const handleInputChange = (field, value) => {
      const fieldParts = field.split("."); // Split the field into parts (e.g., "lifeExpectancy.mean")
    
      setFormValues((prev) => {
          if (fieldParts.length === 3) {
              const [grandparent, parent, child] = fieldParts; 
              return {
                  ...prev,
                  [grandparent]: {
                      ...prev[grandparent],
                      [parent]: {
                          ...prev[grandparent]?.[parent],
                          [child]: value,
                      }
                  }
              };
          }
  
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

  return (<>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>

        <CustomInput 
            title="Event name" 
            value={formValues.eventSeriesName} 
            setValue={(value) => handleInputChange("eventSeriesName", value)} 
        />

        <CustomInput 
            title="Description (Optional)" 
            type="multiline" 
            value={formValues.eventSeriesDescription} 
            setValue={(value) => handleInputChange("eventSeriesDescription", value)} 
        />
          <CustomInput
            title="Maximum Cash"
            type="number"
            adornment="$"
            value={formValues.maxCash}
            setValue={(value) => handleInputChange("maxCash", value)}
            inputProps={{ min: 0 }}
        /> 

        <CustomToggle
            title="Start Year"
            labels={["Fixed", "Normal", "Uniform", "Same as", "After"]}
            values={["fixedAmt", "normal", "uniform", "same", "after"]}
            value={formValues.startYear.type}
            setValue={(value) => handleInputChange("startYear.type", value)}
        />

        <Box sx={{mt:2}}></Box>

        {formValues.startYear.type === "fixedAmt" && (
            <Stack direction="row" spacing={1} alignItems="start">
                <CustomInput 
                    title="Value"
                    type="number"
                    value={formValues.startYear.value}
                    setValue={(value) => handleInputChange("startYear.value", value)}
                />
            </Stack>
        )}
        {formValues.startYear.type === "normal" && (
            <Stack direction="row" spacing={1} alignItems="start">
                <CustomInput 
                    title="Mean"
                    type="number"
                    value={formValues.startYear.mean}
                    setValue={(value) => handleInputChange("startYear.mean", value)}
                />
                <CustomInput 
                    title="Standard Deviation"
                    type="number"
                    value={formValues.startYear.stdDev}
                    setValue={(value) => handleInputChange("startYear.stdDev", value)}
                />
            </Stack>
        )}
        {formValues.startYear.type === "uniform" && (
            <Stack direction="row" spacing={1} alignItems="start">
                <CustomInput 
                    title="Min"
                    type="number"
                    value={formValues.startYear.min}
                    setValue={(value) => handleInputChange("startYear.min", value)}
                />
                <CustomInput 
                    title="Max"
                    type="number"
                    value={formValues.startYear.max}
                    setValue={(value) => handleInputChange("startYear.max", value)}
                />
            </Stack>
        )}
        {formValues.startYear.type === "same" && (
            <Stack direction="row" spacing={1} alignItems="start">
                <CustomInput 
                    title="Min"
                    type="number"
                    value={formValues.startYear.min}
                    setValue={(value) => handleInputChange("startYear.min", value)}
                />
                <CustomInput 
                    title="Max"
                    type="number"
                    value={formValues.startYear.max}
                    setValue={(value) => handleInputChange("startYear.max", value)}
                />
            </Stack>
        )}
        {formValues.startYear.type === "after" && (
            <Stack direction="row" spacing={1} alignItems="start">
                <CustomInput 
                    title="Min"
                    type="number"
                    value={formValues.startYear.min}
                    setValue={(value) => handleInputChange("startYear.min", value)}
                />
                <CustomInput 
                    title="Max"
                    type="number"
                    value={formValues.startYear.max}
                    setValue={(value) => handleInputChange("startYear.max", value)}
                />
            </Stack>
        )}

        {/* Input Fields Below in Columns */}
        <Stack direction="row" spacing={1} alignItems="start">
            <CustomToggle
                title="Duration"
                labels={["Fixed", "Normal", "Uniform"]}
                values={["fixedAmt", "normal", "uniform"]}
                width={100}
                value={formValues.duration.type}
                setValue={(value) => handleInputChange("duration.type", value)}
            />

            {formValues.duration.type === "fixedAmt" && (
                <Stack direction="row" spacing={1} alignItems="start">
                <CustomInput 
                    title="Value"
                    type="number"
                    value={formValues.duration.value}
                    setValue={(value) => handleInputChange("duration.value", value)}
                />
                </Stack>
            )}

            {formValues.duration.type === "normal" && (
                <Stack direction="row" spacing={1} alignItems="start">
                    <CustomInput 
                        title="Mean"
                        type="number"
                        value={formValues.duration.mean}
                        setValue={(value) => handleInputChange("duration.mean", value)}
                    />
                    <CustomInput 
                        title="Standard Deviation"
                        type="number"
                        value={formValues.duration.stdDev}
                        setValue={(value) => handleInputChange("duration.stdDev", value)}
                    />
                </Stack>
            )}

            {formValues.duration.type === "uniform" && (
                <Stack direction="row" spacing={1} alignItems="start">
                    <CustomInput 
                        title="Min"
                        type="number"
                        value={formValues.duration.min}
                        setValue={(value) => handleInputChange("duration.min", value)}
                    />
                    <CustomInput 
                        title="Max"
                        type="number"
                        value={formValues.duration.max}
                        setValue={(value) => handleInputChange("duration.max", value)}
                    />
                </Stack>
            )}
        </Stack>
        
      </Container>
    </ThemeProvider>
  </>);
};

export default EventSeries;
