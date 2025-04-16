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

const DEFAULT_FORM_VALUES = {
  _id: "",
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
  rebalanceAllocation: {
    type: "fixed",
    fixedPercentages: {},
    initialPercenatages: {},
    finalPercentages: {}
  }
};
const TAX_MAP = {
  "non-retirement": "Taxable",
  "pre-tax": "Tax-Deferred",
  "after-tax": "Tax-free",
};

const Rebalance = () => {
  const { currRebalance, setCurrRebalance, currInvestments, currInvestmentTypes, setCurrScenario, editMode } = useContext(AppContext);
  const { eventEditMode, setEventEditMode } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  
  const investmentTypeMap = useMemo(() => (
    Object.fromEntries(currInvestmentTypes.map(i => [i._id, i]))
  ), [currInvestmentTypes]);
  const investmentMap = useMemo(() => (
    Object.fromEntries(currInvestments.map(i => [i._id, i]))
  ), [currInvestments]);

  const getInvestmentTypeById = (id) => investmentTypeMap[id] || { _id: "NULL", name: "Unknown Type" };
  const getInvestmentById = (id) => investmentMap[id] || null;
  const getRebalanceById = (id) => currRebalance.find(r => r._id === id) || null;
  const getRebalanceByTaxStatus = (status) => currRebalance.find(r => r.taxStatus === status) || DEFAULT_FORM_VALUES;
  
  const allowedInvestments = currInvestments.filter((item) => getInvestmentTypeById(item.investmentType).name !== "Cash");
  const [formValues, setFormValues] = useState(getRebalanceById(eventEditMode.id) || getRebalanceByTaxStatus("non-retirement"));
  const [selectedInvestment, setSelectedInvestment] = useState("");
  const displayedList = formValues.rebalanceAllocation;
  console.log(displayedList);
  // useEffect(()=> {
    
  // }, [eventEditMode]);

  const handleTaxStatusChange = (selectedTaxStatus) => {
    const match = currRebalance?.find((r) => r.taxStatus === selectedTaxStatus);
    
    if (match) { setEventEditMode((prev) => ({ ...prev, id: match._id })); } 
    else { setEventEditMode((prev) => ({ ...prev, id: "new" })); }
    const updatedForms = {...DEFAULT_FORM_VALUES, taxStatus: selectedTaxStatus};
    const newForm = match || updatedForms;
  
    setFormValues(newForm);
    setSelectedInvestment("");
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

  const filteredInvestments = allowedInvestments.filter((investment) => {
    const matchesTaxStatus = investment.accountTaxStatus === formValues.taxStatus;
  
    const { type, fixedPercentages = {}, initialPercentages = {} } = formValues.rebalanceAllocation;
  
    const alreadyAllocated =
      type === "fixed"
        ? Object.prototype.hasOwnProperty.call(fixedPercentages, investment._id)
        : Object.prototype.hasOwnProperty.call(initialPercentages, investment._id);
  
    return matchesTaxStatus && !alreadyAllocated; // If investment matches with given tax status as well its not already allocated
  });

  const [pendingPercentage, setPendingPercentage] = useState("");
  const [pendingInitial, setPendingInitial] = useState("");
  const [pendingFinal, setPendingFinal] = useState("");

  // const [taxableInvestments, setTaxableInvestments] = useState([]); //keep
  // const [taxDeferredInvestments, setTaxDeferredInvestments] = useState([]); //keep
  // const [taxFreeInvestments, setTaxFreeInvestments] = useState([]); //keep

  const navigate = useNavigate();

  const handleSave = async () => {
    // const cleanRebalanceAllocation = (form) => {
    //   const cleaned = { ...form };
    //   const allocation = { ...form.rebalanceAllocation };
    
    //   if (allocation.type === "fixed") {
    //     allocation.initialPercentages = {};
    //     allocation.finalPercentages = {};
    //   } else if (allocation.type === "glidePath") {
    //     allocation.fixedPercentages = {};
    //   }
    
    //   cleaned.rebalanceAllocation = allocation;
    //   return cleaned;
    // };
    // const cleanedFormValues = cleanRebalanceAllocation(formValues);

    const cleanedAllocation = formValues.rebalanceAllocation.type === "fixed"
            ? { ...formValues.rebalanceAllocation, initialPercentages: {}, finalPercentages: {} }
            : { ...formValues.rebalanceAllocation, fixedPercentages: {} };
    const cleanedFormValues = { ...formValues, rebalanceAllocation: cleanedAllocation };
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
  
  const handleAddInvestment = () => {
    if (!selectedInvestment) return;
  
    const investment = getInvestmentById(selectedInvestment);
    if (!investment) return;
  
    setFormValues((prev) => {
      const updatedRebalance = { ...prev.rebalanceAllocation };
      const allocationType = prev.rebalanceAllocation.type;
  
      if (allocationType === "fixed") {
        if (!updatedRebalance.fixedPercentages) updatedRebalance.fixedPercentages = {};
        updatedRebalance.fixedPercentages[selectedInvestment] = pendingPercentage;
      } else if (allocationType === "glidePath") {
        if (!updatedRebalance.initialPercentages) updatedRebalance.initialPercentages = {};
        if (!updatedRebalance.finalPercentages) updatedRebalance.finalPercentages = {};
  
        updatedRebalance.initialPercentages[selectedInvestment] = pendingInitial;
        updatedRebalance.finalPercentages[selectedInvestment] = pendingFinal;
      }
  
      return {
        ...prev,
        rebalanceAllocation: updatedRebalance,
      };
    });
  
    // Categorize investment
    // const alreadyInList = (list) =>
    //   list.some((inv) => inv.investmentTypeName === investment.investmentTypeName);
  
    // if (formValues.taxStatus === "non-retirement" && !alreadyInList(taxableInvestments)) {
    //   setTaxableInvestments([...taxableInvestments, investment]);
    // } else if (formValues.taxStatus === "pre-tax" && !alreadyInList(taxDeferredInvestments)) {
    //   setTaxDeferredInvestments([...taxDeferredInvestments, investment]);
    // } else if (formValues.taxStatus === "after-tax" && !alreadyInList(taxFreeInvestments)) {
    //   setTaxFreeInvestments([...taxFreeInvestments, investment]);
    // }
  
    // Clear selection + pending inputs
    setSelectedInvestment("");
    setPendingPercentage("");
    setPendingInitial("");
    setPendingFinal("");
  };

  const handleDeleteInvestment = (investmentId) => {
    setFormValues((prev) => {
      const updated = { ...prev };
      const type = updated.rebalanceAllocation.type;
      
      // Parse, delete, then update allocation
      if (type === "fixed") {
        const updatedFixed = { ...updated.rebalanceAllocation.fixedPercentages };
        delete updatedFixed[investmentId];

        updated.rebalanceAllocation.fixedPercentages = updatedFixed;
      } else if (type === "glidePath") {
        const updatedInitial = { ...updated.rebalanceAllocation.initialPercentages };
        const updatedFinal = { ...updated.rebalanceAllocation.finalPercentages };
        delete updatedInitial[investmentId];
        delete updatedFinal[investmentId];

        updated.rebalanceAllocation.initialPercentages = updatedInitial;
        updated.rebalanceAllocation.finalPercentages = updatedFinal;
      }

      return updated;
    });
  };
  
  const handleEditInvestment = (investmentId) => {
    setSelectedInvestment(investmentId);
    const { type, fixedPercentages, initialPercentages, finalPercentages } = formValues.rebalanceAllocation;
  
    if (type === "fixed") {
      setPendingPercentage(fixedPercentages[investmentId] ?? "");
    } else if (type === "glidePath") {
      setPendingInitial(initialPercentages[investmentId] ?? "");
      setPendingFinal(finalPercentages[investmentId] ?? "");
    }
  };
  
  const InvestList = ({ rebalanceAllocation, getInvestmentNameById }) => {
    const displayList = [];

    if (!rebalanceAllocation || !rebalanceAllocation.type) {
      return <div>No allocation data to display</div>;
    }
  
    const { type, fixedPercentages = {}, initialPercentages = {}, finalPercentages = {} } = rebalanceAllocation;
  
    if (type === "glidePath") {
      Object.keys(initialPercentages).forEach((id) => {
        const investment = getInvestmentNameById(id); // should return full investment object
        const typeObj = getInvestmentTypeById(investment?.investmentType);
        displayList.push({
          _id: id,
          investmentTypeName: typeObj?.name || "Unknown Investment",
          initial: initialPercentages[id] * 100,
          final: finalPercentages[id] * 100,
        });
      });
    } else if (type === "fixed") {
      Object.keys(fixedPercentages).forEach((id) => {
        const investment = getInvestmentNameById(id); // full object
        const typeObj = getInvestmentTypeById(investment?.investmentType);
        displayList.push({
          _id: id,
          investmentTypeName: typeObj?.name || "Unknown Investment",
          percent: fixedPercentages[id],
        });
      });
    }

    return (
      <List>
        {displayList.map((item, index) => (
          <ListItem
            key={`${item.investmentTypeName}-${index}`}
            sx={{
              backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
              "&:hover": { backgroundColor: "#B0B0B0" },
            }}
            secondaryAction={
              <>
                 <IconButton edge="end" onClick={() => handleEditInvestment(item._id)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteInvestment(item._id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText
              primary={<span style={{ fontWeight: "bold" }}>{item.investmentTypeName || "Unknown Investment"}</span>}
              secondary={
                item.initial !== undefined && item.final !== undefined
                  ? `${item.initial}% → ${item.final}%`
                  : item.percent !== undefined ? `${item.percent}%` : "—"
              }
            />
          </ListItem>
        ))}
      </List>
    );
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
            <Typography variant="h6" sx={{ fontWeight: "bold", marginTop: 4, marginBottom: 2 }}>
              Add Asset Allocation
            </Typography>
            {/* Investment Dropdown - Populated Based on Tax Category */}
            <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto", mb:2 }}>
              <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                Investment
              </Typography>
              <TextField select 
                value={selectedInvestment} 
                onChange={(e) => setSelectedInvestment(e.target.value)} 
                fullWidth sx={textFieldStyles} 
                disabled={!formValues.taxStatus}
              >
                <MenuItem value="" disabled>
                  Select
                </MenuItem>
                {filteredInvestments.map((investment) => (
                  <MenuItem key={investment._id} value={investment._id}>
                    {getInvestmentTypeById(investment.investmentType).name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Stack spacing={3} >
              {/* Toggle Allocation Type */}
              <CustomToggle
                title="Allocations"
                labels={["Fixed", "Glide Path"]}
                values={["fixed", "glidePath"]}
                sideView={false}
                width={100}
                value={formValues.rebalanceAllocation.type}
                setValue={(value) =>
                  handleInputChange("rebalanceAllocation.type", value)
                }
              />

              {/* Input Fields Below in Columns */}
              {formValues.rebalanceAllocation.type === "fixed" && (
                <CustomInput
                  title="Value"
                  type="number"
                  adornment="%"
                  value={pendingPercentage ?? "" }
                  setValue={setPendingPercentage}
                />
              )}
              {formValues.rebalanceAllocation.type === "glidePath" && (
                <Stack direction="row" spacing={4} alignItems="start">
                  <CustomInput
                    title="Initial Percentage"
                    type="number"
                    adornment="%"
                    value={pendingInitial ?? ""}
                    setValue={setPendingInitial}
                  />
                  <CustomInput
                    title="Final Percentage"
                    type="number"
                    adornment="%"
                    value={pendingFinal ?? ""}
                    setValue={setPendingFinal}
                  />
                </Stack>
              )}
            </Stack>

            {/* Add Button */}
            <Stack direction="row" spacing={4} sx={{mt: 4}}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {TAX_MAP[formValues.taxStatus] || "Investments"}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ textTransform: "none" }}
                onClick={handleAddInvestment}
                disabled={!selectedInvestment} // Disable if no investment selected
              >
                Add
              </Button>
            </Stack>
            
            <InvestList
              rebalanceAllocation={displayedList}
              getInvestmentNameById={getInvestmentById}
            />
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
