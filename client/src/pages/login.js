import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Container, Typography, Card, CardContent, Avatar, Button, Box, Stack } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { AuthContext } from "../context/authContext";

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
        navigate("/");
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
        navigate("/"); // Redirect guest users to homepage
    };

    console.log(localStorage);
    return (
        <GoogleOAuthProvider clientId="600916289393-qfjvma6fnncebuv070vt2h9oddeuddhd.apps.googleusercontent.com">
            <Container maxWidth="sm" sx={{ textAlign: "center", mt: 8 }}>
                <Card elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Sign in with Google
                    </Typography>

                    {
                        <Stack spacing={2} mt={2}>
                            <GoogleLogin 
                                onSuccess={handleSuccess} 
                                onError={() => alert("Login Failed")} 
                            />
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleGuestLogin}
                            >
                                Sign in as Guest
                            </Button>
                        </Stack>
                     }
                </Card>
            </Container>
        </GoogleOAuthProvider>
    );
};

export default GoogleAuth;