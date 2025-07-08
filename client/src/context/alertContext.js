import React, { createContext, useContext, useState } from "react";
import { Alert, Box, Collapse } from "@mui/material";
import { v4 as uuidv4 } from "uuid";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, severity = "error") => {
    const id = uuidv4();
    setAlerts(prev => [...prev, { id, message, severity, open: true }]);
    setTimeout(() => closeAlert(id), 20000);
  };

  const closeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      
      {children}

      {/* Absolute container with stacking layout */}
      <Box
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1400,
          display: "flex",
          flexDirection: "column",
          gap: 1, // spacing between alerts
          width: "fit-content",
        }}
      >
        <Box sx={{mt: 8}}></Box>
        {alerts.map(alert => (
          <Collapse in={alert.open} key={alert.id}>
            <Alert
              onClose={() => closeAlert(alert.id)}
              severity={alert.severity}
              variant="filled"
              sx={{ width: 390, maxWidth: 600 }}
            >
              {alert.message}
            </Alert>
          </Collapse>
        ))}
      </Box>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
