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

const Expense = () => {
    const {currExpense, setCurrExpense} = useContext(AppContext);
    const {eventEditMode, setEventEditMode} = useContext(AppContext);
    const {currScenario, setCurrScenario} = useContext(AppContext);
    const {editMode, setEditMode} = useContext(AppContext);
    const { user } = useContext(AuthContext);

    const getExpenseById = (id) => {
        for (let i = 0; i < currExpense.length; i++) {
            if (currExpense[i]._id == id) {
                return currExpense[i]; // Return the found scenario
            }
        }
        return null; // Return null if not found
      };

    let indieExpense = getExpenseById(eventEditMode.id);
    // console.log(indieExpense);

    // console.log(indieExpense.duration.type);

    const [formValues, setFormValues] = useState(indieExpense || {
        _id: "",
        eventSeriesName: "",
        eventSeriesDescription: "",
        startYear: {
            type: "",
            value: "",
            mean: "",
            stdDev: "",
            min: "",
            max: "",
            year: ""
        },
        duration:
        {
            type: "fixedAmt",
            value: "",
            mean: "",
            stdDev: "",
            min: "",
            max: ""
        },
        initialAmount: "",
        annualChange: 
        {
            distribution: "none",
            type: "fixed",
            // value: "",
            mean: "",
            stdDev: "",
            min: "",
            max: "",
            amount: ""
        },
        userPercentage: "",
        inflationAdjustment: false,
        isDiscretionary: false
    });

    // console.log(formValues);

    // console.log(indieExpense);
    const handleInputChange = (field, value) => {
        const fieldParts = field.split("."); // Split the field into parts (e.g., "lifeExpectancy.mean")
      
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

    useEffect(() => {
                    console.log("Updated eventEditMode:", eventEditMode);
                }, [eventEditMode]);
    const handleSave = async () =>
    {
        // console.log("HANDLER");
        // console.log(formValues);
        // console.log(eventEditMode);
        if (eventEditMode.id == "new")
        {
            let id;

            if (!user.guest) {
              const response = await axios.post(`http://localhost:8080/scenario/${editMode}/expenseEvent`, formValues);
              id = response.data._id;
            } else {
              id = currExpense.length;
            }
            // console.log(id);
            handleInputChange("_id", id);
            setCurrExpense((prev) => [...prev, { ...formValues, _id: id }]);
            // console.log(formValues);

            setEventEditMode({type:"Expense", id: id});
            

            setCurrScenario((prevScenario) => {
                const updatedScenario = {
                    ...prevScenario,
                    expenseEventSeries: [...(prevScenario?.expenseEventSeries || []), id],
                    spendingStrategy: [...(prevScenario?.spendingStrategy || []), id]
                };
                // Send POST request with the updated scenario after state update
                // axios.post(`http://localhost:8080/updateScenario/${editMode}`, updatedScenario)
                //     .then(() => console.log("Scenario updated successfully"))
                //     .catch((error) => console.error("Error updating scenario:", error));

                return updatedScenario;
            });
        } 
        else
        {
            let response = await axios.post(`http://localhost:8080/updateExpense/${eventEditMode.id}`, formValues);
            setCurrExpense((prev) => {
                let newList = prev.filter((item)=> item._id !== eventEditMode.id);
                return [...newList, formValues];
              });
            console.log(response);
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
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, width: 400 }}>
                        <EventSeries formValues={formValues} setFormValues={setFormValues}/>
                    </Box>
                    {/* Second Column */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", width: 300 }}>
                        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                            <CustomInput 
                                title="Initial Expense Amount"
                                type="number"
                                adornment="$"
                                value={formValues.initialAmount}
                                setValue={(value) => handleInputChange("initialAmount", value)}
                            />
                            <CustomInput 
                                title="User's Contribution"
                                type="number"
                                adornment="%"
                                value={formValues.userPercentage}
                                setValue={(value) => handleInputChange("userPercentage", value)}
                            />
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2} sx={{ marginTop: 4, mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: "medium", width: 150 }}>
                                Inflation Adjustment
                            </Typography>
                            <Checkbox checked={formValues.inflationAdjustment} 
                            onChange={(value) => {
                                console.log(formValues.inflationAdjustment);
                                handleInputChange("inflationAdjustment", value.target.checked);
                                }}/>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                            <Typography variant="body1" sx={{ fontWeight: "medium", width: 150 }}>
                               Discretionary
                            </Typography>
                            <Checkbox checked={formValues.isDiscretionary} onChange={(value) => handleInputChange("isDiscretionary", value.target.checked)}/>
                        </Stack>

                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "bold" }}>Expected Annual Change:</Typography>

                        <CustomToggle
                            title="Distribution"
                            labels = {["None", "Normal", "Uniform"]}
                            values={["none", "normal", "uniform"]}
                            sideView={true}
                            width={100}
                            value={formValues.annualChange.distribution}
                            setValue={(value) => handleInputChange("annualChange.distribution", value)}
                        />

                        <CustomToggle
                            title="Rate/Unit"
                            labels = {["Fixed", "Percentage"]}
                            values={["fixed", "percentage"]}
                            sideView={true}
                            width={100}
                            value={formValues.annualChange.type}
                            setValue={(value) => handleInputChange("annualChange.type", value)}
                        />

                        {formValues.annualChange.distribution === "none" && (
                            <CustomInput 
                                title="Value"
                                type="number"
                                adornment={formValues.annualChange.type === "percentage" ? "%" : "$"}
                                value={formValues.annualChange.amount}
                                setValue={(value) => handleInputChange("annualChange.amount", value)}
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
                                />
                                <CustomInput 
                                    title="Standard Deviation"
                                    type="number"
                                    adornment={formValues.annualChange.type === "percentage" ? "%" : "$"}
                                    value={formValues.annualChange.stdDev}
                                    setValue={(value) => handleInputChange("annualChange.stdDev", value)}
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
                                />
                                <CustomInput 
                                    title="Max"
                                    type="number"
                                    adornment={formValues.annualChange.type === "percentage" ? "%" : "$"}
                                    value={formValues.annualChange.max}
                                    setValue={(value) => handleInputChange("annualChange.type", value)}
                                />
                            </Stack>
                        )}
                    </Box>
                </Box>

                <Box sx={backContinueContainerStyles}>
                    <Button variant="contained" color="primary" sx={buttonStyles}
                        onClick={() => navigate("/scenario/event_series_list")}
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" color="success" sx={buttonStyles}
                        onClick={() => {
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

export default Expense;
