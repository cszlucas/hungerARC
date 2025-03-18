import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Container, Typography, Card, CardContent, Avatar, Button, Box, Stack } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const GoogleAuth = () => {
    const [user, setUser] = useState(null);
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

        const data = await res.json();
        console.log("Server Response:", data);
        setUser(userData);

        // Store token in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ Redirect to homepage
        navigate("/");
    };

    const handleGuestLogin = () => {
        const guestUser = {
            googleId: null,
            email: "Guest@hungerArc.com", // No profile image for guest users
            guest: true
        };

        setUser(guestUser);

        localStorage.setItem("user", JSON.stringify(guestUser));
        console.log(localStorage.getItem("user"));
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