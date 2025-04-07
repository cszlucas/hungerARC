import React from "react";
import { Box, Typography, TextField, InputAdornment } from "@mui/material";
import { numFieldStyles, multiLineTextFieldStyles, textFieldStyles } from "./styles";

const CustomInput = ({ 
    title, 
    type = "normal", 
    adornment = "none", 
    value, 
    setValue, 
    width = "auto",
    inputProps = {}
}) => {
    
    const handleChange = (event, newValue) => {
        // If it's a number field, enforce min and max constraints
        if (type === "number") {
            const min = inputProps.min !== undefined ? Number(inputProps.min) : -Infinity;
            const max = inputProps.max !== undefined ? Number(inputProps.max) : Infinity;
            
            if (event.target.value !== "" && !isNaN(event.target.value)) {
                const numericValue = Number(event.target.value);

                if (numericValue < min || numericValue > max) {
                    return; // Prevent the change
                }
            }
        }

        if (newValue !== null) {
            setValue(event.target.value);
        }
    };

    const getAdornment = () => {
        if (adornment === "none") return null;
        return (
            <InputAdornment position={adornment === "%" ? "end" : "start"}>
                {adornment}
            </InputAdornment>
        );
    };

    const getFieldStyles = () => {
        switch (type) {
            case "multiline":
                return multiLineTextFieldStyles;
            case "number":
                return numFieldStyles;
            default:
                return textFieldStyles;
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "auto", mb: 2 }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium", minWidth: 170 }}>
                {title}
            </Typography>
            <TextField
                variant="outlined"
                type={type === "number" ? "number" : "text"}
                multiline={type == "multiline"}
                sx={{ ...getFieldStyles(), ...{width: width}}}
                value={value}
                onChange={handleChange}
                onKeyDown={(e) => {
                    if (type === "number" && (e.key === "-" || e.key === "+" || e.key === "e")) {
                        e.preventDefault();
                    }
                }}
                InputProps={{...{ 
                    startAdornment: adornment !== "none" && adornment !== "%" ? getAdornment() : null,
                    endAdornment: adornment === "%" ? getAdornment() : null
                }, ...{inputProps}}}
            />
        </Box>
    );
};

export default CustomInput;
