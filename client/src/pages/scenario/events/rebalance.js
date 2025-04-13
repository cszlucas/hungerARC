import React, { useState, useContext } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
  Button,
  Stack,
  Box,
  List,
  MenuItem,
  ListItem,
  ListItemText,
  TextField,
  IconButton
} from "@mui/material";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import PageHeader from "../../../components/pageHeader";
import { stackStyles, titleStyles, buttonStyles, backContinueContainerStyles, textFieldStyles } from "../../../components/styles";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";
import axios from "axios";
import { AuthContext } from "../../../context/authContext";

const Rebalance = () => {
  const { currRebalance, setCurrRebalance, currInvestments, currInvestmentTypes, setCurrScenario, editMode } = useContext(AppContext);
  const { eventEditMode, setEventEditMode } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  
  // console.log(currRebalance);
  // console.log(eventEditMode);
  
  const getInvestmentById = (id) => {
    console.log(id);
    console.log(currInvestments);
    for (let i = 0; i < currInvestments.length; i++) {
      if (currInvestments[i]._id == id) {
        return currInvestments[i]; // Return the found scenario
      }
    }
    return null; // Return null if not found
  };
  
  const getRebalanceById = (id) => {
    for (let i = 0; i < currRebalance.length; i++) {
      if (currRebalance[i]._id == id) {
        return currRebalance[i]; // Return the found scenario
      }
    }
    return null; // Return null if not found
  };
  
  const handleDeleteInvestment = (investmentId) => {
    console.log(investmentId);
    setFormValues((prev) => {
      const updated = { ...prev };
      const type = updated.rebalanceAllocation.type;
  
      if (type === "fixed") {
        const updatedFixed = { ...updated.rebalanceAllocation.fixedPercentages };
        delete updatedFixed[investmentId];
        updated.rebalanceAllocation.fixedPercentages = updatedFixed;
      } else if (type === "glidePath") {
        const updatedInitial = { ...updated.rebalanceAllocation.initialPercentages };
        const updatedFinal = { ...updated.rebalanceAllocation.finalPercentages };
        delete updatedInitial[investmentId];
        delete updatedFinal[investmentId];
        updated.rebalanceAllocation.initialPercentages = updatedInitial;
        updated.rebalanceAllocation.finalPercentages = updatedFinal;
      }

      console.log(formValues.rebalanceAllocation);
  
      return updated;
    });
  };
  
  const handleEditInvestment = (investmentId) => {
    console.log(investmentId);
    setSelectedInvestment(investmentId);
  
    const { type, fixedPercentages, initialPercentages, finalPercentages } = formValues.rebalanceAllocation;
  
    if (type === "fixed") {
      setPendingPercentage(fixedPercentages[investmentId] ?? "");
    } else if (type === "glidePath") {
      setPendingInitial(initialPercentages[investmentId] ?? "");
      setPendingFinal(finalPercentages[investmentId] ?? "");
    }
  };
  

  const InvestList = ({ rebalanceAllocation, getInvestmentNameById }) => {
    const displayList = [];

    if (!rebalanceAllocation || !rebalanceAllocation.type) {
      return <div>No allocation data to display</div>;
    }
  
    const { type, fixedPercentages = {}, initialPercentages = {}, finalPercentages = {} } = rebalanceAllocation;
  
    if (type === "glidePath") {
      Object.keys(initialPercentages).forEach((id) => {
        const investment = getInvestmentNameById(id); // should return full investment object
        const typeObj = getInvesmentTypeById(investment?.investmentType);
        displayList.push({
          _id: id,
          investmentTypeName: typeObj?.name || "Unknown Investment",
          initial: initialPercentages[id] * 100,
          final: finalPercentages[id] * 100,
        });
      });
    } else if (type === "fixed") {
      Object.keys(fixedPercentages).forEach((id) => {
        const investment = getInvestmentNameById(id); // full object
        const typeObj = getInvesmentTypeById(investment?.investmentType);
        displayList.push({
          _id: id,
          investmentTypeName: typeObj?.name || "Unknown Investment",
          percent: fixedPercentages[id] * 100,
        });
      });
    }
  
  
    return (
      <List>
        {displayList.map((item, index) => (
          <ListItem
            key={`${item.investmentTypeName}-${index}`}
            sx={{
              backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
              "&:hover": { backgroundColor: "#B0B0B0" },
            }}
            secondaryAction={
              <>
                 <IconButton edge="end" onClick={() => handleEditInvestment(item._id)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => {
                  // console.log(item);
                  handleDeleteInvestment(item._id);
                }}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText
              primary={<span style={{ fontWeight: "bold" }}>{item.investmentTypeName || "Unknown Investment"}</span>}
              secondary={
                item.initial !== undefined && item.final !== undefined
                  ? `${item.initial.toFixed(1)}% → ${item.final.toFixed(1)}%`
                  : item.percent !== undefined
                    ? `${item.percent.toFixed(1)}%`
                    : "—"
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };
  // console.log(getRebalanceById(eventEditMode.id));

  let indieRebalance = getRebalanceById(eventEditMode.id);
  // console.log(indieRebalance);
  const [formValues, setFormValues] = useState(indieRebalance || {
    _id: "",
    eventSeriesName: "",
    eventSeriesDescription: "",
    startYear: {
      type: "",
      value: "",
      mean: "",
      stdDev: "",
      min: "",
      max: "",
      year: ""
    },
    duration: {
      type: "fixedAmt",
      value: "",
      mean: "",
      stdDev: "",
      min: "",
      max: ""
    },
    taxStatus: "",
    rebalanceAllocation: {
      type: "fixed",
      fixedPercentages: {

      },
      initialPercenatages: {

      },
      finalPercentages: {

      }
    }
  });
  

  const handleInputChange = (field, value) => {
    const fieldParts = field.split("."); // Split the field into parts (e.g., "lifeExpectancy.mean")
  
    setFormValues((prev) => {
      // Update the nested object
      if (fieldParts.length === 2) {
        const [parent, child] = fieldParts; // 'lifeExpectancy' and 'mean'
        return {
          ...prev,
          [parent]: { // Spread the parent object (lifeExpectancy)
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

  const handleTaxStatusChange = (selectedTaxStatus) => {
    const match = currRebalance?.find(
      (rebalance) => rebalance.taxStatus === selectedTaxStatus
    );
    
    if (match)
    {
      setEventEditMode((prev) => ({ ...prev, id: match._id }));
    }
    else
    {
      setEventEditMode((prev) => ({ ...prev, id: "new" }));
    }
  
    const newForm = match || {
      _id: "",
      eventSeriesName: "",
      eventSeriesDescription: "",
      startYear: {
        type: "",
        value: "",
        mean: "",
        stdDev: "",
        min: "",
        max: "",
        year: "",
      },
      duration: {
        type: "fixedAmt",
        value: "",
        mean: "",
        stdDev: "",
        min: "",
        max: "",
      },
      taxStatus: selectedTaxStatus,
      rebalanceAllocation: {
        type: "fixed",
        fixedPercentages: {},
        initialPercentages: {},
        finalPercentages: {},
      },
    };
  
    setFormValues(newForm);
    setSelectedTaxType(selectedTaxStatus);
    setSelectedInvestment("");
  };
  

  const getInvesmentTypeById = (id) => {
    if (id != "new") {
        for (let i = 0; i < currInvestmentTypes.length; i++) {
            if (currInvestmentTypes[i]._id == id) {
                return currInvestmentTypes[i]; // Return the found scenario
            }
        }
    }
    return {_id: "NULL", name: "Unknown Type"};
};


  const [selectedTaxType, setSelectedTaxType] = useState(""); //keep
  const [selectedInvestment, setSelectedInvestment] = useState(""); //keep
  const [pendingPercentage, setPendingPercentage] = useState("");
  const [pendingInitial, setPendingInitial] = useState("");
  const [pendingFinal, setPendingFinal] = useState("");

  const [taxableInvestments, setTaxableInvestments] = useState([]); //keep
  const [taxDeferredInvestments, setTaxDeferredInvestments] = useState([]); //keep
  const [taxFreeInvestments, setTaxFreeInvestments] = useState([]); //keep


  const navigate = useNavigate();
  // console.log(currInvestments);
  const filteredInvestments = currInvestments.filter((investment) => {
    const matchesTaxStatus = investment.accountTaxStatus === formValues.taxStatus;
  
    const {
      type,
      fixedPercentages = {},
      initialPercentages = {}
    } = formValues.rebalanceAllocation;
  
    const alreadyAllocated =
      type === "fixed"
        ? Object.prototype.hasOwnProperty.call(fixedPercentages, investment._id)
        : Object.prototype.hasOwnProperty.call(initialPercentages, investment._id);
  
    return matchesTaxStatus && !alreadyAllocated;
  });
  
  // console.log(filteredInvestments);

  const cleanRebalanceAllocation = (form) => {
    const cleaned = { ...form };
    const allocation = { ...form.rebalanceAllocation };
  
    if (allocation.type === "fixed") {
      allocation.initialPercentages = {};
      allocation.finalPercentages = {};
    } else if (allocation.type === "glidePath") {
      allocation.fixedPercentages = {};
    }
  
    cleaned.rebalanceAllocation = allocation;
    return cleaned;
  };
  

  const handleSave = async () => {
    const cleanedFormValues = cleanRebalanceAllocation(formValues);
    
    setFormValues(cleanedFormValues);

    if (eventEditMode.id === "new") {
      let id;
  
      if (!user.guest) {
        const response = await axios.post(
          `http://localhost:8080/scenario/${editMode}/rebalanceStrategy`,
          cleanedFormValues
        );
        id = response.data._id;
      } else {
        id = currRebalance.length;
      }
  
      handleInputChange("_id", id);
      setCurrRebalance((prev) => [...prev, { ...cleanedFormValues, _id: id }]);
      setEventEditMode({ type: "Rebalance", id });
  
      setCurrScenario((prevScenario) => ({
        ...prevScenario,
        rebalanceEventSeries: [...(prevScenario?.rebalanceEventSeries || []), id],
      }));
    } else {
      const response = await axios.post(
        `http://localhost:8080/updateRebalanceStrategy/${eventEditMode.id}`,
        cleanedFormValues
      );
  
      setCurrRebalance((prev) => {
        const newList = prev.filter((item) => item._id !== eventEditMode.id);
        return [...newList, cleanedFormValues];
      });
  
      console.log(response);
    }
  };
  
  

    const handleAddInvestment = () => {
      if (!selectedInvestment) return;
    
      const investment = currInvestments.find((inv) => inv._id === selectedInvestment);
      if (!investment) return;
    
      setFormValues((prev) => {
        const updatedRebalance = { ...prev.rebalanceAllocation };
        const allocationType = prev.rebalanceAllocation.type;
    
        if (allocationType === "fixed") {
          if (!updatedRebalance.fixedPercentages) updatedRebalance.fixedPercentages = {};
          updatedRebalance.fixedPercentages[selectedInvestment] = parseFloat(pendingPercentage);
        } else if (allocationType === "glidePath") {
          if (!updatedRebalance.initialPercentages) updatedRebalance.initialPercentages = {};
          if (!updatedRebalance.finalPercentages) updatedRebalance.finalPercentages = {};
    
          updatedRebalance.initialPercentages[selectedInvestment] = parseFloat(pendingInitial);
          updatedRebalance.finalPercentages[selectedInvestment] = parseFloat(pendingFinal);
        }
    
        return {
          ...prev,
          rebalanceAllocation: updatedRebalance,
        };
      });
    
      // Categorize investment
      const alreadyInList = (list) =>
        list.some((inv) => inv.investmentTypeName === investment.investmentTypeName);
    
      if (formValues.taxStatus === "non-tax" && !alreadyInList(taxableInvestments)) {
        setTaxableInvestments([...taxableInvestments, investment]);
      } else if (formValues.taxStatus === "pre-tax" && !alreadyInList(taxDeferredInvestments)) {
        setTaxDeferredInvestments([...taxDeferredInvestments, investment]);
      } else if (formValues.taxStatus === "after-tax" && !alreadyInList(taxFreeInvestments)) {
        setTaxFreeInvestments([...taxFreeInvestments, investment]);
      }
    
      // Clear selection + pending inputs
      setSelectedInvestment("");
      setPendingPercentage("");
      setPendingInitial("");
      setPendingFinal("");
    };
    
  


  console.log(formValues.rebalanceAllocation);
  const displayedList = formValues.rebalanceAllocation;
  console.log(displayedList);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={""} />
      <Container>
        {/* Stack for title and save button */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Rebalance
          </Typography>
          <Button variant="contained" color="secondary" sx={buttonStyles} onClick={handleSave}>
            Save
          </Button>
        </Stack>

        <PageHeader />

        {/* Row 3 - Inflation Assumptions */}

        <Typography variant="h6" sx={{ fontWeight: "bold", marginTop: 4, marginBottom: 2 }}>
          Add Asset Allocation
        </Typography>

        <Box sx={{ display: "flex", gap: 4, width: "100%" }}>
          {/* Left Column - Tax Category & Investment Dropdowns */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Tax Category Dropdown */}
            <CustomInput title="Event name" value={formValues.eventSeriesName} setValue={(value) => handleInputChange("eventSeriesName", value)} />

            <CustomInput title="Description (Optional)" type="multiline" value={formValues.eventSeriesDescription} setValue={(value) => handleInputChange("eventSeriesDescription", value)} />

            <Stack direction="column" spacing={2}>
              <CustomInput title="Start Year" type="number" value={formValues.startYear.year} setValue={(value) => handleInputChange("startYear.year", value)} />

              <Stack spacing={2}>
                {/* Toggle on Top */}
                <CustomToggle 
                  title="Duration" 
                  labels={["Fixed", "Normal", "Uniform"]} 
                  values={["fixedAmt", "normal", "uniform"]} 
                  sideView={false} width={100} 
                  value={formValues.duration.type} setValue={(value) => handleInputChange("duration.type", value)} />

                {/* Input Fields Below in Columns */}
                <Stack direction="row" spacing={4} alignItems="start">
                  {formValues.duration.type === "fixedAmt" && 
                  <CustomInput title="Value" type="number" adornment={""} value={formValues.duration.value} setValue={(value) => handleInputChange("duration.value", value)} />}

                  {formValues.duration.type === "normal" && (
                    <Stack direction="row" spacing={4} alignItems="start">
                      <CustomInput title="Mean" type="number" adornment={""} value={formValues.duration.mean} setValue={(value) => handleInputChange("duration.mean", value)} />
                      <CustomInput title="Variance" type="number" adornment={""} value={formValues.duration.stdDev} setValue={(value) => handleInputChange("duration.stdDev", value)} />
                    </Stack>
                  )}

                  {formValues.duration.type === "uniform" && (
                    <Stack direction="row" spacing={4} alignItems="start">
                      <CustomInput title="Min" type="number" adornment={""} value={formValues.duration.min} setValue={(value) => handleInputChange("duration.min", value)} />
                      <CustomInput title="Max" type="number" adornment={""} value={formValues.duration.max} setValue={(value) => handleInputChange("duration.max", value)} />
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Stack>

            <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
              <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                Tax Category
              </Typography>
              <TextField
                select
                value={formValues.taxStatus}
                onChange={(e) => {
                  handleTaxStatusChange(e.target.value);
                }}
                fullWidth
                sx={textFieldStyles}
              >
                <MenuItem value="" disabled>
                  Select
                </MenuItem>
                <MenuItem value="non-tax">Taxable</MenuItem>
                <MenuItem value="pre-tax">Tax-Deferred</MenuItem>
                <MenuItem value="after-tax">Tax-Free</MenuItem>
              </TextField>
            </Box>

            {/* Investment Dropdown - Populated Based on Tax Category */}
            <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
              <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
                Investment
              </Typography>
              <TextField select value={selectedInvestment} onChange={(e) => setSelectedInvestment(e.target.value)} fullWidth sx={textFieldStyles} disabled={!formValues.taxStatus}>
                <MenuItem value="" disabled>
                  Select
                </MenuItem>
                {filteredInvestments.map((investment) => (
                  <MenuItem key={investment._id} value={investment._id}>
                    {getInvesmentTypeById(investment.investmentType).name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Stack spacing={2}>
              {/* Toggle Allocation Type */}
              <CustomToggle
                title="Allocations"
                labels={["Fixed", "Glide Path"]}
                values={["fixed", "glidePath"]}
                sideView={false}
                width={100}
                value={formValues.rebalanceAllocation.type}
                setValue={(value) =>
                  handleInputChange("rebalanceAllocation.type", value)
                }
              />

                {/* Input Fields Below in Columns */}
                <Stack direction="row" spacing={4} alignItems="start">
                  {formValues.rebalanceAllocation.type === "fixed" && selectedInvestment && (
                    <CustomInput
                      title="Value"
                      type="number"
                      adornment="%"
                      value={
                        pendingPercentage ?? ""
                      }
                      setValue={
                        setPendingPercentage
                      }
                    />
                  )}

                  {formValues.rebalanceAllocation.type === "glidePath" && selectedInvestment && (
                    <Stack direction="row" spacing={4} alignItems="start">
                      <CustomInput
                        title="Initial Percentage"
                        type="number"
                        adornment="%"
                        value={
                          pendingInitial ?? ""
                        }
                        setValue={
                          setPendingInitial
                        }
                      />
                      <CustomInput
                        title="Final Percentage"
                        type="number"
                        adornment="%"
                        value={
                          pendingFinal ?? ""
                        }
                        setValue={
                          setPendingFinal
                        }
                      />
                    </Stack>
                  )}
                </Stack>
              </Stack>


            {/* Add Button */}
            <Box sx={{ marginTop: 1, display: "flex", justifyContent: "flex-start" }}>
              <Button
                variant="contained"
                color="primary"
                sx={{ fontSize: "1.1rem", textTransform: "none" }}
                onClick={handleAddInvestment}
                disabled={!selectedInvestment} // Disable if no investment selected
              >
                Add
              </Button>
            </Box>
          </Box>

          {/* Right Column - Investment List for the selected tax type */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {formValues.taxStatus || "Investments"}
            </Typography>
            <InvestList
              rebalanceAllocation={displayedList}
              getInvestmentNameById={getInvestmentById}
            />
          </Box>
        </Box>

        {/* Back and Continue buttons */}
        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles} onClick={() => navigate("/scenario/event_series")}>
            Back
          </Button>

          <Button variant="contained" color="success" sx={buttonStyles}>
            Continue
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Rebalance;
