import React, { useState, useContext, useMemo, useEffect } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Box, Grid, List, ListItem, ListItemText, IconButton, Button, Stack, Switch } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CustomDropdown from "../../components/customDropDown";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import PageHeader from "../../components/pageHeader";
import CustomInput from "../../components/customInputBox";
import { AppContext } from "../../context/appContext";
import { useNavigate } from "react-router-dom";
import { backContinueContainerStyles, buttonStyles, rowBoxStyles, stackStyles, titleStyles } from "../../components/styles";
import CustomSave from "../../components/customSaveBtn";
import axios from "axios";
import { AuthContext } from "../../context/authContext";

const TAX_MAP = {
  "non-retirement": "Taxable",
  "pre-tax": "Tax-Deferred",
  "after-tax": "Tax-Free",
};

const StrategyList = ({ list, setList, fieldName, setScenario }) => {
  const handleMove = (index, direction) => {
    const newList = [...list];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newList.length) {
      [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
      setList(newList);

      // Update `currScenario` with the new order
      setScenario((prev) => ({
        ...prev,
        [fieldName]: newList.map((item) => item.id),
      }));
    }
  };

  return (
    <>
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
              primary={
                <>
                  <span style={{ fontWeight: "bold" }}>{item.name}</span>
                </>
              }
              secondary={TAX_MAP[item.accountTaxStatus]}
            />

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
  const { currScenario, setCurrScenario, setScenarioData, currInvestments, currExpense, currInvestmentTypes, editMode } = useContext(AppContext);
  const [isRothOptimized, setIsRothOptimized] = useState(currScenario.optimizerSettings.enabled || false);
  const [startYear, setStartYear] = useState(currScenario.optimizerSettings?.startYear || "");
  const [endYear, setEndYear] = useState(currScenario.optimizerSettings?.endYear || "");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    setIsRothOptimized(currScenario.optimizerSettings.enabled);
  }, [currScenario.optimizerSettings.enabled]);

  const handleCurrScenarioChange = (field, value) => {
    const fieldParts = field.split("."); // Split the field into parts (e.g., "lifeExpectancy.mean")

    setCurrScenario((prev) => {
      // Update the nested object
      if (fieldParts.length === 2) {
        const [parent, child] = fieldParts; // 'lifeExpectancy' and 'mean'
        return {
          ...prev,
          [parent]: {
            // Spread the parent object (lifeExpectancy)
            ...prev[parent],
            [child]: value, // Update the child property (mean)
          },
        };
      }

      // For top-level fields (no dot notation)
      return {
        ...prev,
        [field]: value,
      };
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
        startYear: startYear,
        endYear: endYear,
      },
      isRothOptimized,
    };

    if (!user.guest) await axios.post(`${process.env.REACT_APP_API_URL}/updateScenario/${editMode}`, formValues);
    setScenarioData((prev) => prev.map((item) => (item._id === editMode ? currScenario : item)));
    // console.log(scenarioData);
    // console.log("Data successfully updated:", response.data);
  };

  const spendingStrategy = useMemo(() => {
    if (!Array.isArray(currExpense)) return [];

    return (currScenario.spendingStrategy ?? []).map((id) => {
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
    return strategyList.map((id) => {
      let matchedInvestment = null;

      for (let i = 0; i < currInvestments.length; i++) {
        if (String(currInvestments[i]._id) === String(id)) {
          matchedInvestment = currInvestments[i];
          break;
        }
      }

      if (!matchedInvestment) return { id, name: "Unknown Investment Strategy", accountTaxStatus: "" };

      let matchedInvestmentType = null;

      for (let j = 0; j < currInvestmentTypes.length; j++) {
        if (String(currInvestmentTypes[j]._id) === String(matchedInvestment.investmentType)) {
          matchedInvestmentType = currInvestmentTypes[j];
          break;
        }
      }

      return {
        id,
        name: matchedInvestmentType ? matchedInvestmentType.name : "Unknown Investment Type",
        accountTaxStatus: matchedInvestment.accountTaxStatus,
      };
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Strategies
          </Typography>
          <Button variant="contained" color="secondary" sx={buttonStyles} onClick={handleSave}>
            Save
          </Button>
        </Stack>

        <PageHeader />

        <Box sx={{ padding: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                Spending Strategy:
              </Typography>
              <StrategyList list={spendingStrategy} setList={() => {}} fieldName="spendingStrategy" setScenario={setCurrScenario} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                Expense Withdrawal Strategy:
              </Typography>
              <StrategyList list={expenseWithdrawalStrategy} setList={() => {}} fieldName="expenseWithdrawalStrategy" setScenario={setCurrScenario} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Roth Conversion Strategy:
                </Typography>
                <Switch
                  checked={isRothOptimized}
                  onChange={() => {
                    handleCurrScenarioChange("optimizerSettings.enabled", !isRothOptimized);
                  }}
                  color="secondary"
                />
              </Stack>
              {isRothOptimized && (
                <>
                  <StrategyList list={rothConversionStrategy} setList={() => {}} fieldName="rothConversionStrategy" setScenario={setCurrScenario} />
                  <Box sx={{ ...rowBoxStyles, mt: 2 }}>
                    <CustomDropdown
                      label="Start Year"
                      value={startYear}
                      setValue={(value) => {
                        setStartYear(value);
                        handleCurrScenarioChange("optimizerSettings.startYear", value);
                      }}
                      menuItems={Array.from({ length: 200 }, (_, i) => new Date().getFullYear() + i)}
                    />
                    <CustomDropdown
                      label="End Year"
                      value={endYear}
                      setValue={(value) => {
                        setEndYear(value);
                        handleCurrScenarioChange("optimizerSettings.endYear", value);
                      }}
                      menuItems={Array.from({ length: 200 }, (_, i) => new Date().getFullYear() + i)}
                    />
                  </Box>
                </>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                RMD Strategy:
              </Typography>
              <StrategyList list={rmdStrategy} setList={() => {}} fieldName="rmdStrategy" setScenario={setCurrScenario} />
            </Grid>
          </Grid>
        </Box>
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles} onClick={() => navigate("/scenario/event_series_list")}>
            Back
          </Button>
          <CustomSave label={"Finish"} routeTo={"/scenario/run_simulations"} />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Strategies;
