import React from "react";
import { Box, ToggleButtonGroup, ToggleButton, Typography } from "@mui/material";
import { toggleButtonGroupStyles } from "./styles";

const CustomToggle = ({ title, labels = [], values=[], sideView=false, width, value, setValue }) => {
    if (labels == [] || labels.length != values.length) {
        labels = values;
    }

    const handleChange = (event) => {
        setValue(event.target.value);
    };

    return (<>
        
            {sideView ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginTop: 2, marginBottom: 3 }}>
                    <Box width={width || "100px"}>
                        <Typography>{title}</Typography>
                    </Box>
                    <Box>
                        <ToggleButtonGroup
                            value={value}
                            exclusive
                            onChange={handleChange}
                            sx={toggleButtonGroupStyles}
                        >
                            {values.map((val, i) => (
                                <ToggleButton key={val} value={val}>
                                    {labels[i]}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
                    <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                        {title}
                    </Typography>
                    <Box>
                        <ToggleButtonGroup
                            value={value}
                            exclusive
                            onChange={handleChange}
                            sx={toggleButtonGroupStyles}
                        >
                        {values.map((val, i) => (
                            <ToggleButton key={val} value={val}>
                                {labels[i]}
                            </ToggleButton>
                        ))}
                        </ToggleButtonGroup>
                    </Box>
             </Box>
            )}
        </>);
};

export default CustomToggle;
