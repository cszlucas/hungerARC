import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import { toggleButtonGroupStyles } from './styles';

const CustomToggle = ({ title, values, sideView, width, value, setValue }) => {
    const handleChange = (event) => {
        setValue(event.target.value);
    };

    const capitalizeFirstLetter = (str) => {
        if (!str) return '';  // Handle empty or null strings
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    return (<>
        
            {sideView ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2, marginBottom: 3 }}>
                    <Box width={width || '100px'}>
                        <Typography>{title}</Typography>
                    </Box>
                    <Box>
                        <ToggleButtonGroup
                            value={value}
                            exclusive
                            onChange={handleChange}
                            sx={toggleButtonGroupStyles}
                        >
                            {values.map((val) => (
                                <ToggleButton key={val} value={val}>
                                    {capitalizeFirstLetter(val)}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                    <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                        {title}
                    </Typography>
                    <Box>
                        <ToggleButtonGroup
                            value={value}
                            exclusive
                            onChange={handleChange}
                            sx={toggleButtonGroupStyles}
                        >
                        {values.map((val) => (
                            <ToggleButton key={val} value={val}>
                                {capitalizeFirstLetter(val)}
                            </ToggleButton>
                        ))}
                        </ToggleButtonGroup>
                    </Box>
             </Box>
            )}
        </>);
};

export default CustomToggle;
