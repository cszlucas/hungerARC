import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
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
    alert('Add Event functionality here');
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
              <Button variant="contained" color="primary" onClick={handleAddEvent} sx={{textTransform: 'none'}}>
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
      </Container>
    </ThemeProvider>
  );
};

export default EventSeries;
