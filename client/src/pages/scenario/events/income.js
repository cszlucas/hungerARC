import React, { useState, useContext, useEffect } from "react";
import {
    ThemeProvider, CssBaseline, Container, Button, Stack, Box, Checkbox, Typography
} from "@mui/material";

import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import {
    backContinueContainerStyles,
    buttonStyles,
    rowBoxStyles
} from "../../../components/styles";

import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import EventSeries from "./eventSeries";
import { useNavigate } from "react-router-dom";

import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";

import axios from "axios";
import { ObjectId } from "bson";

const Income = () => {
    // Context values from application-wide state
    const { currIncome, setCurrIncome } = useContext(AppContext);
    const { eventEditMode, setEventEditMode } = useContext(AppContext);
    const { currScenario, setCurrScenario } = useContext(AppContext);
    const { editMode } = useContext(AppContext);
    const { user } = useContext(AuthContext);

    const navigate = useNavigate();

    // Utility function to get a specific income event by ID
    const getIncomeById = (id) => {
        for (let i = 0; i < currIncome.length; i++) {
            if (currIncome[i]._id == id) {
                return currIncome[i];
            }
        }
        return null;
    };

    // If editing an existing event, preload its values
    let indieIncome = "";
    if (eventEditMode !== "new") {
        indieIncome = getIncomeById(eventEditMode.id);
    }

    // Form state for the income event series
    const [formValues, setFormValues] = useState(indieIncome || {
        _id: null,
        eventSeriesName: "",
        description: "",
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
            max: "",
        },
        initialAmount: "",
        annualChange: {
            distribution: "none",
            type: "fixed",
            amount: "",
            mean: "",
            stdDev: "",
            min: "",
            max: ""
        },
        userPercentage: "",
        inflationAdjustment: false,
        isSocialSecurity: false
    });
    // Handles the enabling or disabling the save button
    const [disable, setDisable] = useState(true);
    useEffect(() => {
        const expression = formValues.eventSeriesName 
            && (formValues.startYear.type !== "fixedAmt" || (formValues.startYear.value))
            && (formValues.startYear.type !== "normal" || (formValues.startYear.mean && formValues.startYear.stdDev))
            && (formValues.startYear.type !== "uniform" || (formValues.startYear.min && formValues.startYear.max))
            && ((formValues.startYear.type !== "same" && formValues.startYear.type !== "after") || (formValues.startYear.refer))
            && (formValues.duration.type !== "fixedAmt" || (formValues.duration.value))
            && (formValues.duration.type !== "normal" || (formValues.duration.mean && formValues.duration.stdDev))
            && (formValues.duration.type !== "uniform" || (formValues.duration.min && formValues.duration.max))
            && formValues.initialAmount
            && (formValues.annualChange.distribution !== "none" || formValues.annualChange.amount)
            && (formValues.annualChange.distribution !== "normal" || (formValues.annualChange.mean && formValues.annualChange.stdDev))
            && (formValues.annualChange.distribution !== "uniform" || (formValues.annualChange.min && formValues.annualChange.max));

        setDisable(expression ? false : true);
    }, [formValues]);
    

    // Generic handler for updating nested or flat form fields
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

    // Save handler for creating or updating income events
    const handleSave = async () => {
        try {
            if (eventEditMode.id === "new") {
                let id;
                // Save new event to backend (if not guest user), or generate ID locally
                if (!user.guest) {
                    const response = await axios.post(`http://localhost:8080/scenario/${editMode}/incomeEvent`, formValues);
                    id = response.data._id;
                } else {
                    id = new ObjectId().toHexString();
                }

                handleInputChange("_id", id); // Update local ID
                setCurrIncome((prev) => [...prev, { ...formValues, _id: id }]);
                setEventEditMode({ type: "Income", id });

                // Link the income event to the scenario object
                setCurrScenario((prevScenario) => ({
                    ...prevScenario,
                    incomeEventSeries: [...(prevScenario?.incomeEventSeries || []), id]
                }));

            } else {
                // Updating an existing event
                if (!user.guest) await axios.post(`http://localhost:8080/updateIncome/${eventEditMode.id}`, formValues);
                setCurrIncome((prev) => {
                    const newList = prev.filter((item) => item._id !== eventEditMode.id);
                    return [...newList, formValues];
                });
            }

        } catch (error) {
            console.error("Error saving data:", error);
            alert("Failed to save data!");
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={""} />
            <Container>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ marginTop: 6, marginBottom: 2 }}>
                    <Typography variant="h2" component="h1" sx={{ fontWeight: "bold" }}>
                        Income
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ fontSize: "1.25rem", textTransform: "none" }}
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </Stack>

                <PageHeader />

                <Box sx={rowBoxStyles}>
                    {/* Column 1: General Event Info */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, width: 400 }}>
                        <EventSeries formValues={formValues} setFormValues={setFormValues} />
                    </Box>

                    {/* Column 2: Income Details */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", width: 300 }}>
                        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                            <CustomInput
                                title="Initial Income Amount"
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

                        {/* Inflation and Social Security Checkboxes */}
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ marginTop: 4, mb: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: "medium", width: 150 }}>
                                Inflation Adjustment
                            </Typography>
                            <Checkbox
                                checked={formValues.inflationAdjustment || false}
                                onChange={(e) => handleInputChange("inflationAdjustment", e.target.checked)}
                            />
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 5 }}>
                            <Typography variant="body1" sx={{ fontWeight: "medium", width: 150 }}>
                                Social Security
                            </Typography>
                            <Checkbox
                                checked={formValues.isSocialSecurity || false}
                                onChange={(e) => handleInputChange("isSocialSecurity", e.target.checked)}
                            />
                        </Stack>

                        {/* Annual Change Config */}
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "bold" }}>Expected Annual Change:</Typography>

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

                        {/* Conditional Inputs Based on Distribution */}
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
                                    title="Variance"
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

                {/* Navigation Buttons */}
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

export default Income;
