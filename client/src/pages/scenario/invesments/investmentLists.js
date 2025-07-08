import axios from "axios";
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, InputAdornment, Box, List, MenuItem, ListItem,
  ListItemText, IconButton, Backdrop, Fade, TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import CustomDropdown from "../../../components/customDropDown";
import CustomInput from "../../../components/customInputBox";
import CustomSave from "../../../components/customSaveBtn";
import PageHeader from "../../../components/pageHeader";
import {
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, backContinueContainerStyles, textFieldStyles
} from "../../../components/styles";
import { AppContext } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";
import { ObjectId } from "bson";

// Constants 
const NEW_ID = "new";
const TAX_STATUSES = [
  { label: "Taxable", value: "non-retirement" },
  { label: "Tax-Deferred", value: "pre-tax" },
  { label: "Tax-Free", value: "after-tax" },
];
// Map to quickly retrieve tax status labels
const TAX_STATUSES_REVERSE = TAX_STATUSES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

// Default structure for a new investment
const defaultInvestment = { id: NEW_ID, investmentTypeId: "", taxType: "", value: "" };

const InvestmentLists = () => {
  // Global app and auth context
  const {
    editMode, setEventEditMode, currInvestments, setCurrInvestments, currInvestmentTypes, 
    currScenario, setCurrScenario, takenTaxStatusAccounts, setTakenTaxStatusAccounts, setCurrInvestmentTypes
  } = useContext(AppContext);
  const { user } = useContext(AuthContext);

  // Local state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [availableTaxTypes, setAvailableTaxTypes] = useState([[], []]);
  const [newInvestment, setNewInvestment] = useState(defaultInvestment);
  // Handle form input changes
  const handleInputChange = (field, value) => { setNewInvestment((prev) => ({ ...prev, [field]: value })); };
  const navigate = useNavigate();

  // Helper: Add value to a key array in the scenario object
  const appendToScenarioKey = useCallback((key, value) => {
    setCurrScenario((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), value],
    }));
  }, [setCurrScenario]);
  const removeFromScenarioKey = useCallback((key, valueToRemove) => {
    setCurrScenario((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((value) => value !== valueToRemove),
    }));
  }, [setCurrScenario]);

  // Helper: Add tax status to taken account types
  const appendToTakenTaxStatusAccounts = useCallback((key, value) => {
    setTakenTaxStatusAccounts((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), value],
    }));
  }, [setTakenTaxStatusAccounts]);
  const removeFromTakenTaxStatusAccounts = useCallback((key, valueToRemove) => {
    console.log(valueToRemove);
    setTakenTaxStatusAccounts((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((value) => value !== valueToRemove),
    }));
  }, [setTakenTaxStatusAccounts]);

  // Helper: Create a lookup map from investment type ID to name
  const investmentTypeMap = useMemo(() => {
    const map = {};
    if (Array.isArray(currInvestmentTypes)) {
      currInvestmentTypes.forEach((type) => {
        if (type._id && type.name) {
          map[type._id] = type.name;
        }
      });
    }
    return map;
  }, [currInvestmentTypes]);

  // Update available tax types when a new investment or type changes
  useEffect(() => {
    const taxTypesList = [[], []]; // A list of valid tax types
    if (newInvestment.investmentTypeId) {
      const taken = takenTaxStatusAccounts[newInvestment.investmentTypeId] || [];
      TAX_STATUSES.forEach(({ label, value }) => {
        if (!taken.includes(value)) {
          taxTypesList[0].push(label);
          taxTypesList[1].push(value);
        }
      });
    }

    if (editing && newInvestment.taxType && !taxTypesList[1].includes(newInvestment.taxType)) {
      taxTypesList[0].push(TAX_STATUSES_REVERSE[newInvestment.taxType]);
      taxTypesList[1].push(newInvestment.taxType);
    }
    // console.log(taxTypesList);
    setAvailableTaxTypes(taxTypesList);

    if (!editing) { handleInputChange("taxType", ""); }
  }, [newInvestment.id, newInvestment.investmentTypeId]);

  // Helper: Adds Cash Account if non exists
  const addCashInvestment = async (scenarioId) => {
    // Default investment type setup for a "Cash" account
    const cashTypeAccount = {
      name: "Cash",
      description: "Cash Type Account",
      expenseRatio: "0.00",
      taxability: true,
      annualReturn: {
          unit: "fixed",
          type: "fixed",
          value: "0",
          mean: "0",
          stdDev: "0",
      },
      annualIncome: {
          unit: "fixed",
          type: "fixed",
          value: "0",
          mean: "0",
          stdDev: "0",
      },
    };

    // Default investment entry tied to the cash investment type
    const cashInvestment = {
        investmentType: "", // Will be assigned below
        accountTaxStatus: "non-retirement",
        value: "0",
    };

    try {
        // Generate ObjectIds for local/guest mode
        const investmentTypeId = new ObjectId().toHexString();
        const investmentId = new ObjectId().toHexString();
        if (user?.guest) {
            // Guest users: use locally generated IDs
            cashTypeAccount._id = investmentTypeId;
            cashInvestment.investmentType = investmentTypeId;
            cashInvestment._id = investmentId;
        } else {
            // Logged-in users: create and persist data on server
            const createdType = await axios.post(
                `http://localhost:8080/scenario/${scenarioId}/investmentType`,
                cashTypeAccount,
                { withCredentials: true }
            );
            const createdInvestment = await axios.post(
                `http://localhost:8080/scenario/${scenarioId}/investment`,
                {
                    ...cashInvestment,
                    investmentType: createdType.data._id,
                },
                { withCredentials: true }
            );
            cashTypeAccount._id = createdType.data._id;
            cashInvestment.investmentType = createdType.data._id;
            cashInvestment._id = createdInvestment.data._id;
        }

        // Update current scenario state with new investment and type
        appendToScenarioKey("setOfInvestmentTypes", cashInvestment.investmentType);
        appendToScenarioKey("setOfInvestments", cashInvestment._id);

        // Update top-level investment state in the app context
        await setCurrInvestments((prev) => {
          setCurrInvestmentTypes((prev) => {
            return [...(Array.isArray(prev) ? prev : []), cashTypeAccount];
          });
          return [...(Array.isArray(prev) ? prev : []), cashInvestment];
        });

        // console.log(cashInvestment);
    } catch (error) {
        console.error("Error saving data:", error);
        alert("Failed to save data! Please try again.");
    }
  };
  useEffect(() => {
    if (currInvestments.length === 0) addCashInvestment(currScenario?._id || "");
  }, [currInvestments.length]);

  // UI Event: Modal open/close
  const handleOpen = () => {
    setNewInvestment(defaultInvestment);
    setOpen(true);
  };
  const handleClose = () => { 
    setOpen(false); 
    setEditing(false);
  };

  // Add or update investment in state (and backend if not guest)
  const handleAddInvestment = async () => {
    const { investmentTypeId, taxType, value, id } = newInvestment;
    if (!investmentTypeId || !taxType || value === "" || isNaN(Number(value))) return;

    // Transform frontend investment data to backend format
    const renameAttributes = (investment) => ({
      investmentType: investment.investmentTypeId,
      accountTaxStatus: investment.taxType,
      value: investment.value,
    });
    // Update scenario and tax status mappings for new investment
    const handleUpdates = (investment, editing=false) => {
      if (editing) {
        const old = currInvestments.find((inv) => inv._id === investment._id);
        removeFromTakenTaxStatusAccounts(old.investmentType, old.accountTaxStatus);
        if (old.accountTaxStatus === "pre-tax") {
          removeFromScenarioKey("rothConversionStrategy", old._id);
          removeFromScenarioKey("rmdStrategy", old._id);
        }
        setCurrInvestments((prev) =>
          prev.map((item) => (item._id === investment._id ? investment : item))
        );
      }

      appendToTakenTaxStatusAccounts(investment.investmentType, investment.accountTaxStatus);
      if (investment.accountTaxStatus === "pre-tax") {
        appendToScenarioKey("rothConversionStrategy", investment._id);
        appendToScenarioKey("rmdStrategy", investment._id);
      }
      if (editing) return;
      appendToScenarioKey("setOfInvestments", investment._id);
      appendToScenarioKey("expenseWithdrawalStrategy", investment._id);
      setCurrInvestments((prev) => [...(Array.isArray(prev) ? prev : []), investment]);
    };

    const transformed = renameAttributes(newInvestment);
    try {
      if (id === NEW_ID) { // Create new investment
        const response = !user.guest ? (await axios.post(`http://localhost:8080/scenario/${currScenario._id}/investment`, transformed)).data : transformed;
        if (user.guest) response._id = new ObjectId().toHexString();
        handleUpdates(response);
      } else {  // Update existing investment
        transformed._id = id;
        const response = !user.guest ? (await axios.post(`http://localhost:8080/updateInvestment/${id}`, transformed)).data.result : transformed;
        handleUpdates(response, true);
        setEditing(false);
      }

      setNewInvestment(defaultInvestment);
      handleClose();
    } catch (error) {
      console.error("Error adding investment:", error);
    }
  };

  // Trigger edit modal with investment data
  const handleEditInvestment = useCallback((item) => {
    setEditing(true);
    setNewInvestment({
      id: item._id,
      investmentTypeId: item.investmentType,
      taxType: item.accountTaxStatus,
      value: item.value,
    });
    setOpen(true);
  }, []);

  // Delete investment locally (and optionally backend)
  const handleDeleteInvestment = useCallback(async (item) => {
    if (!user.guest) { await axios.post(`http://localhost:8080/deleteInvestment/${item._id}`); }
    removeFromScenarioKey("setOfInvestments", item._id);
    removeFromTakenTaxStatusAccounts(item.investmentType, item.accountTaxStatus);
    if (item.accountTaxStatus === "pre-tax") {
      removeFromScenarioKey("rothConversionStrategy", item._id);
      removeFromScenarioKey("rmdStrategy", item._id);
    }
    removeFromScenarioKey("expenseWithdrawalStrategy", item._id);
    setCurrInvestments((prev) => prev.filter((inv) => inv._id !== item._id));
  }, [setCurrInvestments]);

  // Investment list renderer by tax type
  const InvestList = ({ list, taxType }) => {
    const filteredInvestments = Array.isArray(list) ? list.filter((item) => item.accountTaxStatus === taxType) : [];

    return (
      <List>
        {filteredInvestments.map((item, index) => {
          if (!item || !item.investmentType) {
            return (
              <ListItem key={`invalid-${index}`}>
                <ListItemText primary="Invalid investment data" />
              </ListItem>
            );
          }

          const investmentTypeName = investmentTypeMap[item.investmentType] || "Unknown Type";
          const isCash = investmentTypeName?.toLowerCase() === "cash";

          return (
            <ListItem
              key={item._id}
              sx={{
                backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
                "&:hover": { backgroundColor: "#B0B0B0" },
              }}
            >
              <ListItemText
                primary={<span style={{ fontWeight: "bold" }}>{investmentTypeName}</span>}
                secondary={`Balance: $${parseFloat(item.value).toFixed(2)}`} // | ${item._id}
              />
              <IconButton edge="end" aria-label="edit" onClick={() => handleEditInvestment(item)}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteInvestment(item)} disabled={isCash}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          );
        })}
      </List>
    );
  };
  

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Investments
          </Typography>
        </Stack>

        <PageHeader />

        <Box sx={{ marginBottom: 1, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" color="primary" sx={{ fontSize: "1.1rem", textTransform: "none" }} onClick={handleOpen}>
            Add
          </Button>
        </Box>

        <Box sx={rowBoxStyles}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Taxable
            </Typography>
            <InvestList list={currInvestments} taxType="non-retirement" />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Tax-Deferred
            </Typography>
            <InvestList list={currInvestments} taxType="pre-tax" />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Tax-Free
            </Typography>
            <InvestList list={currInvestments} taxType="after-tax" />
          </Box>
        </Box>

        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles} onClick={() => navigate("/scenario/basics")}>
            Back
          </Button>
          <CustomSave label={"Continue"} routeTo={"/scenario/event_series_list"} />
        </Box>

        <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 1300 }}>
          <Fade in={open}>
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                backgroundColor: "white", boxShadow: 24, p: 4, borderRadius: 2,
                minWidth: 500, maxWidth: 800, display: "flex", flexDirection: "column", gap: 2,
              }}
            >
              <Typography variant="h5">Add New Investment</Typography>
              <Box>
                <Typography variant="body1" sx={{ mt: 2, marginBottom: 1, fontWeight: "medium" }}>
                  Investment Type
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <TextField
                    select
                    name="investmentTypeId"
                    value={newInvestment.investmentTypeId || ""}
                    onChange={(e) => handleInputChange("investmentTypeId", e.target.value)}
                    sx={{ ...textFieldStyles, width: 350 }}
                    fullWidth
                    disabled={investmentTypeMap[newInvestment.investmentTypeId]?.toLowerCase() === "cash" || editing}
                  >
                    {Array.isArray(currInvestmentTypes) && currInvestmentTypes.length > 0 ? (
                      currInvestmentTypes.map((it) =>
                        it._id && it.name ? (
                          <MenuItem key={it._id} value={it._id} disabled={it.name?.toLowerCase() === "cash"}>
                            {it.name}
                          </MenuItem>
                        ) : null
                      )
                    ) : (
                      <MenuItem value="" disabled>
                        No Investment Types Available
                      </MenuItem>
                    )}
                  </TextField>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => {
                      setEventEditMode(newInvestment.investmentTypeId);
                      navigate("/scenario/investment_type");
                    }}
                    disabled={!newInvestment.investmentTypeId}
                    sx={{
                      backgroundColor: "black",
                      color: "white",
                      "&:hover": { backgroundColor: "#333" },
                      "&:disabled": { backgroundColor: "#B0B0B0", color: "#FFFFFF99" },
                      ml: -1.5,
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="add"
                    onClick={() => {
                      setEventEditMode("new");
                      navigate("/scenario/investment_type");
                    }}
                    sx={{
                      backgroundColor: "black",
                      color: "white",
                      "&:hover": { backgroundColor: "#333" },
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={rowBoxStyles}>
                <Box sx={{ flex: 1 }}>
                  <CustomDropdown
                    label={"Tax Status of account"}
                    value={newInvestment.taxType || ""}
                    setValue={(value) => handleInputChange("taxType", value)}
                    menuLabels={availableTaxTypes[0]}
                    menuItems={availableTaxTypes[1]}
                    width={250}
                    disable={investmentTypeMap[newInvestment.investmentTypeId]?.toLowerCase() === "cash"}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <CustomInput
                    title="Value"
                    type="number"
                    value={newInvestment.value}
                    setValue={(value) => handleInputChange("value", value)}
                    adornment={"$"}
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="contained" color="primary" onClick={handleClose} sx={{ textTransform: "none" }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleAddInvestment}
                  sx={{ textTransform: "none" }}
                  disabled={
                    newInvestment.taxType === "" ||
                    newInvestment.value === "" ||
                    isNaN(Number(newInvestment.value))
                  }
                >
                  Save
                </Button>
              </Box>
            </Box>
          </Fade>
        </Backdrop>
      </Container>
    </ThemeProvider>
  );
};

export default InvestmentLists;
