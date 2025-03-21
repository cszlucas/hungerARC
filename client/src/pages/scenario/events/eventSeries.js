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
  textFieldStyles,
  numFieldStyles,
  multiLineTextFieldStyles,
  toggleButtonGroupStyles,
  backContinueContainerStyles,
  buttonStyles,
  rowBoxStyles,
} from '../../../components/styles';

const EventSeries = () => {
  const [toggleType, setToggleType] = useState('Toggle A');
  const [value, setValue] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [openBackdrop, setOpenBackdrop] = useState(false);

  // Example event series
  const eventSeries = [
    { 'Event A1': 'Income' },
    { 'Event B2': 'Expense' },
    { 'Event C3': 'Invest' },
  ];

  const handleToggleChange = (event, newToggleType) => {
    if (newToggleType !== null) {
      setToggleType(newToggleType);
    }
  };

  const handleValueChange = (event) => {
    setValue(event.target.value);
  };

  const handleEventNameChange = (event) => {
    setEventName(event.target.value);
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  const handleStartYearChange = (event) => {
    setStartYear(event.target.value);
  };

  const handleEndYearChange = (event) => {
    setEndYear(event.target.value);
  };

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
          {/* First Box with Inputs */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
              Event name
            </Typography>
            <TextField
              variant="outlined"
              value={eventName}
              onChange={handleEventNameChange}
              sx={textFieldStyles}
            />

            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium', marginTop: 2 }}>
              Description (Optional)
            </Typography>
            <TextField
              variant="outlined"
              multiline
              value={description}
              onChange={handleDescriptionChange}
              sx={multiLineTextFieldStyles}
              rows={4}
            />

            <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
              <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                  Start Year
                </Typography>
                <TextField
                  variant="outlined"
                  type="number"
                  value={startYear}
                  onChange={handleStartYearChange}
                  sx={numFieldStyles}
                />
              </Box>

              <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                  End Year
                </Typography>
                <TextField
                  variant="outlined"
                  type="number"
                  value={endYear}
                  onChange={handleEndYearChange}
                  sx={numFieldStyles}
                />
              </Box>
            </Stack>
          </Box>

          {/* Empty Box */}
          <Box sx={{ flex: 1 }}>
            {/* List of Event Series */}
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
          <Button variant="contained" color="primary" sx={buttonStyles}>
            Back
          </Button>
          <Button variant="contained" color="success" sx={buttonStyles}>
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
                <Button variant="contained" onClick={() => handleSelectEventType('Income')} 
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200, marginBottom: 1 }}>
                  <PaymentsIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Income
                </Button>
                <Button variant="contained" onClick={() => handleSelectEventType('Expense')} 
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200, marginBottom: 1 }}>
                  <SellIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Expense
                </Button>
              </Stack>
              <Stack direction="row" spacing={3} sx={{ justifyContent: 'center', mt: 2 }}>
                <Button variant="contained" onClick={() => handleSelectEventType('Invest')} 
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200, marginBottom: 1 }}>
                  <AccountBalanceIcon sx={{ fontSize: 60, marginBottom: 1 }} />
                  Invest
                </Button>
                <Button variant="contained" onClick={() => handleSelectEventType('Rebalance')} 
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
