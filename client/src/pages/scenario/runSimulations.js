import React, { useState, useContext } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, Switch, MenuItem, TextField, IconButton, Backdrop, Fade } from "@mui/material";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import PageHeader from "../../components/pageHeader";
import {
  stackStyles,
  titleStyles,
  textFieldStyles,
  backContinueContainerStyles,
  buttonStyles,
  rowBoxStyles,
} from "../../components/styles";  // Import your modular styles
import CustomInput from "../../components/customInputBox";
import { Close as CloseIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/appContext";
import {AuthContext} from "../../context/authContext";
import { saveAs } from "file-saver";
import yaml from "js-yaml";
import axios from "axios";
import CustomSave from "../../components/customSaveBtn";


const RunSimulation = () => {
  const [numSimulations, setNumSimulations] = useState("1");
  const [openBackdrop, setOpenBackdrop] = useState(false); // State to control backdrop visibility
  const [emails, setEmails] = useState([]); // Store the email addresses
  const [permission, setPermission] = useState([]);


  const {currScenario, currInvestmentTypes, currInvestments, currIncome, currExpense, currInvest, currRebalance} = useContext(AppContext);
  const {user} = useContext(AuthContext);
  // console.log(currScenario);

  /**
   * Converts a generic distribution object into a standardized internal format.
   * Supports fixed, normal, and uniform distributions with appropriate defaults.
   */
  function buildDistribution(dist) {
    if (dist.type === "fixed") {
      return { type: "fixed", value: parseFloat(dist.value) || 0 };
    } else if (dist.type === "normal") {
      return {
        type: "normal",
        mean: parseFloat(dist.mean) || 0,
        stdev: parseFloat(dist.stdDev) || 0,
      };
    } else if (dist.type === "uniform") {
      return {
        type: "uniform",
        lower: parseFloat(dist.lower) || 0,
        upper: parseFloat(dist.upper) || 0,
      };
    }
    // Fallback to a fixed zero value if the distribution type is unrecognized
    return { type: "fixed", value: 0 };
  }

  /**
   * Resolves a MongoDB ObjectId for an investment type to its human-readable name.
   * Falls back to the raw ID if a match is not found.
   */
  function resolveInvestmentTypeName(id, investmentTypes) {
    const match = investmentTypes.find(t => t._id === id);
    return match ? match.name : id;
  }

  /**
   * Constructs a readable label for an investment, combining its type and tax status.
   * Example: "S&P 500 pre-tax"
   */
  function buildReadableInvestmentId(investment, investmentTypes) {
    const name = resolveInvestmentTypeName(investment.investmentType, investmentTypes);
    return `${name} ${investment.accountTaxStatus}`;
  }

  /**
   * Converts a start or duration field into a normalized internal format.
   * Supports fixed values, distributions (normal/uniform), and references to events.
   */
  function convertStartOrDuration(field) {
    if (!field || !field.type) {
      return { type: "fixed", value: 0 }; // Default for undefined or malformed input
    }

    const { type, value, mean, stdDev, min, max, refer } = field;

    if (type === "fixedAmt" || type === "fixed") {
      return { type: "fixed", value: parseFloat(value) };
    } else if (type === "normal") {
      return { type: "normal", mean: parseFloat(mean), stdev: parseFloat(stdDev) };
    } else if (type === "uniform") {
      return { type: "uniform", lower: parseFloat(min), upper: parseFloat(max) };
    } else if (type === "startWith" || type === "startAfter") {
      return { type, eventSeries: refer }; // Relative timing based on another event
    }

    // Fallback for unrecognized types
    return { type: "fixed", value: 0 };
  }

  /**
   * Converts an annual change object into a normalized format with distribution info.
   * Supports both amount and percent-based changes, with optional variability.
   */
  function convertAnnualChange(change) {
    if (!change || !change.type) {
      return {
        changeAmtOrPct: "amount",
        changeDistribution: { type: "fixed", value: 0 },
      };
    }

    const { type, amount, distribution, mean, stdDev, min, max } = change;
    const changeAmtOrPct = type === "percent" ? "percent" : "amount";

    // Default to fixed change unless a distribution is specified
    let changeDistribution = { type: "fixed", value: parseFloat(amount) || 0 };
    if (distribution === "normal") {
      changeDistribution = {
        type: "normal",
        mean: parseFloat(mean),
        stdev: parseFloat(stdDev),
      };
    } else if (distribution === "uniform") {
      changeDistribution = {
        type: "uniform",
        lower: parseFloat(min),
        upper: parseFloat(max),
      };
    }

    return { changeAmtOrPct, changeDistribution };
  }

  /**
   * Converts investment allocation keys (raw MongoDB ObjectIds) to user-friendly strings.
   * This makes allocation maps easier to read in a UI or exported format.
   */
  function convertAllocationKeys(allocationObj, currInvestments, currInvestmentTypes) {
    if (!allocationObj) return {};

    const result = {};
    for (const rawId in allocationObj) {
      const inv = currInvestments.find(i => i._id === rawId);
      const readableId = inv ? buildReadableInvestmentId(inv, currInvestmentTypes) : rawId;
      result[readableId] = allocationObj[rawId];
    }
    return result;
  }

  function exportToYAML({
    currScenario,
    currInvestmentTypes,
    currInvestments,
    currIncome,
    currExpense,
    currInvest,
    currRebalance,
  }) {
    const {
      setOfInvestmentTypes,
      setOfInvestments,
      incomeEventSeries,
      expenseEventSeries,
      investEventSeries,
      rebalanceEventSeries,
      _id,
      __v,
      ...filteredScenario
    } = currScenario;
  
    const yamlObject = {
      name: filteredScenario.name || "Retirement Planning Scenario",
      maritalStatus: filteredScenario.filingStatus === "single" ? "individual" : "couple",
      birthYears: [filteredScenario.birthYearUser, filteredScenario.birthYearSpouse],
      lifeExpectancy: [filteredScenario.lifeExpectancy, filteredScenario.lifeExpectancySpouse],
      investmentTypes: currInvestmentTypes.map(t => ({
        name: t.name,
        description: t.description,
        returnAmtOrPct: t.annualReturn.unit,
        returnDistribution: buildDistribution(t.annualReturn),
        expenseRatio: parseFloat(t.expenseRatio),
        incomeAmtOrPct: t.annualIncome.unit,
        incomeDistribution: buildDistribution(t.annualIncome),
        taxability: t.taxability,
      })),
      investments: currInvestments.map(inv => {
        const name = resolveInvestmentTypeName(inv.investmentType, currInvestmentTypes);
        const readableId = buildReadableInvestmentId(inv, currInvestmentTypes);
        return {
          investmentType: name,
          value: inv.value,
          taxStatus: inv.accountTaxStatus,
          id: readableId,
        };
      }),
      eventSeries: [
        ...(currIncome || []).filter(e => e?.startYear && e?.duration).map(e => {
          const { changeAmtOrPct, changeDistribution } = convertAnnualChange(e.annualChange);
          return {
            name: e.eventSeriesName,
            start: convertStartOrDuration(e.startYear),
            duration: convertStartOrDuration(e.duration),
            type: "income",
            initialAmount: parseFloat(e.initialAmount),
            changeAmtOrPct,
            changeDistribution,
            inflationAdjusted: e.inflationAdjustment,
            userFraction: parseFloat(e.userPercentage),
            socialSecurity: e.isSocialSecurity,
          };
        }),
        ...(currExpense || []).filter(e => e?.startYear && e?.duration).map(e => {
          const { changeAmtOrPct, changeDistribution } = convertAnnualChange(e.annualChange);
          return {
            name: e.eventSeriesName,
            start: convertStartOrDuration(e.startYear),
            duration: convertStartOrDuration(e.duration),
            type: "expense",
            initialAmount: parseFloat(e.initialAmount),
            changeAmtOrPct,
            changeDistribution,
            inflationAdjusted: e.inflationAdjustment,
            userFraction: parseFloat(e.userPercentage),
            discretionary: e.isDiscretionary,
          };
        }),
        ...(currInvest || []).filter(e => e?.startYear && e?.duration && e?.assetAllocation).map(e => {
          const isGlide = e.assetAllocation.type === "glidePath";
          const allocation = convertAllocationKeys(
            isGlide ? e.assetAllocation.initialPercentages ?? {} : e.assetAllocation.fixedPercentages ?? {},
            currInvestments,
            currInvestmentTypes
          );
      
          const allocation2 = isGlide
            ? convertAllocationKeys(e.assetAllocation.finalPercentages ?? {}, currInvestments, currInvestmentTypes)
            : undefined;
      
          
          return {
            name: e.eventSeriesName,
            start: convertStartOrDuration(e.startYear),
            duration: convertStartOrDuration(e.duration),
            type: "invest",
            assetAllocation: allocation,
            ...(isGlide && { glidePath: true }),
            ...(isGlide && { assetAllocation2: allocation2 }),
            ...(e.maxCash !== undefined && { maxCash: parseFloat(e.maxCash) }),
          };
        }),
        ...(currRebalance || []).filter(e => e?.startYear && e?.duration && e?.rebalanceAllocation).map(e => {
          const isGlide = e.rebalanceAllocation.type === "glidePath";
          const allocation = convertAllocationKeys(
            isGlide ? e.rebalanceAllocation.initialPercentages ?? {} : e.rebalanceAllocation.fixedPercentages ?? {},
            currInvestments,
            currInvestmentTypes
          );
      
          const allocation2 = isGlide
            ? convertAllocationKeys(e.rebalanceAllocation.finalPercentages ?? {}, currInvestments, currInvestmentTypes)
            : undefined;
          
  
          return {
            name: e.eventSeriesName,
            start: convertStartOrDuration(e.startYear),
            duration: convertStartOrDuration(e.duration),
            type: "rebalance",
            assetAllocation: allocation,
            ...(isGlide && { glidePath: true }),
            ...(isGlide && { assetAllocation2: allocation2 }),
          };
        })
      ],
      inflationAssumption: filteredScenario.inflationAssumption,
      afterTaxContributionLimit: filteredScenario.irsLimits?.initialAfterTax || 7000,
      spendingStrategy: (filteredScenario.spendingStrategy || []).map(id => {
        const match = currExpense.find(e => e._id === id);
        return match ? match.eventSeriesName : id;
      }),      
      expenseWithdrawalStrategy: (filteredScenario.expenseWithdrawalStrategy || []).map(id => {
        const inv = currInvestments.find(i => i._id === id);
        return inv ? buildReadableInvestmentId(inv, currInvestmentTypes) : id;
      }),
      RMDStrategy: (filteredScenario.rmdStrategy || []).map(id => {
        const inv = currInvestments.find(i => i._id === id);
        return inv ? buildReadableInvestmentId(inv, currInvestmentTypes) : id;
      }),
      RothConversionOpt: filteredScenario.optimizerSettings?.enabled || false,
      RothConversionStart: filteredScenario.optimizerSettings?.startYear,
      RothConversionEnd: filteredScenario.optimizerSettings?.endYear,
      RothConversionStrategy: (filteredScenario.rothConversionStrategy || []).map(id => {
        const inv = currInvestments.find(i => i._id === id);
        return inv ? buildReadableInvestmentId(inv, currInvestmentTypes) : id;
      }),
      financialGoal: filteredScenario.financialGoal,
      residenceState: filteredScenario.stateResident || "NY",
    };
  
    const yamlStr = yaml.dump(yamlObject, { lineWidth: -1 });
    const fileName = `${currScenario.name?.replace(/\s+/g, "_").toLowerCase() || "scenario"}.yaml`;
    const blob = new Blob([yamlStr], { type: "text/yaml;charset=utf-8" });
    saveAs(blob, fileName);
  }
  
  
  const handleExport = () => {
    exportToYAML({
      currScenario,
      currInvestmentTypes,
      currInvestments,
      currIncome,
      currExpense,
      currInvest,
      currRebalance
    });
  };

  const navigate = useNavigate();

  const handleShareClick = () => {
    setOpenBackdrop(true); // Show backdrop when the "Share" button is clicked
  };

  const handleBackdropClose = () => {
    setOpenBackdrop(false); // Close the backdrop
  };

  const handleEmailChange = (event) => {
    if (event.key === "Enter" && event.target.value) {
      setEmails([...emails, event.target.value]); // Add email to the list when Enter is pressed
      event.target.value = ""; // Clear input field after adding email
    }
  };

  const handleEmailDelete = (emailToDelete) => {
    setEmails(emails.filter(email => email !== emailToDelete)); // Remove email from list
  };

  const getChartData = async () => {
    try {
      console.log(user._id);
      console.log(currScenario._id);
      const response = await axios.get("http://localhost:8080/runSimulation", {
        params: {
          scenarioId: currScenario._id,
          userId: user._id,
          simulationCount: numSimulations,
        },
      });

      console.log(response.data);
      navigate("/charts", {
        state: { chartData: response.data }
      });
  
      // return response.data; // optional: just return the data, not the whole Axios response
    } catch (error) {
      console.error("Error fetching simulation data:", error);
      throw error; // rethrow if you want to handle it outside
    }
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>

        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Congratulations on completing your scenario!
          </Typography>

          {/* Use marginLeft: auto to push the Box to the right */}
          <Box direction="row" spacing={2} sx={{ display: "flex", gap: 2, marginLeft: "auto", marginTop: 2 }}>
            <Button
              variant="contained"
              sx={{
                ...buttonStyles,
                backgroundColor: "#c98b34", // Custom background color for Share button
                "&:hover": {
                  backgroundColor: "#a67a2b", // Optionally set hover color
                },
              }}
              onClick={handleShareClick} // Show backdrop when clicked
            >
              Share
            </Button>

            <Button
              variant="contained"
              sx={{
                ...buttonStyles,
                backgroundColor: "#c98bc0", // Custom background color for Export button
                "&:hover": {
                  backgroundColor: "#a67a99", // Optionally set hover color
                },
              }}
              onClick={handleExport}
            >
              Export
            </Button>

            <Button
              variant="contained"
              sx={{
                ...buttonStyles,
                backgroundColor: "#61afc9", // Custom background color for Save & Exit button
                "&:hover": {
                  backgroundColor: "#59a8c2", // Optionally set hover color
                },
              }}
              onClick={() => navigate("/scenario/scenarios")}
            >
              Save & Exit
            </Button>
          </Box>
        </Stack>

        <PageHeader />

        {/* Stack for title and save button */}
        <Box sx={rowBoxStyles}>
          <Box>
            <Typography variant="h5" sx={{fontWeight: "bold", mb: 3}}>
              Simulation
            </Typography>
            <CustomInput
              title='Number of times to run'
              type='number'
              value={numSimulations}
              setValue={setNumSimulations}
              inputProps={{ min: "1" }}
            />
         </Box>
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles}
            onClick={() => navigate("/scenario/strategies")}
          >
            Back
          </Button>
          <Button variant="contained" color="secondary" sx={buttonStyles}
            onClick={() => {
              // const fetchedData = await getChartData();
              // console.log(fetchedData);
              getChartData();
            }}
          >
            Run Simulation
          </Button>
        </Box>

        {/* MUI Backdrop for Share */}
        <Backdrop
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            display: openBackdrop ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
          }}
          open={openBackdrop}
          onClick={handleBackdropClose} // Close backdrop on clicking outside
        >
          <Fade in={openBackdrop}>
            <Box
              sx={{
                backgroundColor: "white", padding: 3, borderRadius: 2, minWidth: 400,
                display: "flex", flexDirection: "column"
              }}
              onClick={(e) => e.stopPropagation()} // Prevent click from closing backdrop
            >
              <Typography variant="h6" sx={{ mb: 2 }}>Share With Others</Typography>
              <Stack direction="row" alignItems="center" sx={{mb: 1, minWidth: 400, gap: 2}}>
                <Box>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                      Email (Press Enter to add emails)
                  </Typography>
                  <TextField
                      variant="outlined"
                      fullWidth
                      onKeyDown={handleEmailChange} // Handle Enter key press
                      sx={textFieldStyles}
                  />
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                      Permission
                  </Typography>
                  <TextField
                      select
                      value={permission}
                      onChange={(e) => setPermission(e.target.value)}
                      displayempty="true"
                      fullWidth
                      sx={textFieldStyles}
                  >
                      <MenuItem value="" disabled>
                        Select
                      </MenuItem>
                      <MenuItem key="Edit" value="Edit">
                        Edit
                      </MenuItem>
                      <MenuItem key="Read Only" value="Read Only">
                        Read Only
                      </MenuItem>
                  </TextField>
                </Box>
              </Stack>

              {/* Display added emails as small containers */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, maxWidth: 400 }}>
                {emails.map((email, index) => (
                  <Box
                    key={index}
                    sx={{
                      backgroundColor: "#f0f0f0", padding: "5px 10px", borderRadius: "15px", display: "flex",
                      alignItems: "center", gap: 1
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>{email}</Typography>
                    <IconButton onClick={() => handleEmailDelete(email)} size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              
              <Button variant="contained" color="secondary" sx={{textTransform: "none", fontSize: "1.05rem", mt: 2}}>
                Click to share scenario
              </Button>
            </Box>
          </Fade>
        </Backdrop>
      </Container>
    </ThemeProvider>
  );
};

export default RunSimulation;
