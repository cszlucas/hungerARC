import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, ToggleButton, ToggleButtonGroup, MenuItem } from '@mui/material';
import theme from '../../components/theme';
import Navbar from '../../components/navbar';
import PageHeader from '../../components/pageHeader';
import {
  stackStyles,
  titleStyles,
  textFieldStyles,
  numFieldStyles,
  toggleButtonGroupStyles,
  backContinueContainerStyles,
  buttonStyles,
  rowBoxStyles,
} from '../../components/styles';

const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const Basics = () => {
  const [person, setPerson] = useState('myself');
  const [financialGoal, setFinancialGoal] = useState('');
  const [inflationType, setInflationType] = useState('none');
  const [inflationValue, setInflationValue] = useState('');
  const [residence, setResidence] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [lifeExpectancy, setLifeExpectancy] = useState('');
  const [spouseBirthYear, setSpouseBirthYear] = useState('');
  const [spouseLifeExpectancy, setSpouseLifeExpectancy] = useState('');
  const [yourSampleAge, setYourSampleAge] = useState('custom');
  const [spouseSampleAge, setSpouseSampleAge] = useState('custom');
  const [yourMean, setYourMean] = useState('');
  const [yourStdDev, setYourStdDev] = useState('');
  const [spouseMean, setSpouseMean] = useState('');
  const [spouseStdDev, setSpouseStdDev] = useState('');

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

  const handleResidenceChange = (event) => {
    setResidence(event.target.value);
  };

  const handleBirthYearChange = (event) => {
    setBirthYear(event.target.value);
  };

  const handleLifeExpectancyChange = (event) => {
    setLifeExpectancy(event.target.value);
  };

  const handleSpouseBirthYearChange = (event) => {
    setSpouseBirthYear(event.target.value);
  };

  const handleSpouseLifeExpectancyChange = (event) => {
    setSpouseLifeExpectancy(event.target.value);
  };

  const handleYourSampleAgeChange = (event, newValue) => {
    if (newValue !== null) {
      setYourSampleAge(newValue);
    }
  };

  const handleSpouseSampleAgeChange = (event, newValue) => {
    if (newValue !== null) {
      setSpouseSampleAge(newValue);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={''} />
      <Container>

        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Your Scenario Starts Here
          </Typography>
          <Button variant="contained" color="secondary" sx={buttonStyles}>
            Save
          </Button>
        </Stack>

        <PageHeader />

        {/* Row 1 */}
        <Box sx={rowBoxStyles}>
          <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
              Name of Scenario
            </Typography>
            <TextField variant="outlined" sx={textFieldStyles} />
          </Box>

          <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
              Financial Goal
            </Typography>
            <TextField
              type="number"
              variant="outlined"
              value={financialGoal}
              onChange={handleGoalChange}
              sx={numFieldStyles}
            />
          </Box>

          <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
              State Residence
            </Typography>
            <TextField
              select
              variant="outlined"
              value={residence}
              onChange={handleResidenceChange}
              sx={textFieldStyles}
            >
              {states.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
              Is the scenario for yourself or with your spouse?
            </Typography>
            <ToggleButtonGroup
              value={person}
              exclusive
              onChange={handlePersonChange}
              aria-label="scenario target"
              sx={toggleButtonGroupStyles}
            >
              <ToggleButton value="myself" aria-label="myself">
                Myself
              </ToggleButton>
              <ToggleButton value="spouse" aria-label="with spouse">
                With Spouse
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Row 2 */}
        <Box sx={rowBoxStyles}>
          <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
              Your Birth Year
            </Typography>
            <TextField
              type="number"
              variant="outlined"
              value={birthYear}
              onChange={handleBirthYearChange}
              sx={numFieldStyles}
            />
          </Box>

          {/* Toggle for Life Expectancy or Sample Age */}
          <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
              Your Age Type
            </Typography>
            <ToggleButtonGroup
              value={yourSampleAge}
              exclusive
              onChange={handleYourSampleAgeChange}
              aria-label="your age type"
              sx={toggleButtonGroupStyles}
            >
              <ToggleButton value="custom" aria-label="custom">
                Custom
              </ToggleButton>
              <ToggleButton value="sample" aria-label="sample">
                Sample Age
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Custom or Sample Age */}
          {yourSampleAge === 'custom' && (
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
              <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                Your Life Expectancy
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                value={lifeExpectancy}
                onChange={handleLifeExpectancyChange}
                sx={numFieldStyles}
              />
            </Box>
          )}

          {yourSampleAge === 'sample' && (
            <>
              <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                  Your Mean
                </Typography>
                <TextField
                  type="number"
                  variant="outlined"
                  value={yourMean}
                  onChange={(e) => setYourMean(e.target.value)}
                  sx={numFieldStyles}
                />
              </Box>

              <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                  Your Standard Deviation
                </Typography>
                <TextField
                  type="number"
                  variant="outlined"
                  value={yourStdDev}
                  onChange={(e) => setYourStdDev(e.target.value)}
                  sx={numFieldStyles}
                />
              </Box>
            </>
          )}
        </Box>

        {/* Row 3 - Spouse's birth year / life expectancy */}
        {person === 'spouse' && (
          <Box sx={rowBoxStyles}>
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
              <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                Spouse's Birth Year
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                value={spouseBirthYear}
                onChange={handleSpouseBirthYearChange}
                sx={numFieldStyles}
              />
            </Box>

            {/* Spouse Toggle for Life Expectancy or Sample Age */}
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
              <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                Spouse's Age Type
              </Typography>
              <ToggleButtonGroup
                value={spouseSampleAge}
                exclusive
                onChange={handleSpouseSampleAgeChange}
                aria-label="spouse age type"
                sx={toggleButtonGroupStyles}
              >
                <ToggleButton value="custom" aria-label="custom">
                  Custom
                </ToggleButton>
                <ToggleButton value="sample" aria-label="sample">
                  Sample Age
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Custom or Sample Age */}
            {spouseSampleAge === 'custom' && (
              <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                  Spouse's Life Expectancy
                </Typography>
                <TextField
                  type="number"
                  variant="outlined"
                  value={spouseLifeExpectancy}
                  onChange={handleSpouseLifeExpectancyChange}
                  sx={numFieldStyles}
                />
              </Box>
            )}

            {spouseSampleAge === 'sample' && (
              <>
                <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                    Spouse's Mean
                  </Typography>
                  <TextField
                    type="number"
                    variant="outlined"
                    value={spouseMean}
                    onChange={(e) => setSpouseMean(e.target.value)}
                    sx={numFieldStyles}
                  />
                </Box>

                <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                    Spouse's Standard Deviation
                  </Typography>
                  <TextField
                    type="number"
                    variant="outlined"
                    value={spouseStdDev}
                    onChange={(e) => setSpouseStdDev(e.target.value)}
                    sx={numFieldStyles}
                  />
                </Box>
              </>
            )}
          </Box>
        )}

        {/* Row 4 - Inflation Assumptions */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginTop: 4, marginBottom: 2 }}>
          Inflation Assumptions
        </Typography>

        <Box sx={rowBoxStyles}>
          <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
              Distribution Type
            </Typography>
            <ToggleButtonGroup
              value={inflationType}
              exclusive
              onChange={handleInflationChange}
              aria-label="inflation distribution"
              sx={toggleButtonGroupStyles}
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
          </Box>

          {/* Inflation Value (Conditional) */}
          {inflationType === 'none' && (
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
              <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                Inflation Value
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                value={inflationValue}
                onChange={handleInflationValueChange}
                sx={numFieldStyles}
              />
            </Box>
          )}
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

export default Basics;
