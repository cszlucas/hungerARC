import React, { useContext, useState } from "react";
import { Box, Breadcrumbs, Link as MUILink } from "@mui/material";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../context/appContext";
import { AuthContext } from "../context/authContext";
import { ObjectId } from "bson";
import axios from "axios";

export default function PageHeader() {
  const { currScenario, setCurrScenario, setScenarioData, editMode, setEditMode } = useContext(AppContext);
  const { setCurrInvestmentTypes, setCurrInvestments } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const [isSaving, setIsSaving] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pathSegments = location.pathname.split("/");
  const pageName = pathSegments.length >= 3 ? pathSegments[2] : "";

  const isActive = (pages) => pages.includes(pageName);

  const handleNavigation = (to) => {
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
            const response = await axios.post("http://localhost:8080/basicInfo/", scenario, { withCredentials: true });
            id = response.data._id;
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
        navigate(to);
      }
    };

    handleSave();
  };

  const crumbItems = [
    {
      label: "Basic Info",
      to: "/scenario/basics",
      match: ["basics"],
    },
    {
      label: "Investments",
      to: "/scenario/investment_lists",
      match: ["investment_type", "investment_lists"],
    },
    {
      label: "Event Series",
      to: "/scenario/event_series_list",
      match: ["event_series_list", "invest", "expense", "income", "rebalance"],
    },
    {
      label: "Strategies",
      to: "/scenario/strategies",
      match: ["strategies"],
    },
    {
      label: "Run Simulations",
      to: "/scenario/run_simulations",
      match: ["run_simulations"],
    },
  ];

  return (
    <Box sx={{ p: 2, mb: 2 }}>
      <Breadcrumbs separator="→" aria-label="breadcrumb">
        {crumbItems.map(({ label, to, match }) => (
          <MUILink
            key={label}
            component="button"
            onClick={() => handleNavigation(to)}
            color={isActive(match) ? "primary" : "textPrimary"}
            underline="hover"
            fontWeight={isActive(match) ? "bold" : "normal"}
            sx={{ cursor: "pointer" }}
          >
            {label}
          </MUILink>
        ))}
      </Breadcrumbs>
    </Box>
  );
}
