import React, { useState, useContext, useMemo, useEffect } from "react";

import {
  Typography, Button, Stack, Box, List, MenuItem, ListItem, ListItemText, TextField, IconButton,
  Backdrop, Paper
} from "@mui/material";
import { textFieldStyles, rowBoxStyles } from "../../../components/styles";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";

const TAX_MAP = {
  "non-retirement": "Taxable",
  "pre-tax": "Tax-Deferred",
  "after-tax": "Tax-Free",
};

const AssetAllocation = ({ formValues, setFormValues, isRebalance = false, setPercentError }) => {
  const { currInvestments, currInvestmentTypes } = useContext(AppContext);
  
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

  useEffect(() => {
    function roundToTwo(num) {
      return Math.round(num * 100) / 100;
    }

    if (formValues.assetAllocation.type === "fixed") {
      const total = Object.values(formValues.assetAllocation.fixedPercentages)
          .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      
      // console.log(`${roundToTwo(total)}`);
      setPercentError(roundToTwo(total) !== 1);
    } else {
      const total_initial = Object.values(formValues.assetAllocation.initialPercentages)
          .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      const total_final = Object.values(formValues.assetAllocation.finalPercentages)
          .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      
      // console.log(`${roundToTwo(total_intial)} - ${roundToTwo(total_final)}`);
      setPercentError(roundToTwo(total_intial) !== 1 || roundToTwo(total_final) !== 1);
    }
  }, [formValues.assetAllocation]);

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
  // console.log(allowedInvestments);
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
        updatedAssetAllocation.fixedPercentages[selectedInvestment] = parseFloat(pendingPercentage);
      } else if (allocationType === "glidePath") {
        if (!updatedAssetAllocation.initialPercentages) updatedAssetAllocation.initialPercentages = {};
        if (!updatedAssetAllocation.finalPercentages) updatedAssetAllocation.finalPercentages = {};
  
        updatedAssetAllocation.initialPercentages[selectedInvestment] = parseFloat(pendingInitial);
        updatedAssetAllocation.finalPercentages[selectedInvestment] = parseFloat(pendingFinal);
      }
  
      return {
        ...prev,
        assetAllocation: updatedAssetAllocation,
      };
    });
    // console.log(formValues);
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
          accountTaxStatus: investment?.accountTaxStatus || "",
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
          accountTaxStatus: investment?.accountTaxStatus || "",
          percent: fixedPercentages[id] * 100,
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
              primary={<span>
                <span style={{ fontWeight: "bold" }}>{item.investmentTypeName || "Unknown Investment"}</span>
                {" " + TAX_MAP[item.accountTaxStatus]}
              </span>}
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
          <Box sx={{width: "auto"}}>
            {/* Add Button */}
            <Stack direction="row" spacing={1} sx={{display: "flex", justifyContent: "space-between",  alignItems: "center"}}>
              <Box sx={{display: "flex", columnGap: 2, alignItems: "center"}}>
                <Typography variant="h5" sx={{ fontWeight: "bold"}}>
                  {TAX_MAP[formValues.taxStatus] || "Investments"}
                </Typography>
                <CustomToggle
                  title=""
                  labels={["Fixed", "Glide Path"]}
                  values={["fixed", "glidePath"]}
                  sideView={false}
                  width={150}
                  value={formValues.assetAllocation.type}
                  setValue={(value) =>
                    handleInputChange("assetAllocation.type", value)
                  }
                />
              </Box>
              <Button
                variant="contained"
                color="primary"
                sx={{ textTransform: "none"}}
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
                >
                  <MenuItem value="" disabled>
                    Select
                  </MenuItem>
                  {(
                    selectedInvestment && typeof selectedInvestment === "string" && selectedInvestment.trim() !== ""
                      ? [...filteredInvestments, getInvestmentById(selectedInvestment)]
                      : [...filteredInvestments]
                  )
                    .filter((inv) => inv && typeof inv === "object")
                    .reduce((unique, inv) => {
                      if (!unique.some((i) => i._id === inv._id)) unique.push(inv);
                      return unique;
                    }, [])
                    .map((investment) => (
                      <MenuItem key={investment._id} value={investment._id}>
                        {getInvestmentTypeById(investment.investmentType)?.name} - {TAX_MAP[investment.accountTaxStatus]}
                      </MenuItem>
                    ))}
                </TextField>
              </Box>
              {/* Toggle Allocation Type */}
              
            </Box>
          
            <Box sx={{mt: -3}}>
              {/* Input Fields Below in Columns */}
              {formValues.assetAllocation.type === "fixed" && (
                <CustomInput
                  title="Value"
                  type="number"
                  adornment="%"
                  value={pendingPercentage ?? ""}
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
