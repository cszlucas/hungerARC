import React, { createContext, useState, useEffect } from "react";

// Create Context
export const AppContext = createContext();

// Context Provider Component
export const AppProvider = ({ children }) => {
  // Retrieve data from localStorage or set default state
  const initialState = JSON.parse(localStorage.getItem("data")) || {
    name: "John Doe",
    theme: "light",
  };

  const [data, setData] = useState(initialState);

  // Sync localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("data", JSON.stringify(data));
  }, [data]);

  return (
    <AppContext.Provider value={{ data, setData }}>
      {children}
    </AppContext.Provider>
  );
};
