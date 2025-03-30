import { Box, Typography, TextField, MenuItem } from "@mui/material";
import React from "react";
import { textFieldStyles } from "./styles";

const CustomDropdown = ({ label, value, setValue, menuLabels=[], menuItems=[] }) => {
    if (menuLabels == [] || menuLabels.length != menuItems.length) {
        menuLabels = menuItems;
    }

    const handleChange = (event) => {
        setValue(event.target.value);
    };

    return (
        <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                {label}
            </Typography>
            <TextField
                select
                value={value}
                onChange={handleChange}
                displayEmpty
                fullWidth
                sx={textFieldStyles}
            >
                <MenuItem value="" disabled>
                    Select
                </MenuItem>
                {menuItems.map((item, i) => (
                    <MenuItem key={item} value={item}>
                        {menuLabels[i]}
                    </MenuItem>
                ))}
            </TextField>
        </Box>
    );
};

export default CustomDropdown;
