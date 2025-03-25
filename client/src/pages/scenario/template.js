import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, ToggleButton, ToggleButtonGroup, MenuItem } from "@mui/material";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import {
  stackStyles,
  titleStyles,
  textFieldStyles,
  numFieldStyles,
  toggleButtonGroupStyles,
  backContinueContainerStyles,
  buttonStyles,
  rowBoxStyles,
} from "../../../components/styles";  // Import your modular styles

const EventSeries = () => {
  const [toggleType, setToggleType] = useState("Toggle A");
  const [value, setValue] = useState("");

  const handleToggleChange = (event, newToggleType) => {
    if (newToggleType !== null) {
      setToggleType(newToggleType);
    }
  };

  const handleValueChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>

        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Your Title Starts Here
          </Typography>
          <Button variant="contained" color="secondary" sx={buttonStyles}>
            Save
          </Button>
        </Stack>

        <PageHeader />

        {/* Row 3 - Inflation Assumptions */}
        <Typography variant="h6" sx={{ fontWeight: "bold", marginTop: 4, marginBottom: 2 }}>
          Subtitle Text Here
        </Typography>

        <Box sx={rowBoxStyles}>
          {/* Distribution Type */}
          <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
              Toggle Type
            </Typography>

            <ToggleButtonGroup
              value={toggleType}
              exclusive
              onChange={handleToggleChange}
              aria-label="toggles"
              sx={toggleButtonGroupStyles}
            >
              <ToggleButton value="Toggle A" aria-label="Toggle A">
                Toggle A
              </ToggleButton>
              <ToggleButton value="Toggle B" aria-label="Toggle B">
                Toggle B
              </ToggleButton>
              <ToggleButton value="Toggle C" aria-label="Toggle C">
                Toggle C
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Inflation Value (Conditional) */}
          {toggleType === "Toggle A" && (
            <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
              <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                Temp Value
              </Typography>

              <TextField
                type="number"
                variant="outlined"
                value={value}
                onChange={handleValueChange}
                sx={numFieldStyles}
              />
            </Box>
          )}
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles}>
            Back
          </Button>

          <Button variant="contained" color="success" sx={buttonStyles}>
            Continue
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default EventSeries;
