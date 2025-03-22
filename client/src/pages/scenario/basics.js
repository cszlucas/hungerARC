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

import CustomInput from '../../components/customInputBox';
import CustomToggle from '../../components/customToggle';
import CustomDropdown from '../../components/customDropDown';

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
  const [name, setName] = useState('');
  const [person, setPerson] = useState('Myself');
  const [financialGoal, setFinancialGoal] = useState('');

  const [residence, setResidence] = useState('');
  
  const [birthYear, setBirthYear] = useState('');
  const [lifeExpectancy, setLifeExpectancy] = useState('');
  const [spouseBirthYear, setSpouseBirthYear] = useState('');
  const [spouseLifeExpectancy, setSpouseLifeExpectancy] = useState('');
  const [yourSampleAge, setYourSampleAge] = useState('Custom');
  const [spouseSampleAge, setSpouseSampleAge] = useState('Custom');
  const [yourMean, setYourMean] = useState('');
  const [yourStdDev, setYourStdDev] = useState('');
  const [spouseMean, setSpouseMean] = useState('');
  const [spouseStdDev, setSpouseStdDev] = useState('');

  const [inflationType, setInflationType] = useState('None');
  const [inflationValue, setInflationValue] = useState('');
  const [inflationMean, setInflationMean] = useState('');
  const [inflationStdDev, setInflationStdDev] = useState('');
  const [inflationMin, setInflationMin] = useState('');
  const [inflationMax, setInflationMax] = useState('');


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
          <CustomInput 
              title="Name of Scenarios"
              type="normal"
              value={name}
              setValue={setName}
          />
          <CustomInput 
              title="Financial Goal"
              type="number"
              value={financialGoal}
              setValue={setFinancialGoal}
          />

          <CustomDropdown
            label="State Residence"
            value= {residence}
            menuItems={states}
            setValue={setResidence}
            textFieldStyles={textFieldStyles}
          />

          <CustomToggle
              title="Is the scenario for yourself or with your spouse?"
              values={['Myself', 'With Spouse']}
              sideView={false}
              width={100}
              value={person}
              setValue={setPerson}
          />
        </Box>

        {/* Row 2 */}
        <Box sx={rowBoxStyles}>
          <CustomInput 
              title="Your Birth Year"
              type="number"
              value={birthYear}
              setValue={setBirthYear}
          />

          {/* Toggle for Life Expectancy or Sample Age */}
          <CustomToggle
              title="your age type"
              values={['Custom', 'Sample Age']}
              sideView={false}
              width={100}
              value={yourSampleAge}
              setValue={setYourSampleAge}
          />

          {/* Custom or Sample Age */}
          {yourSampleAge === 'Custom' && (
            <CustomInput 
                title="Your Life Expectancy"
                type="number"
                adornment=""
                value={lifeExpectancy}
                setValue={setLifeExpectancy}
            />
          )}

          {yourSampleAge === 'Sample Age' && (
            <>
              <CustomInput 
                title="Mean"
                type="number"
                adornment=""
                value={yourMean}
                setValue={setYourMean}
             />

              <CustomInput 
                title="Standard Deviation"
                type="number"
                adornment=""
                value={yourStdDev}
                setValue={setYourStdDev}
             />
            </>
          )}
        </Box>

        {/* Row 3 - Spouse's birth year / life expectancy */}
        {person === 'With Spouse' && (
          <Box sx={rowBoxStyles}>
            <CustomInput 
                title="Spouse's Birth Year"
                type="number"
                adornment=""
                value={spouseBirthYear}
                setValue={setSpouseBirthYear}
            />

            {/* Spouse Toggle for Life Expectancy or Sample Age */}
            <CustomToggle
                title="your age type"
                values={['Custom', 'Sample Age']}
                sideView={false}
                width={100}
                value={spouseSampleAge}
                setValue={setSpouseSampleAge}
            />

            {/* Custom or Sample Age */}
            {spouseSampleAge === 'Custom' && (
              <CustomInput 
                  title="Spouse's Life Expectancy"
                  type="number"
                  adornment=""
                  value={spouseLifeExpectancy}
                  setValue={setSpouseLifeExpectancy}
              />
            )}

            {spouseSampleAge === 'Sample Age' && (
              <>
                <CustomInput 
                    title="Mean"
                    type="number"
                    adornment=""
                    value={spouseMean}
                    setValue={setSpouseMean}
                />

                <CustomInput 
                    title="Standard Deviation"
                    type="number"
                    adornment=""
                    value={spouseStdDev}
                    setValue={setSpouseStdDev}
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
              values={['None', 'Uniform', 'Normal']}
              sideView={false}
              width={100}
              value={inflationType}
              setValue={setInflationType}
          />

          {/* Inflation Value (Conditional) */}
          {inflationType === 'None' && (
            <CustomInput 
                title="Value"
                type="number"
                adornment="%"
                value={inflationValue}
                setValue={setInflationValue}
            />
          )}
          {inflationType === 'Uniform' && (
            <>
              <CustomInput 
                  title="Min"
                  type="number"
                  adornment="%"
                  value={inflationMin}
                  setValue={setInflationMin}
              />
              <CustomInput 
                  title="Max"
                  type="number"
                  adornment="%"
                  value={inflationMax}
                  setValue={setInflationMax}
              />
            </>
          )}
          {inflationType === 'Normal' && (
            <>
              <CustomInput 
                  title="Mean"
                  type="number"
                  adornment="%"
                  value={inflationMean}
                  setValue={setInflationMean}
              />
              <CustomInput 
                  title="Standard Deviation"
                  type="number"
                  adornment="%"
                  value={inflationStdDev}
                  setValue={setInflationStdDev}
              />
            </>
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
