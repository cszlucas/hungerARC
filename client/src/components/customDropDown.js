import { Box, Typography, TextField, MenuItem } from "@mui/material";

const CustomDropdown = ({ label, value, setValue, menuItems, textFieldStyles }) => {
    return (
        <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                {label}
            </Typography>
            <TextField
                select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                displayEmpty
                fullWidth
                sx={textFieldStyles}
            >
                <MenuItem value="" disabled>
                    Select
                </MenuItem>
                {menuItems.map((item) => (
                    <MenuItem key={item} value={item}>
                        {item}
                    </MenuItem>
                ))}
            </TextField>
        </Box>
    );
};

export default CustomDropdown;
