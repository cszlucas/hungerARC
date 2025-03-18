import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {jwtDecode} from "jwt-decode";

const GoogleAuth = () => {
    const [user, setUser] = useState(null);

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

        // Store token in localStorage (Optional)
        localStorage.setItem("token", data.token);
    };

    return (
        <GoogleOAuthProvider clientId="600916289393-qfjvma6fnncebuv070vt2h9oddeuddhd.apps.googleusercontent.com">
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h1>Sign in with Google</h1>
                {!user ? (
                    <GoogleLogin onSuccess={handleSuccess} onError={() => alert("Login Failed")} />
                ) : (
                    <div>
                        <h2>Welcome, {user.name}!</h2>
                        <img src={user.picture} alt="Profile" style={{ borderRadius: "50%" }} />
                    </div>
                )}
            </div>
        </GoogleOAuthProvider>
    );
};

export default GoogleAuth;