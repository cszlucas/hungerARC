import React, { useState, useContext, useEffect } from "react";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, 
  Box, List, ListItem, ListItemText, 
  IconButton,
} from "@mui/material";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import {
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, 
  backContinueContainerStyles, textFieldStyles, toggleButtonGroupStyles
} from "../../../components/styles";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete"; 
import CustomDropdown from "../../../components/customDropDown"; 
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";

import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";

import axios from "axios";

const mongoose = require("mongoose");


const Invest = () => {
    const {editMode, eventEditMode, setEventEditMode, currInvest, setCurrInvest, currInvestments, currInvestmentTypes, setCurrScenario} = useContext(AppContext);
    const navigate = useNavigate();

    const getInvesmentTypeById = (id) => {
        if (id != "new") {
            for (let i = 0; i < currInvestmentTypes.length; i++) {
                if (currInvestmentTypes[i]._id == id) {
                    return currInvestmentTypes[i]; // Return the found scenario
                }
            }
        }
        return {_id: "NULL", name: "Unknown Type"};
    };

    const getInvestmentById = (id) => {
        if (id != "") {
            for (let i = 0; i < currInvestments.length; i++) {
                if (currInvestments[i]._id == id) {
                    return currInvestments[i]; // Return the found scenario
                }
            }
        }
        return {_id: "NULL", investmentType: "NULL"};
    };

    const getInvestById = (id) => {
        if (id) {
            for (let i = 0; i < currInvest.length; i++) {
                if (currInvest[i]._id == id) {
                    if (currInvest[i].assetAllocation) {
                        return currInvest[i]; // Return the found scenario
                    }
                    
                    const invest = {...currInvest[i], "assetAllocation" : {
                        type: "fixed",
                        fixedPercentages: {}, 
                        initialPercentages: {},
                        finalPercentages: {},
                    }};
                    return invest;
                }
            }
        }

        return {
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
    
    let investId = eventEditMode ? eventEditMode.id : "new";
    let indieInvest = getInvestById(investId);
    const [formValues, setFormValues] = useState(indieInvest);
    const handleInputChange = (field, value) => {
        const fieldParts = field.split("."); // Split the field into parts (e.g., "lifeExpectancy.mean")
      
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

    const getListOfSelectedInvestments = () => {
        const setIds = formValues.assetAllocation.type === "fixed" 
        ?  Object.keys(formValues.assetAllocation.fixedPercentages)
        :  Object.keys(formValues.assetAllocation.initialPercentages);

        if (Object.keys(setIds).length === 0) {
            return [];
        }
        let listOfSI = [];
        setIds.forEach((investmentId) => {
            const description = formValues.assetAllocation.type === "fixed"
                ? `Allocation: ${formValues.assetAllocation.fixedPercentages[`${investmentId}`]}%`
                : `Initial: ${formValues.assetAllocation.initialPercentages[`${investmentId}`]}%\t\tFinal: ${formValues.assetAllocation.finalPercentages[`${investmentId}`]}%`;
            
            let investmentTypeId = getInvestmentById(investmentId).investmentType;
            
            listOfSI.push({
                id: investmentId,
                name: getInvesmentTypeById(investmentTypeId).name,
                description
            });
        });
        return listOfSI;
    };
    const [listOfSelectedInvestments, setListOfSelectedInvestments] = useState(getListOfSelectedInvestments);

    useEffect(() => {
        const resetAllocations = {
            initialPercentages: {},
            finalPercentages: {},
            fixedPercentages: {},
        };
    
        if (formValues.assetAllocation.type === "fixed") {
            handleInputChange("assetAllocation", { ...formValues.assetAllocation, ...resetAllocations, fixedPercentages: {} });
        } else {
            handleInputChange("assetAllocation", { ...formValues.assetAllocation, ...resetAllocations, initialPercentages: {}, finalPercentages: {} });
        }
        setValidInvestments(getValidInvestments);
        setListOfSelectedInvestments(getListOfSelectedInvestments);
    }, [formValues.assetAllocation.type]);

    const getValidInvestments = () => {
        const setIds = formValues.assetAllocation.type === "fixed" 
            ?  Object.keys(formValues.assetAllocation.fixedPercentages)
            :  Object.keys(formValues.assetAllocation.initialPercentages);
        
        // console.log(currInvestments);
        if (Object.keys(setIds).length === 0) {
            return currInvestments.filter((item) => item.accountTaxStatus !== "pre-tax");
        }
        
        return currInvestments
            .filter((item) => item.accountTaxStatus !== "pre-tax")
            .filter((item) => !setIds.includes(item._id));
    };
    const [validInvestments, setValidInvestments] = useState(getValidInvestments);
    console.log(validInvestments);
    console.log(validInvestments.map((item)=>{ return item._id;}));

    const [newInvestment, setNewInvestment] = useState({id: "", fixed: "", initial: "", final: "" });
    const handleNewInvestmentChange = (field, value) => {
        setNewInvestment((prev) => {
            return { ...prev, [field]: value, };
        });
    };

    const handleAddInvestment = () => {
        if (!newInvestment.id || (formValues.assetAllocation.type == "fixed" && newInvestment.fixed === "") 
        || ( formValues.assetAllocation.type == "glidePath" && newInvestment.initial === "" && newInvestment.final === "")) {
            alert("Please select an investment and enter a valid allocation percentage.");
            return;
        }
        setValidInvestments((prev) => prev.filter((item) => item._id !== newInvestment.id));
        let newAllocation = {};

        // Adding the Assest Allocation under Invest
        if (formValues.assetAllocation.type == "fixed") {
            newAllocation = { 
                ...formValues.assetAllocation.fixedPercentages, 
                [new mongoose.Types.ObjectId(newInvestment.id)]: newInvestment.fixed 
            };
            handleInputChange("assetAllocation.fixedPercentages", newAllocation);
        } else {
            newAllocation = { 
                ...formValues.assetAllocation.initialPercentages, 
                [new mongoose.Types.ObjectId(newInvestment.id)]: newInvestment.initial 
            };
            handleInputChange("assetAllocation.initialPercentages", newAllocation);
            newAllocation = { 
                ...formValues.assetAllocation.finalPercentages, 
                [new mongoose.Types.ObjectId(newInvestment.id)]: newInvestment.final 
            };
            handleInputChange("assetAllocation.finalPercentages", newAllocation);
        }

        const description = formValues.assetAllocation.type === "fixed"
            ? `Allocation: ${newInvestment.fixed}%`
            : `Initial: ${newInvestment.initial}%\t\tFinal: ${newInvestment.final}%`;
        
        let investmentTypeId = getInvestmentById(newInvestment.id).investmentType;
        
        setListOfSelectedInvestments((prev) => [...prev, {
            id: newInvestment.id,
            name: getInvesmentTypeById(investmentTypeId).name,
            description
        }]);
        setNewInvestment({ id: "", fixed: "", initial: "", final: ""});
    };

    const handleRemoveInvestment = (id) => {
        if (formValues.assetAllocation.type === "fixed") {
            const { [id]: discardFixed, ...updatedFixedAlloc } = formValues.assetAllocation.fixedPercentages;
            handleInputChange("assetAllocation.fixedPercentages", updatedFixedAlloc);
        } else {
            const { [id]: discardInitial, ...updatedInitialAlloc } = formValues.assetAllocation.initialPercentages;
            handleInputChange("assetAllocation.initialPercentages", updatedInitialAlloc);
    
            const { [id]: discardFinal, ...updatedFinalAlloc } = formValues.assetAllocation.finalPercentages;
            handleInputChange("assetAllocation.finalPercentages", updatedFinalAlloc);
        }
        setValidInvestments((prev) => [...prev, getInvestmentById(id)]);
        setListOfSelectedInvestments((prevInvestments) => prevInvestments.filter((item) => item.id !== id));
    };    
     
    const InvestList = ({ list, handleRemoveInvestment }) => {
        return (
            <List>
                {list.map((item, index) => (
                    <ListItem
                        key={item.id}
                        sx={{
                            backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
                            "&:hover": { backgroundColor: "#B0B0B0" },
                        }}
                    >
                        <ListItemText
                            primary={item.name}
                            secondary={item.description}
                        />
    
                        {/* Delete Button */}
                        <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleRemoveInvestment(item.id)}
                        >
                            <DeleteIcon color="grey" />
                        </IconButton>
                    </ListItem>
                ))}
            </List>
        );
    };

    const handleSave = async () => {
        if (eventEditMode.id == "new") {
            // console.log("VV Sending to backend VV")
            // console.log(formValues);
            let response = await axios.post("http://localhost:8080/investStrategy", formValues);
            // console.log()
            let id = response.data._id;

            // console.log('Event Id')
            // console.log(id);
            handleInputChange("_id", id);
            setCurrInvest((prev) => [...prev, { ...formValues, _id: id }]);
            setEventEditMode({type:"Invest", id: id});
            // console.log()

            setCurrScenario((prevScenario) => {
                const updatedScenario = {
                    ...prevScenario,
                    investEventSeries: [...(prevScenario?.investEventSeries || []), id]
                };

                // Send POST request with the updated scenario after state update
                axios.post(`http://localhost:8080/updateScenario/${editMode}`, updatedScenario)
                    .then(() => console.log("Scenario updated successfully"))
                    .catch((error) => console.error("Error updating scenario:", error));

                return updatedScenario;
            });
        } else {
            let response = await axios.post(`http://localhost:8080/updateInvestStrategy/${eventEditMode.id}`, formValues);
            setCurrInvest((prev) => {
                let newList = prev.filter((item)=> item._id !== eventEditMode.id);
                return [...newList, formValues];
            });
            // console.log(response);
        }
    };

    return (
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navbar currentPage={""} />
        <Container>

            {/* Stack for title and save button */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
            <Typography variant="h2" component="h1" sx={titleStyles}>
                Invest
            </Typography>
            <Button variant="contained" color="secondary" sx={buttonStyles} onClick={handleSave}>
                Save
            </Button>
            </Stack>

            <PageHeader />

            <Box sx={rowBoxStyles}>
                {/* First Column - Input Fields */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, width: 400 }}>
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
                        setValue={(value) => handleInputChange("maxCash", value)}
                        inputProps={{ min: 0 }}
                    /> 

                    <Stack direction="row" spacing={1} alignItems="start">
                        <CustomToggle
                            title="Start Year"
                            labels={["Fixed", "Normal", "Uniform"]}
                            values={["fixedAmt", "normal", "uniform"]}
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
                            labels={["Fixed", "Normal", "Uniform"]}
                            values={["fixedAmt", "normal", "uniform"]}
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

                    <Typography variant="h6" sx={{ fontWeight: "bold", marginTop: 2, marginBottom: 1 }}>
                        Add Asset Allocation
                    </Typography>
                    <Box sx={rowBoxStyles}>
                        <Box>
                            <CustomDropdown
                                label="Investment Name"
                                value={newInvestment.id}
                                menuLabels={validInvestments.map((item)=>{ return getInvesmentTypeById(item.investmentType).name;})}
                                menuItems={validInvestments.map((item)=>{ return item._id;})}
                                setValue={(value) => {
                                    handleNewInvestmentChange("id", value);
                                }}
                            />
                        </Box>
                        {/* Toggle Button for Glide Path / Fixed Percentage */}
                        <Box>
                            <CustomToggle
                                title="Allocation Type"
                                labels={["Glide Path", "Fixed"]}
                                values={["glidePath", "fixed"]}
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
                                    setValue={(value) => handleNewInvestmentChange("initial", value)}
                                    inputProps={{ min: 0, max: 100 }}
                                />

                                <CustomInput
                                    title="Final Allocation"
                                    type="number"
                                    value={newInvestment.final}
                                    adornment={"%"}
                                    setValue={(value) => handleNewInvestmentChange("final", value)}
                                    inputProps={{ min: 0, max: 100 }}
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
                                setValue={(value) => handleNewInvestmentChange("fixed", value)}
                                inputProps={{ min: 0, max: 100 }}
                            />
                        )}
                    </Box>

                    <Box sx={{ marginTop: 1, display: "flex", justifyContent: "flex-start" }}>
                        <Button 
                            variant="contained" 
                            color="primary"
                            sx={{ fontSize: "1.1rem", textTransform: "none" }}
                            onClick={handleAddInvestment}
                        >
                            Add
                        </Button>
                    </Box>
                </Box>

                {/* Second Column - Investment List */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>Taxable</Typography>
                    <InvestList list={listOfSelectedInvestments} handleRemoveInvestment={handleRemoveInvestment}/>
                </Box>
            </Box>
           

            {/* Back and Continue buttons */}
            <Box sx={backContinueContainerStyles}>
            <Button variant="contained" color="primary" sx={buttonStyles}
                onClick={() => navigate("/scenario/event_series")}
            >
                Cancel
            </Button>

            <Button variant="contained" color="success" sx={buttonStyles} 
                onClick={()=> {
                    handleSave();
                    navigate("/scenario/event_series");
                }}
            >
                Save & Continue
            </Button>
            </Box>
        </Container>
        </ThemeProvider>
    );
};

export default Invest;