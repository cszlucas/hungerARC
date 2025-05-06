// pages/login.js
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { ThemeProvider, Container, Typography, Button, Box, Stack } from "@mui/material";
import { AuthContext } from "../context/authContext";
import theme from "../components/theme";
import Navbar from "../components/navbar";

const GoogleAuth = () => {
    const { setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleAllRoutes = async () => {
        await fetch("http://localhost:8080/handleAllRoutes", { method: "GET" });
        // console.log((await response.json()));
    };
    
    handleAllRoutes();
    
    const handleSuccess = async (credentialResponse) => {
        const decodedToken = jwtDecode(credentialResponse.credential);
        const userData = {
            googleId: decodedToken.sub,
            email: decodedToken.email,
            guest: false,
        };

        const res = await fetch("http://localhost:8080/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
            credentials: "include", // send cookie
        });

        if (res.ok) {
            const data = await res.json();
            // console.log(data);
            setUser(data);
            navigate("/profile");
        } else {
            alert("Login failed");
        }
    };

    const handleGuestLogin = async () => {
        const res = await fetch("http://localhost:8080/auth/guest", {
            method: "POST",
            credentials: "include",
        });

        if (res.ok) {
            const data = await res.json();
            setUser(data);
            navigate("/profile");
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Navbar currentPage={"login"} />
            <GoogleOAuthProvider clientId="600916289393-qfjvma6fnncebuv070vt2h9oddeuddhd.apps.googleusercontent.com">
                <Container sx={{ textAlign: "center", mt: 8 }}>
                    <Typography variant="h2" sx={{ mt: 20, fontWeight: "bold" }}>
                        Welcome to Hunger <span style={{ color: "#00825B" }}>Finance</span>
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 4, mb: 10 }}>
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
                                sx={{ textTransform: "none" }}
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
