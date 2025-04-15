import axios from "axios";
import { ObjectId } from "bson";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, List, ListItem, ListItemText, IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete"; 

import EventSeries from "./eventSeries";
import CustomDropdown from "../../../components/customDropDown"; 
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import {
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, backContinueContainerStyles,
} from "../../../components/styles";

import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";

const mongoose = require("mongoose");
const DEFAULT_FORM_VALUES = {
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
        refer: "",
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

const Invest = () => {
    const {editMode, eventEditMode, setEventEditMode, currInvest, setCurrInvest, currInvestments, currInvestmentTypes, setCurrScenario} = useContext(AppContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const investmentTypeMap = useMemo(() =>
        Object.fromEntries(currInvestmentTypes.map(i => [i._id, i])), [currInvestmentTypes]);
    const investmentMap = useMemo(() =>
        Object.fromEntries(currInvestments.map(i => [i._id, i])), [currInvestments]);

    const getInvestmentTypeById = (id) => investmentTypeMap[id] || { _id: "NULL", name: "Unknown Type" };    
    const getInvestmentById = (id) => investmentMap[id] || { _id: "NULL", name: "Unknown Type" };
    const getInvestById = (id) => {
        if (!id || id === "new") { return DEFAULT_FORM_VALUES; }
        for (let i = 0; i < currInvest.length; i++) {
            if (currInvest[i]._id === id) {
                if (currInvest[i].assetAllocation) { // Has assest allocations
                    return currInvest[i]; // Return the found scenario
                }
                const invest = {...currInvest[i], "assetAllocation" : {
                    type: "fixed", fixedPercentages: {}, initialPercentages: {}, finalPercentages: {},
                }};
                return invest;
            }
        }
        return DEFAULT_FORM_VALUES;
    };

    const allowedInvestments = currInvestments
        .filter((item) => getInvestmentTypeById(item.investmentType).name !== "Cash")
        .filter((item) => item.accountTaxStatus !== "pre-tax");

    const computeAssestAllocatedAccounts = () => {
        const setIds = formValues.assetAllocation.type === "fixed" 
        ?  Object.keys(formValues.assetAllocation.fixedPercentages)
        :  Object.keys(formValues.assetAllocation.initialPercentages);

        if (Object.keys(setIds).length === 0) return [];

        let AAAlist = [];
        setIds.forEach((investmentId) => {
            const description = formValues.assetAllocation.type === "fixed"
                ? `Allocation: ${formValues.assetAllocation.fixedPercentages[investmentId]}%`
                : `Initial: ${formValues.assetAllocation.initialPercentages[investmentId]}%\t\tFinal: ${formValues.assetAllocation.finalPercentages[investmentId]}%`;
            
            AAAlist.push({
                id: investmentId,
                name: getInvestmentTypeById(getInvestmentById(investmentId).investmentType).name,
                description
            });
        });
        return AAAlist;
    };
    const getValidInvestments = () => {
        const setIds = formValues.assetAllocation.type === "fixed" 
            ?  Object.keys(formValues.assetAllocation.fixedPercentages)
            :  Object.keys(formValues.assetAllocation.initialPercentages);
        
        return allowedInvestments.filter((item) => !setIds.includes(item._id));
    };
    
    const [formValues, setFormValues] = useState(getInvestById(eventEditMode ? eventEditMode.id : "new"));
    const [AAAList, setAAAList] = useState(computeAssestAllocatedAccounts);
    const [validInvestments, setValidInvestments] = useState(getValidInvestments);
    const [newAAA, setNewAAA] = useState({id: "", fixed: "", initial: "", final: "" });

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
    const handleNewAAAChange = (field, value) => {
        setNewAAA((prev) => {
            return { ...prev, [field]: value, };
        });
    };
    useEffect(() => {       
        setValidInvestments(getValidInvestments);
        setAAAList(computeAssestAllocatedAccounts);
    }, [formValues.assetAllocation.type]);

    const handleAddInvestment = () => {
        if (!newAAA.id || (formValues.assetAllocation.type == "fixed" && newAAA.fixed === "") 
        || ( formValues.assetAllocation.type == "glidePath" && newAAA.initial === "" && newAAA.final === "")) {
            alert("Please select an investment and enter a valid allocation percentage.");
            return;
        }

        setValidInvestments((prev) => prev.filter((item) => item._id !== newAAA.id));
        let newAllocation = {};

        // Adding the Assest Allocation under Invest
        if (formValues.assetAllocation.type == "fixed") {
            newAllocation = { 
                ...formValues.assetAllocation.fixedPercentages, 
                [new mongoose.Types.ObjectId(newAAA.id)]: newAAA.fixed 
            };
            handleInputChange("assetAllocation.fixedPercentages", newAllocation);
        } else {
            newAllocation = { 
                ...formValues.assetAllocation.initialPercentages, 
                [new mongoose.Types.ObjectId(newAAA.id)]: newAAA.initial 
            };
            handleInputChange("assetAllocation.initialPercentages", newAllocation);
            newAllocation = { 
                ...formValues.assetAllocation.finalPercentages, 
                [new mongoose.Types.ObjectId(newAAA.id)]: newAAA.final 
            };
            handleInputChange("assetAllocation.finalPercentages", newAllocation);
        }

        const description = formValues.assetAllocation.type === "fixed"
            ? `Allocation: ${newAAA.fixed}%`
            : `Initial: ${newAAA.initial}%\t\tFinal: ${newAAA.final}%`;
        
        setAAAList((prev) => [...prev, {
            id: newAAA.id,
            name: getInvestmentTypeById(getInvestmentById(newAAA.id).investmentType).name,
            description
        }]);
        setNewAAA({ id: "", fixed: "", initial: "", final: ""});
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
        setAAAList((prevInvestments) => prevInvestments.filter((item) => item.id !== id));
    };    
    const handleSave = async () => {
        const updatedAssetAllocation = formValues.assetAllocation.type === "fixed" 
            ? { ...formValues.assetAllocation, initialPercentages: {}, finalPercentages: {} } 
            : { ...formValues.assetAllocation, fixedPercentages: {} };
        
        const updatedFormValues = {
            ...formValues,
            assetAllocation: updatedAssetAllocation,
        };

        if (eventEditMode.id == "new") {
            let id = new ObjectId().toHexString();

            if (!user.guest) {
              const response = await axios.post(`http://localhost:8080/scenario/${editMode}/investStrategy`, updatedFormValues);
              id = response.data._id;
            }

            handleInputChange("_id", id);
            setCurrInvest((prev) => [...prev, { ...updatedFormValues, _id: id }]);
            setEventEditMode({type:"Invest", id: id});

            setCurrScenario((prevScenario) => {
                const updatedScenario = {
                    ...prevScenario,
                    investEventSeries: [...(prevScenario?.investEventSeries || []), id]
                };

                return updatedScenario;
            });
        } else {
            if (!user.guest) await axios.post(`http://localhost:8080/updateInvestStrategy/${eventEditMode.id}`, updatedFormValues);
            setCurrInvest((prev) => {
                let newList = prev.filter((item)=> item._id !== eventEditMode.id);
                return [...newList, updatedFormValues];
            });
        }
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
                    <EventSeries formValues={formValues} setFormValues={setFormValues}/>
                    
                    <CustomInput
                        title="Maximum Cash"
                        type="number"
                        adornment="$"
                        value={formValues.maxCash}
                        setValue={(value) => handleInputChange("maxCash", value)}
                        inputProps={{ min: 0 }}
                    /> 
                </Box>

                {/* Second Column - Investment List */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", marginTop: 2, marginBottom: 2 }}>
                        Add Asset Allocation
                    </Typography>
                    <Box sx={rowBoxStyles}>
                        <Box>
                            <CustomDropdown
                                label="Investment Name"
                                value={newAAA.id}
                                menuLabels={validInvestments.map((item)=>{ return getInvestmentTypeById(item.investmentType).name;})}
                                menuItems={validInvestments.map((item)=>{ return item._id;})}
                                setValue={(value) => {
                                    handleNewAAAChange("id", value);
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

                    <Box sx={{mt: -1}}>
                        {/* Show Initial & Final Fields if Glide Path is selected */}
                        {formValues.assetAllocation.type === "glidePath" && (
                            <Stack direction="row" spacing={4}>
                                <CustomInput
                                    title="Initial Allocation"
                                    type="number"
                                    value={newAAA.initial}
                                    adornment={"%"}
                                    setValue={(value) => handleNewAAAChange("initial", value)}
                                    inputProps={{ min: 0, max: 100 }}
                                />

                                <CustomInput
                                    title="Final Allocation"
                                    type="number"
                                    value={newAAA.final}
                                    adornment={"%"}
                                    setValue={(value) => handleNewAAAChange("final", value)}
                                    inputProps={{ min: 0, max: 100 }}
                                />
                            </Stack>
                        )}

                        {/* Show only Initial Field if Fixed Percentage is selected */}
                        {formValues.assetAllocation.type === "fixed" && (
                            <Stack direction="row" spacing={4}>
                                <CustomInput
                                    title="Fixed Allocation"
                                    type="number"
                                    value={newAAA.fixed}
                                    adornment={"%"}
                                    setValue={(value) => handleNewAAAChange("fixed", value)}
                                    inputProps={{ min: 0, max: 100 }}
                                />
                            </Stack>
                        )}
                    </Box>

                    <Box sx={{ mt: 5, mb: 2, display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: "bold" }}>Accounts</Typography>
                        <Button 
                            variant="contained" 
                            color="primary"
                            sx={{ textTransform: "none", mt:-1 }}
                            onClick={handleAddInvestment}
                        >
                            Add
                        </Button>
                    </Box>
                   
                    <InvestList list={AAAList} handleRemoveInvestment={handleRemoveInvestment}/>
                </Box>
            </Box>
           

            {/* Back and Continue buttons */}
            <Box sx={backContinueContainerStyles}>
            <Button variant="contained" color="primary" sx={buttonStyles}
                onClick={() => navigate("/scenario/event_series_list")}
            >
                Cancel
            </Button>

            <Button variant="contained" color="success" sx={buttonStyles} 
                onClick={()=> {
                    handleSave();
                    navigate("/scenario/event_series_list");
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