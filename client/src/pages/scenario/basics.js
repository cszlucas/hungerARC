import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import theme from '../../components/theme';
import Navbar from '../../components/navbar';
import PageHeader from '../../components/pageHeader';

const Basics = () => {
  const [person, setPerson] = useState('myself');
  const [financialGoal, setFinancialGoal] = useState('');
  const [inflationType, setInflationType] = useState('none');
  const [inflationValue, setInflationValue] = useState('');

  const handlePersonChange = (event, newPerson) => {
    if (newPerson !== null) {
      setPerson(newPerson);
    }
  };

  const handleGoalChange = (event) => {
    setFinancialGoal(event.target.value);
  };

  const handleInflationChange = (event, newInflationType) => {
    if (newInflationType !== null) {
      setInflationType(newInflationType);
    }
  };

  const handleInflationValueChange = (event) => {
    setInflationValue(event.target.value);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={''} />
      <Container>
        {/* Stack for title and save button */}
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between" 
          sx={{ marginTop: 6, marginBottom: 2 }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontWeight: 'bold' }}
          >
            Your Scenario Starts Here
          </Typography>
          
          <Button 
            variant="contained" 
            color="secondary"
            sx={{ fontSize: '1.25rem', textTransform: 'none' }}
          >
            Save
          </Button>
        </Stack>
        <PageHeader />

        {/* Row for Scenario Name, Toggle Buttons, and Financial Goal */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 4 }}>
          
          {/* Scenario Name Field */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body1" 
              sx={{ marginBottom: 1, fontWeight: 'medium' }}
            >
              Name of Scenario
            </Typography>

            <TextField
              variant="outlined"
              fullWidth
              placeholder=""
              sx={{
                maxWidth: '250px',    // Shortened width
                height: '40px',       // Shortened height
                '& .MuiOutlinedInput-root': {
                  height: '40px',     // Apply height to input box
                  backgroundColor: theme.palette.grey[300], // Contained color grey 300
                  border: 'none',     // Remove the border
                  '& fieldset': { display: 'none' }, // Remove border from fieldset
                  '&:hover fieldset': { display: 'none' }, // Remove hover border
                  '&.Mui-focused fieldset': { display: 'none' }, // Remove focused border
                }
              }}
            />
          </Box>

          {/* Toggle Button Group */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body1" 
              sx={{ marginBottom: 1, fontWeight: 'medium' }}
            >
              Is the scenario for yourself or with your spouse?
            </Typography>

            <ToggleButtonGroup
              value={person}
              exclusive
              onChange={handlePersonChange}
              aria-label="scenario target"
              sx={{
                maxWidth: '250px',   // Shortened width
                height: '40px',      // Same height as input box
                '& .MuiToggleButton-root': {
                  backgroundColor: theme.palette.grey[400],  // Grey 400 background when not selected
                  color: 'black',  // Text color set to black when not selected
                  height: '40px',    // Matching height
                  textTransform: 'none', // Disable capitalization of text
                  '&:hover': {
                    backgroundColor: theme.palette.grey[500],  // Darker grey on hover
                  },
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                    }
                  }
                }
              }}
            >
              <ToggleButton value="myself" aria-label="myself">
                Myself
              </ToggleButton>
              <ToggleButton value="spouse" aria-label="with spouse">
                With Spouse
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Financial Goal Input */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body1" 
              sx={{ marginBottom: 1, fontWeight: 'medium' }}
            >
              Financial Goal
            </Typography>

            <TextField
              type="number"
              variant="outlined"
              fullWidth
              value={financialGoal}
              onChange={handleGoalChange}
              placeholder="Enter amount"
              sx={{
                maxWidth: '250px',    // Shortened width
                height: '40px',       // Shortened height
                '& .MuiOutlinedInput-root': {
                  height: '40px',     // Matching height
                  backgroundColor: theme.palette.grey[300], // Contained color grey 300
                  border: 'none',     // Remove the border
                  '& fieldset': { display: 'none' }, // Remove border from fieldset
                  '&:hover fieldset': { display: 'none' }, // Remove hover border
                  '&.Mui-focused fieldset': { display: 'none' }, // Remove focused border
                }
              }}
            />
          </Box>

        </Box>

        {/* Inflation Assumptions Section */}
        <Box sx={{ marginTop: 4, marginBottom: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
            Inflation Assumptions
          </Typography>

          {/* Distribution Selection */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <ToggleButtonGroup
              value={inflationType}
              exclusive
              onChange={handleInflationChange}
              aria-label="inflation distribution"
              sx={{
                maxWidth: '250px',   // Shortened width
                height: '40px',      // Same height as input box
                '& .MuiToggleButton-root': {
                  backgroundColor: theme.palette.grey[400],  // Grey 400 background when not selected
                  color: 'black',  // Text color set to black when not selected
                  height: '40px',    // Matching height
                  textTransform: 'none', // Disable capitalization of text
                  '&:hover': {
                    backgroundColor: theme.palette.grey[500],  // Darker grey on hover
                  },
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                    }
                  }
                }
              }}
            >
              <ToggleButton value="none" aria-label="none">
                None
              </ToggleButton>
              <ToggleButton value="uniform" aria-label="uniform">
                Uniform
              </ToggleButton>
              <ToggleButton value="normal" aria-label="normal">
                Normal
              </ToggleButton>
            </ToggleButtonGroup>

            {/* If "None" is selected, show an input field to enter a value */}
            {inflationType === 'none' && (
              <TextField
                type="number"
                variant="outlined"
                fullWidth
                value={inflationValue}
                onChange={handleInflationValueChange}
                placeholder="Enter value"
                sx={{
                  maxWidth: '250px',    // Shortened width
                  height: '40px',       // Shortened height
                  '& .MuiOutlinedInput-root': {
                    height: '40px',     // Matching height
                    backgroundColor: theme.palette.grey[300], // Contained color grey 300
                    border: 'none',     // Remove the border
                    '& fieldset': { display: 'none' }, // Remove border from fieldset
                    '&:hover fieldset': { display: 'none' }, // Remove hover border
                    '&.Mui-focused fieldset': { display: 'none' }, // Remove focused border
                  }
                }}
              />
            )}
          </Box>
        </Box>

        {/* Box to align Back and Continue buttons on the right */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2, 
            marginTop: 4 
          }}
        >
          <Button 
            variant="contained" 
            color="primary"
            sx={{ fontSize: '1.1rem', textTransform: 'none' }}
          >
            Back
          </Button>

          <Button 
            variant="contained" 
            color="success"
            sx={{ fontSize: '1.1rem', textTransform: 'none' }}
          >
            Continue
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Basics;
