import React, { useState, useContext, useEffect } from "react";
import { ThemeProvider, CssBaseline, Container, Button, Stack, Box, Checkbox, Typography } from "@mui/material";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import {
    backContinueContainerStyles,
    buttonStyles,
    rowBoxStyles,
} from "../../../components/styles";

import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";
import EventSeries from "./eventSeries";
import axios from "axios";
import { ObjectId } from "bson";

const Expense = () => {
    // Accessing global app and auth contexts
    const { currExpense, setCurrExpense } = useContext(AppContext);
    const { eventEditMode, setEventEditMode } = useContext(AppContext);
    const { currScenario, setCurrScenario } = useContext(AppContext);
    const { editMode } = useContext(AppContext);
    const { user } = useContext(AuthContext);

    // Helper to find an expense by its ID from the current expense list
    const getExpenseById = (id) => {
        for (let i = 0; i < currExpense.length; i++) {
            if (currExpense[i]._id == id) {
                return currExpense[i];
            }
        }
        return null;
    };

    // Determine whether editing an existing expense or creating a new one
    let indieExpense = getExpenseById(eventEditMode.id);

    // Initialize the form state — prefill if editing, otherwise use default structure
    const [formValues, setFormValues] = useState(indieExpense || {
        _id: null,
        eventSeriesName: "",
        eventSeriesDescription: "",
        startYear: {
            type: "fixedAmt",
            value: "",
            mean: "",
            stdDev: "",
            min: "",
            max: "",
            refer: null,
        },
        duration: {
            type: "fixedAmt",
            value: "",
            mean: "",
            stdDev: "",
            min: "",
            max: ""
        },
        initialAmount: "",
        annualChange: {
            distribution: "none",
            type: "fixed",
            amount: "",
            mean: "",
            stdDev: "",
            min: "",
            max: "",
        },
        userPercentage: 1,
        inflationAdjustment: false,
        isDiscretionary: false
    });

    // Handles the enabling or disabling the save button
    const [disable, setDisable] = useState(true);
    useEffect(() => {
        function checkValidNum(eventValue) {
            return eventValue >= 0 && typeof eventValue === "number" && !isNaN(eventValue);
        }

        const expression = formValues.eventSeriesName 
            && (formValues.startYear.type !== "fixedAmt" 
                || checkValidNum(formValues.startYear.value))
            && (formValues.startYear.type !== "normal" 
                || (checkValidNum(formValues.startYear.mean) && checkValidNum(formValues.startYear.stdDev)))
            && (formValues.startYear.type !== "uniform" 
                || (checkValidNum(formValues.startYear.min) && checkValidNum(formValues.startYear.max) 
                && formValues.startYear.min <= formValues.startYear.max))
            && ((formValues.startYear.type !== "same" && formValues.startYear.type !== "after") 
                || (formValues.startYear.refer))
            && (formValues.duration.type !== "fixedAmt" 
                || checkValidNum(formValues.duration.value))
            && (formValues.duration.type !== "normal" 
                || (checkValidNum(formValues.duration.mean) && checkValidNum(formValues.duration.stdDev)))
            && (formValues.duration.type !== "uniform" 
                || (checkValidNum(formValues.duration.min) && checkValidNum(formValues.duration.max) 
                && formValues.duration.min <= formValues.duration.max))
            && checkValidNum(formValues.initialAmount)
            && (currScenario.filingStatus !== "married" 
                || checkValidNum(formValues.userPercentage))
            && (formValues.annualChange.distribution !== "none" 
                || checkValidNum(formValues.annualChange.amount))
            && (formValues.annualChange.distribution !== "normal" 
                || (checkValidNum(formValues.annualChange.mean) && checkValidNum(formValues.annualChange.stdDev)))
            && (formValues.annualChange.distribution !== "uniform" 
                || (checkValidNum(formValues.annualChange.min) && checkValidNum(formValues.annualChange.max) 
                && formValues.annualChange.min <= formValues.annualChange.max));
        
        setDisable(expression ? false : true);
    }, [formValues]);

    // Utility for updating nested or top-level form fields
    const handleInputChange = (field, value) => {
        const fieldParts = field.split(".");
        setFormValues((prev) => {
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

    // useEffect(() => {
    //     // Helpful for debugging edit mode state
    //     console.log("Updated eventEditMode:", eventEditMode);
    // }, [eventEditMode]);

    // Handles saving new or updated expense data
    const handleSave = async () => {
        if (eventEditMode.id === "new") {
            // Creating new expense
            let id = new ObjectId().toHexString();

            // Persist to backend if not in guest mode
            if (!user.guest) {
                const response = await axios.post(`http://localhost:8080/scenario/${editMode}/expenseEvent`, formValues);
                id = response.data._id;
            }

            // Update local state with newly generated ID
            handleInputChange("_id", id);
            setCurrExpense((prev) => [...prev, { ...formValues, _id: id }]);
            setEventEditMode({ type: "Expense", id });

            // Append new expense to the current scenario
            setCurrScenario((prevScenario) => {
                const updatedScenario = {
                    ...prevScenario,
                    expenseEventSeries: [...(prevScenario?.expenseEventSeries || []), id],
                    spendingStrategy: [...(prevScenario?.spendingStrategy || []), id]
                };
                return updatedScenario;
            });
        } else {
            // Updating an existing expense
            if (!user.guest) await axios.post(`http://localhost:8080/updateExpense/${eventEditMode.id}`, formValues);
            // Replace old version with updated version in state
            setCurrExpense((prev) => {
                let newList = prev.filter((item) => item._id !== eventEditMode.id);
                return [...newList, formValues];
            });
        }
    };

    const navigate = useNavigate();

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={""} />
            <Container>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ marginTop: 6, marginBottom: 2 }}>
                    <Typography variant="h2" component="h1" sx={{ fontWeight: "bold" }}>
                        Expense
                    </Typography>
                    <Button variant="contained" color="secondary" sx={{ fontSize: "1.25rem", textTransform: "none" }} onClick={handleSave}>
                        Save
                    </Button>
                </Stack>

                <PageHeader />

                <Box sx={rowBoxStyles}>
                    {/* Left column for event metadata */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 400 }}>
                        <EventSeries formValues={formValues} setFormValues={setFormValues} />
                    </Box>

                    {/* Right column for financial details */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", width: 300 }}>
                        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                            <CustomInput 
                                title="Initial Expense Amount"
                                type="number"
                                adornment="$"
                                value={formValues.initialAmount}
                                setValue={(value) => handleInputChange("initialAmount", value)}
                                inputProps={{ min: 0 }}
                            />
                            {currScenario.filingStatus === "married" && 
                                <CustomInput 
                                    title="User's Contribution"
                                    type="number"
                                    adornment="%"
                                    value={formValues.userPercentage}
                                    setValue={(value) => handleInputChange("userPercentage", value)}
                                    inputProps={{ min: 0, max: 100 }}
                                />
                            }
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2} sx={{ marginTop: 4, mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: "medium", width: 150 }}>
                                Inflation Adjustment
                            </Typography>
                            <Checkbox
                                checked={formValues.inflationAdjustment}
                                onChange={(value) => handleInputChange("inflationAdjustment", value.target.checked)}
                            />
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                            <Typography variant="body1" sx={{ fontWeight: "medium", width: 150 }}>
                                Discretionary
                            </Typography>
                            <Checkbox
                                checked={formValues.isDiscretionary}
                                onChange={(value) => handleInputChange("isDiscretionary", value.target.checked)}
                            />
                        </Stack>

                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "bold" }}>
                            Expected Annual Change:
                        </Typography>

                        <CustomToggle
                            title="Distribution"
                            labels={["None", "Normal", "Uniform"]}
                            values={["none", "normal", "uniform"]}
                            sideView={true}
                            width={100}
                            value={formValues.annualChange.distribution}
                            setValue={(value) => handleInputChange("annualChange.distribution", value)}
                        />

                        <CustomToggle
                            title="Rate/Unit"
                            labels={["Fixed", "Percentage"]}
                            values={["fixed", "percentage"]}
                            sideView={true}
                            width={100}
                            value={formValues.annualChange.type}
                            setValue={(value) => handleInputChange("annualChange.type", value)}
                        />

                        {/* Conditional inputs based on distribution type */}
                        {formValues.annualChange.distribution === "none" && (
                            <CustomInput 
                                title="Value"
                                type="number"
                                adornment={formValues.annualChange.type === "percentage" ? "%" : "$"}
                                value={formValues.annualChange.amount}
                                setValue={(value) => handleInputChange("annualChange.amount", value)}
                                inputProps={{ min: 0 }}
                            />
                        )}

                        {formValues.annualChange.distribution === "normal" && (
                            <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                                <CustomInput 
                                    title="Mean"
                                    type="number"
                                    adornment={formValues.annualChange.type === "percentage" ? "%" : "$"}
                                    value={formValues.annualChange.mean}
                                    setValue={(value) => handleInputChange("annualChange.mean", value)}
                                    inputProps={{ min: 0 }}
                                />
                                <CustomInput 
                                    title="Standard Deviation"
                                    type="number"
                                    adornment={formValues.annualChange.type === "percentage" ? "%" : "$"}
                                    value={formValues.annualChange.stdDev}
                                    setValue={(value) => handleInputChange("annualChange.stdDev", value)}
                                    inputProps={{ min: 0 }}
                                />
                            </Stack>
                        )}

                        {formValues.annualChange.distribution === "uniform" && (
                            <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                                <CustomInput 
                                    title="Min"
                                    type="number"
                                    adornment={formValues.annualChange.type === "percentage" ? "%" : "$"}
                                    value={formValues.annualChange.min}
                                    setValue={(value) => handleInputChange("annualChange.min", value)}
                                    inputProps={{ min: 0 }}
                                />
                                <CustomInput 
                                    title="Max"
                                    type="number"
                                    adornment={formValues.annualChange.type === "percentage" ? "%" : "$"}
                                    value={formValues.annualChange.max}
                                    setValue={(value) => handleInputChange("annualChange.max", value)}
                                    inputProps={{ min: 0 }}
                                />
                            </Stack>
                        )}
                    </Box>
                </Box>

                <Box sx={backContinueContainerStyles}>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={buttonStyles}
                        onClick={() => navigate("/scenario/event_series_list")}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        sx={buttonStyles}
                        onClick={() => {
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

export default Expense;
