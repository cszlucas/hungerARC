// App.js
import React, { useContext } from "react";
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../components/theme';
import Navbar from '../components/navbar';
import { Container } from '@mui/material';
import { AuthContext } from '../context/AuthContext';

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
    const { user } = useContext(AuthContext); // If AuthContext is undefined, this throws an error
    console.log("check for user and email");
    console.log(user);
    console.log(user.email);

    // const user = localStorage.getItem("user");
    return (
        <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Applies global styles based on the theme */}
        <Navbar currentPage={'profile'}/>
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