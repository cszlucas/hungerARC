import React, { useState, useContext, useEffect, useCallback } from "react";
import { 
  Typography, Button, Stack, Box, List,
  ListItem, ListItemText, IconButton, Backdrop, Paper, Switch 
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import CustomInput from "../components/customInputBox";
import CustomDropdown from "../components/customDropDown";
import { rowBoxStyles } from "../components/styles";

import { AppContext } from "../context/appContext";
import { AuthContext } from "../context/authContext";

const DimensionalExploration = () => {
  const { 
    currIncome, currExpense, currInvest, currRebalance, currInvestments, currInvestmentTypes, 
    currScenario, setCurrScenario, editMode, tempExploration, setTempExploration
  } = useContext(AppContext);
  const { eventEditMode, setEventEditMode } = useContext(AppContext);
  const { user } = useContext(AuthContext);

  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [tempExplorationForm, setTempExplorationForm] = useState({
    type: "", 
    id: "", 
    parameter: "", 
    range: { lower: "", upper: "", steps: "" }, 
    data: {}
  });

  const handleInputChange = useCallback((field, value) => {
    const keys = field.split(".");
    setTempExplorationForm((prev) => {
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  }, []);

  const getIncomeById = (id) => currIncome.find(e => e._id === id) || null;
  const getExpenseById = (id) => currExpense.find(e => e._id === id) || null;
  const getInvestById = (id) => currInvest.find(e => e._id === id) || null;
  const getRebalanceById = (id) => currRebalance.find(e => e._id === id) || null;

  const incomeItems = [[], []]; 
  const expenseItems = [[], []]; 
  const investItems = [[], []]; 
  const rebalanceItems = [[], []]; 
  
  (currIncome || []).forEach((e) => { incomeItems[0].push(e._id); incomeItems[1].push(e.eventSeriesName); });
  (currExpense || []).forEach((e) => { expenseItems[0].push(e._id); expenseItems[1].push(e.eventSeriesName); });
  (currInvest || []).forEach((e) => { investItems[0].push(e._id); investItems[1].push(e.eventSeriesName); });
  (currRebalance || []).forEach((e) => { rebalanceItems[0].push(e._id); rebalanceItems[1].push(e.eventSeriesName); });

  const [dropDownItems, setDropDownItems] = useState([[], []]);

  useEffect(() => {
    if (tempExplorationForm.type === "Income") {
      handleInputChange("id", "");
      setDropDownItems(incomeItems);
    } else if (tempExplorationForm.type === "Expense") {
      handleInputChange("id", "");
      setDropDownItems(expenseItems);
    } else if (tempExplorationForm.type === "Invest") {
      handleInputChange("id", "");
      setDropDownItems(investItems);
    } else if (tempExplorationForm.type === "Rebalance") {
      handleInputChange("id", "");
      setDropDownItems(rebalanceItems);
    }
  }, [tempExplorationForm.type, handleInputChange]);

  useEffect(() => {
    handleInputChange("parameter", "");
    if (tempExplorationForm.type === "Income") handleInputChange("data", getIncomeById(tempExplorationForm.id));
    else if (tempExplorationForm.type === "Expense") handleInputChange("data", getExpenseById(tempExplorationForm.id));
    else if (tempExplorationForm.type === "Invest") handleInputChange("data", getInvestById(tempExplorationForm.id));
    else if (tempExplorationForm.type === "Rebalance") handleInputChange("data", getRebalanceById(tempExplorationForm.id));
  }, [tempExplorationForm.id, tempExplorationForm.type, handleInputChange]);

  // useEffect(() => { console.log(tempExplorationForm); }, [tempExplorationForm.range]);

  const handleOpenBackdrop = () => {
    setOpenBackdrop(true);
  };

  const handleCloseBackdrop = () => {
    setOpenBackdrop(false);
  };

  const handleAddExploration = () => {
    if (eventEditMode && eventEditMode.event === "Exploration") {
      setTempExploration((prev) => 
        prev.map((e) => 
          e.id === eventEditMode.id ? tempExplorationForm : e
        )
      );
    } else {
      setTempExploration((prev) => [...prev, tempExplorationForm]);
    }
    setEventEditMode(null);
    setOpenBackdrop(false);
  };

  const handleEditExploration = (index) => {
    const selected = tempExploration[index];
    setTempExplorationForm({ ...selected });
    setEventEditMode({ id: selected.id, event: "Exploration" });
    setOpenBackdrop(true);
  };

  const handleDeleteExploration = (index) => {
    setTempExploration((prev) => prev.filter((_, i) => i !== index));
  };

  const DimensionalExplorationList = () => {
    const displayList = (tempExploration || []).map((explore) => {
      if (explore.type === "Roth Optimizer Flag") {
        return {
          name: "Roth Optimizer Flag",
          description: `${currScenario.optimizerSettings.enabled} → ${explore.data?.optimizerSettings?.enabled}`
        };
      } else {
        return {
          name: `${explore.data?.eventSeriesName || "Unknown"} - ${explore.type} - ${explore.parameter}`,
          description: `${explore.range.lower} → ${explore.range.upper} by taking ${explore.range.steps} increments`
        };
      }
    });

    return (
      <List>
        {displayList.map((item, index) => (
          <ListItem
            key={`${item.name}-${index}`}
            sx={{
              backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
              "&:hover": { backgroundColor: "#B0B0B0" },
            }}
            secondaryAction={
              <>
                <IconButton edge="end" onClick={() => handleEditExploration(index)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteExploration(index)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText
              primary={<span style={{ fontWeight: "bold" }}>{item.name || "Unknown Investment"}</span>}
              secondary={item.description}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Box sx={{ minWidth: 400, width: "40vw" }}>
      <Stack direction="row" spacing={4} justifyContent="space-between" alignItems="center">
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Dimensional Exploration
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ textTransform: "none" }}
          onClick={handleOpenBackdrop}
          disabled={(tempExploration?.length || 0) >= 2}
        >
          Add
        </Button>
      </Stack>

      <DimensionalExplorationList />

      <Backdrop
        sx={{ 
          color: "#fff", 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: "flex",
          flexDirection: "column"
        }}
        open={openBackdrop}
        onClick={handleCloseBackdrop}
      >
        <Paper
          elevation={4}
          onClick={(e) => e.stopPropagation()}
          sx={{ p: 4, minWidth: 400, width: "50vw", borderRadius: 2 }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            Add Dimensional Exploration
          </Typography>
          
          <Box sx={rowBoxStyles}>
            <Box>
              <CustomDropdown
                label="Select Type"
                value={tempExplorationForm.type}
                menuItems={["Roth Optimizer Flag", "Income", "Expense", "Invest", "Rebalance"]}
                setValue={(value) => { 
                  if (value === "Roth Optimizer Flag") {
                    handleInputChange("id", "roth-optimizer");
                    handleInputChange("data", currScenario);
                  }
                  handleInputChange("type", value);
                }}
              />

              { tempExplorationForm.type === "Roth Optimizer Flag" && (<>
                <Stack direction="row" alignItems="center" sx={{mt: 4, minWidth: 370}}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Roth Conversion Optimizer:
                  </Typography>
                  <Switch 
                    checked={tempExplorationForm.data?.optimizerSettings?.enabled || false} 
                    onChange={()=>{
                      handleInputChange("data.optimizerSettings.enabled", 
                        !tempExplorationForm.data?.optimizerSettings?.enabled);
                    }} 
                    color="secondary" 
                  />
                </Stack>
                {tempExplorationForm.data?.optimizerSettings?.enabled && (
                  <Box sx={{ mt: 2, ...rowBoxStyles }}>
                    <CustomInput
                      title="Start Year"
                      type="number"
                      value={tempExplorationForm.data?.optimizerSettings?.startYear || ""}
                      setValue={(value)=>{ 
                        handleInputChange("data.optimizerSettings.startYear", value);
                      }}
                      inputProps={{ min: 0 }}
                    />
                    <CustomInput
                      title="End Year"
                      type="number"
                      value={tempExplorationForm.data?.optimizerSettings?.endYear || ""}
                      setValue={(value)=>{ 
                        handleInputChange("data.optimizerSettings.endYear", value);
                      }}
                      inputProps={{ min: 0 }}
                    />
                  </Box>
                )}
              </>)}
            </Box>
            
            { tempExplorationForm.type !== "" && (
              <>
                {tempExplorationForm.type !== "Roth Optimizer Flag" && (
                  <Box>
                    <CustomDropdown
                      label={`${tempExplorationForm.type} Event Series`}
                      value={tempExplorationForm.id}
                      menuLabels={dropDownItems[1]}
                      menuItems={dropDownItems[0]}
                      setValue={(value) => { handleInputChange("id", value); }}
                    />
                  </Box>
                )}

                {tempExplorationForm.id !== "" && (
                  <Box>
                    <CustomDropdown
                      label="Parameter to Explore"
                      value={tempExplorationForm.parameter}
                      menuItems={
                        tempExplorationForm.type === "Income" || tempExplorationForm.type === "Expense"
                          ? ["Start Year", "Duration", "Initial Amount"]
                          : tempExplorationForm.type === "Invest"
                            ? ["Start Year", "Duration", "Asset Allocation"]
                            : ["Start Year", "Duration"]
                      }
                      setValue={(value) => handleInputChange("parameter", value)}
                    />
                  </Box>
                )}

                {tempExplorationForm.parameter !== "" && (<Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                    Parameter Exploration Range:
                  </Typography>
                  <Box sx={{display: "flex", alignItems: "flex-start", flexWrap: "wrap", columnGap: 4}}>
                    <CustomInput
                      title="Lower Bound"
                      type="number"
                      adornment={tempExplorationForm.parameter === "Asset Allocation" ? "%" : ""}
                      value={tempExplorationForm.range.lower || ""}
                      setValue={(value) => handleInputChange("range.lower", value)}
                      inputProps={{
                        min: 0,
                        ...(tempExplorationForm.parameter === "Asset Allocation" ? { max: 100 } : {})
                      }}
                    />
                    <CustomInput
                      title="Upper Bound"
                      type="number"
                      adornment={tempExplorationForm.parameter === "Asset Allocation" ? "%" : ""}
                      value={tempExplorationForm.range.upper || ""}
                      setValue={(value) => handleInputChange("range.upper", value)}
                      inputProps={{
                        min: 0,
                        ...(tempExplorationForm.parameter === "Asset Allocation" ? { max: 100 } : {})
                      }}
                    />
                    <CustomInput
                      title="Step Size"
                      type="number"
                      adornment={tempExplorationForm.parameter === "Asset Allocation" ? "%" : ""}
                      value={tempExplorationForm.range.steps || ""}
                      setValue={(value) => handleInputChange("range.steps", value)}
                      inputProps={{
                        min: 0,
                        ...(tempExplorationForm.parameter === "Asset Allocation" ? { max: 100 } : {})
                      }}
                    />
                  </Box>
                </Box>)}
              </>
            )}
          </Box>
          
          <Box sx={{display: "flex", justifyContent: "space-between"}}>
            <Button variant="contained" color="primary" sx={{ textTransform: "none" }} onClick={handleCloseBackdrop}>
              Cancel
            </Button>
            <Button variant="contained" color="secondary" sx={{ textTransform: "none" }} onClick={handleAddExploration}>
              Add
            </Button>
          </Box>
        </Paper>
      </Backdrop>
    </Box>
  );
};

export default DimensionalExploration;
