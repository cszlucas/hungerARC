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

const InvestmentType = () => {
    const [returnAmountType, setReturnAmountType] = useState('fixed');
    const [incomeAmountType, setIncomeAmountType] = useState('fixed');
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
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                            Name
                        </Typography>
                        <TextField
                            variant="outlined"
                            sx={textFieldStyles}
                        />
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium', marginTop: 2 }}>
                            Description (Optional)
                        </Typography>
                        <TextField
                            variant="outlined"
                            multiline
                            sx={multiLineTextFieldStyles}
                            rows={4}
                        />
                    </Box>

                    {/* Expected Annual Return */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>Expected Annual Return:</Typography>
                        <Box sx={{ flex: 1, minWidth: '270px', marginTop: 1 }}>
                        
                            {/* Amount Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                                <Box width='100px'>
                                    <Typography>Amount</Typography>
                                </Box>
                                <Box>
                                    <ToggleButtonGroup
                                        value={returnAmountType}
                                        exclusive
                                        onChange={handleToggleChange(setReturnAmountType)}
                                        sx={toggleButtonGroupStyles}
                                    >
                                        <ToggleButton value="fixed">Fixed</ToggleButton>
                                        <ToggleButton value="percentage">Percentage</ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            </Box>

                            {/* Distribution Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 3, marginBottom: 3 }}>
                                <Box width='100px'>
                                    <Typography>Distribution</Typography>
                                </Box>
                                <Box>
                                    <ToggleButtonGroup
                                        value={returnDistributionType}
                                        exclusive
                                        onChange={handleToggleChange(setReturnDistributionType)}
                                        sx={toggleButtonGroupStyles}
                                    >
                                        <ToggleButton value="None">None</ToggleButton>
                                        <ToggleButton value="Normal">Normal</ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            </Box>

                            {/* Conditional Inputs */}
                            {returnDistributionType === "None" && (
                                <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                    <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                        Value
                                    </Typography>
                                    <TextField 
                                        type="number"
                                        variant="outlined" 
                                        sx={numFieldStyles} 
                                        value={returnDistributionValue} 
                                        onChange={(e) => setReturnDistributionValue(e.target.value)} 
                                    />
                                </Box>
                            )}
                            {returnDistributionType === "Normal" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                            Mean
                                        </Typography>
                                        <TextField 
                                            type="number"
                                            variant="outlined" 
                                            value={returnMean}
                                            sx={numFieldStyles}  
                                            onChange={(e) => setReturnMean(e.target.value)} 
                                        />
                                    </Box>
                                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                            Variance
                                        </Typography>
                                        <TextField 
                                            type="number"
                                            variant="outlined" 
                                            value={returnVariance} 
                                            sx={numFieldStyles} 
                                            onChange={(e) => setReturnVariance(e.target.value)} 
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Expected Annual Income */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>Expected Annual Income:</Typography>
                        <Box sx={{ flex: 1, minWidth: '270px', marginTop: 1 }}>
                        
                            {/* Amount Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                                <Box width='100px'>
                                    <Typography>Amount</Typography>
                                </Box>
                                <Box>
                                    <ToggleButtonGroup
                                        value={incomeAmountType}
                                        exclusive
                                        onChange={handleToggleChange(setIncomeAmountType)}
                                        sx={toggleButtonGroupStyles}
                                    >
                                        <ToggleButton value="fixed">Fixed</ToggleButton>
                                        <ToggleButton value="percentage">Percentage</ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            </Box>

                            {/* Distribution Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 3, marginBottom: 3 }}>
                                <Box width='100px'>
                                    <Typography>Distribution</Typography>
                                </Box>
                                <Box>
                                    <ToggleButtonGroup
                                        value={incomeDistributionType}
                                        exclusive
                                        onChange={handleToggleChange(setIncomeDistributionType)}
                                        sx={toggleButtonGroupStyles}
                                    >
                                        <ToggleButton value="None">None</ToggleButton>
                                        <ToggleButton value="Normal">Normal</ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            </Box>

                            {/* Conditional Inputs */}
                            {incomeDistributionType === "None" && (
                                <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                    <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                        Value
                                    </Typography>
                                    <TextField 
                                        type="number"
                                        variant="outlined" 
                                        sx={numFieldStyles} 
                                        value={incomeDistributionValue} 
                                        onChange={(e) => setIncomeDistributionValue(e.target.value)} 
                                    />
                                </Box>
                            )}
                            {incomeDistributionType === "Normal" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                            Mean
                                        </Typography>
                                        <TextField 
                                            type="number"
                                            variant="outlined" 
                                            value={incomeMean}
                                            sx={numFieldStyles}  
                                            onChange={(e) => setIncomeMean(e.target.value)} 
                                        />
                                    </Box>
                                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                            Variance
                                        </Typography>
                                        <TextField 
                                            type="number"
                                            variant="outlined" 
                                            value={incomeVariance} 
                                            sx={numFieldStyles} 
                                            onChange={(e) => setIncomeVariance(e.target.value)} 
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
                
                <Box sx={rowBoxStyles}>
                    <Box>
                        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                            <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                Expense Ratio
                            </Typography>
                            <TextField
                                variant="outlined"
                                type="number"
                                sx={numFieldStyles}
                            />
                            </Box>
            
                            <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                Taxability
                            </Typography>
                            <TextField
                                select
                                value={taxability}
                                onChange={(e) => handleToggleChange(setTaxability)}
                                displayEmpty
                                fullWidth
                                sx={textFieldStyles}
                            >
                                <MenuItem value="" disabled>Select</MenuItem>
                                <MenuItem value="Taxable">Taxable</MenuItem>
                                <MenuItem value="Tax-Deferred">Tax-Deferred</MenuItem>
                                <MenuItem value="Tax-Free">Tax-Free</MenuItem>
                            </TextField>
                            </Box>
                        </Stack>
                    </Box>
                    <Box sx = {{marginTop: 6, marginLeft: "auto"}}>
                        <Button 
                            variant="contained" 
                            color="secondary"
                            sx={{ fontSize: '1.1rem', textTransform: 'none' }}
                        >
                            Add
                        </Button>
                    </Box>
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

