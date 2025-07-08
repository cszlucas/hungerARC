import axios from "axios";
import React, { useState, useContext, useEffect } from "react";
import { flushSync } from "react-dom";

import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, Alert, MenuItem, TextField,
} from "@mui/material";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import { 
  stackStyles, titleStyles, buttonStyles, backContinueContainerStyles, rowBoxStyles 
} from "../../../components/styles";

import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";
import { useAlert } from "../../../context/alertContext";

import EventSeries from "./eventSeries";
import { ObjectId } from "bson";
import AssetAllocation from "./assetAllocation";

const DEFAULT_FORM_VALUES = {
  _id: null,
  eventSeriesName: "",
  eventSeriesDescription: "",
  startYear: {
    type: "fixedAmt",
    value: "",
    mean: "",
    stdDev: "",
    min: "",
    max: "",
    refer: null,
  },
  duration: {
    type: "fixedAmt",
    value: "",
    mean: "",
    stdDev: "",
    min: "",
    max: ""
  },
  // taxStatus: "non-retirement",
  assetAllocation: {
    type: "fixed",
    fixedPercentages: {},
    initialPercenatages: {},
    finalPercentages: {}
  }
};
const TAX_MAP = {
  "non-retirement": "Taxable",
  "pre-tax": "Tax-Deferred",
  "after-tax": "Tax-Free",
};

