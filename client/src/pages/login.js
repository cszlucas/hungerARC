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

        let jsonResponse = 
        {
            "_id": "67df2ec125693e5e54c14377",
            "googleId": "103151424804713196609",
            "email": "william.p.lee@stonybrook.edu",
            "guest": false,
            "scenarios": [
                "67df396953a415566df67af2"
            ],
            "lastLogin": "2025-03-23T20:36:41.130Z",
            "__v": 0
        };

        data = typeof jsonResponse === "string" ? JSON.parse(jsonResponse) : jsonResponse;
        setUser(data);
        
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