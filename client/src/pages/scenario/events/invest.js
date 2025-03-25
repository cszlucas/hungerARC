import React, { useState, useContext, useEffect } from "react";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, 
  InputAdornment, Box, List, MenuItem, ListItem, ListItemText, 
  IconButton, TextField, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import theme from '../../../components/theme';
import Navbar from '../../../components/navbar';
import PageHeader from '../../../components/pageHeader';
import {
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, 
  backContinueContainerStyles, textFieldStyles, toggleButtonGroupStyles
} from '../../../components/styles';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete'; 
import CustomDropdown from "../../../components/customDropDown"; 
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";

import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";

const Invest = () => {
    const {currInvest, setCurrInvest, currInvestments, currInvestmentTypes} = useContext(AppContext);
    const {eventEditMode, setEventEditMode} = useContext(AppContext);
    const navigate = useNavigate();
    // console.log("in Invest");
    // console.log(currInvest);
    // console.log(eventEditMode);

    const getInvesmentTypeById = (id) => {
        if (id != "") {
            for (let i = 0; i < currInvestmentTypes.length; i++) {
                if (currInvestmentTypes[i]._id == id) {
                    return currInvestmentTypes[i].name; // Return the found scenario
                }
            }
        }
        return "Unknown Type"
    }

    const getInvestById = (id) => {
        if (id != "") {
            for (let i = 0; i < currInvest.length; i++) {
                if (currInvest[i]._id == id) {
                    return currInvest[i]; // Return the found scenario
                }
            }
        }

        return {
            _id: "",
            eventSeriesName: "",
            eventSeriesDescription: "",
            maxCash: 0,
            startYear: {
                type: "fixedAmt",
                value: "",
                mean: "",
                stdDev: "",
                min: "",
                max: "",
                year: "",
            },
            duration: {
                type: "fixedAmt",
                value: "",
                mean: "",
                stdDev: "",
                min: "",
                max: "",
            },
            assetAllocation: {
                type: "fixed",
                fixedPercentages: {}, 
                initialPercentages: {},
                finalPercentages: {},
            },
        };
      };
    
    let investId = eventEditMode ? eventEditMode._id : "";
    let indieInvest = getInvestById(investId);
    // console.log(indieInvest);
    const [formValues, setFormValues] = useState(indieInvest);
    const handleInputChange = (field, value) => {
        const fieldParts = field.split('.'); // Split the field into parts (e.g., "lifeExpectancy.mean")
      
        setFormValues((prev) => {
            if (fieldParts.length === 3) {
                const [grandparent, parent, child] = fieldParts; 
                return {
                    ...prev,
                    [grandparent]: {
                        ...prev[grandparent],
                        [parent]: {
                            ...prev[grandparent]?.[parent],
                            [child]: value,
                        }
                    }
                };
            }
    
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

    const [listOfSelectedInvestments, setListOfSelectedInvestments] = useState([]);

    useEffect(()=>{
        if (formValues.assetAllocation.type == "fixed") {
            handleInputChange("assetAllocation.initialPercentages", {});
            handleInputChange("assetAllocation.finalPercentages", {});
        } else {
            handleInputChange("assetAllocation.fixedPercentages", {});
        }
        setListOfSelectedInvestments([]);
    }, [formValues.assetAllocation.type])

    const updateListOfSelectedInvestments = () => {
        let listSI = [];
        if (formValues.assetAllocation && formValues.assetAllocation.type == "fixed") {
            listSI = Object.entries(formValues.assetAllocation.fixedPercentages).map(([key, value]) => ({
                name: getInvesmentTypeById(key),
                description: "Allocation: " + value + "%"
            }));
        } else {
            listSI = Object.entries(formValues.assetAllocation.initialPercentages).map(([key, value]) => ({
                name: getInvesmentTypeById(key),
                description: "Initial Allocation: " + value + "%\t\tFinal Allocation: " 
                + formValues.assetAllocation.finalPercentages[key] +"%"
            }));
        }
        setListOfSelectedInvestments(listSI);
    }

    const getValidInvestments = () => { return currInvestments.filter((item) => item.accountTaxStatus != "pre-tax") };
    // console.log(validInvestments);
    const [validInvestments, setValidInvestments] = useState(getValidInvestments);
    const [newInvestment, setNewInvestment] = useState({
        id: "",
        fixed: '',
        initial: '',
        final: '',
    });
    const handleNewInvestmentChange = (field, value) => {
        setNewInvestment((prev) => {
            return { ...prev, [field]: value, };
        });
    };

    const handleAddInvestment = () => {
        if (!newInvestment.id || (formValues.assetAllocation.type == "fixed" && newInvestment.fixed === '') 
        || ( formValues.assetAllocation.type == "glidePath" && newInvestment.initial === '' && newInvestment.final === '')) {
            alert("Please select an investment and enter a valid allocation percentage.");
            return;
        }
        setValidInvestments(validInvestments.filter((item) => item._id != newInvestment.id));

        let newAllocation = {}
        if (formValues.assetAllocation.type == "fixed") {
            newAllocation = formValues.assetAllocation.fixedPercentages[newInvestment.id] = newInvestment.fixed;
        } else {
            newAllocation = { ...formValues.assetAllocation.initialPercentages, [newInvestment.id]: newInvestment.initial };
            newAllocation = formValues.assetAllocation.finialPercentages[newInvestment.id] = newInvestment.final;
        }

        
        const handleAddKey = () => {
            // Create a new object by copying the old state and adding the new key
            const updatedForm = { ...formValues.assetAllocation.initialPercentages, [newInvestment.id]: newInvestment.initial };
            handleInputChange("",updatedForm);
        };
  

        // Ensure investment is not already in selectedInvestments
        // const investmentExists = selectedInvestments.some(
        //     (investment) => investment.investmentTypeName === newInvestment.investmentTypeName
        // );

        // if (!investmentExists) {
        //     setSelectedInvestments([...selectedInvestments, { ...newInvestment }]);
    
        //     // Reset input fields after adding
        //     setNewInvestment({
        //         id: "",
        //         fixed: '',
        //         initial: '',
        //         final: '',
        //     });
        // } else {
        //     alert("Investment already added!");
        // }
    };

    const handleRemoveInvestment = (index) => {
        // setSelectedInvestments((prevInvestments) => prevInvestments.filter((_, i) => i !== index));
    };    

    // const availableInvestments = allInvestments.filter(
    //     (investment) => !selectedInvestments.some((sel) => sel.investmentTypeName === investment.investmentTypeName)
    // );    
    
    
    const InvestList = ({ list, handleRemoveInvestment }) => {
        return (
            <List>
                {list.map((item, index) => (
                    <ListItem
                        key={`${item.investmentTypeName}-${index}`}
                        sx={{
                            backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
                            "&:hover": { backgroundColor: "#B0B0B0" },
                        }}
                    >
                        <ListItemText
                            primary={<span style={{ fontWeight: "bold" }}>{item.investmentTypeName}</span>}
                            secondary={`Initial: ${item.initial}, Final: ${item.final}`}
                        />
    
                        {/* Delete Button */}
                        <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleRemoveInvestment(index)}
                        >
                            <DeleteIcon color="grey" />
                        </IconButton>
                    </ListItem>
                ))}
            </List>
        );
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewInvestment((prev) => ({
          ...prev,
          [name]: value,
        }));
    };

    return (
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navbar currentPage={''} />
        <Container>

            {/* Stack for title and save button */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
            <Typography variant="h2" component="h1" sx={titleStyles}>
                Invest
            </Typography>
            <Button variant="contained" color="secondary" sx={buttonStyles}>
                Save
            </Button>
            </Stack>

            <PageHeader />

            <Box sx={rowBoxStyles}>
                {/* First Column - Input Fields */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, width: 400 }}>
                    <CustomInput 
                        title="Event name" 
                        value={formValues.eventSeriesName} 
                        setValue={(value) => handleInputChange("eventSeriesName", value)} 
                    />

                    <CustomInput 
                        title="Description (Optional)" 
                        type="multiline" 
                        value={formValues.eventSeriesDescription} 
                        setValue={(value) => handleInputChange("eventSeriesDescription", value)} 
                    />
                     <CustomInput
                        title="Maximum Cash"
                        type="number"
                        adornment="$"
                        value={formValues.maxCash}
                        setValue={(value) => handleInputChange("eventSeriesDescription", value)}
                    /> 

                    <Stack direction="row" spacing={1} alignItems="start">
                        <CustomToggle
                            title="Start Year"
                            labels={['Fixed', 'Normal', 'Uniform']}
                            values={['fixedAmt', 'normal', 'uniform']}
                            value={formValues.startYear.type}
                            setValue={(value) => handleInputChange("startYear.type", value)}
                        />

                        {formValues.startYear.type === "fixedAmt" && (
                            <Stack direction="row" spacing={1} alignItems="start">
                                <CustomInput 
                                    title="Value"
                                    type="number"
                                    value={formValues.startYear.value}
                                    setValue={(value) => handleInputChange("startYear.value", value)}
                                />
                            </Stack>
                        )}
                        {formValues.startYear.type === "normal" && (
                            <Stack direction="row" spacing={1} alignItems="start">
                                <CustomInput 
                                    title="Mean"
                                    type="number"
                                    value={formValues.startYear.mean}
                                    setValue={(value) => handleInputChange("startYear.mean", value)}
                                />
                                <CustomInput 
                                    title="Standard Deviation"
                                    type="number"
                                    value={formValues.startYear.stdDev}
                                    setValue={(value) => handleInputChange("startYear.stdDev", value)}
                                />
                            </Stack>
                        )}
                        {formValues.startYear.type === "uniform" && (
                            <Stack direction="row" spacing={1} alignItems="start">
                                <CustomInput 
                                    title="Min"
                                    type="number"
                                    value={formValues.startYear.min}
                                    setValue={(value) => handleInputChange("startYear.min", value)}
                                />
                                <CustomInput 
                                    title="Max"
                                    type="number"
                                    value={formValues.startYear.max}
                                    setValue={(value) => handleInputChange("startYear.max", value)}
                                />
                            </Stack>
                        )}
                    </Stack>
                   
                    {/* Input Fields Below in Columns */}
                    <Stack direction="row" spacing={1} alignItems="start">
                        <CustomToggle
                            title="Duration"
                            labels={['Fixed', 'Normal', 'Uniform']}
                            values={['fixedAmt', 'normal', 'uniform']}
                            width={100}
                            value={formValues.duration.type}
                            setValue={(value) => handleInputChange("duration.type", value)}
                        />

                        {formValues.duration.type === "fixedAmt" && (
                            <Stack direction="row" spacing={1} alignItems="start">
                            <CustomInput 
                                title="Value"
                                type="number"
                                value={formValues.duration.value}
                                setValue={(value) => handleInputChange("duration.value", value)}
                            />
                            </Stack>
                        )}

                        {formValues.duration.type === "normal" && (
                            <Stack direction="row" spacing={1} alignItems="start">
                                <CustomInput 
                                    title="Mean"
                                    type="number"
                                    value={formValues.duration.mean}
                                    setValue={(value) => handleInputChange("duration.mean", value)}
                                />
                                <CustomInput 
                                    title="Standard Deviation"
                                    type="number"
                                    value={formValues.duration.stdDev}
                                    setValue={(value) => handleInputChange("duration.stdDev", value)}
                                />
                            </Stack>
                        )}

                        {formValues.duration.type === "uniform" && (
                            <Stack direction="row" spacing={1} alignItems="start">
                                <CustomInput 
                                    title="Min"
                                    type="number"
                                    value={formValues.duration.min}
                                    setValue={(value) => handleInputChange("duration.min", value)}
                                />
                                <CustomInput 
                                    title="Max"
                                    type="number"
                                    value={formValues.duration.max}
                                    setValue={(value) => handleInputChange("duration.max", value)}
                                />
                            </Stack>
                        )}
                    </Stack>

                    <Typography variant="h6" sx={{ fontWeight: 'bold', marginTop: 2, marginBottom: 1 }}>
                        Add Asset Allocation
                    </Typography>
                    <Box sx={rowBoxStyles}>
                        <Box>
                            <CustomDropdown
                                label="Investment Name"
                                value={newInvestment.id}
                                menuLabels={newInvestment.id}
                                menuItems={newInvestment.id}
                                setValue={(value) => handleNewInvestmentChange("newInvestment.id", value)}
                                textFieldStyles={textFieldStyles}
                            />
                        </Box>
                        {/* Toggle Button for Glide Path / Fixed Percentage */}
                        <Box>
                            <CustomToggle
                                title="Allocation Type"
                                labels={['Glide Path', 'Fixed']}
                                values={['glidePath', 'fixed']}
                                value={formValues.assetAllocation.type}
                                setValue={(value) => handleInputChange("assetAllocation.type", value)}
                            />
                        </Box>
                    </Box>

                    <Box sx={{mt: -4}}>
                        {/* Show Initial & Final Fields if Glide Path is selected */}
                        {formValues.assetAllocation.type === "glidePath" && (
                            <Stack direction="row" spacing={2}>
                                <CustomInput
                                    title="Initial Allocation"
                                    type="number"
                                    value={newInvestment.initial}
                                    adornment={"%"}
                                    setValue={(value) => handleNewInvestmentChange("newInvestment.initial", value)}
                                    inputProps={{ min: 0 }}
                                />

                                <CustomInput
                                    title="Final Allocation"
                                    type="number"
                                    value={newInvestment.final}
                                    adornment={"%"}
                                    setValue={(value) => handleNewInvestmentChange("newInvestment.final", value)}
                                    inputProps={{ min: 0 }}
                                />
                            </Stack>
                        )}

                        {/* Show only Initial Field if Fixed Percentage is selected */}
                        {formValues.assetAllocation.type === "fixed" && (
                            <CustomInput
                                title="Fixed Allocation"
                                type="number"
                                value={newInvestment.fixed}
                                adornment={"%"}
                                setValue={(value) => handleNewInvestmentChange("newInvestment.fixed", value)}
                                inputProps={{ min: 0 }}
                            />
                        )}
                    </Box>

                    <Box sx={{ marginTop: 1, display: "flex", justifyContent: "flex-start" }}>
                        <Button 
                            variant="contained" 
                            color="primary"
                            sx={{ fontSize: '1.1rem', textTransform: 'none' }}
                            onClick={handleAddInvestment}
                        >
                            Add
                        </Button>
                    </Box>
                </Box>

                {/* Second Column - Investment List */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Taxable</Typography>
                    <InvestList list={newInvestment} handleRemoveInvestment={handleRemoveInvestment}/>
                </Box>
            </Box>
           

            {/* Back and Continue buttons */}
            <Box sx={backContinueContainerStyles}>
            <Button variant="contained" color="primary" sx={buttonStyles}
                onClick={() => navigate("/scenario/event_series")}
            >
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

export default Invest;