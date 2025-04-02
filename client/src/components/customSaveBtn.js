import axios from "axios";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

import { AppContext } from "../context/appContext";
import { buttonStyles } from "./styles";

const CustomSave = ({ label = "Save", routeTo, color = "secondary" }) => {
  const { currScenario, setCurrScenario, scenarioData, setScenarioData, editMode, setEditMode } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSave = async () => {
    try {
      console.log("editMode: ", editMode);
  
      if (currScenario.name === "") {
        // Use the callback function of setState to ensure the update is applied before proceeding
        setCurrScenario((prev) => {
          const updatedScenario = { ...prev, name: "Untitled Scenario" };
          // Proceed with API request only AFTER state is updated
          saveScenario(updatedScenario);
          return updatedScenario;
        });
      } else {
        saveScenario(currScenario);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something Went Wrong!");
    }
  };
  
  // Extract the saving logic into a separate function
  const saveScenario = async (scenario) => {
    try {
      if (editMode === "new") {
        const response = await axios.post("http://localhost:8080/basicInfo", scenario);
        const id = response.data._id;
  
        setCurrScenario((prev) => ({ ...prev, _id: id }));
        setScenarioData((prev) => [...prev, { ...scenario, _id: id }]);
        setEditMode(id);
      } else {
        const response = await axios.post(`http://localhost:8080/updateScenario/${editMode}`, scenario);
  
        setScenarioData((prev) =>
          prev.map((item) => (item._id === editMode ? scenario : item))
        );
  
        console.log("Data successfully updated:", response.data);
      }
  
      if (routeTo) navigate(routeTo);
      console.log("Data has been saved");
    } catch (error) {
      console.error("Error:", error);
      alert("Something Went Wrong!");
    }
  };
  

  return (
    <Button 
      variant="contained" 
      color={color}
      sx={buttonStyles}
      onClick={handleSave}
    >
      {label}
    </Button>
  );
};

export default CustomSave;
