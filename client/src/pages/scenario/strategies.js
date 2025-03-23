import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Box, Grid, Paper, List, ListItem, ListItemText, IconButton, Button, Stack } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import PageHeader from "../../components/pageHeader";

import {
    stackStyles,
    titleStyles,
    textFieldStyles,
    numFieldStyles,
    toggleButtonGroupStyles,
    backContinueContainerStyles,
    buttonStyles,
    rowBoxStyles,
  } from '../../components/styles';  // Import your modular styles
  

import { useNavigate } from "react-router-dom";


const StrategyList = ({ title, list, setList }) => {
  const handleMove = (index, direction) => {
    const newList = [...list];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newList.length) {
      [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
      setList(newList);
    }
  };

  const handleRemove = (index) => {
    const newList = list.filter((_, i) => i !== index);
    setList(newList);
  };

  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
        {title}
      </Typography>
      <List>
        {list.map((item, index) => (
          <ListItem
            key={item.id}
            sx={{
              backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
              "&:hover": { backgroundColor: "#B0B0B0" },
            }}
          >
            <ListItemText
              primary={<span style={{ fontWeight: "bold" }}>{item.name}</span>}
            />

            {/* Move Up Button (Not for first item) */}
            {index > 0 && (
              <IconButton onClick={() => handleMove(index, -1)}>
                <ArrowUpwardIcon />
              </IconButton>
            )}

            {/* Move Down Button (Not for last item) */}
            {index < list.length - 1 && (
              <IconButton onClick={() => handleMove(index, 1)}>
                <ArrowDownwardIcon />
              </IconButton>
            )}

            {/* Delete Button */}
            <IconButton onClick={() => handleRemove(index)}>
            </IconButton>
          </ListItem>
        ))}
      </List>
    </>
  );
};


const Strategies = () => {
  const navigate = useNavigate();

  const [spendingStrategy, setSpendingStrategy] = useState([
    { id: 1, name: "Conservative Spending" },
    { id: 2, name: "Moderate Spending" },
    { id: 3, name: "Aggressive Spending" }
  ]);
  
  const [expenseWithdrawalStrategy, setExpenseWithdrawalStrategy] = useState([
    { id: 1, name: "Proportional Withdrawal" },
    { id: 2, name: "Fixed Percentage Withdrawal" },
    { id: 3, name: "Bucket Strategy" }
  ]);
  
  const [rothConversionStrategy, setRothConversionStrategy] = useState([
    { id: 1, name: "Annual Conversion" },
    { id: 2, name: "Tax-Bracket Based Conversion" },
    { id: 3, name: "Lump-Sum Conversion" }
  ]);
  
  const [rmdStrategy, setRmdStrategy] = useState([
    { id: 1, name: "Standard IRS Schedule" },
    { id: 2, name: "Qualified Longevity Annuity Contract (QLAC)" },
    { id: 3, name: "Charitable RMDs" }
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={''} />
      <Container>

        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Strategies
          </Typography>
          <Button variant="contained" color="secondary" sx={buttonStyles}>
            Save
          </Button>
        </Stack>

        <PageHeader />
        

        <Box sx={{ padding: 4 }}>
          <Grid container spacing={4}>
            {/* Row 1 */}
            <Grid item xs={12} md={6}>
              <StrategyList title="Spending Strategy:" list={spendingStrategy} setList={setSpendingStrategy} />
            </Grid>
            <Grid item xs={12} md={6}>
              <StrategyList title="Expense Withdrawal Strategy:" list={expenseWithdrawalStrategy} setList={setExpenseWithdrawalStrategy} />
            </Grid>

            {/* Row 2 */}
            <Grid item xs={12} md={6}>
              <StrategyList title="Roth Conversion Strategy:" list={rothConversionStrategy} setList={setRothConversionStrategy} />
            </Grid>
            <Grid item xs={12} md={6}>
              <StrategyList title="RMD Strategy:" list={rmdStrategy} setList={setRmdStrategy} />
            </Grid>
          </Grid>
        </Box>


        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles}
            onClick={() => navigate("/scenario/event_series")}
          >
            Back
          </Button>

          <Button variant="contained" color="success" sx={buttonStyles}
            onClick={() => navigate("/scenario/run_simulations")}
          >
            Continue
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Strategies;