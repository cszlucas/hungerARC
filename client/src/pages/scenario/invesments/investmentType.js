import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, TextField, ToggleButton, ToggleButtonGroup, Select, MenuItem } from '@mui/material';
import theme from '../../../components/theme';
import Navbar from '../../../components/navbar';
import PageHeader from '../../../components/pageHeader';

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

                <Box sx={{ display: 'flex', gap: 2 }}>
    
                    {/* Name Field */}
                    <Box sx={{ flex: 1, maxWidth: '250px' }}> 
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                            Name
                        </Typography>
                        <TextField
                            variant="outlined"
                            fullWidth
                            placeholder=""
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: theme.palette.grey[300], // Gray background
                                    border: 'none', 
                                    height: '35px',
                                    '& fieldset': { display: 'none' }, 
                                    '&:hover fieldset': { display: 'none' }, 
                                    '&.Mui-focused fieldset': { display: 'none' },
                                }
                            }}
                        />
                    </Box>

                    {/* Description Field */}
                    <Box sx={{ flex: 1, maxWidth: '350px' }}> 
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                            Description
                        </Typography>
                        <TextField
                            variant="outlined"
                            fullWidth
                            multiline
                            placeholder=""
                            minRows={1} 
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: theme.palette.grey[300], // Gray background
                                    border: 'none',
                                    height: '35px',
                                    '& fieldset': { display: 'none' }, 
                                    '&:hover fieldset': { display: 'none' }, 
                                    '&.Mui-focused fieldset': { display: 'none' },
                                }
                            }}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 4 }}>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        {/* Expected Annual Return */}
                        <Box sx={{ flex: 1, minWidth: '270px', marginTop: 1 }}>
                            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>Expected Annual Return:</Typography>

                            {/* Amount Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                                <Typography>Amount</Typography>
                                <ToggleButtonGroup
                                    value={returnAmountType}
                                    exclusive
                                    onChange={handleToggleChange(setReturnAmountType)}
                                    sx={{
                                        height: '40px',
                                        '& .MuiToggleButton-root': {
                                            backgroundColor: theme.palette.grey[400],
                                            color: 'black',
                                            height: '40px',
                                            textTransform: 'none',
                                            '&:hover': { backgroundColor: theme.palette.grey[500] },
                                            '&.Mui-selected': {
                                                backgroundColor: theme.palette.secondary.main,
                                                color: theme.palette.secondary.contrastText,
                                                '&:hover': { backgroundColor: theme.palette.secondary.dark }
                                            }
                                        }
                                    }}
                                >
                                    <ToggleButton value="fixed">Fixed</ToggleButton>
                                    <ToggleButton value="percentage">Percentage</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {/* Distribution Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 3 }}>
                                <Typography>Distribution</Typography>
                                <ToggleButtonGroup
                                    value={returnDistributionType}
                                    exclusive
                                    onChange={handleToggleChange(setReturnDistributionType)}
                                    sx={{
                                        height: '40px',
                                        '& .MuiToggleButton-root': {
                                            backgroundColor: theme.palette.grey[400],
                                            color: 'black',
                                            height: '40px',
                                            textTransform: 'none',
                                            '&:hover': { backgroundColor: theme.palette.grey[500] },
                                            '&.Mui-selected': {
                                                backgroundColor: theme.palette.secondary.main,
                                                color: theme.palette.secondary.contrastText,
                                                '&:hover': { backgroundColor: theme.palette.secondary.dark }
                                            }
                                        }
                                    }}
                                >
                                    <ToggleButton value="None">None</ToggleButton>
                                    <ToggleButton value="Normal">Normal</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {/* Conditional Inputs */}
                            {returnDistributionType === "None" && (
                                <TextField fullWidth label="Value" variant="outlined" sx={{ marginTop: 2,  maxWidth: '150px'}} value={returnDistributionValue} onChange={(e) => setReturnDistributionValue(e.target.value)} />
                            )}
                            {returnDistributionType === "Normal" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    <TextField fullWidth label="Mean" 
                                    variant="outlined" value={returnMean}
                                    sx={{ 
                                      maxWidth: '150px'  // Only reducing width
                                    }}  
                                    onChange={(e) => setReturnMean(e.target.value)} />
                                    <TextField fullWidth label="Variance" 
                                    variant="outlined" value={returnVariance} 
                                    sx={{ 
                                      maxWidth: '150px'  // Only reducing width
                                    }} 
                                    onChange={(e) => setReturnVariance(e.target.value)} />
                                </Box>
                            )}
                        </Box>

                        {/* Expected Annual Income */}
                        <Box sx={{ flex: 1, minWidth: '270px', marginTop:1 }}>
                            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>Expected Annual Income:</Typography>

                            {/* Amount Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                                <Typography>Amount</Typography>
                                <ToggleButtonGroup
                                    value={incomeAmountType}
                                    exclusive
                                    onChange={handleToggleChange(setIncomeAmountType)}
                                    sx={{
                                        height: '40px',
                                        '& .MuiToggleButton-root': {
                                            backgroundColor: theme.palette.grey[400],
                                            color: 'black',
                                            height: '40px',
                                            textTransform: 'none',
                                            '&:hover': { backgroundColor: theme.palette.grey[500] },
                                            '&.Mui-selected': {
                                                backgroundColor: theme.palette.secondary.main,
                                                color: theme.palette.secondary.contrastText,
                                                '&:hover': { backgroundColor: theme.palette.secondary.dark }
                                            }
                                        }
                                    }}
                                >
                                    <ToggleButton value="fixed">Fixed</ToggleButton>
                                    <ToggleButton value="percentage">Percentage</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {/* Distribution Toggle */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 3 }}>
                                <Typography>Distribution</Typography>
                                <ToggleButtonGroup
                                    value={incomeDistributionType}
                                    exclusive
                                    onChange={handleToggleChange(setIncomeDistributionType)}
                                    sx={{
                                        height: '40px',
                                        '& .MuiToggleButton-root': {
                                            backgroundColor: theme.palette.grey[400],
                                            color: 'black',
                                            height: '40px',
                                            textTransform: 'none',
                                            '&:hover': { backgroundColor: theme.palette.grey[500] },
                                            '&.Mui-selected': {
                                                backgroundColor: theme.palette.secondary.main,
                                                color: theme.palette.secondary.contrastText,
                                                '&:hover': { backgroundColor: theme.palette.secondary.dark }
                                            }
                                        }
                                    }}
                                >
                                    <ToggleButton value="None">None</ToggleButton>
                                    <ToggleButton value="Normal">Normal</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {/* Conditional Inputs */}
                            {incomeDistributionType === "None" && (
                                <TextField fullWidth label="Value" 
                                variant="outlined" 
                                sx={{ marginTop: 2, maxHeight: '35px',  maxWidth: '150px'}} value={incomeDistributionValue} onChange={(e) => setIncomeDistributionValue(e.target.value)} />
                            )}
                            {incomeDistributionType === "Normal" && (
                                <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    <TextField fullWidth label="Mean" 
                                    variant="outlined"
                                    sx={{ 
                                      maxWidth: '150px'  // Only reducing width
                                    }} 
                                    value={incomeMean} onChange={(e) => setIncomeMean(e.target.value)} />
                                    <TextField fullWidth label="Variance" 
                                    variant="outlined" 
                                    sx={{ 
                                      maxWidth: '150px'  // Only reducing width
                                    }}
                                    value={incomeVariance} onChange={(e) => setIncomeVariance(e.target.value)} />
                                </Box>
                            )}
                        </Box>
                    </Box>

                    



                    
                <Box sx={{ display: 'flex', gap: 2 }}>
    
                {/* Name Field */}
                    <Box sx={{ flex: 1, maxWidth: '125px' }}> 
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                            Expense Ratio
                        </Typography>
                        <TextField
                            variant="outlined"
                            fullWidth
                            placeholder=""
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: theme.palette.grey[300], // Gray background
                                    border: 'none', 
                                    height: '35px',
                                    '& fieldset': { display: 'none' }, 
                                    '&:hover fieldset': { display: 'none' }, 
                                    '&.Mui-focused fieldset': { display: 'none' },
                                }
                            }}
                        />
                    </Box>

                {/* Description Field */}
                      <Box sx={{ flex: 1, maxWidth: '125px' }}> 
                          <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                              Taxability
                          </Typography>
                          <Select
                              value={taxability}
                              onChange={(e) => handleToggleChange(setTaxability)}
                              displayEmpty
                              fullWidth
                              sx={{
                                  backgroundColor: theme.palette.grey[300], // Gray background
                                  border: 'none',
                                  height: '35px',
                                  '& .MuiOutlinedInput-notchedOutline': { display: 'none' }, // Remove border
                                  '&:hover .MuiOutlinedInput-notchedOutline': { display: 'none' }, // Remove hover border
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { display: 'none' },
                              }}>
                              <MenuItem value="" disabled>Select</MenuItem>
                              <MenuItem value="Taxable">Taxable</MenuItem>
                              <MenuItem value="Tax-Deferred">Tax-Deferred</MenuItem>
                              <MenuItem value="Tax-Free">Tax-Free</MenuItem>
                          </Select>
                      </Box>

            </Box>
                    
            {/* Box to align buttons */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',  // Ensures spacing between left and right buttons
                gap: 2, 
                marginTop: 4 
              }}
            >
              {/* Left-Side Button */}
              <Button 
                variant="contained" 
                color="secondary"
                sx={{ fontSize: '1.1rem', textTransform: 'none' }}
              >
                Add
              </Button>

              {/* Right-Side Buttons (Back & Continue) */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  sx={{ fontSize: '1.1rem', textTransform: 'none' }}
                >
                  Back
                </Button>

                <Button 
                  variant="contained" 
                  color="success"
                  sx={{ fontSize: '1.1rem', textTransform: 'none' }}
                >
                  Continue
                </Button>
              </Box>
            </Box>

                    

              </Box>
            </Container>
        </ThemeProvider>
    );
};

export default InvestmentType;

