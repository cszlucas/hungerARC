import React, { useState, useContext } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, List, ListItem, ListItemText, IconButton, Backdrop, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PaymentsIcon from "@mui/icons-material/Payments";
import SellIcon from "@mui/icons-material/Sell";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BalanceIcon from "@mui/icons-material/Balance";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import {
  stackStyles,
  titleStyles,
  backContinueContainerStyles,
  buttonStyles,
  rowBoxStyles,
  multiLineTextFieldStyles,
} from "../../../components/styles";

import CustomInput from "../../../components/customInputBox";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";

const EventSeries = () => {
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const {currIncome, setCurrIncome} = useContext(AppContext);
  const {currExpense, setCurrExpense} = useContext(AppContext);
  const {currInvest, setCurrInvest} = useContext(AppContext);
  const {currRebalance, setCurrRebalance} = useContext(AppContext);
  const {eventEditMode, setEventEditMode} = useContext(AppContext);

  let safeCurrIncome = Array.isArray(currIncome) ? currIncome : [];
  let safeCurrExpense = Array.isArray(currExpense) ? currExpense : [];
  let safeCurrInvest = Array.isArray(currInvest) ? currInvest : [];
  let safeCurrRebalance = Array.isArray(currRebalance) ? currRebalance : [];
  
  // 🔹 Ensure all states are arrays before merging, and add an event type label
  safeCurrIncome = Array.isArray(currIncome) 
  ? currIncome.map(event => ({ ...event, type: "Income" }))  // 🔹 Added `.map()` to add "type"
    : [];
  console.log("safety: " );
  console.log(safeCurrIncome);
  safeCurrExpense = Array.isArray(currExpense) 
    ? currExpense.map(event => ({ ...event, type: "Expense" }))  // 🔹 Added `.map()` to add "type"
    : [];
  
  safeCurrInvest = Array.isArray(currInvest) 
    ? currInvest.map(event => ({ ...event, type: "Invest" }))  // 🔹 Added `.map()` to add "type"
    : [];
  
  safeCurrRebalance = Array.isArray(currRebalance) 
    ? currRebalance.map(event => ({ ...event, type: "Rebalance" }))  // 🔹 Added `.map()` to add "type"
    : [];
  // console.log(currIncome);
  // console.log(currExpense);
  // console.log(currInvest);
  // console.log(currRebalance);

  const currEventSeries = [...safeCurrIncome, ...safeCurrExpense, ...safeCurrInvest, ...safeCurrRebalance];

  console.log(currEventSeries);

  const navigate = useNavigate();

  // Example event series

  const handleAddEvent = () => {
    setOpenBackdrop(true);
  };

  const handleAddIncome = () => {
    let editObject = {type: "Income", id: "new"};
    localStorage.setItem("editEvent", JSON.stringify(editObject));
    setEventEditMode(editObject);
    navigate("/scenario/income");
  };

  const handleAddInvest = () => {
    let editObject = {type: "Invest", id: "new"};
    localStorage.setItem("editEvent", JSON.stringify(editObject ));
    setEventEditMode(editObject );
    navigate("/scenario/invest");
  };

  const handleAddExpense = () => {
    let editObject = {type: "Expense", id: "new"};
    localStorage.setItem("editEvent", JSON.stringify(editObject));
    setEventEditMode(editObject);
    navigate("/scenario/expense");
  };

  const handleAddRebalance = () => {
    let editObject = {type: "Rebalance", id: "new"};
    localStorage.setItem("editEvent", JSON.stringify(editObject));
    setEventEditMode(editObject);
    navigate("/scenario/rebalance");
  };

  const handleCloseBackdrop = () => {
    setOpenBackdrop(false);
  };

  const handleSelectEventType = (type) => {
    alert(`Selected Event: ${type}`);
    setOpenBackdrop(false);
  };

  const handleEditEvent = (event) => {
    let editObject = { type: event.type, id: event._id};
    localStorage.setItem("editEvent", JSON.stringify(editObject));
    setEventEditMode(editObject); // 🔹 Store the event ID in context
  
    // 🔹 Determine the correct route based on event type
    let route = "";
    switch (event.type) {
      case "Income":
        route = "/scenario/income";
        break;
      case "Expense":
        route = "/scenario/expense";
        break;
      case "Invest":
        route = "/scenario/invest";
        break;
      case "Rebalance":
        route = "/scenario/rebalance";
        break;
      default:
        console.error("Unknown event type:", event.type);
        return;
    }
  
    navigate(route); // 🔹 Navigate to the correct page
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>

        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Event Series
          </Typography>
          <Button variant="contained" color="secondary" sx={buttonStyles}>
            Save
          </Button>
        </Stack>

        <PageHeader />

        <Box sx={rowBoxStyles}>
          {/* List of Event Series */}
          <Box sx={{ flex: 1 }}>
            
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" sx={{ fontWeight: "bold", marginTop: 4, marginBottom: 2 }}>
                List of Event Series
              </Typography>
              <Button variant="contained" color="primary" onClick={handleAddEvent} sx={{ textTransform: "none" }}>
                Add
              </Button>
            </Stack>
            <List>
              {currEventSeries.map((event, index) => {
                // const eventName = Object.keys(event)[0];
                // const eventType = event[eventName];
                return (
                  <ListItem 
                    key={index} 
                    sx={{
                      backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
                      "&:hover": {
                        backgroundColor: "#B0B0B0",
                      },
                    }}
                  >
                    <ListItemText
                      primary={<span style={{ fontWeight: "bold" }}>{event.eventSeriesName}</span>} 
                      secondary={event.type} 
                    />
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditEvent(event)}>
                      <EditIcon />
                    </IconButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles}
            onClick={() => navigate("/scenario/investment_lists")}
          >
            Back
          </Button>
          <Button variant="contained" color="success" sx={buttonStyles}
            onClick={() => navigate("/scenario/strategies")}
          >
            Continue
          </Button>
        </Box>

        {/* Backdrop with Buttons for Event Type Selection */}
        <Backdrop open={openBackdrop} onClick={handleCloseBackdrop} sx={{ zIndex: 1200, color: "#fff" }}>
          <Dialog open={openBackdrop} onClose={handleCloseBackdrop} >
            <DialogTitle>
              <Typography variant="h5" sx={{ fontWeight: "bold", marginTop: 2, marginBottom: 1, minWidth: 400 }}>
                Select a category
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack direction="row" spacing={3} sx={{ justifyContent: "center" }}>
                <Button variant="contained" onClick={handleAddIncome} 
                  sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 200, marginBottom: 1 }}>
                  <PaymentsIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Income
                </Button>
                <Button variant="contained" onClick={handleAddExpense}
                  sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 200, marginBottom: 1 }}>
                  <SellIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Expense
                </Button>
              </Stack>
              <Stack direction="row" spacing={3} sx={{ justifyContent: "center", mt: 2 }}>
                <Button variant="contained" onClick={handleAddInvest}
                  sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 200, marginBottom: 1 }}>
                  <AccountBalanceIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Invest
                </Button>
                <Button variant="contained" onClick={handleAddRebalance}
                  sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 200, marginBottom: 1 }}>
                  <BalanceIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Rebalance
                </Button>
              </Stack>
            </DialogContent>
          </Dialog>
        </Backdrop>

      </Container>
    </ThemeProvider>
  );
};

export default EventSeries;
