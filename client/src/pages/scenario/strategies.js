import React, { useState, useContext, useMemo } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Box, Grid, List, ListItem, ListItemText, IconButton, Button, Stack, Switch } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import PageHeader from "../../components/pageHeader";
import CustomInput from "../../components/customInputBox";
import { AppContext } from "../../context/appContext";
import { useNavigate } from "react-router-dom";
import {
  backContinueContainerStyles,
  buttonStyles,
  rowBoxStyles,
} from '../../components/styles';
import axios from 'axios';

const StrategyList = ({ title, list, setList, fieldName, setScenario, setScenarioData, currScenario, editMode }) => {
  const handleMove = (index, direction) => {
    const newList = [...list];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newList.length) {
      [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
      setList(newList);

      // Update `currScenario` with the new order
      setScenario(prev => ({
        ...prev,
        [fieldName]: newList.map(item => item.id),
      }));
    }
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
            <ListItemText primary={<span style={{ fontWeight: "bold" }}>{item.name}</span>} />

            {index > 0 && (
              <IconButton onClick={() => handleMove(index, -1)}>
                <ArrowUpwardIcon />
              </IconButton>
            )}

            {index < list.length - 1 && (
              <IconButton onClick={() => handleMove(index, 1)}>
                <ArrowDownwardIcon />
              </IconButton>
            )}
          </ListItem>
        ))}
      </List>
    </>
  );
};

const Strategies = () => {
  const navigate = useNavigate();
  const { currScenario, setCurrScenario, scenarioData, setScenarioData, currInvestments, currExpense, currInvestmentTypes, editMode } = useContext(AppContext);
  const [isRothOptimized, setIsRothOptimized] = useState(currScenario.isRothOptimized || false);
  const [startYear, setStartYear] = useState(currScenario.optimizerSettings?.startYear || "");
  const [endYear, setEndYear] = useState(currScenario.optimizerSettings?.endYear || "");

  // ✅ Toggle Handler for Roth Optimizer
  const handleToggleRothOptimizer = () => {
    setIsRothOptimized(prev => {
      const newValue = !prev;
      setCurrScenario(prevScenario => ({
        ...prevScenario,
        isRothOptimized: newValue,
      }));
      return newValue;
    });
  };

  const handleSave = async () => {
    let formValues = {
      spendingStrategy: currScenario.spendingStrategy,
      expenseWithdrawalStrategy: currScenario.expenseWithdrawalStrategy,
      rmdStrategy: currScenario.rmdStrategy,
      rothConversionStrategy: currScenario.rothConversionStrategy,
      optimizerSettings: {
        enabled: currScenario.optimizerSettings?.enabled,
        startYear: currScenario.optimizerSettings?.startYear,
        endYear: currScenario.optimizerSettings?.endYear
      },
      isRothOptimized
    };

    let response = await axios.post(`http://localhost:8080/updateScenario/${editMode}`, formValues);
    setScenarioData(prev => prev.map(item => (item._id === editMode ? currScenario : item)));

    console.log('Data successfully updated:', response.data);
  };

  const spendingStrategy = useMemo(() => {
    if (!Array.isArray(currExpense)) return [];

    return (currScenario.spendingStrategy ?? []).map(id => {
      let matchedExpense = null;

      for (let i = 0; i < currExpense.length; i++) {
        if (String(currExpense[i]._id) === String(id)) {
          matchedExpense = currExpense[i];
          break;
        }
      }

      return { id, name: matchedExpense ? matchedExpense.eventSeriesName : "Unknown Expense Strategy" };
    });
  }, [currScenario.spendingStrategy, currExpense]);

  const mapInvestmentsToNames = (strategyList) => {
    return strategyList.map(id => {
      let matchedInvestment = null;

      for (let i = 0; i < currInvestments.length; i++) {
        if (String(currInvestments[i]._id) === String(id)) {
          matchedInvestment = currInvestments[i];
          break;
        }
      }

      if (!matchedInvestment) return { id, name: "Unknown Investment Strategy" };

      let matchedInvestmentType = null;

      for (let j = 0; j < currInvestmentTypes.length; j++) {
        if (String(currInvestmentTypes[j]._id) === String(matchedInvestment.investmentType)) {
          matchedInvestmentType = currInvestmentTypes[j];
          break;
        }
      }

      return { id, name: matchedInvestmentType ? matchedInvestmentType.name : "Unknown Investment Type" };
    });
  };

  const expenseWithdrawalStrategy = useMemo(() => mapInvestmentsToNames(currScenario.expenseWithdrawalStrategy), [currScenario.expenseWithdrawalStrategy, currInvestments, currInvestmentTypes]);
  const rothConversionStrategy = useMemo(() => mapInvestmentsToNames(currScenario.rothConversionStrategy), [currScenario.rothConversionStrategy, currInvestments, currInvestmentTypes]);
  const rmdStrategy = useMemo(() => mapInvestmentsToNames(currScenario.rmdStrategy), [currScenario.rmdStrategy, currInvestments, currInvestmentTypes]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h2">Strategies</Typography>
          <Button variant="contained" color="secondary" onClick={handleSave}>Save</Button>
        </Stack>

        <PageHeader />

        <Box sx={{ padding: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <StrategyList title="Spending Strategy:" list={spendingStrategy} setList={() => {}} fieldName="spendingStrategy" setScenario={setCurrScenario} />
            </Grid>
            <Grid item xs={12} md={6}>
              <StrategyList title="Expense Withdrawal Strategy:" list={expenseWithdrawalStrategy} setList={() => {}} fieldName="expenseWithdrawalStrategy" setScenario={setCurrScenario} />
            </Grid>

            {/* ✅ Roth Strategy Toggle */}
            <Grid item xs={12} md={6}>
              <Stack direction="row" alignItems="center" sx={{ marginBottom: 2 }}>
                <Typography variant="h6">Roth Conversion Strategy:</Typography>
                <Switch checked={isRothOptimized} onChange={handleToggleRothOptimizer} color="secondary" />
              </Stack>

              {isRothOptimized && (
                <>
                  <StrategyList title="Roth Conversion Strategy:" list={rothConversionStrategy} setList={() => {}} fieldName="rothConversionStrategy" setScenario={setCurrScenario} />
                </>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <StrategyList title="RMD Strategy:" list={rmdStrategy} setList={() => {}} fieldName="rmdStrategy" setScenario={setCurrScenario} />
            </Grid>
          </Grid>
        </Box> 
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
