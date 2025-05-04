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
    inputProps = {},
    disable = false
}) => {

    const handleChange = (event) => {
        const inputValue = event.target.value;

        if (type === "number") {
            const min = inputProps.min !== undefined ? Number(inputProps.min) : -Infinity;
            const max = inputProps.max !== undefined ? Number(inputProps.max) : Infinity;

            if (inputValue === "") {
                setValue(""); // Allow clearing the input
                return;
            }

            if (!isNaN(inputValue)) {
                const numericValue = Number(inputValue);
                const decimalPart = inputValue.split(".")[1];
                if (decimalPart && decimalPart.length > 2) {
                    return; // Too many decimal places
                }

                if (numericValue >= min && numericValue <= max) {
                    setValue(adornment === "%" ? numericValue * 0.01 : numericValue);
                }
            }
        } else {
            setValue(inputValue);
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

    const displayValue =
        type === "number" && adornment === "%" && typeof value === "number"
            ? (value * 100).toFixed(2).replace(/\.?0+$/, "")
            : value;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "auto", mb: 2 }}>
            {title && (
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium", minWidth: 170 }}>
                    {title}
                </Typography>
            )}
            <TextField
                variant="outlined"
                type={type === "number" ? "number" : "text"}
                multiline={type === "multiline"}
                sx={{ ...getFieldStyles(), width: width }}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={(e) => {
                    if (type === "number" && ["-", "+", "e"].includes(e.key)) {
                        e.preventDefault();
                    }
                }}
                InputProps={{
                    startAdornment: adornment !== "none" && adornment !== "%" ? getAdornment() : null,
                    endAdornment: adornment === "%" ? getAdornment() : null,
                    inputProps: inputProps
                }}
                disabled={disable}
            />
        </Box>
    );
};

export default CustomInput;
