import React, { useState, useContext, useEffect } from "react";
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

import axios from 'axios';

const Income = () => {
    const {currIncome, setCurrIncome} = useContext(AppContext); // scenarios/:id/IncomeEvent
    const {eventEditMode, setEventEditMode} = useContext(AppContext); 
    const {currScenario, setCurrScenario} = useContext(AppContext);
    const {editMode, setEditMode} = useContext(AppContext); //scenario
    // setEventEditMode({ type: event.type, id: event._id}); // 🔹  type: "new" if new
    const getIncomeById = (id) => {
        for (let i = 0; i < currIncome.length; i++) {
            // console.log('currIncome[i].id :>> ', currIncome[i]._id);
            // console.log('currIncome[i] :>> ', currIncome[i]);
            // console.log('id :>> ', id);
            if (currIncome[i]._id == id) {
                return currIncome[i]; // Return the found scenario
            }
        }
        return null; // Return null if not found
      };

    let indieIncome="";
    if(eventEditMode.type!=="new"){
        console.log("printed");
     indieIncome = getIncomeById(eventEditMode.id);
    }

    // useEffect(() => {
    //     if (eventEditMode.type !== "new") {
    //         console.log("Fetching income data for edit mode");
    //         indieIncome = getIncomeById(eventEditMode.id);
    //         console.log("Fetched indieIncome:", indieIncome);
    //         if (indieIncome) {
    //             setFormValues(indieIncome);
    //         }
    //     }
    // }, [eventEditMode]);

    console.log('currIncome :>> ', currIncome);
    console.log("event edit mode: ",eventEditMode)
    console.log("indieIncome");
    console.log(indieIncome);

    // console.log(eventEditMode);
    // console.log(currIncome);

    // scenario has list of income 
    const [formValues, setFormValues] = useState(indieIncome ||  {
        _id:'',
        eventSeriesName: '',
        description: '',
        startYear: {
            type: 'fixedAmt',
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
        inflationAdjustment: false,
        isSocialSecurity: false
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


    
      const handleSave = async () => {
        try {
          let response;
        //   console.log("editMode: ", editMode);
          console.log(formValues._id);
          console.log("form valu: ",formValues);
          if (eventEditMode.id == "new"){

            let response = await axios.post('http://localhost:8080/incomeEvent', formValues);
            let id = response.data._id;
            console.log("NEW EVENT MODE ID: ", id)

            handleInputChange("_id", id);
            setCurrIncome((prev)=> [...prev, formValues]);
            setEventEditMode({type:"Income", id: id});
            console.log("NEW EVENT EDIT MODE: ", eventEditMode)
            setCurrScenario((prevScenario) => {
                const updatedScenario = {
                    ...prevScenario,
                    incomeEventSeries: [...(prevScenario?.incomeEventSeries || []), id]
                };

                axios.post(`http://localhost:8080/updateScenario/${editMode}`, updatedScenario)
                    .then(() => console.log("Scenario updated successfully"))
                    .catch((error) => console.error("Error updating scenario:", error));

                return updatedScenario;
            });

            console.log('Data successfully saved:', response.data);
            // setEditMode(id);
          } else {
            console.log("EVENT EDIT MODE ID: ", eventEditMode.id)
            let response = await axios.post(`http://localhost:8080/updateIncome/${eventEditMode.id}`, formValues);
            // setCurrScenario(formValues);
            setCurrIncome((prev) => {
              let newList = prev.filter((item)=> item._id !== eventEditMode.id)
              return [...newList, formValues]
            });
            console.log('Data successfully updated:', response.data);
          }
    
          alert('Save data');
        } catch (error) {
          console.error('Error saving data:', error);
        //   setErrorBackdrop(true); 
          alert('Failed to save data!');
        }
      };


    // const handleSave = () => {
    //     setCurrIncome((prevIncome) =>
    //         prevIncome.map((income) =>
    //             income.id === indieIncome.id ? { ...income, ...formValues } : income
    //         )
    //     );


        // try {
        //     const response = await fetch('/api/update-income', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //             id: indieIncome.id, // Use the unique identifier for the document
        //             updatedIncome: formValues, // Send the updated form values
        //         }),
        //     });
    
        //     if (!response.ok) {
        //         throw new Error('Failed to update MongoDB');
        //     }
    
        //     const data = await response.json();
        //     console.log('MongoDB Update Response:', data);
        // } catch (error) {
        //     console.error('Error updating MongoDB:', error);
        // }

        // console.log('HANDLE SAVE :>> ', currIncome);
    // };

    const handleBackClick = () =>  {
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
                        value={formValues.eventSeriesName} 
                        setValue={(value) => handleInputChange("eventSeriesName", value)}
                        />

                        <CustomInput 
                        title="Description (Optional)" 
                        type="multiline" 
                        value={formValues.description} 
                        setValue={(value) => handleInputChange("description", value)} 
                        />

                        <Stack direction="column" spacing={2}>
                            <CustomInput 
                                title="Start Year" 
                                type="number" 
                                value={formValues.startYear.value} 
                                setValue={(value) => handleInputChange("startYear.value", value)} 
                            />

                            <Stack spacing={2}>
                                {/* Toggle on Top */}
                                <CustomToggle
                                    title="Duration"
                                    values={['fixedAmt', 'Normal', 'Uniform']}
                                    sideView={false}
                                    width={100}
                                    value={formValues.duration.type}
                                    setValue={(value) => handleInputChange("duration.type", value)}
                                />

                                {/* Input Fields Below in Columns */}
                                <Stack direction="row" spacing={4} alignItems="start">
                                    {formValues.duration.type === "fixedAmt" && (
                                        <CustomInput 
                                            title="Value"
                                            type="number"
                                            adornment={expectedChangeType === 'Percentage' ? '' : ''}
                                            value={formValues.duration.value}
                                            setValue={(value) => handleInputChange("duration.value", value)}
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
                            <Checkbox 
                                    checked={formValues.inflationAdjustment || false}
                                    onChange={(value) => handleInputChange("inflationAdjustment", value.target.checked)}
                            />
                        </Stack>

                        {/* <CustomToggle
                            title="Income Type"
                            values={['Wage', 'Social Security']}
                            sideView={true}
                            width={150}
                            value={formValues.isSocialSecurity}
                            setValue={(value) => handleInputChange("isSocialSecurity", value)}
                        /> */}
                       <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', width: 150 }}>
                               Social Security
                            </Typography>
                            <Checkbox checked={formValues.isSocialSecurity || false}  
                                onChange={(value) => handleInputChange("isSocialSecurity", value.target.checked)}/>
                        </Stack>

                        
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
                            values={['fixed', 'percentage']}
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
