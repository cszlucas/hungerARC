import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { ThemeProvider, Container, Typography, Card, CardContent, Avatar, Button, Box, Stack } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { AuthContext } from "../context/authContext";
import theme from "../components/theme";
import Navbar from "../components/navbar";

const GoogleAuth = () => {
    const {user, setUser} = useContext(AuthContext);
    // const [user, setUser] = useState(null);
    const navigate = useNavigate(); // Use navigate for redirection

    const handleSuccess = async (credentialResponse) => {
        const decodedToken = jwtDecode(credentialResponse.credential);
        console.log("Decoded Token:", decodedToken);

        const userData = {
            googleId: decodedToken.sub,
            email: decodedToken.email,
            guest: false,
        };
        // Send data to backend
        const res = await fetch("http://localhost:8080/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        let data = await res.json();
        console.log("Server Response:", data);

        if (data && typeof data === "object" && !Array.isArray(data)) {
            console.log("Valid JSON response received.");
    
            // Transform the response to match the expected format
            let formattedData = {
                _id: data.user._id || "",
                googleId: data.user.googleId || "",
                email: data.user.email || "",
                guest: data.user.guest ?? false, // Ensures boolean type
                scenarios: Array.isArray(data.user.scenarios) ? data.user.scenarios : [], // Ensures array type
                lastLogin: data.user.lastLogin || new Date().toISOString(), // Defaults to current time if missing
                __v: data.user.__v ?? 0 // Ensures numeric type
            };
    
            console.log("Formatted Data:", formattedData);
            setUser(formattedData);
        }
        
        // Store token in localStorage
        // localStorage.setItem("token", data.token);
        // localStorage.setItem("user", JSON.stringify(data.user));
        // setScenarioData(getInitialState);

        // ✅ Redirect to homepage
        navigate("/profile");
    };

    const handleGuestLogin = () => {
        const guestUser = {
            googleId: null,
            email: "Guest@hungerArc.com", // No profile image for guest users
            guest: true,
            scenarios: []
        };

        setUser(guestUser);

        // localStorage.setItem("user", JSON.stringify(guestUser));
        // console.log(localStorage.getItem("user"));
        navigate("/profile"); // Redirect guest users to profile
    };

    console.log(localStorage);
    return (
        <ThemeProvider theme={theme}>
            <Navbar currentPage={"login"}/>
            <GoogleOAuthProvider clientId="600916289393-qfjvma6fnncebuv070vt2h9oddeuddhd.apps.googleusercontent.com">
                
                <Container sx={{ textAlign: "center", mt: 8 }}>
                    <Typography variant="h2" sx={{mt: 20, fontWeight: "bold"}}>
                        Welcome to Hunger <span style={{ color: "#00825B" }}>Finance</span>
                    </Typography>
                    <Typography variant="h6" sx={{mt: 4, mb: 10}}>
                        Please login or visit as guest to start using our Financial Planner 
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                        <Stack direction="column" spacing={4} sx={{ width: "100%", maxWidth: 300 }}>
                        <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={() => alert("Login Failed")}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleGuestLogin}
                            size="large"
                            sx={{ 
                                textTransform: "none", 
                            }}
                        >
                            Go as Guest
                        </Button>

                        </Stack>
                    </Box>
                </Container>
            </GoogleOAuthProvider>
        </ThemeProvider>
    );
};

export default GoogleAuth;