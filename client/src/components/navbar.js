import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch"; // MUI Switch for light/dark mode toggle

export default function NavBar({ currentPage }) {
  const [open, setOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = (state) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setOpen(state);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleThemeToggle = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const menuItems = ["Profile", "Scenarios"];

  const DrawerList = (
    <Box
      sx={{
        width: 250,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      role="presentation"
      onClick={(e) => e.stopPropagation()}  // 👈 Prevent closing when clicking inside
    >
      {/* Top Section */}
      <List>
        {menuItems.map((text) => {
          const isCurrent = currentPage.toLowerCase() === text.toLowerCase();
          const routePath = `/${text.toLowerCase()}`;

          return (
            <ListItem key={text} disablePadding>
              {isCurrent ? (
                <Box
                  sx={{
                    backgroundColor: "#424242",
                    color: "#fff",
                    width: "100%",
                    padding: "10px 16px",
                  }}
                >
                  <ListItemText primary={text} />
                </Box>
              ) : (
                <Link
                  to={routePath}
                  style={{ textDecoration: "none", color: "inherit", width: "100%" }}
                >
                  <ListItem button>
                    <ListItemText primary={text} />
                  </ListItem>
                </Link>
              )}
            </ListItem>
          );
        })}
      </List>

      {/* Bottom Section */}
      <Box>
        <Divider />
        <List>
          {/* Theme Toggle */}
          <ListItem disablePadding>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%", padding: "10px 16px" }}>
              <ListItemText primary={isDarkMode ? "Dark Mode" : "Light Mode"} />
              <Switch
                checked={isDarkMode}
                onChange={handleThemeToggle}
                color="primary"
              />
            </Box>
          </ListItem>

          {/* Logout */}
          <ListItem disablePadding>
            <ListItem button onClick={handleLogout}>
              <ListItemText primary={"Logout"} />
            </ListItem>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, marginTop: 2, marginBottom: 2 }}>
            Hunger <span style={{ color: "#00825B" }}>Finance</span>
          </Typography>
          { currentPage != "login" &&
          <IconButton edge="end" color="inherit" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
          }
        </Toolbar>
      </AppBar>
      { currentPage != "login" &&
      <Drawer anchor="right" open={open} onClose={toggleDrawer(false)} onClick={(e) => e.stopPropagation()}>
        {DrawerList}
      </Drawer> 
      } 
    </>
  );
}