const Rebalance = () => {
  const { currRebalance, setCurrRebalance, setCurrScenario, editMode } = useContext(AppContext);
  const { eventEditMode, setEventEditMode } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const getRebalanceById = (id) => currRebalance.find(r => r._id === id) || null;
  const getRebalanceByTaxStatus = (status) => {
    const found = currRebalance.find(r => r.taxStatus === status);
    if (found) return found;
    return structuredClone({ ...DEFAULT_FORM_VALUES, taxStatus: status }); // or use JSON.parse(JSON.stringify(...))
  };  
  const [formValues, setFormValues] = useState(() => {
    if (eventEditMode && eventEditMode.id) { return getRebalanceById(eventEditMode.id) || getRebalanceByTaxStatus(["non-retirement", "pre-tax", "after-tax"].find(type => !currRebalance.some(r => r.taxStatus === type))); }
    return getRebalanceByTaxStatus("non-retirement");
  });
  const [disable, setDisable] = useState(true);
  const [percentError, setPercentError] = useState(false);
  
  // Enable Save button only if all required fields are filled correctly
  useEffect(() => {
    function checkValidNum(eventValue) {
      return eventValue >= 0 && typeof eventValue === "number" && !isNaN(eventValue);
    }

    const expression = formValues.eventSeriesName 
      && (formValues.startYear.type !== "fixedAmt" 
        || checkValidNum(formValues.startYear.value)) 
      && (formValues.startYear.type !== "normal" 
        || (checkValidNum(formValues.startYear.mean) && checkValidNum(formValues.startYear.stdDev))) 
      && (formValues.startYear.type !== "uniform" 
        || (checkValidNum(formValues.startYear.min) && checkValidNum(formValues.startYear.max) 
        && formValues.startYear.min <= formValues.startYear.max)) 
      && (["same", "after"].includes(formValues.startYear.type) 
        ? formValues.startYear.refer : true) 
      && (formValues.duration.type !== "fixedAmt" 
        || checkValidNum(formValues.duration.value)) 
      && (formValues.duration.type !== "normal" 
        || (checkValidNum(formValues.duration.mean) && checkValidNum(formValues.duration.stdDev))) 
      && (formValues.duration.type !== "uniform" 
        || (checkValidNum(formValues.duration.min) && checkValidNum(formValues.duration.max) 
        && formValues.duration.min <= formValues.duration.max)) 
      && (formValues.assetAllocation.type === "fixed" 
        ? Object.keys(formValues.assetAllocation.fixedPercentages).length > 0 : true)
      && (formValues.assetAllocation.type === "glidePath" 
        ? Object.keys(formValues.assetAllocation.initialPercentages).length > 0 : true);

    setDisable(!expression);
  }, [formValues]);

  const handleTaxStatusChange = (selectedTaxStatus) => {
    const match = getRebalanceByTaxStatus(selectedTaxStatus);
    setEventEditMode((prev) => ({ ...prev, id: match._id ?? "new" }));
    setFormValues(match);
  };

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

  const navigate = useNavigate();

  const handleSave = async () => {
    const cleanedAllocation = formValues.assetAllocation.type === "fixed"
            ? { ...formValues.assetAllocation, initialPercentages: {}, finalPercentages: {} }
            : { ...formValues.assetAllocation, fixedPercentages: {} };
    const cleanedFormValues = { ...formValues, assetAllocation: cleanedAllocation };
    setFormValues(cleanedFormValues);

    if (eventEditMode.id === "new") {
      let id = new ObjectId().toHexString();
  
      if (!user.guest) {
        const response = await axios.post(`http://localhost:8080/scenario/${editMode}/rebalanceStrategy`, cleanedFormValues);
        id = response.data._id;
      }
  
      handleInputChange("_id", id);
      setCurrRebalance((prev) => [...prev, { ...cleanedFormValues, _id: id }]);
      setEventEditMode({ type: "Rebalance", id });
  
      setCurrScenario((prevScenario) => ({
        ...prevScenario,
        rebalanceEventSeries: [...(prevScenario?.rebalanceEventSeries || []), id],
      }));
    } else {
      if (!user.guest) await axios.post(`http://localhost:8080/updateRebalanceStrategy/${eventEditMode.id}`, cleanedFormValues);
  
      setCurrRebalance((prev) => {
        const newList = prev.filter((item) => item._id !== eventEditMode.id);
        return [...newList, cleanedFormValues];
      });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>
        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Stack direction="column">
            <Typography variant="h2" component="h1" sx={titleStyles}>
              Rebalance
            </Typography>
            <Stack direction="row">
              <Typography variant="body" sx={titleStyles}>
                For
              </Typography>
              <TextField
                select
                value={formValues.taxStatus || "non-retirement"}
                onChange={(e) => { handleTaxStatusChange(e.target.value); }}
                sx ={{ 
                  mt: -1,
                  ml: 1, 
                  mr: 1, 
                  minWidth: "100px",
                  minheight: "10px",
                  "& .MuiOutlinedInput-root": {
                    height: "40px",
                    backgroundColor: "grey.300",
                    border: "none",
                    "& fieldset": { display: "none" },
                    "&:hover fieldset": { display: "none" },
                    "&.Mui-focused fieldset": { display: "none" },
                  },
                }}
              >
                <MenuItem value="non-retirement">Taxable</MenuItem>
                <MenuItem value="pre-tax">Tax-Deferred</MenuItem>
                <MenuItem value="after-tax">Tax-Free</MenuItem>
              </TextField>
              <Typography variant="body" sx={titleStyles}>
                Accounts
              </Typography>
            </Stack>
          </Stack>
          <Button variant="contained" color="secondary" sx={buttonStyles} onClick={handleSave}>
            Save
          </Button>
        </Stack>

        <PageHeader />

        <Box sx={rowBoxStyles }>
          {/* Left Column - Tax Category & Investment Dropdowns */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 400, maxWidth: 500 }}>
            {/* Tax Category Dropdown */}
            <EventSeries formValues={formValues} setFormValues={setFormValues} />
          </Box>
          {/* Right Column - Investment List for the selected tax type */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <AssetAllocation formValues={formValues} setFormValues={setFormValues} isRebalance={true} setPercentError={setPercentError}/>
          </Box>
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
        <Button
          variant="contained"
          color="primary"
          sx={buttonStyles}
          onClick={() => {
            flushSync(() => {
              localStorage.setItem("editEvent", JSON.stringify(null));
              setEventEditMode(null);
            });
            navigate("/scenario/event_series_list");
          }}
        >
          Back
        </Button>

          <Button variant="contained" color="success" sx={buttonStyles} 
            onClick={()=> {
              if (percentError) {
                showAlert("Fixed or initial and final allocation percentages must each sum to exactly 100%.", "error");
                return;
              }
              handleSave();
              navigate("/scenario/event_series_list");
            }}
            disabled={disable}
          >
            Save & Continue
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Rebalance;
