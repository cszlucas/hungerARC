import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const rawData = localStorage.getItem("user");
    console.log(rawData);
    const [user, setUser] = useState((rawData != "undefined" ? JSON.parse(rawData) : null));
    
    useEffect(() => {
        // Load user data from localStorage
        localStorage.setItem("user", JSON.stringify(user));
    }, [user]);
    
    // const logout = () => {
    //     localStorage.removeItem("edit");
    //     localStorage.clear();
    //     setUser(null);
    // };

    return (
        <AuthContext.Provider value={{ user, setUser}}>
            {children}
        </AuthContext.Provider>
    );
};
