import React, { useState, useContext } from "react";
import { ThemeProvider, CssBaseline, Container, Link, Typography, List, ListItem, ListItemText, IconButton, Box, Button } from "@mui/material";
import { AppContext } from "../../context/appContext";
import EditIcon from "@mui/icons-material/Edit";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import { useNavigate } from "react-router-dom";

const ScenarioList = () => {
    // window.location.reload();
    const [ selectedScenario, setSelectedScenario] = useState(null); // Track selected scenario
    const { scenarioData, setEditMode } = useContext(AppContext);

    const navigate = useNavigate();
    const handleSelectScenario = (scenarioKey) => {
        setSelectedScenario(scenarioKey); // Update the selected scenario
    };

    return (
      <ThemeProvider theme={theme}>
          <CssBaseline /> {/* Applies global styles based on the theme */}
          <Navbar currentPage={"scenarios"} />
          <Container>
              {/* Title with margin-top and bold style */}
              <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom 
                  sx={{ marginTop: 6, marginBottom: 2, fontWeight: "bold" }} // Added margin-top and bold style
              >
                  Your Financial Journey! 🎉
              </Typography>

              <Typography 
                  variant="h6" 
                  component="h5" 
                  gutterBottom 
                  sx={{ marginTop: 0, marginBottom: 1 }} // Added margin-top and bold style
              >
                Make a New Scenario!
              </Typography>
              <Button 
                  variant="contained"
                  sx={{ marginTop: 0, marginBottom: 6, textTransform: "none" }}
                  onClick={() => { 
                    setEditMode("new");
                    navigate("/scenario/basics");
                }}
              >
                New Scenario
              </Button>

              {/* Existing Scenarios Section */}
              <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
                  <Typography variant="h6" component="h5" sx={{ marginRight: 2 }}>
                      Existing Scenarios
                  </Typography>
                  <Button variant="contained" sx={{ marginRight: 2, textTransform: "none" }}>
                      Import
                  </Button>
                  <Button 
                      variant="contained" 
                      color="secondary" // Uses the theme's secondary color
                      sx={{ textTransform: "none" }}
                    >
                      Share
                  </Button>
              </Box>

              {/* List of Scenarios, limited to 50% width */}
              <Box sx={{ display: "flex" }}>
                  {/* Left Box for List */}
                  <Box sx={{ width: "45%" }}>
                      <List>
                          {scenarioData != null && scenarioData.map((plan, index) => (
                              <ListItem 
                                  key={plan.name} 
                                  sx={{
                                      backgroundColor: selectedScenario === plan.name ? "#A2E7D2" : (index % 2 === 0 ? "#BBBBBB" : "#D9D9D9"), // Highlight selected item
                                      "&:hover": {
                                          backgroundColor: selectedScenario !== plan.name ? "#B0B0B0" : "#A2E7D2", // Hover effect
                                      },
                                  }}
                                  onClick={() => handleSelectScenario(plan.name)} // Set the selected scenario
                              >
                                  <ListItemText
                                      primary={<span style={{ fontWeight: "bold" }}>{plan.name}</span>} // Bold primary text
                                      secondary={`Goal: $${plan.financialGoal}`} // Display the formatted date
                                  />
                                  <IconButton 
                                      edge="end" 
                                      aria-label="edit" 
                                      onClick={() => {
                                        setEditMode(plan._id);
                                        navigate("/scenario/basics");
                                      }} // Handle edit button click
                                  >
                                      <EditIcon />
                                  </IconButton>
                              </ListItem>
                          ))}
                      </List>
                  </Box>

                  {/* Right Box for Selected Scenario Display */}
                  <Box 
                      sx={{ 
                          width: "45%", 
                          backgroundColor: selectedScenario ? "#A2E7D2" : "transparent", // Only show colored box if a scenario is selected
                          display: selectedScenario ? "block" : "none", // Only show the box when a scenario is selected
                          padding: 2,
                          marginLeft: 5
                      }}
                  >
                      {selectedScenario && (
                          <Typography variant="h6" component="h2">
                              Selected Scenario: {selectedScenario} Chart
                          </Typography>
                      )}
                  </Box>
              </Box>
          </Container>
      </ThemeProvider>
    );
};

export default ScenarioList;
