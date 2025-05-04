import axios from "axios";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/appContext";
import { AuthContext } from "../context/authContext";
import { 
  Typography, Button, Stack, Box, MenuItem, TextField, IconButton, Backdrop, Fade 
} from "@mui/material";
import {
  textFieldStyles, buttonStyles,
} from "./styles";  // Import your modular styles
import { Close as CloseIcon } from "@mui/icons-material";

const CustomShare = ({ label = "Share", disable = false }) => {
  const { currScenario, setCurrScenario, setScenarioData, editMode, setEditMode } = useContext(AppContext);
  const { setCurrInvestmentTypes, setCurrInvestments } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [openBackdrop, setOpenBackdrop] = useState(false); // State to control backdrop visibility
  const [emails, setEmails] = useState([]); // Store the email addresses
  const [permission, setPermission] = useState([]);

  const handleShareClick = () => {
    setOpenBackdrop(true); // Show backdrop when the "Share" button is clicked
  };

  const handleBackdropClose = () => {
    setOpenBackdrop(false); // Close the backdrop
  };

  const handleEmailChange = (event) => {
    if (event.key === "Enter" && event.target.value) {
      setEmails([...emails, event.target.value]); // Add email to the list when Enter is pressed
      event.target.value = ""; // Clear input field after adding email
    }
  };

  const handleEmailDelete = (emailToDelete) => {
    setEmails(emails.filter(email => email !== emailToDelete)); // Remove email from list
  };

  return (<>
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
      disabled={disable}
    >
      {label}
    </Button>

    {/* MUI Backdrop for Share */}
    <Backdrop
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        display: openBackdrop ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
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
                  displayempty="true"
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
          
          <Button variant="contained" color="secondary" sx={{textTransform: "none", fontSize: "1.05rem", mt: 2}}>
            Click to share scenario
          </Button>
        </Box>
      </Fade>
    </Backdrop>
  </>);
};

export default CustomShare;
