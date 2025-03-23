import React, { useState } from "react";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, 
  InputAdornment, Box, List, MenuItem, ListItem, ListItemText, 
  IconButton, TextField, ToggleButton, ToggleButtonGroup
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

const Invest = () => {
    const navigate = useNavigate();

    const [eventName, setEventName] = useState('');
    const [description, setDescription] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');

    const [maxCash, setMaxCash] = useState('');
    const [newInvestment, setNewInvestment] = useState({
        investmentTypeName: '',
        initial: '',
        final: '',
      });
    
    const [allocationType, setAllocationType] = useState("glide"); // Default is Glide Path
    const handleAllocationChange = (event, newType) => {
        if (newType !== null) {
            setAllocationType(newType);
        }
    };

    const [allInvestments] = useState([
        { investmentTypeName: 'Apple', initial: '0', final: '0'},
        { investmentTypeName: 'Microsoft', initial: '0', final: '0'},
        { investmentTypeName: 'Amazon', initial: '0', final: '0'},
        { investmentTypeName: 'IRA', initial: '0', final: '0'},
        { investmentTypeName: '401k', initial: '0', final: '0'},
        { investmentTypeName: 'Roth 401k', initial: '0', final: '0'},
        { investmentTypeName: 'Roth 403k', initial: '0', final: '0'},
    ]);

    const [selectedInvestments, setSelectedInvestments] = useState([]);
    
    // import { List, ListItem, ListItemText, IconButton } from "@mui/material";
    const handleMoveInvestment = (fromIndex, toIndex) => {
        setSelectedInvestments((prevInvestments) => {
            if (fromIndex === toIndex || fromIndex < 0 || toIndex >= prevInvestments.length) {
                return prevInvestments;
            }
    
            // Swap elements in selectedInvestments
            const newInvestments = [...prevInvestments];
            [newInvestments[fromIndex], newInvestments[toIndex]] = [newInvestments[toIndex], newInvestments[fromIndex]];
    
            return newInvestments;
        });
    };
    


    const handleAddInvestment = () => {
        if (!newInvestment.investmentTypeName || newInvestment.initial === '') {
            alert("Please select an investment and enter a valid allocation percentage.");
            return;
        }
    
        // Ensure investment is not already in selectedInvestments
        const investmentExists = selectedInvestments.some(
            (investment) => investment.investmentTypeName === newInvestment.investmentTypeName
        );
    
        if (!investmentExists) {
            setSelectedInvestments([...selectedInvestments, { ...newInvestment }]);
    
            // Reset input fields after adding
            setNewInvestment({
                investmentTypeName: '',
                initial: '',
                final: '',
            });
        } else {
            alert("Investment already added!");
        }
    };

    const handleRemoveInvestment = (index) => {
        setSelectedInvestments((prevInvestments) => prevInvestments.filter((_, i) => i !== index));
    };    

    const availableInvestments = allInvestments.filter(
        (investment) => !selectedInvestments.some((sel) => sel.investmentTypeName === investment.investmentTypeName)
    );    
    
    
    const InvestList = ({ list, handleMoveInvestment, handleRemoveInvestment }) => {
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
                            secondary={`Initial: ${item.initial}, Final: ${item.final}`}
                        />
    
                        {/* Move Up Button (Not for first item) */}
                        {index > 0 && (
                            <IconButton
                                edge="end"
                                aria-label="move up"
                                onClick={() => handleMoveInvestment(index, index - 1)}
                            >
                                <ArrowUpwardIcon />
                            </IconButton>
                        )}
    
                        {/* Move Down Button (Not for last item) */}
                        {index < list.length - 1 && (
                            <IconButton
                                edge="end"
                                aria-label="move down"
                                onClick={() => handleMoveInvestment(index, index + 1)}
                            >
                                <ArrowDownwardIcon />
                            </IconButton>
                        )}
    
                        {/* Delete Button */}
                        <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleRemoveInvestment(index)}
                        >
                            <DeleteIcon color="grey" />
                        </IconButton>
                    </ListItem>
                ))}
            </List>
        );
    };
    
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewInvestment((prev) => ({
          ...prev,
          [name]: value,
        }));
    };

    return (
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navbar currentPage={''} />
        <Container>

            {/* Stack for title and save button */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
            <Typography variant="h2" component="h1" sx={titleStyles}>
                Invest
            </Typography>
            <Button variant="contained" color="secondary" sx={buttonStyles}>
                Save
            </Button>
            </Stack>

            <PageHeader />

            <Box sx={rowBoxStyles}>
                {/* First Column - Input Fields */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
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

                        <CustomInput
                            title="Maximum Cash"
                            type="number"
                            adornment="$"
                            value={maxCash}
                            setValue={setMaxCash}
                        />
                    </Stack>


                    <Typography variant="h6" sx={{ fontWeight: 'bold', marginTop: 2, marginBottom: 1 }}>
                            Add Asset Allocation
                    </Typography>
                    <Box sx={rowBoxStyles}>
                        <Box>
                            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                Investment Name
                            </Typography>
                            <TextField
                                select
                                name="investmentTypeName"
                                value={newInvestment.investmentTypeName}
                                onChange={handleChange}
                                sx={{ ...textFieldStyles, width: "150px" }}
                                fullWidth
                            >
                                <MenuItem value="" disabled>
                                    Select an Investment
                                </MenuItem>
                                {availableInvestments.map((investment) => (
                                    <MenuItem key={investment.investmentTypeName} value={investment.investmentTypeName}>
                                        {investment.investmentTypeName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        {/* Toggle Button for Glide Path / Fixed Percentage */}
                        <Box sx={{ mt: 4, mb: 2 }}>
                            <ToggleButtonGroup
                                value={allocationType}
                                exclusive
                                onChange={handleAllocationChange}
                                aria-label=""
                                sx={toggleButtonGroupStyles}
                            >
                                <ToggleButton value="glide"> Glided Path </ToggleButton>
                                <ToggleButton value="fixed"> Fixed </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>

                    <Box sx={{mt: -4}}>
                        {/* Show Initial & Final Fields if Glide Path is selected */}
                        {allocationType === "glide" && (
                            <Stack direction="row" spacing={2}>
                                <Box sx={{mb: 2}}>
                                    <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                        Initial Investment Allocation
                                    </Typography>
                                    <TextField
                                        type="number"
                                        name="initial"
                                        value={newInvestment.initial}
                                        onChange={handleChange}
                                        sx={{ ...textFieldStyles, width: "150px" }}
                                        fullWidth
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                        Final Investment Allocation
                                    </Typography>
                                    <TextField
                                        type="number"
                                        name="final"
                                        value={newInvestment.final}
                                        onChange={handleChange}
                                        sx={{ ...textFieldStyles, width: "150px" }}
                                        fullWidth
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                    />
                                </Box>
                            </Stack>
                        )}

                        {/* Show only Initial Field if Fixed Percentage is selected */}
                        {allocationType === "fixed" && (
                            <Box>
                                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                    Fixed Allocation Percentage
                                </Typography>
                                <TextField
                                    type="number"
                                    name="initial"
                                    value={newInvestment.initial}
                                    onChange={handleChange}
                                    sx={{ ...textFieldStyles, width: "150px" }}
                                    fullWidth
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                />
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ marginTop: 1, display: "flex", justifyContent: "flex-start" }}>
                        <Button 
                            variant="contained" 
                            color="primary"
                            sx={{ fontSize: '1.1rem', textTransform: 'none' }}
                            onClick={handleAddInvestment}
                        >
                            Add
                        </Button>
                    </Box>
                </Box>

                {/* Second Column - Investment List */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Taxable</Typography>
                    <InvestList list={selectedInvestments} handleMoveInvestment={handleMoveInvestment} handleRemoveInvestment={handleRemoveInvestment}/>
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

export default Invest;