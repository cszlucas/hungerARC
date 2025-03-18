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

        // Send data to backend
        const res = await fetch("http://localhost:5000/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: credentialResponse.credential }),
        });

        const data = await res.json();
        console.log("Server Response:", data);
        setUser(data.user);

        // Store token in localStorage
        localStorage.setItem("token", data.token);

        // ✅ Redirect to homepage
        navigate("/");
    };

    const handleGuestLogin = () => {
        setUser({
            name: "Guest User",
            picture: null, // No profile image for guest users
        });
        navigate("/"); // Redirect guest users to homepage
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("token");
        navigate("/login"); // Redirect back to login page
    };

    return (
        <GoogleOAuthProvider clientId="600916289393-qfjvma6fnncebuv070vt2h9oddeuddhd.apps.googleusercontent.com">
            <Container maxWidth="sm" sx={{ textAlign: "center", mt: 8 }}>
                <Card elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Sign in with Google
                    </Typography>

                    {!user ? (
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
                    ) : (
                        <CardContent>
                            <Avatar 
                                src={user.picture || ""} 
                                alt="Profile" 
                                sx={{ width: 80, height: 80, margin: "auto", bgcolor: user.picture ? "transparent" : "grey.300" }}
                            >
                                {!user.picture && <AccountCircleIcon fontSize="large" />}
                            </Avatar>
                            <Typography variant="h6" mt={2}>
                                Welcome, {user.name}!
                            </Typography>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                sx={{ mt: 2 }}
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </CardContent>
                    )}
                </Card>
            </Container>
        </GoogleOAuthProvider>
    );
};

export default GoogleAuth;