// External library imports
import axios from "axios";
import { ObjectId } from "bson";
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// MUI Components
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, Alert,
} from "@mui/material";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Custom component imports
import EventSeries from "./eventSeries";
import CustomInput from "../../../components/customInputBox";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import AssetAllocation from "./assetAllocation";

// Style imports
import {
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, backContinueContainerStyles,
} from "../../../components/styles";

// Contexts
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";

// Default state structure for a new investment event
const DEFAULT_FORM_VALUES = {
  _id: null,
  eventSeriesName: "",
  eventSeriesDescription: "",
  maxCash: "",
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
    max: "",
  },
  assetAllocation: {
    type: "fixed",
    fixedPercentages: {},
    initialPercentages: {},
    finalPercentages: {},
  },
};

const Invest = () => {
  const { editMode, eventEditMode, setEventEditMode, currInvest, setCurrInvest, setCurrScenario } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Get existing investment or default
  const getInvestById = (id) => {
    if (!id || id === "new") return structuredClone(DEFAULT_FORM_VALUES);

    for (let i = 0; i < currInvest.length; i++) {
      if (currInvest[i]._id === id) {
        if (currInvest[i].assetAllocation) return currInvest[i];
        return {
          ...currInvest[i],
          assetAllocation: {
            type: "fixed",
            fixedPercentages: {},
            initialPercentages: {},
            finalPercentages: {},
          },
        };
      }
    }
    return structuredClone(DEFAULT_FORM_VALUES);
  };

  const [formValues, setFormValues] = useState(getInvestById(eventEditMode ? eventEditMode.id : "new"));
  const [disable, setDisable] = useState(true);
  const [percentError, setPercentError] = useState(false);
  const [showPercentError, setShowPercentError] = useState(false);

  // Enable Save button if all fields are filled
  useEffect(() => {
    const expression = formValues.eventSeriesName &&
      (formValues.startYear.type !== "fixedAmt" || formValues.startYear.value) &&
      (formValues.startYear.type !== "normal" || (formValues.startYear.mean && formValues.startYear.stdDev)) &&
      (formValues.startYear.type !== "uniform" || (formValues.startYear.min && formValues.startYear.max)) &&
      (["same", "after"].includes(formValues.startYear.type) ? formValues.startYear.refer : true) &&
      formValues.maxCash &&
      (formValues.duration.type !== "fixedAmt" || formValues.duration.value) &&
      (formValues.duration.type !== "normal" || (formValues.duration.mean && formValues.duration.stdDev)) &&
      (formValues.duration.type !== "uniform" || (formValues.duration.min && formValues.duration.max)) &&
      (formValues.assetAllocation.type === "fixed"
        ? Object.keys(formValues.assetAllocation.fixedPercentages).length > 0
        : true) &&
      (formValues.assetAllocation.type === "glidePath"
        ? Object.keys(formValues.assetAllocation.initialPercentages).length > 0
        : true);

    setDisable(!expression);
  }, [formValues]);

  // Handle input change
  const handleInputChange = (field, value) => {
    const fieldParts = field.split(".");
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
            },
          },
        };
      }
      if (fieldParts.length === 2) {
        const [parent, child] = fieldParts;
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

  const handleSave = async () => {
    const cleanedAllocation = formValues.assetAllocation.type === "fixed"
      ? { ...formValues.assetAllocation, initialPercentages: {}, finalPercentages: {} }
      : { ...formValues.assetAllocation, fixedPercentages: {} };

    const updatedFormValues = { ...formValues, assetAllocation: cleanedAllocation };

    if (eventEditMode.id === "new") {
      let id = new ObjectId().toHexString();

      if (!user.guest) {
        const response = await axios.post(`http://localhost:8080/scenario/${editMode}/investStrategy`, updatedFormValues);
        id = response.data._id;
      }

      handleInputChange("_id", id);
      setCurrInvest((prev) => [...prev, { ...updatedFormValues, _id: id }]);
      setEventEditMode({ type: "Invest", id });

      setCurrScenario((prev) => ({
        ...prev,
        investEventSeries: [...(prev?.investEventSeries || []), id],
      }));
    } else {
      if (!user.guest) {
        await axios.post(`http://localhost:8080/updateInvestStrategy/${eventEditMode.id}`, updatedFormValues);
      }
      setCurrInvest((prev) => {
        const filtered = prev.filter((item) => item._id !== eventEditMode.id);
        return [...filtered, updatedFormValues];
      });
    }
  };

  const triggerPercentError = () => {
    setShowPercentError(true);
    setTimeout(() => setShowPercentError(false), 10000); // Hide after 3s
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>
        {showPercentError && (
          <Alert
            severity="error"
            variant="filled"
            sx={{
              position: "fixed",
              top: 70,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1301,
              width: "auto",
              maxWidth: 500,
              boxShadow: 3,
            }}
          >
            Fixed or initial and final allocation percentages must each sum to exactly 100%.
          </Alert>
        )}

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Invest
          </Typography>
          <Button variant="contained" color="secondary" sx={buttonStyles} onClick={handleSave}>
            Save
          </Button>
        </Stack>

        <PageHeader />

        {/* Form Body */}
        <Box sx={rowBoxStyles}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, width: 400 }}>
            <EventSeries formValues={formValues} setFormValues={setFormValues} />
            <CustomInput
              title="Maximum Cash"
              type="number"
              adornment="$"
              value={formValues.maxCash}
              setValue={(value) => handleInputChange("maxCash", value)}
              inputProps={{ min: 0 }}
            />
          </Box>

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <AssetAllocation
              formValues={formValues}
              setFormValues={setFormValues}
              setPercentError={setPercentError}
            />
          </Box>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button
            variant="contained"
            color="primary"
            sx={buttonStyles}
            onClick={() => navigate("/scenario/event_series_list")}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="success"
            sx={buttonStyles}
            onClick={() => {
              if (percentError) {
                triggerPercentError();
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

export default Invest;
