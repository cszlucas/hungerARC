import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, ToggleButton, ToggleButtonGroup, Select, MenuItem } from '@mui/material';
import theme from '../../../components/theme';
import Navbar from '../../../components/navbar';
import PageHeader from '../../../components/pageHeader';
import {
    stackStyles,
    titleStyles,
    textFieldStyles,
    numFieldStyles,
    multiLineTextFieldStyles,
    toggleButtonGroupStyles,
    backContinueContainerStyles,
    buttonStyles,
    rowBoxStyles,
} from '../../../components/styles';
import CustomDropdown from "../../../components/customDropDown";
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";

const InvestmentType = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [returnAmountType, setReturnAmountType] = useState('Fixed');
    const [incomeAmountType, setIncomeAmountType] = useState('Fixed');
    const [returnDistributionType, setReturnDistributionType] = useState('None');
    const [incomeDistributionType, setIncomeDistributionType] = useState('None');
    const [returnDistributionValue, setReturnDistributionValue] = useState('');
    const [returnMean, setReturnMean] = useState('');
    const [returnVariance, setReturnVariance] = useState('');
    const [incomeDistributionValue, setIncomeDistributionValue] = useState('');
    const [incomeMean, setIncomeMean] = useState('');
    const [incomeVariance, setIncomeVariance] = useState('');
    const [taxability, setTaxability] = useState('');

    const handleToggleChange = (setter) => (event, newValue) => {
        if (newValue !== null) setter(newValue);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={''} />
            <Container>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ marginTop: 6, marginBottom: 2 }}>
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold' }}>
                        Investment Type
                    </Typography>
                    <Button variant="contained" color="secondary" sx={{ fontSize: '1.25rem', textTransform: 'none' }}>
                        Save
                    </Button>
                </Stack>

                <PageHeader />

                <Box sx={rowBoxStyles}>
                    {/* First Box with Inputs */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <CustomInput 
                            title="Name" 
                            value={name} 
                            setValue={setName} 
                        />

                        <CustomInput 
                            title="Description (Optional)" 
                            type="multiline" 
                            value={description} 
                            setValue={setDescription} 
                        />
                        
                        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                            <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                Expense Ratio
                            </Typography>
                            <TextField
                                variant="outlined"
                                type="number"
                                inputProps={{
                                    step: "any", // Allows decimal values
                                    min: "0", // Prevents negative numbers (optional)
                                }}
                                sx={numFieldStyles}
                            />
                            </Box>
                            <CustomDropdown
                                label="Taxability"
                                value={taxability}
                                setValue={setTaxability}
                                menuItems={["Taxable", "Tax-Deferred", "Tax-Free"]}
                                textFieldStyles={textFieldStyles}
                            />
                        </Stack>
                    </Box>


                    {/* Expected Annual Return */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>Expected Annual Return:</Typography>
                        <Box sx={{ flex: 1, minWidth: '270px', marginTop: 1 }}>
                            {/* Amount Toggle */}
                            <CustomToggle
                                title="Amount"
                                values={['Fixed', 'Percentage']}
                                sideView={true}
                                width={100}
                                value={returnAmountType}
                                setValue={setReturnAmountType}
                            />
                            {/* Distribution Toggle */}
                            <CustomToggle
                                title="Distribution"
                                values={['None', 'Normal']}
                                sideView={true}
                                width={100}
                                value={returnDistributionType}
                                setValue={setReturnDistributionType}
                            />
                            {/* Conditional Inputs */}
                            {returnDistributionType === "None" && (
                             <CustomInput 
                                title="Value" 
                                type="number"
                                adornment={ returnAmountType == 'Fixed' ? "$" : "%"}
                                value={returnDistributionValue} 
                                setValue={setReturnDistributionValue} 
                            />
                            )}
                            {returnDistributionType === "Normal" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    <CustomInput 
                                        title="Mean" 
                                        type="number" 
                                        adornment={ returnAmountType == 'Fixed' ? "$" : "%"}
                                        value={returnMean} 
                                        setValue={setReturnMean} 
                                    />
                                    <CustomInput 
                                        title="Variance" 
                                        type="number" 
                                        adornment={ returnAmountType == 'Fixed' ? "$" : "%"}
                                        value={returnVariance} 
                                        setValue={setReturnVariance} 
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Expected Annual Income */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>Expected Annual Income:</Typography>
                        <Box sx={{ flex: 1, minWidth: '270px', marginTop: 1 }}>
                            {/* Amount Toggle */}
                            <CustomToggle
                                title="Amount"
                                values={['Fixed', 'Percentage']}
                                sideView={true}
                                width={100}
                                value={incomeAmountType}
                                setValue={setIncomeAmountType}
                            />
                            {/* Distribution Toggle */}
                            <CustomToggle
                                title="Distribution"
                                values={['None', 'Normal']}
                                sideView={true}
                                width={100}
                                value={incomeDistributionType}
                                setValue={setIncomeDistributionType}
                            />
                            {/* Conditional Inputs */}
                            {incomeDistributionType === "None" && (
                            <CustomInput 
                                title="Value" 
                                type="number"
                                adornment={ incomeAmountType == 'Fixed' ? "$" : "%"}
                                value={returnDistributionValue} 
                                setValue={setReturnDistributionValue} 
                            />
                            )}
                            {incomeDistributionType === "Normal" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    <CustomInput 
                                        title="Mean" 
                                        type="number"
                                        adornment={ incomeAmountType == 'Fixed' ? "$" : "%"} 
                                        value={returnMean} 
                                        setValue={setReturnMean} 
                                    />
                                    <CustomInput 
                                        title="Variance" 
                                        type="number"
                                        adornment={ incomeAmountType == 'Fixed' ? "$" : "%"}
                                        value={returnVariance} 
                                        setValue={setReturnVariance} 
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            
                <Box sx = {{ display: "flex", justifyContent: "flex-end", marginTop: 1 }}>
                    <Button 
                        variant="contained" 
                        color="primary"
                        sx={{ fontSize: '1.1rem', textTransform: 'none' }}
                    >
                        Add
                    </Button>
                </Box>

                    
                {/* Back and Continue buttons */}
                <Box sx={backContinueContainerStyles}>
                    <Button variant="contained" color="primary" sx={buttonStyles}>
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

export default InvestmentType;

