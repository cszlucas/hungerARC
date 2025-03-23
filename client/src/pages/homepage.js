// App.js
import React, { useContext } from "react";
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../components/theme';
import Navbar from '../components/navbar';
import { Container } from '@mui/material';
import { AuthContext } from '../context/authContext';

function extractPrefix(email) {
    let match = email.match(/^[a-zA-Z0-9]+/);
    return match ? match[0] : "Guest"; // Default to "Guest" if no match
}
function DisplayUser({ user }) {
    // console.log("user");
    // console.log(user);
    if (user == null) return  <h1>Hello werido!</h1>;
    const prefix = extractPrefix(user.email);
    return <h1>Hello, {prefix || "Guest"}!</h1>;
  }
  
const Homepage = () => {
    // const { user } = useContext(AuthContext); // If AuthContext is undefined, this throws an error
    // console.log(localStorage.user);
    let user = null
    const userString = localStorage.getItem('user');
    if (userString) {
        user = JSON.parse(userString); // Convert string to object
        console.log("Parsed User:", user);
        console.log("User Email:", user.email);
    } else {
        console.log("No user found in localStorage.");
    }

    // const user = localStorage.getItem("user");
    return (
        <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Applies global styles based on the theme */}
        <Navbar currentPage={'homepage'}/>
        <Container>
        <div>
            {/* Your page content goes here */}
            <DisplayUser user = {(user)}/>
        </div>
        </Container>
        </ThemeProvider>
    );
};

export default Homepage;