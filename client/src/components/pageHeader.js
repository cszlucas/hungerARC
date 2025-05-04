import React from "react";
import { Box, Breadcrumbs, Link as MUILink } from "@mui/material";
import { Link, useLocation, useParams } from "react-router-dom";

export default function PageHeader() {
  const location = useLocation();
  const { id } = useParams(); // Extracts the scenario ID from the URL
  const pathSegments = location.pathname.split("/");

  // Extract current page segment
  const pageName = pathSegments.length >= 3 ? pathSegments[2] : "";

  const isActive = (pages) => pages.includes(pageName);

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
            component={Link}
            to={to}
            color={isActive(match) ? "primary" : "textPrimary"}
            underline="hover"
            fontWeight={isActive(match) ? "bold" : "normal"}
          >
            {label}
          </MUILink>
        ))}
      </Breadcrumbs>
    </Box>
  );
}
