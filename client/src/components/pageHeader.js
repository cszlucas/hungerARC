import React from "react";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useLocation, useParams } from "react-router-dom";

export default function PageHeader() {
  const location = useLocation();
  const { id } = useParams(); // Extracts the scenario ID from the URL
  const pathSegments = location.pathname.split("/");

  // Ensure we have at least three segments: ["", "scenarios", "{id}", "pageName"]
  const pageName = pathSegments.length >= 3 ? pathSegments[2] : "";

  // Helper function to check active route
  const isActive = (pages) => pages.includes(pageName);

  return (
    <Box sx={{ p: 2, mb: 2 }}>
      <Breadcrumbs separator="→" aria-label="breadcrumb">
        {/* Basic Info */}
        <Typography
          color={isActive(["basics"]) ? "primary" : "textPrimary"}
          fontWeight={isActive(["basics"]) ? "bold" : "normal"}
        >
          Basic Info
        </Typography>

        {/* Investments */}
        <Typography
          color={isActive(["investment_type", "investment_lists"]) ? "primary" : "textPrimary"}
          fontWeight={isActive(["investment_type", "investment_lists"]) ? "bold" : "normal"}
        >
          Investments
        </Typography>

        {/* Event Series */}
        <Typography
          color={isActive(["event_series_list", "invest", "expense", "income", "rebalance"]) ? "primary" : "textPrimary"}
          fontWeight={isActive(["event_series_list", "invest", "expense", "income", "rebalance"]) ? "bold" : "normal"}
        >
          Event Series
        </Typography>

        {/* Strategies */}
        <Typography
          color={isActive(["strategies"]) ? "primary" : "textPrimary"}
          fontWeight={isActive(["strategies"]) ? "bold" : "normal"}
        >
          Strategies
        </Typography>

        {/* Run Simulations */}
        <Typography
          color={isActive(["run_simulations"]) ? "primary" : "textPrimary"}
          fontWeight={isActive(["run_simulations"]) ? "bold" : "normal"}
        >
          Run Simulations
        </Typography>
      </Breadcrumbs>
    </Box>
  );
}
