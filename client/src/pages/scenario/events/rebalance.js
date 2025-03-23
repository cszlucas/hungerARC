import React, { useState } from "react";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, 
  InputAdornment, Box, List, MenuItem, ListItem, ListItemText, 
  IconButton, Backdrop, Modal, Fade, TextField, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import theme from '../../../components/theme';
import Navbar from '../../../components/navbar';
import PageHeader from '../../../components/pageHeader';
import {
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, 
  backContinueContainerStyles, textFieldStyles, toggleButtonGroupStyles
} from '../../../components/styles';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete'; 
import CustomDropdown from "../../../components/customDropDown"; 
import CustomInput from "../../../components/customInputBox";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useNavigate } from "react-router-dom";

const investmentsData = [
    { investmentTypeName: "Apple", taxType: "Taxable", percent: "0" },
    { investmentTypeName: "Microsoft", taxType: "Taxable", percent: "0" },
    { investmentTypeName: "Amazon", taxType: "Taxable", percent: "0" },
    { investmentTypeName: "IRA", taxType: "Tax-Deferred", percent: "0" },
    { investmentTypeName: "401k", taxType: "Tax-Deferred", percent: "0" },
    { investmentTypeName: "Roth 401k", taxType: "Tax-Free", percent: "0" },
    { investmentTypeName: "Roth 403k", taxType: "Tax-Free", percent: "0" },
  ];

const InvestList = ({ list, handleMoveInvestment }) => {
    return (
      <List>
        {list.map((item, index) => (
          <ListItem
            key={`${item.investmentTypeName}-${index}`}
            sx={{
              backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
              "&:hover": { backgroundColor: "#B0B0B0" },
            }}
          >
            <ListItemText
              primary={<span style={{ fontWeight: "bold" }}>{item.investmentTypeName}</span>}
              secondary={`${item.percent} %`}
            />
  
            {/* Move Up Button (Not for first item) */}
            {index > 0 && (
              <IconButton edge="end" aria-label="move up" onClick={() => handleMoveInvestment(index, index - 1)}>
                <ArrowUpwardIcon />
              </IconButton>
            )}
  
            {/* Move Down Button (Not for last item) */}
            {index < list.length - 1 && (
              <IconButton edge="end" aria-label="move down" onClick={() => handleMoveInvestment(index, index + 1)}>
                <ArrowDownwardIcon />
              </IconButton>
            )}
          </ListItem>
        ))}
      </List>
    );
  };


