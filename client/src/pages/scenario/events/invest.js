// External library imports
import axios from "axios";
import { ObjectId } from "bson";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// MUI Components
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, List, ListItem, ListItemText, IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete"; 

// Custom component imports
import EventSeries from "./eventSeries";
import CustomDropdown from "../../../components/customDropDown"; 
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";

// Style imports
import {
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, backContinueContainerStyles,
} from "../../../components/styles";

// Contexts
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";

// Utilities
const mongoose = require("mongoose");

// Default state structure for a new investment event
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
    // Contexts
    const { editMode, eventEditMode, setEventEditMode, currInvest, setCurrInvest, currInvestments, currInvestmentTypes, setCurrScenario } = useContext(AppContext);
    const { user } = useContext(AuthContext);

    const navigate = useNavigate();

    // Memoized maps for faster lookup
    const investmentTypeMap = useMemo(() => (
        Object.fromEntries(currInvestmentTypes.map(i => [i._id, i]))
    ), [currInvestmentTypes]);

    const investmentMap = useMemo(() => (
        Object.fromEntries(currInvestments.map(i => [i._id, i]))
    ), [currInvestments]);

    // Utility functions to retrieve investment and investment types
    const getInvestmentTypeById = (id) => investmentTypeMap[id] || { _id: "NULL", name: "Unknown Type" };
    const getInvestmentById = (id) => investmentMap[id] || { _id: "NULL", name: "Unknown Type" };

    // Finds investment object by id or returns default if new
    const getInvestById = (id) => {
        if (!id || id === "new") return DEFAULT_FORM_VALUES;

        for (let i = 0; i < currInvest.length; i++) {
            if (currInvest[i]._id === id) {
                if (currInvest[i].assetAllocation) return currInvest[i];

                // Backward compatibility for investments missing asset allocation field
                return {
                    ...currInvest[i],
                    assetAllocation: {
                        type: "fixed",
                        fixedPercentages: {},
                        initialPercentages: {},
                        finalPercentages: {},
                    }
                };
            }
        }
        return DEFAULT_FORM_VALUES;
    };

    // Filters investments that are allowed (excluding 'Cash' or 'pre-tax')
    const allowedInvestments = currInvestments
        .filter((item) => getInvestmentTypeById(item.investmentType).name !== "Cash")
        .filter((item) => item.accountTaxStatus !== "pre-tax");

    // Computes the list of currently allocated investments for display
    const computeAssestAllocatedAccounts = () => {
        const setIds = formValues.assetAllocation.type === "fixed" 
            ? Object.keys(formValues.assetAllocation.fixedPercentages)
            : Object.keys(formValues.assetAllocation.initialPercentages);

        if (setIds.length === 0) return [];

        return setIds.map((investmentId) => {
            const description = formValues.assetAllocation.type === "fixed"
                ? `Allocation: ${formValues.assetAllocation.fixedPercentages[investmentId]}%`
                : `Initial: ${formValues.assetAllocation.initialPercentages[investmentId]}%\t\tFinal: ${formValues.assetAllocation.finalPercentages[investmentId]}%`;

            return {
                id: investmentId,
                name: getInvestmentTypeById(getInvestmentById(investmentId).investmentType).name,
                description
            };
        });
    };

    // Returns list of valid investments not yet added to allocation
    const getValidInvestments = () => {
        const setIds = formValues.assetAllocation.type === "fixed"
            ? Object.keys(formValues.assetAllocation.fixedPercentages)
            : Object.keys(formValues.assetAllocation.initialPercentages);

        return allowedInvestments.filter((item) => !setIds.includes(item._id));
    };

    // State hooks
    const [formValues, setFormValues] = useState(getInvestById(eventEditMode ? eventEditMode.id : "new"));
    const [AAAList, setAAAList] = useState(computeAssestAllocatedAccounts);
    const [validInvestments, setValidInvestments] = useState(getValidInvestments);
    const [newAAA, setNewAAA] = useState({ id: "", fixed: "", initial: "", final: "" });
    const [disable, setDisable] = useState(true);

    // Enable Save button only if all required fields are filled correctly
    useEffect(() => {
        const expression = formValues.eventSeriesName 
            && (formValues.startYear.type !== "fixedAmt" || formValues.startYear.value)
            && (formValues.startYear.type !== "normal" || (formValues.startYear.mean && formValues.startYear.stdDev))
            && (formValues.startYear.type !== "uniform" || (formValues.startYear.min && formValues.startYear.max))
            && (["same", "after"].includes(formValues.startYear.type) ? formValues.startYear.refer : true)
            && (formValues.duration.type !== "fixedAmt" || formValues.duration.value)
            && (formValues.duration.type !== "normal" || (formValues.duration.mean && formValues.duration.stdDev))
            && (formValues.duration.type !== "uniform" || (formValues.duration.min && formValues.duration.max))
            && (formValues.assetAllocation.type === "fixed" ? Object.keys(formValues.assetAllocation.fixedPercentages).length > 0 : true)
            && (formValues.assetAllocation.type === "glidePath" ? Object.keys(formValues.assetAllocation.initialPercentages).length > 0 : true);

        setDisable(!expression);
    }, [formValues]);

    // Handles form field changes (nested and flat)
    const handleInputChange = (field, value) => {
        const fieldParts = field.split(".");
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
                const [parent, child] = fieldParts;
                return {
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: value,
                    },
                };
            }
            return {
                ...prev,
                [field]: value,
            };
        });
    };

    // Handles changes for new investment being added
    const handleNewAAAChange = (field, value) => {
        setNewAAA((prev) => ({ ...prev, [field]: value }));
    };

    // Syncs list and investment options when assetAllocation.type changes
    useEffect(() => {
        setValidInvestments(getValidInvestments);
        setAAAList(computeAssestAllocatedAccounts);
    }, [formValues.assetAllocation.type]);

    // Add new investment to allocation
    const handleAddInvestment = () => {
        if (!newAAA.id || (formValues.assetAllocation.type === "fixed" && newAAA.fixed === "")
            || (formValues.assetAllocation.type === "glidePath" && newAAA.initial === "" && newAAA.final === "")) {
            alert("Please select an investment and enter a valid allocation percentage.");
            return;
        }

        setValidInvestments((prev) => prev.filter((item) => item._id !== newAAA.id));

        if (formValues.assetAllocation.type === "fixed") {
            const updated = {
                ...formValues.assetAllocation.fixedPercentages,
                [new mongoose.Types.ObjectId(newAAA.id)]: newAAA.fixed
            };
            handleInputChange("assetAllocation.fixedPercentages", updated);
        } else {
            const updatedInitial = {
                ...formValues.assetAllocation.initialPercentages,
                [new mongoose.Types.ObjectId(newAAA.id)]: newAAA.initial
            };
            const updatedFinal = {
                ...formValues.assetAllocation.finalPercentages,
                [new mongoose.Types.ObjectId(newAAA.id)]: newAAA.final
            };
            handleInputChange("assetAllocation.initialPercentages", updatedInitial);
            handleInputChange("assetAllocation.finalPercentages", updatedFinal);
        }

        const description = formValues.assetAllocation.type === "fixed"
            ? `Allocation: ${newAAA.fixed}%`
            : `Initial: ${newAAA.initial}%\t\tFinal: ${newAAA.final}%`;

        setAAAList((prev) => [...prev, {
            id: newAAA.id,
            name: getInvestmentTypeById(getInvestmentById(newAAA.id).investmentType).name,
            description
        }]);

        setNewAAA({ id: "", fixed: "", initial: "", final: "" });
    };

    // Remove an investment from allocation
    const handleRemoveInvestment = (id) => {
        if (formValues.assetAllocation.type === "fixed") {
            const { [id]: _, ...remaining } = formValues.assetAllocation.fixedPercentages;
            handleInputChange("assetAllocation.fixedPercentages", remaining);
        } else {
            const { [id]: _, ...remainingInitial } = formValues.assetAllocation.initialPercentages;
            const { [id]: __, ...remainingFinal } = formValues.assetAllocation.finalPercentages;
            handleInputChange("assetAllocation.initialPercentages", remainingInitial);
            handleInputChange("assetAllocation.finalPercentages", remainingFinal);
        }

        setValidInvestments((prev) => [...prev, getInvestmentById(id)]);
        setAAAList((prev) => prev.filter((item) => item.id !== id));
    };

    // Save investment strategy to backend or local context
    const handleSave = async () => {
        const cleanedAllocation = formValues.assetAllocation.type === "fixed"
            ? { ...formValues.assetAllocation, initialPercentages: {}, finalPercentages: {} }
            : { ...formValues.assetAllocation, fixedPercentages: {} };

        const updatedFormValues = {...formValues, assetAllocation: cleanedAllocation };

        // If new investment strategy
        if (eventEditMode.id === "new") {
            let id = new ObjectId().toHexString();

            if (!user.guest) {
                const response = await axios.post(`http://localhost:8080/scenario/${editMode}/investStrategy`, updatedFormValues);
                id = response.data._id;
            }

            handleInputChange("_id", id);
            setCurrInvest((prev) => [...prev, { ...updatedFormValues, _id: id }]);
            setEventEditMode({ type: "Invest", id });

            setCurrScenario((prevScenario) => ({
                ...prevScenario,
                investEventSeries: [...(prevScenario?.investEventSeries || []), id]
            }));
        } else {
            // Existing strategy update
            if (!user.guest) {
                await axios.post(`http://localhost:8080/updateInvestStrategy/${eventEditMode.id}`, updatedFormValues);
            }
            setCurrInvest((prev) => {
                const filtered = prev.filter((item) => item._id !== eventEditMode.id);
                return [...filtered, updatedFormValues];
            });
        }
    };

    // List component for displaying added asset allocations
    const InvestList = ({ list, handleRemoveInvestment }) => (
        <List>
            {list.map((item, index) => (
                <ListItem
                    key={item.id}
                    sx={{
                        backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
                        "&:hover": { backgroundColor: "#B0B0B0" },
                    }}
                >
                    <ListItemText primary={item.name} secondary={item.description} />
                    <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveInvestment(item.id)}>
                        <DeleteIcon color="grey" />
                    </IconButton>
                </ListItem>
            ))}
        </List>
    );

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
                    disabled={disable}
                >
                    Save & Continue
                </Button>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default Invest;