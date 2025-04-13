import React, { useState, useContext } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, List, ListItem, ListItemText, IconButton, Box, Button } from "@mui/material";
import { AppContext, defaultInfo } from "../../context/appContext";
import EditIcon from "@mui/icons-material/Edit";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import { useNavigate } from "react-router-dom";
import yaml from "js-yaml";

const ScenarioList = () => {
    const [ selectedScenario, setSelectedScenario] = useState(null); // Track selected scenario
    const { scenarioData, setScenarioData, setEditMode, setCurrScenario, setCurrInvestments, setCurrIncome, setCurrExpense, setCurrInvest, setCurrRebalance, setCurrInvestmentTypes } = useContext(AppContext);
    const navigate = useNavigate();

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
            startYear: e.start,
            duration: e.duration,
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
          filingStatus: maritalStatus === "couple" ? "couple" : "single",
          birthYearUser: birthYears[0],
          birthYearSpouse: birthYears[1] ?? null,
          lifeExpectancy,
          setOfinvestmentTypes: frontendInvestmentTypes,
          setOfinvestments: frontendInvestments,
          income,
          expense,
          invest,
          rebalance,
          inflationAssumption,
          irsLimit: { initialAfterTax: afterTaxContributionLimit },
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
      

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline /> {/* Applies global styles based on the theme */}
            <Navbar currentPage={"scenarios"} />
            <Container>
                {/* Title with margin-top and bold style */}
                <Typography 
                    variant="h2" 
                    component="h1" 
                    gutterBottom 
                    sx={{ marginTop: 6, marginBottom: 2, fontWeight: "bold" }} // Added margin-top and bold style
                >
                    Your Financial Journey! 🎉
                </Typography>

                <Typography 
                    variant="h6" 
                    component="h5" 
                    gutterBottom 
                    sx={{ marginTop: 0, marginBottom: 1 }} // Added margin-top and bold style
                >
                    Make a New Scenario!
                </Typography>
                <Button 
                    variant="contained"
                    sx={{ marginTop: 0, marginBottom: 6, textTransform: "none" }}
                    onClick={() => { 
                        setEditMode("new");
                        setCurrScenario(defaultInfo);
                        setCurrInvestments([]);
                        setCurrIncome([]);
                        setCurrExpense([]);
                        setCurrInvest([]);
                        setCurrRebalance([]);
                        setCurrInvestmentTypes([]);
                        navigate("/scenario/basics");
                    }}
                >
                    New Scenario
                </Button>

                {/* Existing Scenarios Section */}
                <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
                    <Typography variant="h6" component="h5" sx={{ marginRight: 2 }}>
                        Existing Scenarios
                    </Typography>
                    <input
                    type="file"
                    accept=".yaml"
                    id="yaml-upload"
                    style={{ display: "none" }}
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = (ev) => {
                        try {
                            const raw = yaml.load(ev.target.result);
                            const parsed = parseScenarioYAML(raw);
                            console.log("✅ Parsed YAML:", parsed);
                            setScenarioData(prev => [...(prev || []), parsed]);
                        } catch (err) {
                            console.error("❌ YAML import failed:", err);
                        }
                        };
                        reader.readAsText(file);
                    }}
                    />

                    <label htmlFor="yaml-upload">
                    <Button
                        variant="contained"
                        component="span"
                        sx={{ marginRight: 2, textTransform: "none" }}
                    >
                        Import
                    </Button>
                    </label>
                    <Button 
                        variant="contained" 
                        color="secondary" // Uses the theme's secondary color
                        sx={{ textTransform: "none" }}
                        >
                        Share
                    </Button>
                </Box>

                {/* List of Scenarios, limited to 50% width */}
                <Box sx={{ display: "flex" }}>
                    {/* Left Box for List */}
                    <Box sx={{ width: "45%" }}>
                        <List>
                            {scenarioData != null && scenarioData.map((plan, index) => (
                                <ListItem 
                                    key={plan.name} 
                                    sx={{
                                        backgroundColor: selectedScenario === plan.name ? "#A2E7D2" : (index % 2 === 0 ? "#BBBBBB" : "#D9D9D9"), // Highlight selected item
                                        "&:hover": {
                                            backgroundColor: selectedScenario !== plan.name ? "#B0B0B0" : "#A2E7D2", // Hover effect
                                        },
                                    }}
                                    //   onClick={() => handleSelectScenario(plan.name)} // Set the selected scenario
                                >
                                    <ListItemText
                                        primary={<span style={{ fontWeight: "bold" }}>{plan.name}</span>} // Bold primary text
                                        secondary={`Goal: $${plan.financialGoal}`} // Display the formatted date
                                    />
                                    <IconButton // Handle Edit Mode
                                        edge="end" 
                                        aria-label="edit" 
                                        onClick={() => {
                                            setEditMode(plan._id);
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
