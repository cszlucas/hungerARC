import React, { useState, useContext } from "react";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, Backdrop, Fade, Paper
} from '@mui/material';
import theme from '../../components/theme';
import Navbar from '../../components/navbar';
import PageHeader from '../../components/pageHeader';
import {
  stackStyles, titleStyles, textFieldStyles, backContinueContainerStyles, buttonStyles, rowBoxStyles,
} from '../../components/styles';

import CustomInput from '../../components/customInputBox';
import CustomToggle from '../../components/customToggle';
import CustomDropdown from '../../components/customDropDown';
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/appContext";

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
  const { currScenario, setCurrScenario } = useContext(AppContext);
  const [formValues, setFormValues] = useState(currScenario || {
    name: '',
    person: 'Myself',
    financialGoal: '',
    residence: '',
    birthYear: '',
    lifeExpectancy: '',
    spouseBirthYear: '',
    spouseLifeExpectancy: '',
    yourSampleAge: 'fixed',
    spouseSampleAge: 'fixed',
    yourMean: '',
    yourStdDev: '',
    spouseMean: '',
    spouseStdDev: '',
    inflationType: 'fixed',
    inflationValue: '',
    inflationMean: '',
    inflationStdDev: '',
    inflationMin: '',
    inflationMax: ''
  });

  const [showBackdrop, setShowBackdrop] = useState(false);
  const [errorBackdrop, setErrorBackdrop] = useState(false);
  const navigate = useNavigate();

  // Unified handle input change function
  const handleInputChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleBackClick = () => {
    setShowBackdrop(true);
  };

  const handleClose = () => {
    setShowBackdrop(false);
  };

  const handleConfirm = () => {
    if (!formValues.name.trim()) {
      setShowBackdrop(false);
      setErrorBackdrop(true);
    } else {
      setCurrScenario(formValues);  // Save formValues before navigating
      setShowBackdrop(false);
      navigate("/scenarios");
    }
  };

  const handleErrorClose = () => {
    setErrorBackdrop(false);
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
          <Button 
            variant="contained" 
            color="secondary" 
            sx={buttonStyles}
            onClick={handleConfirm}
          >
            Save
          </Button>
        </Stack>

        <PageHeader />

        {/* Row 1 */}
        <Box sx={rowBoxStyles}>
          <CustomInput
            title="Name of Scenario"
            type="normal"
            value={formValues.name}
            setValue={(value) => handleInputChange("name", value)}
          />

          <CustomInput
            title="Financial Goal"
            type="number"
            value={formValues.financialGoal}
            setValue={(value) => handleInputChange("financialGoal", value)}
            inputProps={{ min: 0 }}
          />

          <CustomDropdown
            label="State Residence"
            value={formValues.residence}
            menuItems={states}
            setValue={(value) => handleInputChange("residence", value)}
            textFieldStyles={textFieldStyles}
          />

          <CustomToggle
            title="Is the scenario for yourself or with your spouse?"
            values={['Myself', 'With Spouse']}
            sideView={false}
            width={100}
            value={formValues.person}
            setValue={(value) => handleInputChange("person", value)}
          />
        </Box>

        {/* Row 2 */}
        <Box sx={rowBoxStyles}>
          <CustomInput
            title="Your Birth Year"
            type="number"
            value={formValues.birthYear}
            setValue={(value) => handleInputChange("birthYear", value)}
          />

          <CustomToggle
            title="Your age type"
            values={['fixed', 'normal']}
            sideView={false}
            width={100}
            value={formValues.yourSampleAge}
            setValue={(value) => handleInputChange("yourSampleAge", value)}
          />

          {formValues.yourSampleAge === 'fixed' ? (
            <CustomInput
              title="Your Life Expectancy"
              type="number"
              value={formValues.lifeExpectancy}
              setValue={(value) => handleInputChange("lifeExpectancy", value)}
            />
          ) : (
            <>
              <CustomInput
                title="Mean"
                type="number"
                value={formValues.yourMean}
                setValue={(value) => handleInputChange("yourMean", value)}
              />
              <CustomInput
                title="Standard Deviation"
                type="number"
                value={formValues.yourStdDev}
                setValue={(value) => handleInputChange("yourStdDev", value)}
              />
            </>
          )}
        </Box>

        {/* Spouse Row */}
        {formValues.person === 'With Spouse' && (
          <Box sx={rowBoxStyles}>
            <CustomInput
              title="Spouse's Birth Year"
              type="number"
              value={formValues.spouseBirthYear}
              setValue={(value) => handleInputChange("spouseBirthYear", value)}
            />

            <CustomToggle
              title="Spouse age type"
              values={['fixed', 'normal']}
              sideView={false}
              width={100}
              value={formValues.spouseSampleAge}
              setValue={(value) => handleInputChange("spouseSampleAge", value)}
            />

            {formValues.spouseSampleAge === 'fixed' ? (
              <CustomInput
                title="Spouse's Life Expectancy"
                type="number"
                value={formValues.spouseLifeExpectancy}
                setValue={(value) => handleInputChange("spouseLifeExpectancy", value)}
              />
            ) : (
              <>
                <CustomInput
                  title="Mean"
                  type="number"
                  value={formValues.spouseMean}
                  setValue={(value) => handleInputChange("spouseMean", value)}
                />
                <CustomInput
                  title="Standard Deviation"
                  type="number"
                  value={formValues.spouseStdDev}
                  setValue={(value) => handleInputChange("spouseStdDev", value)}
                />
              </>
            )}
          </Box>
        )}
        
        {/* Row 4 - Inflation Assumptions */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginTop: 4, marginBottom: 2 }}>
          Inflation Assumptions
        </Typography>

        <Box sx={rowBoxStyles}>
          <CustomToggle
              title="Distribution"
              values={['fixed', 'uniform', 'normal']}
              sideView={false}
              width={100}
              value={formValues.inflationType}
              setValue={(value) => handleInputChange("inflationType", value)}
          />

          {/* Inflation Value (Conditional) */}
          {formValues.inflationType === 'fixed' && (
            <CustomInput 
                title="Value"
                type="number"
                adornment="%"
                value={formValues.inflationValue}
                setValue={(value) => handleInputChange("inflationValue", value)}
            />
          )}
          {formValues.inflationType === 'uniform' && (
            <>
              <CustomInput 
                  title="Min"
                  type="number"
                  adornment="%"
                  value={formValues.inflationMin}
                  setValue={(value) => handleInputChange("inflationMin", value)}
              />
              <CustomInput 
                  title="Max"
                  type="number"
                  adornment="%"
                  value={formValues.inflationMax}
                  setValue={(value) => handleInputChange("inflationMax", value)}
              />
            </>
          )}
          {formValues.inflationType === 'normal' && (
            <>
              <CustomInput 
                  title="Mean"
                  type="number"
                  adornment="%"
                  value={formValues.inflationMean}
                  setValue={(value) => handleInputChange("inflationMean", value)}
              />
              <CustomInput 
                  title="Standard Deviation"
                  type="number"
                  adornment="%"
                  value={formValues.inflationStdDev}
                  setValue={(value) => handleInputChange("inflationStdDev", value)}
              />
            </>
          )}
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles} onClick={handleBackClick}>
            Back
          </Button>
          <Button variant="contained" color="success" sx={buttonStyles} 
            onClick={() => {
              setCurrScenario(formValues);
              navigate("/scenario/investment_lists")
            }}
          >
            Continue
          </Button>
        </Box>
        
                {/* Backdrop and Fade for confirmation */}
                <Backdrop 
          open={showBackdrop} 
          onClick={handleClose} 
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Fade in={showBackdrop}>
            <Paper 
              elevation={3} 
              sx={{
                padding: 4,
                width: '400px',
                backgroundColor: 'white',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" sx={{fontWeight: 'bold'}} gutterBottom>
                Do you want to save your changes?
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                <Button 
                  variant="contained" 
                  color="error"
                  sx={buttonStyles}
                  onClick={handleClose}
                >
                  No
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary"
                  sx={buttonStyles} 
                  onClick={handleConfirm}
                >
                  Yes
                </Button>
              </Stack>
            </Paper>
          </Fade>
        </Backdrop>

        {/* Separate Backdrop for error message */}
        <Backdrop 
          open={errorBackdrop}
          onClick={handleErrorClose} 
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
        >
          <Fade in={errorBackdrop}>
            <Paper 
              elevation={4} 
              sx={{
                padding: 4,
                width: '350px',
                backgroundColor: 'white',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" color="error" sx={{fontWeight: 'bold'}}>
                Please enter a scenario name before saving.
              </Typography>
            </Paper>
          </Fade>
        </Backdrop>
      </Container>
    </ThemeProvider>
  );
};

export default Basics;
