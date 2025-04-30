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
  IconButton,
  Backdrop,
  Paper
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

// const DEFAULT_FORM_VALUES = {
//   _id: null,
//   eventSeriesName: "",
//   eventSeriesDescription: "",
//   startYear: {
//     type: "fixedAmt",
//     value: "",
//     mean: "",
//     stdDev: "",
//     min: "",
//     max: "",
//     refer: null,
//   },
//   duration: {
//     type: "fixedAmt",
//     value: "",
//     mean: "",
//     stdDev: "",
//     min: "",
//     max: ""
//   },
//   taxStatus: "non-retirement",
//   assetAllocation: {
//     type: "fixed",
//     fixedPercentages: {},
//     initialPercenatages: {},
//     finalPercentages: {}
//   }
// };

const TAX_MAP = {
  "non-retirement": "Taxable",
  "pre-tax": "Tax-Deferred",
  "after-tax": "Tax-Free",
};

const AssetAllocation = ({ formValues, setFormValues, isRebalance = false }) => {
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
  
  const allowedInvestments = currInvestments.filter((item) => getInvestmentTypeById(item.investmentType).name?.toLowerCase() !== "cash");
  const [selectedInvestment, setSelectedInvestment] = useState("");
  const displayedList = formValues.assetAllocation;
  
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const handleOpenBackdrop = () => { setOpenBackdrop(true); };
  const handleCloseBackdrop = () => { setOpenBackdrop(false); };

  useEffect(()=> {
    setSelectedInvestment("");
  }, [formValues._id]);

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
    const matchesTaxStatus = isRebalance 
      ? (investment.accountTaxStatus === formValues.taxStatus) 
      : (investment.accountTaxStatus !== "pre-tax");
    
    const { type, fixedPercentages = {}, initialPercentages = {} } = formValues.assetAllocation;
  
    const alreadyAllocated =
      type === "fixed"
        ? Object.prototype.hasOwnProperty.call(fixedPercentages, investment._id)
        : Object.prototype.hasOwnProperty.call(initialPercentages, investment._id);
  
    return matchesTaxStatus && !alreadyAllocated; // If investment matches with given tax status as well its not already allocated
  });

  const [pendingPercentage, setPendingPercentage] = useState("");
  const [pendingInitial, setPendingInitial] = useState("");
  const [pendingFinal, setPendingFinal] = useState("");
  
  const handleAddInvestment = () => {
    if (!selectedInvestment) return;
  
    const investment = getInvestmentById(selectedInvestment);
    if (!investment) return;
  
    setFormValues((prev) => {
      const updatedAssetAllocation = { ...prev.assetAllocation };
      const allocationType = prev.assetAllocation.type;
  
      if (allocationType === "fixed") {
        if (!updatedAssetAllocation.fixedPercentages) updatedAssetAllocation.fixedPercentages = {};
        updatedAssetAllocation.fixedPercentages[selectedInvestment] = pendingPercentage;
      } else if (allocationType === "glidePath") {
        if (!updatedAssetAllocation.initialPercentages) updatedAssetAllocation.initialPercentages = {};
        if (!updatedAssetAllocation.finalPercentages) updatedAssetAllocation.finalPercentages = {};
  
        updatedAssetAllocation.initialPercentages[selectedInvestment] = pendingInitial;
        updatedAssetAllocation.finalPercentages[selectedInvestment] = pendingFinal;
      }
  
      return {
        ...prev,
        assetAllocation: updatedAssetAllocation,
      };
    });
  
    setSelectedInvestment("");
    setPendingPercentage("");
    setPendingInitial("");
    setPendingFinal("");
    setOpenBackdrop(false);
  };

  const handleDeleteInvestment = (investmentId) => {
    setFormValues((prev) => {
      const updated = { ...prev };
      const type = updated.assetAllocation.type;
      
      // Parse, delete, then update allocation
      if (type === "fixed") {
        const updatedFixed = { ...updated.assetAllocation.fixedPercentages };
        delete updatedFixed[investmentId];

        updated.assetAllocation.fixedPercentages = updatedFixed;
      } else if (type === "glidePath") {
        const updatedInitial = { ...updated.assetAllocation.initialPercentages };
        const updatedFinal = { ...updated.assetAllocation.finalPercentages };
        delete updatedInitial[investmentId];
        delete updatedFinal[investmentId];

        updated.assetAllocation.initialPercentages = updatedInitial;
        updated.assetAllocation.finalPercentages = updatedFinal;
      }

      return updated;
    });
  };
  
  const handleEditInvestment = (investmentId) => {
    const { type, fixedPercentages, initialPercentages, finalPercentages } = formValues.assetAllocation;
    if (type === "fixed") {
      setPendingPercentage(fixedPercentages[investmentId] ?? "");
    } else if (type === "glidePath") {
      setPendingInitial(initialPercentages[investmentId] ?? "");
      setPendingFinal(finalPercentages[investmentId] ?? "");
    }
    filteredInvestments.push(getInvestmentById(investmentId));
    setSelectedInvestment(investmentId);
    setOpenBackdrop(true);
  };
  
  const InvestList = ({ assetAllocation, getInvestmentNameById }) => {
    const displayList = [];

    if (!assetAllocation || !assetAllocation.type) {
      return <div>No allocation data to display</div>;
    }
  
    const { type, fixedPercentages = {}, initialPercentages = {}, finalPercentages = {} } = assetAllocation;
  
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

  return (<>
        <Box>
          {/* Right Column - Investment List for the selected tax type */}
          <Box sx={{width: 350}}>
            {/* Add Button */}
            <Stack direction="row" spacing={4} sx={{mt: 4, display: "flex", justifyContent: "space-between"}}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {TAX_MAP[formValues.taxStatus] || "Investments"}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ textTransform: "none" }}
                onClick={handleOpenBackdrop}
              >
                Add
              </Button>
            </Stack>
            
            <InvestList
              assetAllocation={displayedList}
              getInvestmentNameById={getInvestmentById}
            />
          </Box>
        </Box>
        
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1, display: "flex", flexDirection: "column" }}
          open={openBackdrop}
          onClick={handleCloseBackdrop}
        >
          <Paper
            elevation={4}
            onClick={(e) => e.stopPropagation()}
            sx={{ p: 4, minWidth: 400, borderRadius: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
              Add Asset Allocation
            </Typography>
            {/* Investment Dropdown - Populated Based on Tax Category */}
            <Box sx={rowBoxStyles}>
              <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto", mb:2 }}>
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                  Investment
                </Typography>
                <TextField
                  select
                  value={selectedInvestment}
                  onChange={(e) => setSelectedInvestment(e.target.value)}
                  fullWidth
                  sx={textFieldStyles}
                  disabled={!formValues.taxStatus}
                >
                  <MenuItem value="" disabled>
                    Select
                  </MenuItem>
                  {[...filteredInvestments, selectedInvestment && getInvestmentById(selectedInvestment)]
                    .filter(Boolean)
                    .reduce((unique, inv) => {
                      if (!unique.some((i) => i._id === inv._id)) unique.push(inv);
                      return unique;
                    }, [])
                    .map((investment) => (
                      <MenuItem key={investment._id} value={investment._id}>
                        {getInvestmentTypeById(investment.investmentType)?.name}
                      </MenuItem>
                    ))}
                </TextField>
              </Box>
              {/* Toggle Allocation Type */}
              <Box>
                <CustomToggle
                  title="Allocations"
                  labels={["Fixed", "Glide Path"]}
                  values={["fixed", "glidePath"]}
                  sideView={false}
                  width={100}
                  value={formValues.assetAllocation.type}
                  setValue={(value) =>
                    handleInputChange("assetAllocation.type", value)
                  }
                />
              </Box>
            </Box>
          
            <Box sx={{mt: -3}}>
              {/* Input Fields Below in Columns */}
              {formValues.assetAllocation.type === "fixed" && (
                <CustomInput
                  title="Value"
                  type="number"
                  adornment="%"
                  value={pendingPercentage ?? "" }
                  setValue={setPendingPercentage}
                />
              )}
              {formValues.assetAllocation.type === "glidePath" && (
                <Box sx={{display: "flex", alignItems: "flex-start", flexWrap: "wrap", columnGap: 4 }}>
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
                </Box>
              )}
            </Box>

            <Box sx={{display: "flex", justifyContent: "space-between", mt: 2}}>
              <Button variant="contained" color="primary" sx={{ textTransform: "none" }} onClick={handleCloseBackdrop}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                sx={{ textTransform: "none" }} 
                onClick={handleAddInvestment}
                disabled={!selectedInvestment 
                  || (formValues.assetAllocation.type == "fixed" && !pendingPercentage)
                  || (formValues.assetAllocation.type == "glidePath" && (!pendingInitial || !pendingFinal))
                } // Disable if no investment selected
              >
                Save
              </Button>
            </Box>
          </Paper>
        </Backdrop>
  </>);
};

export default AssetAllocation;
