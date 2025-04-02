import axios from "axios";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

import { AppContext } from "../context/appContext";
import { AuthContext } from "../context/authContext";
import { buttonStyles } from "./styles";

const CustomSave = ({ label = "Save", routeTo, color = "secondary" }) => {
  // Access global state for scenarios and user authentication
  const { currScenario, setCurrScenario, scenarioData, setScenarioData, editMode, setEditMode } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Handles save logic when the button is clicked
  const handleSave = async () => {
    try {
      console.log("editMode: ", editMode);
  
      if (currScenario.name === "") {
        // Ensure the scenario has a valid name before saving
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
  
  // Function to save or update a scenario based on edit mode
  const saveScenario = async (scenario) => {
    try {
      if (editMode === "new") {
        let id = 0;

        if (!user.guest) {
          // If the user is not a guest, send a request to create a new scenario
          const response = await axios.post("http://localhost:8080/basicInfo", scenario);
          id = response.data._id;
        } else {
          // If the user is a guest, assign a temporary ID
          id = scenarioData.length;
        }
  
        // Update the state with the newly created scenario
        setCurrScenario((prev) => ({ ...prev, _id: id }));
        setScenarioData((prev) => [...prev, { ...scenario, _id: id }]);
        setEditMode(id);
      } else {
        // If the scenario already exists, update it in the backend
        if (!user.guest) {
          await axios.post(`http://localhost:8080/updateScenario/${editMode}`, scenario);
        }

        // Update scenario list in state
        setScenarioData((prev) =>
          prev.map((item) => (item._id === editMode ? scenario : item))
        );
      }
  
      // Navigate to the specified route if provided
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
