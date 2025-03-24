import React, { useState, useContext } from "react";
import axios from 'axios';
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
  const { currScenario, setCurrScenario, scenarioData, setScenarioData } = useContext(AppContext);
  const {editMode, setEditMode} = useContext(AppContext);
  // console.log(currScenario);
  const [formValues, setFormValues] = useState(currScenario || {
    _id: '',
    name: '',
    filingStatus: 'single',
    financialGoal: '',
    inflationAssumption: {
      type:'',
      fixedRate: '',
      mean: '',
      stdDev: '',
      min: '',
      max: '',
    },
    birthYearUser: '',
    lifeExpectancy: {
      type: '',
      fixedAge: '',
      mean: '',
      stdDev: '',
    },
    stateResident: '',
  });

  const [showBackdrop, setShowBackdrop] = useState(false);
  const [errorBackdrop, setErrorBackdrop] = useState(false);
  const navigate = useNavigate();

  // Unified handle input change function
  const handleInputChange = (field, value) => {
    const fieldParts = field.split('.'); // Split the field into parts (e.g., "lifeExpectancy.mean")
  
    setFormValues((prev) => {
      // Update the nested object
      if (fieldParts.length === 2) {
        const [parent, child] = fieldParts; // 'lifeExpectancy' and 'mean'
        return {
          ...prev,
          [parent]: { // Spread the parent object (lifeExpectancy)
            ...prev[parent],
            [child]: value, // Update the child property (mean)
          },
        };
      }
  
      // For top-level fields (no dot notation)
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Error handling for leaving through Back button
  const handleBackClick = () => {
    setShowBackdrop(false);
    navigate("/scenarios");
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

  const handleSave = async () => {
    try {
      let response;
      console.log("editMode: ", editMode);
      console.log(formValues._id);
      if (editMode == "new"){
        let response = await axios.post('http://localhost:8080/basicInfo', formValues);
        let id = response.data._id;

        handleInputChange("_id", id);
        setCurrScenario(formValues);
        setScenarioData((prev)=> [...prev, formValues]);
        
        console.log('Data successfully saved:', response.data);
        setEditMode(id);
      } else {
        let response = await axios.post(`http://localhost:8080/updateScenario/${editMode}`, formValues);
        setCurrScenario(formValues);
        setScenarioData((prev) => {
          let newList = prev.filter((item)=> item._id !== editMode)
          return [...newList, formValues]
        });
        console.log('Data successfully updated:', response.data);
      }

      alert('Save data');
    } catch (error) {
      console.error('Error saving data:', error);
      setErrorBackdrop(true); 
      alert('Failed to save data!');
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
          <Button 
            variant="contained" 
            color="secondary" 
            sx={buttonStyles}
            onClick={handleSave}
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
            value={formValues.stateResident}
            menuItems={states}
            setValue={(value) => handleInputChange("stateResident", value)}
            textFieldStyles={textFieldStyles}
          />

          <CustomToggle
            title="Is the scenario for yourself or with your spouse?"
            values={['single', 'married']}
            sideView={false}
            width={100}
            value={formValues.filingStatus}
            setValue={(value) => handleInputChange("filingStatus", value)}
          />
        </Box>

        {/* Row 2 */}
        <Box sx={rowBoxStyles}>
          <CustomInput
            title="Your Birth Year"
            type="number"
            value={formValues.birthYearUser}
            setValue={(value) => handleInputChange("birthYearUser", value)}
          />

          <CustomToggle
            title="Your age type"
            values={['fixed', 'normal']}
            sideView={false}
            width={100}
            value={formValues.lifeExpectancy.type}
            setValue={(value) => handleInputChange("lifeExpectancy.type", value)}
          />

          {formValues.lifeExpectancy.type === 'fixed' ? (
            <CustomInput
              title="Your Life Expectancy"
              type="number"
              value={formValues.lifeExpectancy.fixedAge}
              setValue={(value) => handleInputChange("lifeExpectancy.fixedAge", value)}
            />
          ) : (
            <>
              <CustomInput
                title="Mean"
                type="number"
                value={formValues.lifeExpectancy.mean}
                setValue={(value) => handleInputChange("lifeExpectancy.mean", value)}
              />
              <CustomInput
                title="Standard Deviation"
                type="number"
                value={formValues.lifeExpectancy.stdDev}
                setValue={(value) => handleInputChange("lifeExpectancy.stdDev", value)}
              />
            </>
          )}
        </Box>

        {/* Spouse Row */}
        {formValues.filingStatus === 'married' && (
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
              value={formValues.inflationAssumption.type}
              setValue={(value) => handleInputChange("inflationAssumption.type", value)}
          />

          {/* Inflation Value (Conditional) */}
          {formValues.inflationAssumption.type === 'fixed' && (
            <CustomInput 
                title="Value"
                type="number"
                adornment="%"
                value={formValues.inflationAssumption.fixedRate}
                setValue={(value) => handleInputChange("inflationAssumption.fixedRate", value)}
            />
          )}
          {formValues.inflationAssumption.type === 'uniform' && (
            <>
              <CustomInput 
                  title="Min"
                  type="number"
                  adornment="%"
                  value={formValues.inflationAssumption.min}
                  setValue={(value) => handleInputChange("inflationAssumption.min", value)}
              />
              <CustomInput 
                  title="Max"
                  type="number"
                  adornment="%"
                  value={formValues.inflationAssumption.max}
                  setValue={(value) => handleInputChange("inflationAssumption.max", value)}
              />
            </>
          )}
          {formValues.inflationAssumption.type === 'normal' && (
            <>
              <CustomInput 
                  title="Mean"
                  type="number"
                  adornment="%"
                  value={formValues.inflationAssumption.mean}
                  setValue={(value) => handleInputChange("inflationAssumption.mean", value)}
              />
              <CustomInput 
                  title="Standard Deviation"
                  type="number"
                  adornment="%"
                  value={formValues.inflationAssumption.stdDev}
                  setValue={(value) => handleInputChange("inflationAssumption.stdDev", value)}
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
