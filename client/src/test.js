import React from "react";
import { Button } from "@mui/material";
import { useAlert } from "./context/alertContext";

function SomeComponent() {
  const { showAlert } = useAlert();

  const triggerAlerts = () => {
    showAlert("Success message Success messageSuccess messageSuccess messageSuccess messageSuccess messageSuccess messageSuccess messageSuccess messageSuccess message", "success");
    showAlert("Warning message", "warning");
    showAlert("Error occurred!", "error");
  };

  return <Button onClick={triggerAlerts}>Trigger Alerts</Button>;
}

export default SomeComponent;
