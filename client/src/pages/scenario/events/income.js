import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Checkbox, Stack, Box, TextField, ToggleButton, ToggleButtonGroup, InputAdornment } from '@mui/material';
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
    const [expectedChangeType, setExpectedChangeType] = useState('fixed');
    const [distributionType, setDistributionType] = useState('None');
    const [incomeType, setIncomeType] = useState('wage');
    const [changeValue, setChangeValue] = useState('');
    const [changeMean, setChangeMean] = useState('');
    const [changeVariance, setChangeVariance] = useState('');
    const [changeMin, setChangeMin] = useState('');
    const [changeMax, setChangeMax] = useState('');

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
                        Income
                    </Typography>
                    <Button variant="contained" color="secondary" sx={{ fontSize: '1.25rem', textTransform: 'none' }}>
                        Save
                    </Button>
                </Stack>

                <PageHeader />

                <Box sx={rowBoxStyles}>
                    {/* First Box with Inputs */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 320 }}>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                            Initial Income Amount
                        </Typography>
                        <TextField
                            variant="outlined"
                            type="number"
                            sx={textFieldStyles}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                        />
                        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                            <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                    User's Contribution
                                </Typography>
                                <TextField
                                    variant="outlined"
                                    type="number"
                                    sx={numFieldStyles}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                    Spouse's Contribution
                                </Typography>
                                <TextField
                                    variant="outlined"
                                    type="number"
                                    sx={numFieldStyles}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                />
                            </Box>
                        </Stack>
                        {/* Inflation Adjustment */}
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ marginTop: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                Inflation Adjustment
                            </Typography>
                            <Checkbox />
                        </Stack>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2, marginBottom: 3 }}>
                            <Box width='100px'>
                                <Typography>Income Type</Typography>
                            </Box>
                            <Box>
                                <ToggleButtonGroup
                                    value={incomeType}
                                    exclusive
                                    onChange={handleToggleChange(setIncomeType)}
                                    sx={toggleButtonGroupStyles}
                                >
                                    <ToggleButton value="wage">Wage</ToggleButton>
                                    <ToggleButton value="social security">Social Security</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Box>
                    </Box>

                    {/* Expected Annual Change Column */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'bold' }}>Expected Annual Change:</Typography>
                        <Box sx={{ flex: 1, minWidth: '270px', marginTop: 1 }}>
                            {/* Distribution Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 3, marginBottom: 3 }}>
                                <Box width='100px'>
                                    <Typography>Distribution</Typography>
                                </Box>
                                <Box>
                                    <ToggleButtonGroup
                                        value={distributionType}
                                        exclusive
                                        onChange={handleToggleChange(setDistributionType)}
                                        sx={toggleButtonGroupStyles}
                                    >
                                        <ToggleButton value="None">None</ToggleButton>
                                        <ToggleButton value="Normal">Normal</ToggleButton>
                                        <ToggleButton value="Uniform">Uniform</ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            </Box>

                            {/* Rate or Unit Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2, marginBottom: 3 }}>
                                <Box width='100px'>
                                    <Typography>Rate/Unit</Typography>
                                </Box>
                                <Box>
                                    <ToggleButtonGroup
                                        value={expectedChangeType}
                                        exclusive
                                        onChange={handleToggleChange(setExpectedChangeType)}
                                        sx={toggleButtonGroupStyles}
                                    >
                                        <ToggleButton value="fixed">Fixed</ToggleButton>
                                        <ToggleButton value="percentage">Percentage</ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            </Box>

                            {/* Conditional Inputs */}
                            {distributionType === "None" && (
                              <Box sx={{ display: 'flex', gap: 2, marginTop: 1 }}>
                                <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                    <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                        Value
                                    </Typography>
                                    <TextField 
                                        type="number"
                                        variant="outlined" 
                                        sx={numFieldStyles} 
                                        value={changeValue} 
                                        onChange={(e) => setChangeValue(e.target.value)} 
                                        InputProps={{
                                            [expectedChangeType === 'percentage' ? 'endAdornment' : 'startAdornment']: (
                                                <InputAdornment position={expectedChangeType === 'percentage' ? 'end' : 'start'}>
                                                    {expectedChangeType === 'percentage' ? '%' : '$'}
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                              </Box>
                            )}
                            {distributionType === "Normal" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                            Mean
                                        </Typography>
                                        <TextField 
                                            type="number"
                                            variant="outlined" 
                                            value={changeMean}
                                            sx={numFieldStyles}  
                                            onChange={(e) => setChangeMean(e.target.value)} 
                                            InputProps={{
                                                [expectedChangeType === 'percentage' ? 'endAdornment' : 'startAdornment']: (
                                                    <InputAdornment position={expectedChangeType === 'percentage' ? 'end' : 'start'}>
                                                        {expectedChangeType === 'percentage' ? '%' : '$'}
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                            Variance
                                        </Typography>
                                        <TextField 
                                            type="number"
                                            variant="outlined" 
                                            value={changeVariance} 
                                            sx={numFieldStyles} 
                                            onChange={(e) => setChangeVariance(e.target.value)} 
                                            InputProps={{
                                                [expectedChangeType === 'percentage' ? 'endAdornment' : 'startAdornment']: (
                                                    <InputAdornment position={expectedChangeType === 'percentage' ? 'end' : 'start'}>
                                                        {expectedChangeType === 'percentage' ? '%' : '$'}
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>
                                </Box>
                            )}
                            {distributionType === "Uniform" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 1 }}>
                                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                                            Min
                                        </Typography>
                                        <TextField 
                                            type="number"
                                            variant="outlined" 
                                            value={changeMin}
                                            sx={numFieldStyles}  
                                            onChange={(e) => setChangeMin(e.target.value)} 
                                            InputProps={{
                                                [expectedChangeType === 'percentage' ? 'endAdornment' : 'startAdornment']: (
                                                    <InputAdornment position={expectedChangeType === 'percentage' ? 'end' : 'start'}>
                                                        {expectedChangeType === 'percentage' ? '%' : '$'}
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', width: 'auto' }}>
                                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }} >
                                            Max
                                        </Typography>
                                        <TextField 
                                            type="number"
                                            variant="outlined" 
                                            value={changeMax} 
                                            sx={numFieldStyles} 
                                            onChange={(e) => setChangeMax(e.target.value)} 
                                            InputProps={{
                                                [expectedChangeType === 'percentage' ? 'endAdornment' : 'startAdornment']: (
                                                    <InputAdornment position={expectedChangeType === 'percentage' ? 'end' : 'start'}>
                                                        {expectedChangeType === 'percentage' ? '%' : '$'}
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Box>
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
