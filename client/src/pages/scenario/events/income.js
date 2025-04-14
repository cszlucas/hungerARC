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
import EventSeries from "./eventSeries";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";

import axios from "axios";
import { ObjectId } from "bson";

const Income = () => {
    const {currIncome, setCurrIncome} = useContext(AppContext); // scenarios/:id/IncomeEvent
    const {eventEditMode, setEventEditMode} = useContext(AppContext); 
    const {currScenario, setCurrScenario} = useContext(AppContext);
    const {editMode, setEditMode} = useContext(AppContext); //scenario
    const { user } = useContext(AuthContext);

    // find the income event series object based on the id
    const getIncomeById = (id) => {
        for (let i = 0; i < currIncome.length; i++) {
            if (currIncome[i]._id == id) {
                return currIncome[i];
            }
        }
        return null; // Return null if not found
      };

    let indieIncome="";
    if (eventEditMode !== "new"){
        indieIncome = getIncomeById(eventEditMode.id);
    }

    // scenario has list of income 
    const [formValues, setFormValues] = useState(indieIncome ||  {
        _id:"",
        eventSeriesName: "",
        description: "",
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
        initialAmount: "",
        annualChange: {
            type:"fixed",
            amount:"",
            distribution:"none",
            mean:"",
            stdDev:"",
            min:"",
            max:""
        },
        userPercentage: "",
        inflationAdjustment: false,
        isSocialSecurity: false
    });
    
    // const [expectedChangeType, setExpectedChangeType] = useState("Fixed");
  

    const navigate = useNavigate();

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

    const handleSave = async () => {
        try {
            // let response;
            if (eventEditMode.id == "new"){
            // calls endpoint to make a new income event and put in db
            let id;
            if (!user.guest) {
                const response = await axios.post(`http://localhost:8080/scenario/${editMode}/incomeEvent`, formValues);
                id = response.data._id;
            } else {
                id = new ObjectId().toHexString();
            }
            handleInputChange("_id", id);
            setCurrIncome((prev) => [...prev, { ...formValues, _id: id }]);
            setEventEditMode({type:"Income", id: id});

            setCurrScenario((prevScenario) => {
                const updatedScenario = {
                    ...prevScenario,
                    incomeEventSeries: [...(prevScenario?.incomeEventSeries || []), id]
                };
                // add this income event id into scenario incomeEventSeries array
                // axios.post(`http://localhost:8080/updateScenario/${editMode}`, updatedScenario)
                //     .then(() => console.log("Scenario updated successfully"))
                //     .catch((error) => console.error("Error updating scenario:", error));

                return updatedScenario;
            });

            } else {
            let response = await axios.post(`http://localhost:8080/updateIncome/${eventEditMode.id}`, formValues);
            setCurrIncome((prev) => {
                let newList = prev.filter((item)=> item._id !== eventEditMode.id);
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
                    <Button variant="contained" color="secondary" sx={{ fontSize: "1.25rem", textTransform: "none" }}
                          onClick={() => {
                            handleSave();
                          }}
                    >
                        Save
                    </Button>
                </Stack>

                <PageHeader />

                <Box sx={rowBoxStyles}>
                    {/* First Column */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, width: 400 }}>
                        <EventSeries formValues={formValues} setFormValues={setFormValues}/>
                    </Box>

                    {/* Second Column */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", width: 300 }}>
                        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                            <CustomInput 
                                title="Initial Income Amount"
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
                            {/* <CustomInput 
                                title="Spouse's Contribution"
                                type="number"
                                adornment="%"
                                value={changeVariance}
                                setValue={setChangeVariance}
                            /> */}
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2} sx={{ marginTop: 4, mb: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: "medium", width: 150 }}>
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

                       <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 5 }}>
                            <Typography variant="body1" sx={{ fontWeight: "medium", width: 150 }}>
                               Social Security
                            </Typography>
                            <Checkbox checked={formValues.isSocialSecurity || false}  
                                onChange={(value) => handleInputChange("isSocialSecurity", value.target.checked)}/>
                        </Stack>

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
    
                        {formValues.annualChange.distribution === "none" && (
                            <CustomInput 
                                title="Value"
                                type="number"
                                adornment={formValues.annualChange.type === "Percentage" ? "%" : "$"}
                                value={formValues.annualChange.amount}
                                setValue={(value) => handleInputChange("annualChange.amount", value)}
                            />
                        )}
                        
                        {formValues.annualChange.distribution === "normal" && (
                            <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                                <CustomInput 
                                    title="Mean"
                                    type="number"
                                    adornment={formValues.annualChange.type === "Percentage" ? "%" : "$"}
                                    value={formValues.annualChange.mean}
                                    setValue={(value) => handleInputChange("annualChange.mean", value)}
                                />
                                <CustomInput 
                                    title="Variance"
                                    type="number"
                                    adornment={formValues.annualChange.type === "Percentage" ? "%" : "$"}
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
                                    adornment={formValues.annualChange.type === "Percentage" ? "%" : "$"}
                                    value={formValues.annualChange.min}
                                    setValue={(value) => handleInputChange("annualChange.min", value)}
                                />
                                <CustomInput 
                                    title="Max"
                                    type="number"
                                    adornment={formValues.annualChange.type === "Percentage" ? "%" : "$"}
                                    value={formValues.annualChange.max}
                                    setValue={(value) => handleInputChange("annualChange.max", value)}
                                />
                            </Stack>
                        )}
                    </Box>
                    {/* Third Column */}
                    {/* <Box sx={{ flex: 1 }}>
                        
                    </Box> */}
                </Box>

                <Box sx={backContinueContainerStyles}>
                    <Button variant="contained" color="primary" sx={buttonStyles}
                        // onClick={handleBackClick}
                        onClick={() => navigate("/scenario/event_series_list")}
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" color="success" sx={buttonStyles}
                        onClick={() => {
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

export default Income;
