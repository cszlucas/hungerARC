import React, { useState, useContext } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, ToggleButton, ToggleButtonGroup, Select, MenuItem } from '@mui/material';
import theme from '../../../components/theme';
import Navbar from '../../../components/navbar';
import PageHeader from '../../../components/pageHeader';
import {
    textFieldStyles,
    numFieldStyles,
    backContinueContainerStyles,
    buttonStyles,
    rowBoxStyles,
} from '../../../components/styles';
import CustomDropdown from "../../../components/customDropDown";
import CustomInput from "../../../components/customInputBox";
import CustomToggle from "../../../components/customToggle";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../context/appContext";

const InvestmentType = () => {
    const {currInvestmentTypes, setCurrInvestmentTypes} = useContext(AppContext);
    const { eventEditMode } = useContext(AppContext);

    const getInvestmentTypeById = (id) => {
        let investmentType = null
        console.log('ID BE LIKE: ' + id)
        for (let i = 0; i < currInvestmentTypes.length; i++) {
            if (currInvestmentTypes[i]._id == id) {
                investmentType = currInvestmentTypes[i]; // Return the found scenario
                break;
            }
        }

        const taxMap = {
            "taxable": "Taxable",
            "tax-deferred": "Tax-Deferred",
            "tax-free": "Tax-Free"
        }

        if (investmentType) {
            return {
                id: investmentType._id || "new",
                name: investmentType.name || "",
                description: investmentType.description || "",
                expenseRatio: investmentType.expenseRatio || "",
                taxability: taxMap[investmentType.taxability] || "",

                returnAmountType: investmentType.annualReturn.type.indexOf('Amt') != -1 ? 'Fixed' : 'Percentage',
                returnDistributionType: investmentType.annualReturn.type.indexOf('fix') != -1 ? 'Fixed' : 'Normal',
                returnValue: investmentType.annualReturn.fixed || "",
                returnMean: investmentType.annualReturn.mean || "",
                returnStdDev: investmentType.annualReturn.stdDev || "",

                incomeAmountType: investmentType.annualIncome.type.indexOf('Amt') != -1 ? 'Fixed' : 'Percentage',
                incomeDistributionType: investmentType.annualIncome.type.indexOf('fix') != -1 ? 'Fixed' : 'Normal',
                incomeValue: investmentType.annualIncome.fixed || "",
                incomeMean: investmentType.annualIncome.mean || "",
                incomeStdDev: investmentType.annualIncome.stdDev || "",

            }
        }
        return null; // Return null if not found
    };

    const navigate = useNavigate();
    const [formValues, setFormValues] = useState(getInvestmentTypeById(eventEditMode) || {
        name: "",
        description: "",
        expenseRatio: "",
        taxability: "",

        returnAmountType: "Fixed",
        returnDistributionType: "Fixed",
        returnValue: "",
        returnMean: "",
        returnStdDev: "",

        incomeAmountType: "Fixed",
        incomeDistributionType: "Fixed",
        incomeValue: "",
        incomeMean: "",
        incomeStdDev: "",
    });

    const handleInputChange = (field, value) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
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
                            value={formValues.name} 
                            setValue={(value) => handleInputChange("name", value)} 
                        />

                        <CustomInput 
                            title="Description (Optional)" 
                            type="multiline" 
                            value={formValues.description} 
                            setValue={(value) => handleInputChange("description", value)} 
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
                                value={formValues.expenseRatio}
                                onChange={(value) => handleInputChange("expenseRatio", value)}
                                sx={numFieldStyles}
                            />
                            </Box>
                            <CustomDropdown
                                label="Taxability"
                                value={formValues.taxability}
                                setValue={(value) => handleInputChange("expenseRatio", value)}
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
                                value={formValues.returnAmountType}
                                setValue={(value) => { handleInputChange("returnAmountType", value)} }
                            />
                            {/* Distribution Toggle */}
                            <CustomToggle
                                title="Distribution"
                                values={['Fixed', 'Normal']}
                                sideView={true}
                                width={100}
                                value={formValues.returnDistributionType}
                                setValue={(value) => { handleInputChange("returnDistributionType", value) }}
                            />
                            {/* Conditional Inputs */}
                            {formValues.returnDistributionType === "Fixed" && (
                             <CustomInput 
                                title="Value" 
                                type="number"
                                adornment={ formValues.returnAmountType == 'Fixed' ? "$" : "%"}
                                value={formValues.returnValue} 
                                setValue={(value) => { handleInputChange("returnValue", value)}} 
                            />
                            )}
                            {formValues.returnDistributionType === "Normal" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    <CustomInput 
                                        title="Mean" 
                                        type="number" 
                                        adornment={ formValues.returnAmountType == 'Fixed' ? "$" : "%"}
                                        value={formValues.returnMean} 
                                        setValue={(value) => { handleInputChange("returnMean", value)}} 
                                    />
                                    <CustomInput 
                                        title="Variance" 
                                        type="number" 
                                        adornment={ formValues.returnAmountType == 'Fixed' ? "$" : "%"}
                                        value={formValues.returnStdDev} 
                                        setValue={(value) => { handleInputChange("returnStdDev", value)}} 
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
                                value={formValues.incomeAmountType}
                                setValue={(value) => { handleInputChange("incomeAmountType", value)}}
                            />
                            {/* Distribution Toggle */}
                            <CustomToggle
                                title="Distribution"
                                values={['Fixed', 'Normal']}
                                sideView={true}
                                width={100}
                                value={formValues.incomeDistributionType}
                                setValue={(value) => { handleInputChange("incomeDistributionType", value)}}
                            />
                            {/* Conditional Inputs */}
                            {formValues.incomeDistributionType === "Fixed" && (
                            <CustomInput 
                                title="Value" 
                                type="number"
                                adornment={formValues.incomeAmountType == 'Fixed' ? "$" : "%"}
                                value={formValues.incomeValue} 
                                setValue={(value) => { handleInputChange("incomeValue", value)}} 
                            />
                            )}
                            {formValues.incomeDistributionType === "Normal" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    <CustomInput 
                                        title="Mean" 
                                        type="number"
                                        adornment={ formValues.incomeAmountType == 'Fixed' ? "$" : "%"} 
                                        value={formValues.incomeMean} 
                                        setValue={(value) => { handleInputChange("incomeMean", value)}} 
                                    />
                                    <CustomInput 
                                        title="Variance" 
                                        type="number"
                                        adornment={ formValues.incomeAmountType == 'Fixed' ? "$" : "%"}
                                        value={formValues.incomeStdDev} 
                                        setValue={(value) => { handleInputChange("incomeStdDev", value)}} 
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
                    
                {/* Back and Continue buttons */}
                <Box sx={backContinueContainerStyles}>
                    <Button variant="contained" color="primary" sx={buttonStyles}
                        onClick={() => navigate("/scenario/investment_lists")}
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" color="success" sx={buttonStyles}
                        onClick={() => navigate("/scenario/investment_lists")}
                    >
                        Add
                    </Button>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default InvestmentType;

