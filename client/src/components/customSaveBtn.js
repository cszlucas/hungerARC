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
  
      if (editMode === "new") {
        const response = await axios.post("http://localhost:8080/basicInfo", currScenario);
        const id = response.data._id;
  
        // Use the callback form of setState to avoid stale values
        setCurrScenario((prev) => ({...prev, _id: id, }));
        setScenarioData((prev) => [...prev, { ...currScenario, _id: id }]);
        setEditMode(id);
      } else {
        const response = await axios.post(`http://localhost:8080/updateScenario/${editMode}`, currScenario);
  
        // Update scenario data
        setScenarioData((prev) => {
          const newList = prev.map((item) => 
            item._id === editMode ? currScenario : item
          );
          return newList;
        });
        console.log("Data successfully updated:", response.data);
      }
  
      // alert("Save data");
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