const Rebalance = () => {
    const [eventName, setEventName] = useState('');
    const [description, setDescription] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');

    const [selectedTaxType, setSelectedTaxType] = useState("");
    const [selectedInvestment, setSelectedInvestment] = useState("");
  
    const [taxableInvestments, setTaxableInvestments] = useState([]);
    const [taxDeferredInvestments, setTaxDeferredInvestments] = useState([]);
    const [taxFreeInvestments, setTaxFreeInvestments] = useState([]);

    const navigate = useNavigate();
    const filteredInvestments = investmentsData.filter((investment) => investment.taxType === selectedTaxType);
  
    const handleAddInvestment = () => {
      if (!selectedInvestment) return;
  
      const investment = investmentsData.find((inv) => inv.investmentTypeName === selectedInvestment);
      if (!investment) return;
  
      if (selectedTaxType === "Taxable" && !taxableInvestments.some((inv) => inv.investmentTypeName === investment.investmentTypeName)) {
        setTaxableInvestments([...taxableInvestments, investment]);
      } else if (selectedTaxType === "Tax-Deferred" && !taxDeferredInvestments.some((inv) => inv.investmentTypeName === investment.investmentTypeName)) {
        setTaxDeferredInvestments([...taxDeferredInvestments, investment]);
      } else if (selectedTaxType === "Tax-Free" && !taxFreeInvestments.some((inv) => inv.investmentTypeName === investment.investmentTypeName)) {
        setTaxFreeInvestments([...taxFreeInvestments, investment]);
      }
  
      setSelectedInvestment(""); // Clear selection after adding
    };
  
    const handleMoveInvestment = (listSetter, list, fromIndex, toIndex) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex >= list.length) return;
      const newList = [...list];
      [newList[fromIndex], newList[toIndex]] = [newList[toIndex], newList[fromIndex]];
      listSetter(newList);
    };
  
    const displayedList =
      selectedTaxType === "Taxable" ? taxableInvestments :
      selectedTaxType === "Tax-Deferred" ? taxDeferredInvestments :
      selectedTaxType === "Tax-Free" ? taxFreeInvestments : [];
  

    
  
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navbar currentPage={''} />
        <Container>
  
          {/* Stack for title and save button */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
            <Typography variant="h2" component="h1" sx={titleStyles}>
              Rebalance
            </Typography>
            <Button variant="contained" color="secondary" sx={buttonStyles}>
              Save
            </Button>
          </Stack>
  
          <PageHeader />
  
          {/* Row 3 - Inflation Assumptions */}

        <Typography variant="h6" sx={{ fontWeight: 'bold', marginTop: 4, marginBottom: 2 }}>
          Add Asset Allocation
        </Typography>
        
        <Box sx={{ display: "flex", gap: 4, width: "100%" }}>
      {/* Left Column - Tax Category & Investment Dropdowns */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Tax Category Dropdown */}
        <CustomInput 
          title="Event name" 
          value={eventName} 
          setValue={setEventName} 
        />

        <CustomInput 
          title="Description (Optional)" 
          type="multiline" 
          value={description} 
          setValue={setDescription} 
        />

        <Stack direction="row" spacing={2}>
            <CustomInput 
              title="Start Year" 
              type="number" 
              value={startYear} 
              setValue={setStartYear} 
            />

            <CustomInput
              title="End Year" 
              type="number" 
              value={endYear} 
              setValue={setEndYear} 
            />
        </Stack>
        
        <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
          <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
            Tax Category
          </Typography>
          <TextField
            select
            value={selectedTaxType}
            onChange={(e) => {
              setSelectedTaxType(e.target.value);
              setSelectedInvestment(""); // Reset investment selection
            }}
            fullWidth
            sx={textFieldStyles}
          >
            <MenuItem value="" disabled>
              Select
            </MenuItem>
            <MenuItem value="Taxable">Taxable</MenuItem>
            <MenuItem value="Tax-Deferred">Tax-Deferred</MenuItem>
            <MenuItem value="Tax-Free">Tax-Free</MenuItem>
          </TextField>
        </Box>

        {/* Investment Dropdown - Populated Based on Tax Category */}
        <Box sx={{ display: "inline-flex", flexDirection: "column", width: "auto" }}>
          <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: "medium" }}>
            Investment
          </Typography>
          <TextField
            select
            value={selectedInvestment}
            onChange={(e) => setSelectedInvestment(e.target.value)}
            fullWidth
            sx={textFieldStyles}
            disabled={!selectedTaxType}
          >
            <MenuItem value="" disabled>
              Select
            </MenuItem>
            {filteredInvestments.map((investment) => (
              <MenuItem key={investment.investmentTypeName} value={investment.investmentTypeName}>
                {investment.investmentTypeName}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Add Button */}
        <Box sx={{ marginTop: 1, display: "flex", justifyContent: "flex-start" }}>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ fontSize: '1.1rem', textTransform: 'none' }}
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
          {selectedTaxType || "Investments"}
        </Typography>
        <InvestList
          list={displayedList}
          handleMoveInvestment={(fromIndex, toIndex) =>
            handleMoveInvestment(
              selectedTaxType === "Taxable" ? setTaxableInvestments :
              selectedTaxType === "Tax-Deferred" ? setTaxDeferredInvestments :
              setTaxFreeInvestments,
              displayedList,
              fromIndex,
              toIndex
            )
          }
        />
      </Box>
    </Box>


          {/* Back and Continue buttons */}
          <Box sx={backContinueContainerStyles}>
            <Button variant="contained" color="primary" sx={buttonStyles}
              onClick={() => navigate("/scenario/event_series")}
            >
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
  