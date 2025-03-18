// App.js
import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../components/theme';
import Navbar from '../components/navbar';
import { Container } from '@mui/material';

const Homepage = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Applies global styles based on the theme */}
      <Navbar />
      <Container>
      <div>
        {/* Your page content goes here */}
        <h1>Welcome to the Page</h1>
      </div>
      </Container>
    </ThemeProvider>
  );
};

export default Homepage;