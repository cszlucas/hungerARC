import axios from "axios";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

import { AppContext } from "../context/appContext";
import { AuthContext } from "../context/authContext";
import { buttonStyles } from "./styles";

import { ObjectId } from "bson";

const CustomSave = ({ label = "Save", routeTo, color = "secondary", disable = false }) => {
  const { currScenario, setCurrScenario, setScenarioData, editMode, setEditMode } = useContext(AppContext);
  const { setCurrInvestmentTypes, setCurrInvestments } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  // Handles the save operation and post-save routing or actions
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const scenarioToSave = currScenario.name === ""
        ? { ...currScenario, name: "Untitled Scenario" }
        : currScenario;

      if (currScenario.name === "") {
        setCurrScenario(scenarioToSave);
      }

      await saveScenario(scenarioToSave);
    } catch (error) {
      console.error("Error:", error);
      alert("Something Went Wrong!");
    } finally {
      setIsSaving(false);
    }
  };

  // Persists a scenario to the backend or updates local state depending on edit mode and user status
  const saveScenario = async (scenario) => {
    try {
      if (editMode === "new") {
        let id = new ObjectId().toHexString();

        if (!user.guest) {
          console.log("Saving scenario for user, scenario:", scenario);
          const response = await axios.post("http://localhost:8080/basicInfo/", scenario, { withCredentials: true });
          id = response.data._id;
          console.log("Response from server:", response.data);
        }

        setCurrScenario((prev) => ({ ...prev, _id: id }));
        setScenarioData((prev) => [...prev, { ...scenario, _id: id }]);
        setEditMode(id);
        
        // await addCashInvestment(id);
      } else {
        if (!user.guest) await axios.post(`http://localhost:8080/updateScenario/${editMode}`, scenario, { withCredentials: true });
        setScenarioData((prev) => prev.map((item) => (item._id === editMode ? scenario : item)));
      } 
    } catch (error) {
      console.error("Error:", error);
      alert("Something Went Wrong!");
    } finally {
      // console.log(editMode);
      if (routeTo) navigate(routeTo); // now safely done after all updates
    }
  };

  return (
    <Button
      variant="contained"
      color={color}
      sx={buttonStyles}
      onClick={handleSave}
      disabled={isSaving || disable}
    >
      {label}
    </Button>
  );
};

export default CustomSave;
