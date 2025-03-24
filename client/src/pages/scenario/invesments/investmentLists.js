import axios from "axios";
import React, { useState, useContext } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
  Button,
  Stack,
  InputAdornment,
  Box,
  List,
  MenuItem,
  ListItem,
  ListItemText,
  IconButton,
  Backdrop,
  Modal,
  Fade,
  TextField,
} from "@mui/material";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import { stackStyles, titleStyles, buttonStyles, rowBoxStyles, backContinueContainerStyles, textFieldStyles } from "../../../components/styles";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CustomDropdown from "../../../components/customDropDown";

import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";

const mongoose = require('mongoose');


const InvestmentLists = () => {
  const { currInvestments, setCurrInvestments } = useContext(AppContext);
  const { currInvestmentTypes, setCurrInvestmentTypes } = useContext(AppContext);

  console.log("current Investments");
  console.log(currInvestments);
  console.log(currInvestmentTypes);

  const [open, setOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    investmentTypeName: "",
    taxType: "",
    value: "",
  });
  const navigate = useNavigate();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field: ${name}, New Value: ${value}`);
    setNewInvestment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const transformInvestmentData = (investment) => {
    console.log("Valid? ", mongoose.Types.ObjectId.isValid(investment.investmentTypeName));
    return {
      investmentType: new mongoose.Types.ObjectId(investment.investmentTypeName), // Example: change 'investmentType' to 'investment_type'
      accountTaxStatus: investment.accountTaxStatus, // Example: change 'accountTaxStatus' to 'account_tax_status'
      value: investment.value, // Keep 'value' as it is
    };
  };

  const handleAddInvestment = async () => {
    console.log("Add investment");
    console.log(newInvestment);
    if (newInvestment.investmentTypeName) {
      console.log("transform data");
      const transformedInvestment = transformInvestmentData(newInvestment);
      console.log(transformedInvestment);
      try {
        await axios.post("http://localhost:8080/investment", transformedInvestment);
        setCurrInvestments((prev) => [...prev, transformedInvestment]);
        setNewInvestment({ investmentType: "", accountTaxStatus: "", value: "" });
        handleClose();
      } catch (error) {
        console.error("Error adding investment:", error);
      }
    }
  };

  const handleDeleteInvestment = (index) => {
    setCurrInvestments((prev) => prev.filter((_, i) => i !== index));
  };


  const getInvestmentTypeName = (investmentTypeId) => {
    //console.log("the id ", investmentTypeId);
    for (let i = 0; i < currInvestmentTypes.length; i++) {
      console.log("the match", currInvestmentTypes[i]._id.toString(), investmentTypeId.toString());
      if (currInvestmentTypes[i]._id.toString() === investmentTypeId.toString()) {
        // console.log("a match");
        return currInvestmentTypes[i].name; // Return the matching investment name
      }
    }
    return "Unknown Type"; // Default if not found
  };


  const InvestList = ({ list, taxType }) => {
    const filteredInvestments = list.filter((item) => item.accountTaxStatus === taxType);


    return (
      <List>
        {filteredInvestments.map((item, index) => (
          <ListItem
            key={`${item.investmentType}-${index}`}
            sx={{
              backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
              "&:hover": { backgroundColor: "#B0B0B0" },
            }}
          >
            <ListItemText primary={<span style={{ fontWeight: "bold" }}>{getInvestmentTypeName(item.investmentType)}</span>} secondary={`Value: ${item.value}`} />

            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleDeleteInvestment(currInvestments.indexOf(item))} // Delete the selected row
            >
              <DeleteIcon />
            </IconButton>
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
          <Button variant="contained" color="success" sx={buttonStyles} onClick={() => navigate("/scenario/event_series")}>
            Continue
          </Button>
        </Box>

        {/* Backdrop + Modal */}
        <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 1300 }}>
          <Fade in={open}>
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                backgroundColor: "white",
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
                minWidth: 400,
                maxWidth: 800,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography variant="h5">Add New Investment</Typography>

              <Box>
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                  Investment Type
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                  <TextField select name="investmentTypeName" value={newInvestment.investmentTypeName || ""} onChange={handleChange} sx={textFieldStyles} fullWidth>
                    <MenuItem value="Real Estate">Real Estate</MenuItem>
                    {currInvestmentTypes.map((it) => (
                      <MenuItem value={it._id}>{it.name}</MenuItem>
                    ))}
                  </TextField>
                  <Button variant="contained" color="primary" onClick={() => navigate("/scenario/investment_type")} sx={{ textTransform: "none", minWidth: 150 }}>
                    Add Custom Type
                  </Button>
                </Box>
              </Box>

              <Box sx={rowBoxStyles}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                    Tax Status of account
                  </Typography>
                  <TextField select name="accountTaxStatus" value={newInvestment.accountTaxStatus || ""} onChange={handleChange} sx={textFieldStyles} fullWidth>
                    <MenuItem value="non-tax">Taxable</MenuItem>
                    <MenuItem value="pre-tax">Tax-Deferred</MenuItem>
                    <MenuItem value="after-tax">Tax-Free</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                    Value
                  </Typography>
                  <TextField
                    type="number"
                    name="value"
                    value={newInvestment.value || ''}
                    onChange={handleChange}
                    sx={textFieldStyles}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
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
