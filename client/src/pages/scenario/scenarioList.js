import React, { useState, useContext } from "react";
import {
    ThemeProvider,
    CssBaseline,
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Box,
    Button
} from "@mui/material";
import { AppContext, defaultInfo } from "../../context/appContext";
import { AuthContext } from "../../context/authContext";
import EditIcon from "@mui/icons-material/Edit";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import { useNavigate } from "react-router-dom";
import yaml from "js-yaml";
import axios from "axios";

const ScenarioList = () => {
    // const [ selectedScenario, setSelectedScenario] = useState(null); // Track selected scenario
    const { scenarioData, setScenarioData, setEditMode, setCurrScenario, setCurrInvestments, setCurrIncome, setCurrExpense, setCurrInvest, setCurrRebalance, setCurrInvestmentTypes } = useContext(AppContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    console.log(user);

    function parseScenarioYAML(yamlObject) {
        const {
          name,
          maritalStatus,
          birthYears,
          lifeExpectancy,
          investmentTypes,
          investments,
          eventSeries,
          inflationAssumption,
          afterTaxContributionLimit,
          spendingStrategy,
          expenseWithdrawalStrategy,
          RMDStrategy,
          RothConversionOpt,
          RothConversionStart,
          RothConversionEnd,
          RothConversionStrategy,
          financialGoal,
          residenceState,
        } = yamlObject;
      
        const frontendInvestmentTypes = investmentTypes.map(t => ({
          name: t.name,
          description: t.description,
          expenseRatio: String(t.expenseRatio),
          taxability: t.taxability,
          annualReturn: {
            unit: t.returnAmtOrPct,
            type: t.returnDistribution.type,
            value: t.returnDistribution.value ?? "",
            mean: t.returnDistribution.mean ?? "",
            stdDev: t.returnDistribution.stdev ?? "",
          },
          annualIncome: {
            unit: t.incomeAmtOrPct,
            type: t.incomeDistribution.type,
            value: t.incomeDistribution.value ?? "",
            mean: t.incomeDistribution.mean ?? "",
            stdDev: t.incomeDistribution.stdev ?? "",
          }
        }));
      
        const frontendInvestments = investments.map(inv => ({
          investmentType: inv.investmentType,
          value: inv.value,
          accountTaxStatus: inv.taxStatus,
          id: inv.id,
        }));
      
        const income = [], expense = [], invest = [], rebalance = [];
      
        for (const e of eventSeries) {
          const base = {
            eventSeriesName: e.name,
            startYear: {
              type: e.start.type,
              value: e.start.value ?? null,
              mean: e.start.mean ?? null,
              stdDev: e.start.stdev ?? null,
              min: e.start.lower ?? null,
              max: e.start.upper ?? null,
              refer:  e.start.eventSeries ?? null,
            },
            duration: {
              type: e.duration.type,
              value: e.duration.value ?? null,
              mean: e.duration.mean ?? null,
              stdDev: e.duration.stdev ?? null,
              min: e.duration.lower ?? null,
              max: e.duration.upper ?? null,
            },
          };
          if (e.type === "income") {
            income.push({
              ...base,
              initialAmount: e.initialAmount,
              annualChange: parseChange(e),
              userPercentage: e.userFraction,
              inflationAdjustment: e.inflationAdjusted,
              isSocialSecurity: e.socialSecurity,
            });
          } else if (e.type === "expense") {
            expense.push({
              ...base,
              initialAmount: e.initialAmount,
              annualChange: parseChange(e),
              userPercentage: e.userFraction,
              inflationAdjustment: e.inflationAdjusted,
              isDiscretionary: e.discretionary,
            });
          } else if (e.type === "invest") {
            const allocType = e.glidePath ? "glidePath" : "fixed";
            invest.push({
              ...base,
              maxCash: e.maxCash,
              assetAllocation: {
                type: allocType,
                fixedPercentages: allocType === "fixed" ? e.assetAllocation : {},
                initialPercentages: allocType === "glidePath" ? e.assetAllocation : {},
                finalPercentages: allocType === "glidePath" ? e.assetAllocation2 : {},
              }
            });
          } else if (e.type === "rebalance") {
            const isGlide = !!e.glidePath;
            rebalance.push({
              ...base,
              taxStatus: "", // not present in YAML
              rebalanceAllocation: {
                type: isGlide ? "glidePath" : "fixed",
                fixedPercentages: !isGlide ? e.assetAllocation : {},
                initialPercentages: isGlide ? e.assetAllocation : {},
                finalPercentages: isGlide ? e.assetAllocation2 : {},
              }
            });
          }
        }
      
        return {
          _id: `${name.replace(/\s/g, "-")}-${Date.now()}`, // fake unique ID
          name,
          filingStatus: maritalStatus === "couple" ? "married" : "single",
          birthYearUser: birthYears[0],
          birthYearSpouse: birthYears[1] ?? null,
          // lifeExpectancy,
          lifeExpectancy: {
            type: lifeExpectancy[0].type,
            fixedAge: lifeExpectancy[0].value ?? null,
            mean: lifeExpectancy[0].mean ?? null,
            stdDev: lifeExpectancy[0].stdev ?? null,
          },
          lifeExpectancySpouse: {
            type: lifeExpectancy[1]?.type ?? "fixed",
            fixedAge: lifeExpectancy[1]?.value ?? null,
            mean: lifeExpectancy[1]?.mean ?? null,
            stdDev: lifeExpectancy[1]?.stdev ?? null,
          },          
          setOfinvestmentTypes: frontendInvestmentTypes,
          setOfinvestments: frontendInvestments,
          income,
          expense,
          invest,
          rebalance,
          inflationAssumption: {
            type: inflationAssumption.type,
            fixedRate: inflationAssumption.value ?? null,
            mean: inflationAssumption.mean ?? null,
            stdDev: inflationAssumption.stdev ?? null,
            min: inflationAssumption.min ?? null,
            max: inflationAssumption.max ?? null,
          },
          irsLimit: afterTaxContributionLimit,
          spendingStrategy,
          expenseWithdrawalStrategy,
          rmdStrategy: RMDStrategy,
          optimizerSettings: {
            enabled: RothConversionOpt,
            startYear: RothConversionStart,
            endYear: RothConversionEnd,
          },
          rothConversionStrategy: RothConversionStrategy,
          financialGoal,
          stateResident: residenceState,
        };
    }
      
    function parseChange(e) {
    const dist = e.changeDistribution || {};
    return {
        type: e.changeAmtOrPct,
        amount: dist.value ?? "",
        distribution: dist.type === "fixed" ? "none" : dist.type,
        mean: dist.mean ?? "",
        stdDev: dist.stdev ?? "",
        min: dist.lower ?? "",
        max: dist.upper ?? "",
    };
    }

    const handleYAMLImportFile = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
              const raw = yaml.load(ev.target.result);
              const parsed = parseScenarioYAML(raw);
              console.log("✅ Parsed YAML:", parsed);
              const response = await axios.post(`http://localhost:8080/importScenario/user/${user._id}`, parsed);
              console.log(response);

              setScenarioData((prev) => [...(prev || []), response.data.scenario]);
            } catch (err) {
              console.error("❌ YAML import failed:", err);
            }
        };
        reader.readAsText(file);
    };

    const handleNewScenario = async () => {
        // Reset the app state for a new scenario
        setEditMode("new");
        setCurrScenario(defaultInfo);
        setCurrInvestments([]);
        setCurrInvestmentTypes([]);
        setCurrIncome([]);
        setCurrExpense([]);
        setCurrInvest([]);
        setCurrRebalance([]);

        // Navigate to the scenario basics form
        navigate("/scenario/basics");
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={"scenarios"} />
            <Container>
                <Typography
                    variant="h2"
                    component="h1"
                    gutterBottom
                    sx={{ marginTop: 6, marginBottom: 2, fontWeight: "bold" }}
                >
                    Your Financial Journey
                </Typography>

                <Typography
                    variant="h6"
                    component="h5"
                    gutterBottom
                    sx={{ marginBottom: 1 }}
                >
                    Make a New Scenario
                </Typography>

                <Button
                    variant="contained"
                    sx={{ marginBottom: 6, textTransform: "none" }}
                    onClick={handleNewScenario}
                    disabled={user.guest && scenarioData.length > 1}
                >
                    New Scenario
                </Button>

                <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
                    <Typography variant="h6" component="h5" sx={{ marginRight: 2 }}>
                        Existing Scenarios
                    </Typography>
                    <input
                        type="file"
                        accept=".yaml"
                        id="yaml-upload"
                        style={{ display: "none" }}
                        onChange={handleYAMLImportFile}
                        disabled={user.guest}
                    />
                    <label htmlFor="yaml-upload">
                      <Button
                          variant="contained"
                          component="span"
                          sx={{ marginRight: 2, textTransform: "none" }}
                          disabled={user.guest}
                      >
                          Import
                      </Button>
                    </label>
                    <Button 
                        variant="contained" 
                        color="secondary" // Uses the theme's secondary color
                        sx={{ textTransform: "none" }}
                        disabled={user.guest}
                    >
                        Share
                    </Button>
                </Box>

                <Box sx={{ display: "flex" }}>
                    <Box sx={{ width: "45%" }}>
                        <List>
                            {scenarioData != null && scenarioData.map((plan, index) => (
                                <ListItem
                                    key={plan._id}
                                    sx={{
                                        backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
                                        "&:hover": {
                                            backgroundColor: "#B0B0B0"
                                        },
                                    }}
                                >
                                    <ListItemText
                                        primary={<span style={{ fontWeight: "bold" }}>{plan.name}</span>}
                                        secondary={`Goal: $${plan.financialGoal}`}
                                    />
                                    <IconButton
                                        edge="end"
                                        aria-label="edit"
                                        onClick={() => {
                                            setEditMode(plan._id); // Set edit mode to current plan ID
                                            navigate("/scenario/basics");
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default ScenarioList;
