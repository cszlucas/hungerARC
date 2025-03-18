// Follows this format:
import React, { useContext } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, List, ListItem, ListItemText, IconButton, Box } from '@mui/material';
import { AppContext } from '../context/appContext';
import EditIcon from '@mui/icons-material/Edit';
import theme from '../components/theme';
import Navbar from '../components/navbar';

const Scenarios = () => {
    // const { scenarios } = useContext(AppContext); // Assuming this is coming from the context
    const scenarios = {
      'Plan 1': { 'date': new Date(2025, 2, 20)},
      'Plan 2': { 'date': new Date(2025, 2, 19)},
      'Plan 3': { 'date': new Date(2025, 2, 18)},
    }

    return (
      <ThemeProvider theme={theme}>
          <CssBaseline /> {/* Applies global styles based on the theme */}
          <Navbar currentPage={'scenario'} />
          <Container>
              {/* Title with margin-top and bold style */}
              <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom 
                  sx={{ marginTop: 4, fontWeight: 'bold' }} // Added margin-top and bold style
              >
                  Your Financial Journey! 🎉
              </Typography>

              {/* List of Scenarios, limited to 50% width */}
              <Box sx={{ width: '45%' }}>
                  <List>
                      {Object.entries(scenarios).map(([key, value], index) => (
                          <ListItem 
                              key={key} 
                              sx={{
                                  backgroundColor: index % 2 === 0 ? '#BBBBBB' : '#D9D9D9', // Alternate colors
                                  '&:hover': {
                                      backgroundColor: '#B0B0B0', // Add a hover effect for better interactivity
                                  }
                              }}
                          >
                              <ListItemText
                                  primary={<span style={{ fontWeight: 'bold' }}>{key}</span>} // Bold primary text
                                  secondary={`Date: ${value.date.toDateString()}`} // Display the formatted date
                              />
                              <IconButton 
                                  edge="end" 
                                  aria-label="edit" 
                                  onClick={() => alert(`Edit ${key}`)} // Handle edit button click
                              >
                                  <EditIcon />
                              </IconButton>
                          </ListItem>
                      ))}
                  </List>
              </Box>
          </Container>
      </ThemeProvider>
    );
};

export default Scenarios;
