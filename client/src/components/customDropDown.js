import { Box, Typography, Autocomplete, TextField } from "@mui/material";
import React from "react";
import { textFieldStyles } from "./styles";

const CustomDropdown = ({
  label,
  value,
  setValue,
  menuLabels = [],
  menuItems = [],
  width = "auto",
  disable = false
}) => {
  // Fall back to menuItems if labels are missing or mismatched
  if (menuLabels.length === 0 || menuLabels.length !== menuItems.length) {
    menuLabels = menuItems;
  }

  const options = menuItems.map((item, i) => ({
    label: menuLabels[i],
    value: item
  }));

  const selectedOption = options.find(option => option.value === value) || null;

  return (
    <Box sx={{ display: "inline-flex", flexDirection: "column", width }}>
      <Typography
        variant="body1"
        sx={{ marginBottom: 1, fontWeight: "medium" }}
      >
        {label}
      </Typography>
      <Autocomplete
        disabled={options.length === 0 || disable}
        value={selectedOption}
        onChange={(event, newValue) => {
          setValue(newValue ? newValue.value : "");
        }}
        options={options}
        getOptionLabel={(option) => option.label.toString()}
        isOptionEqualToValue={(option, val) => option.value === val.value}
        renderInput={(params) => (
          <TextField
            {...params}
            sx={{ ...textFieldStyles, width }}
            placeholder="Select"
          />
        )}
        disableClearable
        autoHighlight
        ListboxProps={{ style: { maxHeight: 300 } }}
      />
    </Box>
  );
};

export default CustomDropdown;
