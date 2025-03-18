import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";

export default function NavBar({ currentPage }) {
  const [open, setOpen] = useState(false);

  const toggleDrawer = (state) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setOpen(state);
  };

  const menuItems = ["Profile", "Senario", "Login"];
  const bottomItems = ["Light/Dark Mode", "Logout"];

  const DrawerList = (
    <Box
      sx={{ width: 250, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
      role="presentation"
      onClick={toggleDrawer(false)}
    >
      {/* Top Section */}
      <List>
        {menuItems.map((text) => {
          const isCurrent = currentPage.toLowerCase() === text.toLowerCase();
          const routePath = `/${text.toLowerCase()}`;

          return (
            <ListItem key={text} disablePadding>
              {isCurrent ? (
                <ListItemButton
                  disabled
                  sx={{
                    backgroundColor: "#424242",
                    color: "#fff",
                    "&:hover": { backgroundColor: "#424242" }
                  }}
                >
                  <ListItemText primary={text} />
                </ListItemButton>
              ) : (
                <Link
                  to={routePath}
                  style={{ textDecoration: "none", color: "inherit", width: "100%" }}
                >
                  <ListItemButton>
                    <ListItemText primary={text} />
                  </ListItemButton>
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
          {bottomItems.map((text) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Hunger <span style={{ color: "#00825B" }}>Finance</span>
          </Typography>
          <IconButton edge="end" color="inherit" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
        {DrawerList}
      </Drawer>
    </>
  );
}
