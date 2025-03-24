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
import axios from 'axios';

// StrategyList Component
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
        [fieldName]: newList.map(item => item.id), // Update only the specific field in currScenario
      }));
      
      // setScenarioData((prev) => {
      //   let newList = prev.filter((item)=> item._id !== editMode)
      //   return [...newList, currScenario]
      // });
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
  const [isRothOptimized, setIsRothOptimized] = useState(false);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  console.log("currExpense:", currExpense);
  console.log("currInvestments:", currInvestments);
  console.log("currInvestmentTypes:", currInvestmentTypes);

  /**
   * Matches `spendingStrategy` IDs with names from `currExpense`
   */
  const handleSave = async () =>
  {
      let formValues = {
        spendingStrategy: currScenario.spendingStrategy,
        expenseWithdrawalStrategy: currScenario.expenseWithdrawalStrategy,
        rmdStrategy: currScenario.rmdStrategy,
        rothConversionStrategy: currScenario.rothConversionStrategy
      }
      // currScenario
      let response = await axios.post(`http://localhost:8080/updateScenario/${editMode}`, formValues);
      setScenarioData((prev) => {
        let newList = prev.filter((item)=> item._id !== editMode)
        return [...newList, currScenario]
      });

      console.log('Data successfully updated:', response.data);
  }

  const spendingStrategy = useMemo(() => {
    if (!Array.isArray(currExpense)) {
      console.warn("currExpense is not an array:", currExpense);
      return [];
    }

    return (currScenario.spendingStrategy ?? []).map(id => {
      let matchedExpense = null;
      
      // Manual for loop to find the matching expense
      for (let i = 0; i < currExpense.length; i++) {
        if (String(currExpense[i]._id) === String(id)) {
          matchedExpense = currExpense[i];
          break; // Stop searching once we find a match
        }
      }

      return { id, name: matchedExpense ? matchedExpense.eventSeriesName : "Unknown Expense Strategy" };
    });
  }, [currScenario.spendingStrategy, currExpense]);

  /**
   * Matches all other strategies with Investment names
   */
  const mapInvestmentsToNames = (strategyList) => {
    return strategyList.map(id => {
      let matchedInvestment = null;
      
      // Find the matching investment
      for (let i = 0; i < currInvestments.length; i++) {
        if (String(currInvestments[i]._id) === String(id)) {
          matchedInvestment = currInvestments[i];
          break;
        }
      }

      if (!matchedInvestment) return { id, name: "Unknown Investment Strategy" };

      let matchedInvestmentType = null;

      // Find the investment type name
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
        {/* Title and Save Button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h2" component="h1">
            Strategies
          </Typography>
          <Button variant="contained" color="secondary"onClick={handleSave}>Save</Button>
        </Stack>

        <PageHeader />

        <Box sx={{ padding: 4 }}>
          <Grid container spacing={4}>
            
            {/* Row 1 */}
            <Grid item xs={12} md={6}>
              <StrategyList title="Spending Strategy:" list={spendingStrategy} setList={() => {}} fieldName="spendingStrategy" setScenario={setCurrScenario} setScenarioData={setScenarioData} currScenario = {currScenario} editMode = {editMode} />
            </Grid>
            <Grid item xs={12} md={6}>
              <StrategyList title="Expense Withdrawal Strategy:" list={expenseWithdrawalStrategy} setList={() => {}} fieldName="expenseWithdrawalStrategy" setScenario={setCurrScenario} setScenarioData={setScenarioData} currScenario = {currScenario} editMode = {editMode} />
            </Grid>

            {/* Row 2 */}
            <Grid item xs={12} md={6}>
              <StrategyList title="Roth Conversion Strategy:" list={rothConversionStrategy} setList={() => {}} fieldName="rothConversionStrategy" setScenario={setCurrScenario} setScenarioData={setScenarioData} currScenario={currScenario} editMode = {editMode} />
            </Grid>

            <Grid item xs={12} md={6}>
              <StrategyList title="RMD Strategy:" list={rmdStrategy} setList={() => {}} fieldName="rmdStrategy" setScenario={setCurrScenario} setScenarioData={setScenarioData} currScenario={currScenario} editMode={editMode}/>
            </Grid>
          </Grid>
        </Box>

        {/* Back and Continue Buttons */}
        <Box>
          <Button variant="contained" color="primary" onClick={() => navigate("/scenario/event_series")}>
            Back
          </Button>

          <Button variant="contained" color="success" onClick={() => navigate("/scenario/run_simulations")}>
            Continue
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Strategies;


