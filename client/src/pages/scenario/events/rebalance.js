import React, { useState, useContext, useMemo, useEffect, startTransition } from "react";
import { flushSync } from "react-dom";

import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
  Button,
  Stack,
  Box,
  List,
  MenuItem,
  ListItem,
  ListItemText,
  TextField,
  IconButton
} from "@mui/material";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import { stackStyles, titleStyles, buttonStyles, backContinueContainerStyles, textFieldStyles, rowBoxStyles } from "../../../components/styles";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";
import axios from "axios";
import { AuthContext } from "../../../context/authContext";
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
  taxStatus: "non-retirement",
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
  const { currRebalance, setCurrRebalance, currInvestments, currInvestmentTypes, setCurrScenario, editMode } = useContext(AppContext);
  const { eventEditMode, setEventEditMode } = useContext(AppContext);
  const { user } = useContext(AuthContext);

  const getRebalanceById = (id) => currRebalance.find(r => r._id === id) || null;
  const getRebalanceByTaxStatus = (status) => currRebalance.find(r => r.taxStatus === status) || DEFAULT_FORM_VALUES;
  const [formValues, setFormValues] = useState(getRebalanceById(eventEditMode.id) || getRebalanceByTaxStatus("non-retirement"));

  const handleTaxStatusChange = (selectedTaxStatus) => {
    const match = currRebalance?.find((r) => r.taxStatus === selectedTaxStatus);
    
    if (match) { setEventEditMode((prev) => ({ ...prev, id: match._id })); } 
    else { setEventEditMode((prev) => ({ ...prev, id: "new" })); }
    const updatedForms = {...DEFAULT_FORM_VALUES, taxStatus: selectedTaxStatus};
    const newForm = match || updatedForms;
  
    setFormValues(newForm);
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
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, width: 350, maxWidth: 500 }}>
            {/* Tax Category Dropdown */}
            <EventSeries formValues={formValues} setFormValues={setFormValues} />
          </Box>
          {/* Right Column - Investment List for the selected tax type */}
          <Box sx={{width: 350}}>
            <AssetAllocation formValues={formValues} setFormValues={setFormValues} isRebalance={true}/>
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
              handleSave();
              navigate("/scenario/event_series_list");
            }}
          >
            Save & Continue
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Rebalance;
