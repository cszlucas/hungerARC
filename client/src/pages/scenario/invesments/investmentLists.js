import axios from "axios";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, InputAdornment, Box, List, MenuItem, ListItem, 
  ListItemText, IconButton, Backdrop, Fade, TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

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

const mongoose = require("mongoose");

const InvestmentLists = () => {
  const { currInvestments, setCurrInvestments, setCurrScenario } = useContext(AppContext);
  const { currInvestmentTypes, setCurrInvestmentTypes } = useContext(AppContext);

  const [open, setOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    investmentTypeId: "",
    taxType: "",
    value: "",
  });
  const navigate = useNavigate();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInputChange = (field, value) => {  
    setNewInvestment((prev) => {
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const transformInvestmentData = (investment) => {
    console.log("Valid? ", mongoose.Types.ObjectId.isValid(investment.investmentTypeId));
    return {
      investmentType: new mongoose.Types.ObjectId(investment.investmentTypeId), // Example: change 'investmentType' to 'investment_type'
      accountTaxStatus: investment.taxType, // Example: change 'accountTaxStatus' to 'account_tax_status'
      value: investment.value, // Keep 'value' as it is
    };
  };

  const handleAppendInScenario = (key, newValue) => {
    setCurrScenario((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newValue]  // Append to the specified key
    }));
  };

  const handleAddInvestment = async () => {
    console.log("Add investment");
    console.log(newInvestment);

    if (newInvestment.investmentTypeId) {
      console.log("transform data");
      let transformedInvestment = transformInvestmentData(newInvestment);
      console.log(transformedInvestment);

      try {
        const response = await axios.post("http://localhost:8080/investment", transformedInvestment);
        const id = response.data._id;
        transformedInvestment._id = id;
        
        setCurrInvestments((prev) => {
          return [...(Array.isArray(prev) ? prev : []), transformedInvestment];
        });
        handleAppendInScenario("setOfInvestments", transformedInvestment);
        setNewInvestment({ investmentTypeId: "", taxType: "", value: "" });
        
        if (transformedInvestment.accountTaxStatus == "pre-tax") {
          handleAppendInScenario("rothConversionStrategy", transformedInvestment._id);
          handleAppendInScenario("rmdStrategy", transformedInvestment._id);
        } else {
          handleAppendInScenario("expenseWithdrawalStrategy", transformedInvestment._id);
        }

        handleClose();
      } catch (error) {
        console.error("Error adding investment:", error);
      }
    }
  };

  const handleDeleteInvestment = (index) => {
    setCurrInvestments((prev) => prev.filter((_, i) => i !== index));
  };

  const getInvestmentTypeName = (id) => {
    // console.log(currInvestmentTypes);
    //console.log("the id ", investmentTypeId);
    for (let i = 0; i < currInvestmentTypes.length; i++) {
      // console.log("the match", currInvestmentTypes[i]._id.toString(), id.toString());
      if (currInvestmentTypes[i]._id.toString() === id.toString()) {
        // console.log("a match");
        return currInvestmentTypes[i].name; // Return the matching investment name
      }
    }
    return "Unknown Type"; // Default if not found
  };

  const InvestList = ({ list, taxType }) => {
    const filteredInvestments = Array.isArray(list) ? list.filter((item) => item.accountTaxStatus === taxType) : [];
    
    return (
      <List>
      {filteredInvestments.map((item, index) => {
        // Validate each item has required properties
        if (!item || !item.investmentType || !item.value) {
          console.error("Invalid investment data:", item); // Log an error in the console
          return (
            <ListItem key={`invalid-${index}`}>
              <ListItemText primary="Invalid investment data" />
            </ListItem>
          );
        }
        // Safely call getInvestmentTypeName in case of unexpected investmentType
        const investmentTypeName = getInvestmentTypeName(item.investmentType) || "Unknown Type";

        return (
          <ListItem
            key={`${item.investmentTypeId}`}
            sx={{
              backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
              "&:hover": { backgroundColor: "#B0B0B0" },
            }}
          >
            <ListItemText
              primary={<span style={{ fontWeight: "bold" }}>{investmentTypeName}</span>}
              secondary={`Value: ${item.value}`}
            />

            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleDeleteInvestment(filteredInvestments.indexOf(item))} // Delete the selected row
            >
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
          <CustomSave label={"Continue"} routeTo={"/scenario/strategies"}/>
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
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                  Investment Type
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                  <TextField 
                    select 
                    name="investmentTypeId" 
                    value={newInvestment.investmentTypeId || ""} 
                    onChange={(e) => handleInputChange("investmentTypeId", e.target.value)} 
                    sx={textFieldStyles} 
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
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => navigate("/scenario/investment_type")} 
                    sx={{ textTransform: "none", minWidth: 150 }}
                  >
                    Add Custom Type
                  </Button>
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
