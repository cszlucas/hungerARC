import React, { useState, useContext } from "react";
import { ThemeProvider, CssBaseline, Container, Button, Stack, Box, Checkbox, Typography } from '@mui/material';
import theme from '../../../components/theme';
import Navbar from '../../../components/navbar';
import PageHeader from '../../../components/pageHeader';
import {
    backContinueContainerStyles,
    buttonStyles,
    rowBoxStyles,
} from '../../../components/styles';

import CustomInput from '../../../components/customInputBox';
import CustomToggle from '../../../components/customToggle';
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";

const Income = () => {
    const {currIncome, setCurrIncome} = useContext(AppContext); // scenarios/:id/IncomeEvent
    const {eventEditMode, setEventEditMode} = useContext(AppContext); 
    // setEventEditMode({ type: event.type, id: event._id}); // 🔹  type: "new" if new
    // console.log(eventEditMode);
    console.log('current income on page');
    console.log(currIncome);
    const getIncomeById = (id) => {
        for (let i = 0; i < currIncome.length; i++) {
            if (currIncome[i]._id == id) {
                return currIncome[i]; // Return the found scenario
            }
        }
        return null; // Return null if not found
      };

    let indieIncome="";
    if (eventEditMode !== "new"){
        indieIncome = getIncomeById(eventEditMode.id);
    }


    console.log("indieIncome");
    console.log(indieIncome);

    // console.log(currIncome);

    // scenario has list of income 
    const [formValues, setFormValues] = useState(indieIncome ||  {
        eventName: '',
        description: '',
        startYear: {
            type: '',
            value: '',
            mean: '',
            stdDev: '',
            min: '',
            max: '',
            year: ''
        },
        duration: {
            type: '',
            value: '',
            mean: '',
            stdDev: '',
            min: '',
            max: ''
        },
        initialAmount: '',
        annualChange: {
            type:'',
            amount:''
        },
        userPercentage: '',
        inflationAdjustment: null,
        isSocialSecurity: ''
        // isSocialSecurity: false
    });
    
    // const [eventName, setEventName] = useState('');
    // const [description, setDescription] = useState('');
    const [startYear, setStartYear] = useState('');
    // const [duration, setDuration] = useState('Fixed');
    // const [durationValue, setDurationValue] = useState('');
    // const [durationMin, setDurationMin] = useState('');
    // const [durationMax, setDurationMax] = useState('');
    // const [durationMean, setDurationMean] = useState('');
    // const [durationVariance, setDurationVariance] = useState('');

    const [expectedChangeType, setExpectedChangeType] = useState('Fixed');
    const [distributionType, setDistributionType] = useState('None');
    // const [incomeType, setIncomeType] = useState('Wage'); //SORRY VICKY I PUT THIS BACK
    // const [changeValue, setChangeValue] = useState(''); //SORRY VICKY I PUT THIS BACK
    const [changeMean, setChangeMean] = useState('');
    const [changeVariance, setChangeVariance] = useState('');
    const [changeMin, setChangeMin] = useState('');
    const [changeMax, setChangeMax] = useState('');

    // const [showBackdrop, setShowBackdrop] = useState(false);
    // const [errorBackdrop, setErrorBackdrop] = useState(false);
    const navigate = useNavigate();

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

    const handleSave = () => {
        setCurrIncome((prevIncome) =>
            prevIncome.map((income) =>
                income.id === indieIncome.id ? { ...income, ...formValues } : income
            )
        );
    };

    const handleBackClick = () => {
        // setShowBackdrop(false);
        // setIncome(formValues);
        handleSave();  
        navigate("/scenario/event_series");
      };
      const handleClose = () => {
        // setShowBackdrop(false);
      };

    const handleConfirm = () => {
        if (!formValues.name.trim()) {
        // setShowBackdrop(false);
        // setErrorBackdrop(true);
        } else {
        // setIncome(formValues);  // Save formValues before navigating
        // setShowBackdrop(false);
        navigate("/scenarios");
        }
    };
    const handleErrorClose = () => {
        // setErrorBackdrop(false);
    };

    

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={''} />
            <Container>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ marginTop: 6, marginBottom: 2 }}>
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold' }}>
                        Income
                    </Typography>
                    <Button variant="contained" color="secondary" sx={{ fontSize: '1.25rem', textTransform: 'none' }}>
                        Save
                    </Button>
                </Stack>

                <PageHeader />

                <Box sx={rowBoxStyles}>
                    {/* First Column */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", width: 250 }}>
                        <CustomInput 
                        title="Event name" 
                        value={formValues.eventName} 
                        setValue={(value) => handleInputChange("eventName", value)}
                        />

                        <CustomInput 
                        title="Description (Optional)" 
                        type="multiline" 
                        value={formValues.description} 
                        setValue={(value) => handleInputChange("description", value)} 
                        />

                        <Stack direction="column" spacing={2}>
                            {/* not needed */}
                            <CustomInput 
                                title="Start Year" 
                                type="number" 
                                value={startYear} 
                                setValue={setStartYear} 
                            />

                            <Stack spacing={2}>
                                {/* Toggle on Top */}
                                <CustomToggle
                                    title="Duration"
                                    values={['Fixed', 'Normal', 'Uniform']}
                                    sideView={false}
                                    width={100}
                                    value={formValues.duration.type}
                                    setValue={(value) => handleInputChange("duration.type", value)}
                                />

                                {/* Input Fields Below in Columns */}
                                <Stack direction="row" spacing={4} alignItems="start">
                                    {formValues.duration.type === "Fixed" && (
                                        <CustomInput 
                                            title="Value"
                                            type="number"
                                            adornment={expectedChangeType === 'Percentage' ? '' : ''}
                                            value={formValues.duration.type}
                                            setValue={(value) => handleInputChange("duration.type", value)}
                                        />
                                    )}

                                    {formValues.duration.type === "Normal" && (
                                        <Stack direction="row" spacing={4} alignItems="start">
                                            <CustomInput 
                                                title="Mean"
                                                type="number"
                                                adornment={expectedChangeType === 'Percentage' ? '' : ''}
                                                value={formValues.duration.mean}
                                                setValue={(value) => handleInputChange("duration.mean", value)}
                                            />
                                            <CustomInput 
                                                title="Variance"
                                                type="number"
                                                adornment={expectedChangeType === 'Percentage' ? '' : ''}
                                                value={formValues.duration.stdDev}
                                                setValue={(value) => handleInputChange("duration.stdDev", value)}
                                            />
                                        </Stack>
                                    )}

                                    {formValues.duration.type === "Uniform" && (
                                        <Stack direction="row" spacing={4} alignItems="start">
                                            <CustomInput 
                                                title="Min"
                                                type="number"
                                                adornment={expectedChangeType === 'Percentage' ? '' : ''}
                                                value={formValues.duration.min}
                                                setValue={(value) => handleInputChange("duration.min", value)}
                                            />
                                            <CustomInput 
                                                title="Max"
                                                type="number"
                                                adornment={expectedChangeType === 'Percentage' ? '' : ''}
                                                value={formValues.duration.max}
                                                setValue={(value) => handleInputChange("duration.max", value)}
                                            />
                                        </Stack>
                                    )}
                                </Stack>
                            </Stack>

                        </Stack>
                    </Box>
                    {/* Second Column */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: 300 }}>
                        <CustomInput 
                            title="Initial Income Amount"
                            type="number"
                            adornment="$"
                            value={formValues.initialAmount}
                            setValue={(value) => handleInputChange("initialAmount", value)}
                        />

                        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                            <CustomInput 
                                title="User's Contribution"
                                type="number"
                                adornment="%"
                                value={formValues.userPercentage}
                                setValue={(value) => handleInputChange("userPercentage", value)}
                            />
                            <CustomInput 
                                title="Spouse's Contribution"
                                type="number"
                                adornment="%"
                                value={changeVariance}
                                setValue={setChangeVariance}
                            />
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2} sx={{ marginTop: 4, mb: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                Inflation Adjustment
                            </Typography>
                            <Checkbox />
                        </Stack>

                        <CustomToggle
                            title="Income Type"
                            values={['Wage', 'Social Security']}
                            sideView={true}
                            width={150}
                            value={formValues.isSocialSecurity}
                            setValue={(value) => handleInputChange("isSocialSecurity", value)}
                        />
                    </Box>
                    {/* Third Column */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'bold' }}>Expected Annual Change:</Typography>

                        <CustomToggle
                            title="Distribution"
                            values={['None', 'Normal', 'Uniform']}
                            sideView={true}
                            width={100}
                            value={distributionType}
                            setValue={setDistributionType}
                        />

                        <CustomToggle
                            title="Rate/Unit"
                            values={['Fixed', 'Percentage']}
                            sideView={true}
                            width={100}
                            value={formValues.annualChange.type}
                            setValue={(value) => handleInputChange("annualChange.type", value)}
                        />

                        {distributionType === "None" && (
                            <CustomInput 
                                title="Value"
                                type="number"
                                adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                value={formValues.annualChange.amount}
                                setValue={(value) => handleInputChange("annualChange.amount", value)}
                            />
                        )}
                        
                        {distributionType === "Normal" && (
                            <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                                <CustomInput 
                                    title="Mean"
                                    type="number"
                                    adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                    value={changeMean}
                                    setValue={setChangeMean}
                                />
                                <CustomInput 
                                    title="Variance"
                                    type="number"
                                    adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                    value={changeVariance}
                                    setValue={setChangeVariance}
                                />
                            </Stack>
                        )}

                        {distributionType === "Uniform" && (
                            <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                                <CustomInput 
                                    title="Min"
                                    type="number"
                                    adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                    value={changeMin}
                                    setValue={setChangeMin}
                                />
                                <CustomInput 
                                    title="Max"
                                    type="number"
                                    adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                    value={changeMax}
                                    setValue={setChangeMax}
                                />
                            </Stack>
                        )}
                    </Box>
                </Box>

                <Box sx={backContinueContainerStyles}>
                    <Button variant="contained" color="primary" sx={buttonStyles}
                        onClick={handleBackClick}
                        // onClick={() => navigate("/scenario/event_series")}
                    >
                        Back
                    </Button>
                    <Button variant="contained" color="success" sx={buttonStyles}
                        onClick={() => {
                            handleSave();
                            navigate("/scenario/event_series");
                          }}
                    >
                        Continue
                    </Button>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default Income;
