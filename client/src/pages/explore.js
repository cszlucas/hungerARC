import React, { useState, useContext, useMemo, useEffect } from "react";
import { 
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, List, MenuItem,
  ListItem, ListItemText, IconButton, Backdrop, Paper, Switch 
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import EventSeries from "./scenario/events/eventSeries";
import CustomInput from "../components/customInputBox";
import CustomDropdown from "../components/customDropDown";
import {
  stackStyles, titleStyles, textFieldStyles, backContinueContainerStyles, buttonStyles, rowBoxStyles,
} from "../components/styles";

import { AppContext } from "../context/appContext";
import { AuthContext } from "../context/authContext";
import theme from "../components/theme";
import { useNavigate } from "react-router-dom";

const DimensionalExploration = () => {
  const { 
    currIncome, currExpense, currInvest, currRebalance, currInvestments, currInvestmentTypes, 
    currScenario, setCurrScenario, editMode, tempExploration, setTempExploration
  } = useContext(AppContext);
  const { eventEditMode, setEventEditMode } = useContext(AppContext);
  const { user } = useContext(AuthContext);

  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [tempExplorationForm, setTempExplorationForm] = useState({type: "", itemIndex: "", setting: "", data: {}});

  const handleInputChange = (field, value) => {
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
  };

  // const investmentTypeMap = useMemo(() => (
  //   Object.fromEntries(currInvestmentTypes.map(i => [i._id, i]))
  // ), [currInvestmentTypes]);

  // const investmentMap = useMemo(() => (
  //   Object.fromEntries(currInvestments.map(i => [i._id, i]))
  // ), [currInvestments]);

  // const getInvestmentTypeById = (id) => investmentTypeMap[id] || { _id: "NULL", name: "Unknown Type" };
  // const getInvestmentById = (id) => investmentMap[id] || null;
  // const getIncomeById = (id) => currIncome.find(e => e._id === id) || null;
  // const getExpenseById = (id) => currExpense.find(e => e._id === id) || null;
  // const getInvestById = (id) => currInvest.find(e => e._id === id) || null;
  // const getRebalanceById = (id) => currRebalance.find(e => e._id === id) || null;

  const incomeItems = [[], []]; 
  const expenseItems = [[], []]; 
  const investItems = [[], []]; 
  const rebalanceItems = [[], []]; 
  
  (currIncome || []).forEach((e, i) => { incomeItems[0].push(i); incomeItems[1].push(e.eventSeriesName); });
  (currExpense || []).forEach((e, i) => { expenseItems[0].push(i); expenseItems[1].push(e.eventSeriesName); });
  (currInvest || []).forEach((e, i) => { investItems[0].push(i); investItems[1].push(e.eventSeriesName); });
  (currRebalance || []).forEach((e, i) => { rebalanceItems[0].push(i); rebalanceItems[1].push(e.eventSeriesName); });

  const [dropDownItems, setDropDownItems] = useState([[], []]);

  useEffect(()=>{
    handleInputChange("itemIndex", "");
    if (tempExplorationForm.type === "Income") setDropDownItems(incomeItems);
    else if (tempExplorationForm.type === "Expense") setDropDownItems(expenseItems);
    else if (tempExplorationForm.type === "Invest") setDropDownItems(investItems);
    else if (tempExplorationForm.type === "Rebalance") setDropDownItems(rebalanceItems);
  }, [tempExplorationForm.type]);

  useEffect(()=>{
    handleInputChange("setting", "");
    if (tempExplorationForm.type === "Income") handleInputChange("data", currIncome[tempExplorationForm.itemIndex]);
    else if (tempExplorationForm.type === "Expense") handleInputChange("data", currExpense[tempExplorationForm.itemIndex]);
    else if (tempExplorationForm.type === "Invest") handleInputChange("data", currInvest[tempExplorationForm.itemIndex]);
    else if (tempExplorationForm.type === "Rebalance") handleInputChange("data", currRebalance[tempExplorationForm.itemIndex]);
    setEventEditMode({id: currExpense[tempExplorationForm.itemIndex] });
  }, [tempExplorationForm.itemIndex]);



  const handleOpenBackdrop = () => {
    setOpenBackdrop(true);
  };

  const handleCloseBackdrop = () => {
    setOpenBackdrop(false);
  };

  const handleDeleteExploration = (index) => {
    // To be implemented
  };

  const handleEditExploration = (index) => {
    // To be implemented
  };

  const DimensionalExplorationList = () => {
    const displayList = [{name: "Hi", description: "Testing"}, {name: "hi2", description: "Testing"}];

    if (tempExploration.length !== 0) {
      Object.keys(tempExploration).forEach((explore) => {
        if (explore.type === "rothOptimizerFlag") {
          displayList.push({
            name: "Roth Optimizer Flag",
            description: `${currScenario.optimizerSettings.enabled} → ${explore.data.optimizerSettings.enabled}`
          });
        } else {
          if (explore.setting === "initalAmount") {
            displayList.push({
              name: `${explore.name} - ${explore.type}`,
              description: "Initial Amount Changes"
            });
          } else if (explore.setting === "timeRange") {
            displayList.push({
              name: `${explore.name} - ${explore.type}`,
              description: "Start Year / Duration Changes"
            });
          } else if (explore.setting === "assetAllocation") {
            displayList.push({
              name: `${explore.name} - ${explore.type}`,
              description: "Asset Allocation % Adjustments"
            });
          }
        }
      });
    }

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
          disabled={tempExploration.length >= 2}
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
          onClick={(e) => e.stopPropagation()} // prevent backdrop from closing when clicking inside box
          sx={{ p: 4, minWidth: 400, width: "60vw", borderRadius: 2 }}
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
                  if (value === "Roth Optimizer Flag") handleInputChange("data", currScenario); 
                  handleInputChange("type", value);
                }}
              />

              { tempExplorationForm.type === "Roth Optimizer Flag" && (<>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{mt: 4, minWidth: 370}}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Roth Conversion Strategy:
                  </Typography>
                  <Switch 
                    checked={tempExplorationForm.data.optimizerSettings.enabled || false} 
                    onChange={()=>{
                      handleInputChange("data.optimizerSettings.enabled", !tempExplorationForm.data.optimizerSettings.enabled);
                    }} 
                    color="secondary" 
                  />
                </Stack>
                {tempExplorationForm.data.optimizerSettings.enabled && (
                  <>
                    <Box sx={{...rowBoxStyles, mt: 2}}>
                      <CustomInput
                        title="Start Year"
                        type="number"
                        value={tempExplorationForm.data.optimizerSettings.startYear}
                        setValue={(value)=>{ 
                          handleInputChange("data.optimizerSettings.startYear", value);
                        }}
                        inputProps={{ min: 0 }}
                      />
                      <CustomInput
                        title="End Year"
                        type="number"
                        value={tempExplorationForm.data.optimizerSettings.endYear}
                        setValue={(value)=>{ 
                          handleInputChange("data.optimizerSettings.endYear", value);
                        }}
                        inputProps={{ min: 0 }}
                      />
                    </Box>
                  </>)
                }
              </>)}
            </Box>
            
            { tempExplorationForm.type !== "" && (
              <>
                {tempExplorationForm.type !== "Roth Optimizer Flag" && (
                  <Box>
                    <CustomDropdown
                      label={`${tempExplorationForm.type} Event Series`}
                      value={tempExplorationForm.itemIndex}
                      menuLabels={dropDownItems[1]}
                      menuItems={dropDownItems[0]}
                      setValue={(value) => { handleInputChange("itemIndex", value); }}
                    />
                  </Box>
                )}

                {tempExplorationForm.itemIndex !== "" && (
                  <Box>
                    <CustomDropdown
                      label="Parameter to Explore"
                      value={tempExplorationForm.setting}
                      menuItems={
                        tempExplorationForm.type === "Income" || tempExplorationForm.type === "Expense"
                          ? ["Start Year / Duration", "Initial Amount"]
                          : tempExplorationForm.type === "Invest"
                            ? ["Start Year / Duration", "Asset Allocation"]
                            : ["Start Year / Duration"]
                      }
                      setValue={(value) => handleInputChange("setting", value)}
                    />
                  </Box>
                )}

                {tempExplorationForm.setting === "Initial Amount" && (
                  <Box>
                    <CustomInput
                      title="Initial Income Amount"
                      type="number"
                      adornment="$"
                      value={tempExplorationForm.data?.initialAmount || ""}
                      setValue={(value) => handleInputChange("data.initialAmount", value)}
                      inputProps={{ min: 0 }}
                    />
                  </Box>
                )}
                {tempExplorationForm.setting === "Start Year / Duration" && (
                  <Box>
                    <EventSeries
                      formValues={tempExplorationForm.data}
                      setFormValues={(updater) => {
                        setTempExplorationForm(prev => ({
                          ...prev,
                          data: typeof updater === "function" ? updater(prev.data) : updater
                        }));
                      }}
                      dimensionalExplorationMode={true}
                    />
                  </Box>
                )}
                {tempExplorationForm.setting === "Asset Allocation" && (
                  <Box>
                    <CustomInput
                      title="Initial Income Amount"
                      type="number"
                      adornment="$"
                      value={tempExplorationForm.data?.initialAmount || ""}
                      setValue={(value) => handleInputChange("data.initialAmount", value)}
                      inputProps={{ min: 0 }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
          

          {/* You can put form elements here later */}
          <Button variant="contained" color="primary" sx={{ textTransform: "none" }} onClick={handleCloseBackdrop}>
            Close
          </Button>
        </Paper>
      </Backdrop>
    </Box>
  );
};

export default DimensionalExploration;
