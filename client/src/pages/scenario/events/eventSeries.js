import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, List, ListItem, ListItemText, IconButton, Backdrop, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PaymentsIcon from '@mui/icons-material/Payments';
import SellIcon from '@mui/icons-material/Sell';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BalanceIcon from '@mui/icons-material/Balance';
import theme from '../../../components/theme';
import Navbar from '../../../components/navbar';
import PageHeader from '../../../components/pageHeader';
import {
  stackStyles,
  titleStyles,
  backContinueContainerStyles,
  buttonStyles,
  rowBoxStyles,
  multiLineTextFieldStyles,
} from '../../../components/styles';

import CustomInput from "../../../components/customInputBox";
import { useNavigate } from "react-router-dom";

const EventSeries = () => {
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const navigate = useNavigate();

  // Example event series
  const eventSeries = [
    { 'Event A1': 'Income' },
    { 'Event B2': 'Expense' },
    { 'Event C3': 'Invest' },
  ];

  const handleAddEvent = () => {
    setOpenBackdrop(true);
  };

  const handleCloseBackdrop = () => {
    setOpenBackdrop(false);
  };

  const handleSelectEventType = (type) => {
    alert(`Selected Event: ${type}`);
    setOpenBackdrop(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={''} />
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
              <Typography variant="h6" sx={{ fontWeight: 'bold', marginTop: 4, marginBottom: 2 }}>
                List of Event Series
              </Typography>
              <Button variant="contained" color="primary" onClick={handleAddEvent} sx={{ textTransform: 'none' }}>
                Add
              </Button>
            </Stack>
            <List>
              {eventSeries.map((event, index) => {
                const eventName = Object.keys(event)[0];
                const eventType = event[eventName];
                return (
                  <ListItem 
                    key={index} 
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#BBBBBB' : '#D9D9D9',
                      '&:hover': {
                        backgroundColor: '#B0B0B0',
                      },
                    }}
                  >
                    <ListItemText
                      primary={<span style={{ fontWeight: 'bold' }}>{eventName}</span>} 
                      secondary={eventType} 
                    />
                    <IconButton edge="end" aria-label="edit" onClick={() => alert(`Edit ${eventName}`)}>
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
        <Backdrop open={openBackdrop} onClick={handleCloseBackdrop} sx={{ zIndex: 1200, color: '#fff' }}>
          <Dialog open={openBackdrop} onClose={handleCloseBackdrop} >
            <DialogTitle>
              <Typography variant="h5" sx={{ fontWeight: 'bold', marginTop: 2, marginBottom: 1, minWidth: 400 }}>
                Select a category
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack direction="row" spacing={3} sx={{ justifyContent: 'center' }}>
                <Button variant="contained" onClick={() => navigate("/scenario/income")} 
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200, marginBottom: 1 }}>
                  <PaymentsIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Income
                </Button>
                <Button variant="contained" onClick={() => navigate("/scenario/expense")}
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200, marginBottom: 1 }}>
                  <SellIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Expense
                </Button>
              </Stack>
              <Stack direction="row" spacing={3} sx={{ justifyContent: 'center', mt: 2 }}>
                <Button variant="contained" onClick={() => navigate("/scenario/invest")}
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200, marginBottom: 1 }}>
                  <AccountBalanceIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Invest
                </Button>
                <Button variant="contained" onClick={() => navigate("/scenario/rebalance")}
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200, marginBottom: 1 }}>
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
