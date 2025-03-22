import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, Switch, MenuItem, TextField, IconButton, Backdrop, Fade } from '@mui/material';
import theme from '../../components/theme';
import Navbar from '../../components/navbar';
import PageHeader from '../../components/pageHeader';
import {
  stackStyles,
  titleStyles,
  textFieldStyles,
  numFieldStyles,
  toggleButtonGroupStyles,
  backContinueContainerStyles,
  buttonStyles,
  rowBoxStyles,
} from '../../components/styles';  // Import your modular styles
import CustomInput from '../../components/customInputBox';
import { Close as CloseIcon } from '@mui/icons-material';

const EventSeries = () => {
  const [isRothOptimized, setIsRothOptimized] = useState(false); // State for Switch
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [numSimulations, setNumSimulations] = useState('1');
  const [openBackdrop, setOpenBackdrop] = useState(false); // State to control backdrop visibility
  const [emails, setEmails] = useState([]); // Store the email addresses
  const [permission, setPermission] = useState([]);

  const handleSwitchChange = (event) => {
    setIsRothOptimized(event.target.checked); // Update state when switch is toggled
  };

  const handleShareClick = () => {
    setOpenBackdrop(true); // Show backdrop when the "Share" button is clicked
  };

  const handleBackdropClose = () => {
    setOpenBackdrop(false); // Close the backdrop
  };

  const handleEmailChange = (event) => {
    if (event.key === 'Enter' && event.target.value) {
      setEmails([...emails, event.target.value]); // Add email to the list when Enter is pressed
      event.target.value = ''; // Clear input field after adding email
    }
  };

  const handleEmailDelete = (emailToDelete) => {
    setEmails(emails.filter(email => email !== emailToDelete)); // Remove email from list
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={''} />
      <Container>

        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Congratulations on completing your scenario!
          </Typography>

          {/* Use marginLeft: auto to push the Box to the right */}
          <Box direction="row" spacing={2} sx={{ display: "flex", gap: 2, marginLeft: "auto", marginTop: 2 }}>
            <Button
              variant="contained"
              sx={{
                ...buttonStyles,
                backgroundColor: "#c98b34", // Custom background color for Share button
                "&:hover": {
                  backgroundColor: "#a67a2b", // Optionally set hover color
                },
              }}
              onClick={handleShareClick} // Show backdrop when clicked
            >
              Share
            </Button>

            <Button
              variant="contained"
              sx={{
                ...buttonStyles,
                backgroundColor: "#c98bc0", // Custom background color for Export button
                "&:hover": {
                  backgroundColor: "#a67a99", // Optionally set hover color
                },
              }}
            >
              Export
            </Button>

            <Button
              variant="contained"
              sx={{
                ...buttonStyles,
                backgroundColor: "#61afc9", // Custom background color for Save & Exit button
                "&:hover": {
                  backgroundColor: "#59a8c2", // Optionally set hover color
                },
              }}
            >
              Save & Exit
            </Button>
          </Box>
        </Stack>

        <PageHeader />

        {/* Stack for title and save button */}
        <Box sx={rowBoxStyles}>
          <Box>
            <Stack direction="row" alignItems="center" sx={{mb: 2, width: 350}}>
              <Typography
                variant="h6"
                sx={{ 
                  fontWeight: 'bold', 
                  color: isRothOptimized ? 'secondary.main' : 'inherit', // Conditionally change color
                  mr: 1,
                }}
              >
                Roth Conversion Optimizer
              </Typography>

              <Switch
                checked={isRothOptimized}
                onChange={handleSwitchChange}
                name="rothOptimizerSwitch"
                color="secondary" // Set color of switch when toggled
              />
            </Stack>
            {isRothOptimized === true && (
              <Stack direction="row" alignItems="center">
                <CustomInput 
                    title="Start Year"
                    type="number"
                    adornment=""
                    value={startYear}
                    setValue={setStartYear}
                />

                <CustomInput 
                    title="End Year"
                    type="number"
                    adornment=""
                    value={endYear}
                    setValue={setEndYear}
                />
              </Stack>
            )}
          </Box>
          <Box>
            <Typography variant="h5" sx={{fontWeight: 'bold', mb: 3}}>
              Simulation
            </Typography>
            <CustomInput
              title='Number of times to run'
              type='number'
              value={numSimulations}
              setValue={setNumSimulations}
            />
         </Box>
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles}>
            Back
          </Button>
          <Button variant="contained" color="secondary" sx={buttonStyles}>
            Run Simulation
          </Button>
        </Box>

        {/* MUI Backdrop for Share */}
        <Backdrop
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            display: openBackdrop ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          open={openBackdrop}
          onClick={handleBackdropClose} // Close backdrop on clicking outside
        >
          <Fade in={openBackdrop}>
            <Box
              sx={{
                backgroundColor: "white", padding: 3, borderRadius: 2, minWidth: 400,
                display: "flex", flexDirection: "column"
              }}
              onClick={(e) => e.stopPropagation()} // Prevent click from closing backdrop
            >
              <Typography variant="h6" sx={{ mb: 2 }}>Share With Others</Typography>
              <Stack direction="row" alignItems="center" sx={{mb: 1, minWidth: 400, gap: 2}}>
                <Box>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                      Email (Press Enter to add emails)
                  </Typography>
                  <TextField
                      variant="outlined"
                      fullWidth
                      onKeyDown={handleEmailChange} // Handle Enter key press
                      sx={textFieldStyles}
                  />
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                      Permission
                  </Typography>
                  <TextField
                      select
                      value={permission}
                      onChange={(e) => setPermission(e.target.value)}
                      displayEmpty
                      fullWidth
                      sx={textFieldStyles}
                  >
                      <MenuItem value="" disabled>
                          Select
                      </MenuItem>
                      <MenuItem key="Edit" value="Edit">
                        Edit
                      </MenuItem>
                      <MenuItem key="Read Only" value="Read Only">
                        Read Only
                      </MenuItem>
                  </TextField>
                </Box>
              </Stack>

              {/* Display added emails as small containers */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, maxWidth: 400 }}>
                {emails.map((email, index) => (
                  <Box
                    key={index}
                    sx={{
                      backgroundColor: "#f0f0f0", padding: "5px 10px", borderRadius: "15px", display: "flex",
                      alignItems: "center", gap: 1
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>{email}</Typography>
                    <IconButton onClick={() => handleEmailDelete(email)} size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              
              <Button variant="contained" color="secondary" sx={{textTransform: 'none', fontSize: '1.05rem', mt: 2}}>
                Click to share scenario
              </Button>
            </Box>
          </Fade>
        </Backdrop>
      </Container>
    </ThemeProvider>
  );
};

export default EventSeries;
