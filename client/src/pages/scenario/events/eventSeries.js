import React, { useContext } from "react";
import { Stack, Box } from "@mui/material";

import { rowBoxStyles, } from "../../../components/styles";

import CustomDropdown from "../../../components/customDropDown"; 
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";

import { AppContext } from "../../../context/appContext";

const mongoose = require("mongoose");

const EventSeries = ({ formValues, setFormValues }) => {
// const EventSeries = () => {
    const { eventEditMode, currIncome, currExpense, currInvest, currRebalance } = useContext(AppContext);
    
    const menuLabels = [];
    const menuItems = [];
    const eventSeriesMap = new Map();
    
    const buildOutList = () => {
        const buildMap = (arr) => {
            if (!Array.isArray(arr)) return;
            for (const { _id, eventSeriesName, startYear } of arr) {
                eventSeriesMap.set(_id, { name: eventSeriesName, startYear });
            }
        };

        buildMap(currIncome);
        buildMap(currExpense);
        buildMap(currInvest);
        buildMap(currRebalance);
        
        // if (dimensionalExplorationMode[0]) {
        //     tempExploration.forEach((e) => { 
        //         if (e.setting === "Start Year / Duration") {
        //             eventSeriesMap.set(e.data._id, { name: e.data.eventSeriesName, startYear: e.data.startYear });
        //         }
        //     });
        // }

        if (eventEditMode === "new") {
            for (const key of eventSeriesMap.keys()) {
                validSet.add(key);
            }
            return;
        }

        const validSet = new Set();
        // const notValidSet = new Set([eventEditMode.id]);
        const notValidSet = new Set();

        if (eventEditMode !== "new" && eventEditMode?.id) {
            notValidSet.add(eventEditMode.id);
        }

        const resolveValue = (key, path = new Set()) => {
            if (notValidSet.has(key)) {
                path.forEach(id => notValidSet.add(id));
                return;
            }

            if (validSet.has(key)) {
                path.forEach(id => validSet.add(id));
                return;
            }

            path.add(key);

            const { type, refer } = eventSeriesMap.get(key).startYear || {};
            if (type !== "same" && type !== "after") {
                path.forEach(id => validSet.add(id));
                return;
            }

            if (eventSeriesMap.has(refer)) {
                resolveValue(refer, new Set(path)); // Pass a copy
                return;
            }
            
            path.forEach(id => validSet.add(id));
        };

        for (const key of eventSeriesMap.keys()) { resolveValue(key); }

        for (const id of validSet) {
            menuLabels.push((eventSeriesMap.get(id)).name);
            menuItems.push(id);
        }
    };

    // Run build and populate menu
    buildOutList();

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

    return (
        <>
            <Box sx={{minWidth: 400, width: "auto"}}>
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
            </Box>

            <Box sx={rowBoxStyles}>
                <Box sx={{minWidth: 350}}>
                    <CustomToggle
                        title="Start Year"
                        labels={["Fixed", "Normal", "Uniform", "Same as", "After"]}
                        values={["fixedAmt", "normal", "uniform", "same", "after"]}
                        value={formValues.startYear.type}
                        setValue={(value) => handleInputChange("startYear.type", value)}
                    />

                    <Box sx={{mt:2}}></Box>

                    {formValues.startYear.type === "fixedAmt" && (
                        <Stack direction="row" spacing={1} alignItems="start">
                            <CustomDropdown
                                label="Value"
                                value={formValues.startYear.value}
                                setValue={(value) => handleInputChange("startYear.value", value)}
                                menuItems={Array.from({ length: 300 }, (_, i) => new Date().getFullYear() + i)}
                            />
                        </Stack>
                    )}
                    {formValues.startYear.type === "normal" && (
                        <Stack direction="row" spacing={1} alignItems="start">
                            <CustomDropdown
                                label="Mean"
                                value={formValues.startYear.mean}
                                setValue={(value) => handleInputChange("startYear.mean", value)}
                                menuItems={Array.from({ length: 200 }, (_, i) => new Date().getFullYear() + i)}
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
                            <CustomDropdown
                                label="Min"
                                value={formValues.startYear.min}
                                setValue={(value) => handleInputChange("startYear.min", value)}
                                menuItems={Array.from({ length: 200 }, (_, i) => new Date().getFullYear() + i)}
                            />
                            <CustomDropdown
                                label="Max"
                                value={formValues.startYear.max}
                                setValue={(value) => handleInputChange("startYear.max", value)}
                                menuItems={Array.from({ length: 200 }, (_, i) => new Date().getFullYear() + i)}
                            />
                        </Stack>
                    )}
                    {formValues.startYear.type === "same" && (
                        <Stack direction="row" spacing={1} alignItems="start">
                            <CustomDropdown 
                                label={"Event Series"}
                                value={formValues.startYear.refer}
                                setValue={(value) => handleInputChange("startYear.refer", value)}
                                menuLabels={menuLabels}
                                menuItems={menuItems}
                                width={250}
                            />
                        </Stack>
                    )}
                    {formValues.startYear.type === "after" && (
                        <Stack direction="row" spacing={1} alignItems="start">
                            <CustomDropdown 
                                label={"Event Series"}
                                value={formValues.startYear.refer}
                                setValue={(value) => handleInputChange("startYear.refer", value)}
                                menuLabels={menuLabels}
                                menuItems={menuItems}
                                width={250}
                            />
                        </Stack>
                    )}
                </Box>

                {/* Input Fields Below in Columns */}
                <Box>
                <CustomToggle
                    title="Duration"
                    labels={["Fixed", "Normal", "Uniform"]}
                    values={["fixedAmt", "normal", "uniform"]}
                    width={100}
                    value={formValues.duration.type}
                    setValue={(value) => handleInputChange("duration.type", value)}
                />

                <Box sx={{mt:2}}></Box>

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
                </Box>
            </Box>
        </>
    );
};

export default EventSeries;
