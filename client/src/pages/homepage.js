// App.js
import React, { useContext, useEffect } from "react";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthContext } from "../components/AuthContext";
import theme from '../components/theme';
import Navbar from '../components/navbar';
import { Container } from '@mui/material';
import { useNavigate } from "react-router-dom";

const Homepage = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Log user state every time it changes
    useEffect(() => {
        console.log("User State:", user);
    }, [user]); // Runs when `user` changes

    // Redirect to login if no user is found
    useEffect(() => {
        if (!user) {
            console.log("No user found, redirecting to login...");
            navigate("/login");
        }
    }, [user, navigate]);
    return (
        <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Applies global styles based on the theme */}
        <Navbar currentPage={'profile'}/>
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