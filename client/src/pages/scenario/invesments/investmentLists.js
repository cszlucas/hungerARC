import axios from "axios";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, InputAdornment, Box, List, MenuItem, ListItem, 
  ListItemText, IconButton, Backdrop, Fade, TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import CustomDropdown from "../../../components/customDropDown";
import CustomInput from "../../../components/customInputBox";
import CustomSave from "../../../components/customSaveBtn";
import PageHeader from "../../../components/pageHeader";
import { 
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, backContinueContainerStyles, textFieldStyles 
} from "../../../components/styles";
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";

const mongoose = require("mongoose");

const InvestmentLists = () => {
  const { editMode, setEventEditMode, currInvestments, setCurrInvestments, currInvestmentTypes, setCurrScenario } = useContext(AppContext);
  const { user } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({ id: "new", investmentTypeId: "", taxType: "", value: "" });
  const navigate = useNavigate();

  const handleOpen = () => { 
    setNewInvestment({ id: "new", investmentTypeId: "", taxType: "", value: "" }); 
    setOpen(true); 
  };
  const handleClose = () => setOpen(false);

  const handleInputChange = (field, value) => {  
    setNewInvestment((prev) => {
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleAddInvestment = async () => {
    const handleAppendInScenario = (key, newValue) => {
      setCurrScenario((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), newValue]  // Append to the specified key
      }));
    };

    const transformInvestmentData = (investment) => {
      return {
        investmentType: investment.investmentTypeId,
        accountTaxStatus: investment.taxType, // Example: change 'accountTaxStatus' to 'account_tax_status'
        value: investment.value, // Keep 'value' as it is
      };
    };

    const handleUpdatingLocalStorageForNewInvestments = (investment, id) => {
      handleAppendInScenario("setOfInvestments", id);
      if (investment.accountTaxStatus == "pre-tax") {
        handleAppendInScenario("rothConversionStrategy", id);
        handleAppendInScenario("rmdStrategy", id);
      } else {
        handleAppendInScenario("expenseWithdrawalStrategy", id);
      }
    };

    if (newInvestment.investmentTypeId) {
      // console.log("transform data");
      let transformedInvestment = transformInvestmentData(newInvestment);
      // console.log(transformedInvestment);

      try {
        let id = newInvestment.id;
        if (!user.guest) {
          if (id === "new") {
            const response = await axios.post(`http://localhost:8080/scenario/${editMode}/investment`, transformedInvestment);
            id = response.data._id;
            transformedInvestment._id = id;
            handleUpdatingLocalStorageForNewInvestments(transformedInvestment, id);
          } else {
            transformedInvestment._id = id;
            await axios.post(`http://localhost:8080/updateInvestment/${id}`, transformedInvestment);
            setCurrInvestments((prev) => prev.filter((item) => item._id !== id));
          }
        } else {
          if (id === "new") {
            id = currInvestments.length;
            transformedInvestment._id = id;
            handleUpdatingLocalStorageForNewInvestments(transformedInvestment, id);
          } else {
            transformedInvestment._id = id;
            setCurrInvestments((prev) => prev.filter((item) => item._id !== id));
          }
        }

        setCurrInvestments((prev) => { return [...(Array.isArray(prev) ? prev : []), transformedInvestment]; });
        setNewInvestment({ id: "new", investmentTypeId: "", taxType: "", value: "" });
        
        handleClose();
      } catch (error) {
        console.error("Error adding investment:", error);
      }
    }
  };

  const InvestList = ({ list, taxType }) => {
    const getInvestmentTypeName = (id) => {
      for (let i = 0; i < currInvestmentTypes.length; i++) {
        if (currInvestmentTypes[i]._id.toString() === id.toString()) {
          return currInvestmentTypes[i].name; // Return the matching investment name
        }
      }
      return "Unknown Type"; // Default if not found
    };

    const handleDeleteInvestment = (id) => {
      setCurrInvestments((prev) => prev.filter((item) => item._id !== id));
    };
  
    const handleEditInvestment = (item) => {
      setNewInvestment({
        id: item._id,
        investmentTypeId: item.investmentType,
        taxType: item.accountTaxStatus,
        value: item.value,
      });
      setOpen(true); // Open the modal
    };

    const filteredInvestments = Array.isArray(list) ? list.filter((item) => item.accountTaxStatus === taxType) : [];
    // console.log(taxType);
    // console.log(filteredInvestments);
    return (
      <List>
        {filteredInvestments.map((item, index) => {
          if (!item || !item.investmentType || !item.value) {
            console.error("Invalid investment data:", item);
            return (
              <ListItem key={`invalid-${index}`}>
                <ListItemText primary="Invalid investment data" />
              </ListItem>
            );
          }
  
          const investmentTypeName = getInvestmentTypeName(item.investmentType) || "Unknown Type";
          return (
            <ListItem
              key={item._id}
              sx={{
                backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
                "&:hover": { backgroundColor: "#B0B0B0" },
              }}
            >
              <ListItemText
                primary={<span style={{ fontWeight: "bold" }}>{investmentTypeName}</span>}
                secondary={`Value: ${item.value} | ${item._id}`}
              />
  
              {/* Edit Button */}
              <IconButton edge="end" aria-label="edit" onClick={() => handleEditInvestment(item)}>
                <EditIcon />
              </IconButton>
  
              {/* Delete Button */}
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteInvestment(item._id)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          );
        })}
      </List>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Investments
          </Typography>
          {/* <Button variant="contained" color="secondary" sx={buttonStyles}>
            Saves
          </Button> */}
        </Stack>

        <PageHeader />

        <Box sx={{ marginBottom: 1, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" color="primary" sx={{ fontSize: "1.1rem", textTransform: "none" }} onClick={handleOpen}>
            Add
          </Button>
        </Box>

        <Box sx={rowBoxStyles}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Taxable
            </Typography>
            <InvestList list={currInvestments} taxType="non-tax" />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Tax-Deferred
            </Typography>
            <InvestList list={currInvestments} taxType="pre-tax" />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Tax-Free
            </Typography>
            <InvestList list={currInvestments} taxType="after-tax" />
          </Box>
        </Box>

        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles} onClick={() => navigate("/scenario/basics")}>
            Back
          </Button>
          <CustomSave label={"Continue"} routeTo={"/scenario/event_series"}/>
        </Box>

        {/* Backdrop + Modal */}
        <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 1300 }}>
          <Fade in={open}>
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                backgroundColor: "white", boxShadow: 24, p: 4, borderRadius: 2, 
                minWidth: 500, maxWidth: 800, display: "flex", flexDirection: "column", gap: 2,
              }}
            >
              <Typography variant="h5">Add New Investment</Typography>
              <Box>
                <Typography variant="body1" sx={{ mt: 2, marginBottom: 1, fontWeight: "medium" }}>
                  Investment Type
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <TextField 
                    select 
                    name="investmentTypeId" 
                    value={newInvestment.investmentTypeId || ""} 
                    onChange={(e) => handleInputChange("investmentTypeId", e.target.value)} 
                    sx={{...textFieldStyles, width: 350}} 
                    fullWidth
                  >
                    {/* Check if currInvestmentTypes is an array */}
                    {Array.isArray(currInvestmentTypes) && currInvestmentTypes.length > 0 ? (
                      currInvestmentTypes.map((it) =>
                        // Ensure the item has _id and name properties before rendering
                        it._id && it.name ? (
                          <MenuItem key={it._id} value={it._id}>
                            {it.name}
                          </MenuItem>
                        ) : null
                      )
                    ) : (
                      <MenuItem value="" disabled>
                        No Investment Types Available
                      </MenuItem> // Fallback if no valid data
                    )}
                  </TextField>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => {
                      setEventEditMode(newInvestment.investmentTypeId);
                      navigate("/scenario/investment_type");
                    }}
                    disabled={!newInvestment.investmentTypeId}
                    sx={{
                      backgroundColor: "black",
                      color: "white",
                      "&:hover": { backgroundColor: "#333" }, // Slightly lighter black on hover
                      "&:disabled": { backgroundColor: "#B0B0B0", color: "#FFFFFF99" }, // Greyed out when disabled
                      ml: -1.5,
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="add"
                    onClick={() => {
                      setEventEditMode("new");
                      navigate("/scenario/investment_type");
                    }}
                    sx={{
                      backgroundColor: "black",
                      color: "white",
                      "&:hover": { backgroundColor: "#333" },
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={rowBoxStyles}>
                <Box sx={{ flex: 1 }}>
                  <CustomDropdown 
                    label={"Tax Status of account"}
                    value={newInvestment.taxType || ""}
                    setValue={(value) => handleInputChange("taxType", value)}
                    menuLabels={["Taxable", "Tax-Deferred", "Tax-Free"]}
                    menuItems={["non-tax", "pre-tax", "after-tax"]}
                    width={250}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <CustomInput
                    title="Value"
                    type="number"
                    value={newInvestment.value || ""}
                    setValue={(value) => handleInputChange("value", value)}
                    adornment={"$"}
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="contained" color="primary" onClick={handleClose} sx={{ textTransform: "none" }}>
                  Cancel
                </Button>
                <Button variant="contained" color="secondary" onClick={handleAddInvestment} sx={{ textTransform: "none" }}>
                  Save
                </Button>
              </Box>
            </Box>
          </Fade>
        </Backdrop>
      </Container>
    </ThemeProvider>
  );
};

export default InvestmentLists;
