import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Button, Stack, Box, Checkbox, Typography } from '@mui/material';
import theme from '../../../components/theme';
import Navbar from '../../../components/navbar';
import PageHeader from '../../../components/pageHeader';
import {
    backContinueContainerStyles,
    buttonStyles,
    rowBoxStyles,
} from '../../../components/styles';

import CustomInput from '../../../components/customInputBox';
import CustomToggle from '../../../components/customToggle';

const Income = () => {
    const [expectedChangeType, setExpectedChangeType] = useState('Fixed');
    const [distributionType, setDistributionType] = useState('None');
    const [incomeType, setIncomeType] = useState('Wage');
    const [changeValue, setChangeValue] = useState('');
    const [changeMean, setChangeMean] = useState('');
    const [changeVariance, setChangeVariance] = useState('');
    const [changeMin, setChangeMin] = useState('');
    const [changeMax, setChangeMax] = useState('');

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
                    {/* First Column */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: 300 }}>
                        <CustomInput 
                            title="Initial Income Amount"
                            type="number"
                            adornment="$"
                            value={changeValue}
                            setValue={setChangeValue}
                        />

                        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                            <CustomInput 
                                title="User's Contribution"
                                type="number"
                                adornment="%"
                                value={changeMean}
                                setValue={setChangeMean}
                            />
                            <CustomInput 
                                title="Spouse's Contribution"
                                type="number"
                                adornment="%"
                                value={changeVariance}
                                setValue={setChangeVariance}
                            />
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={2} sx={{ marginTop: 4, mb: 2 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                Inflation Adjustment
                            </Typography>
                            <Checkbox />
                        </Stack>

                        <CustomToggle
                            title="Income Type"
                            values={['Wage', 'Social Security']}
                            sideView={true}
                            width={150}
                            value={incomeType}
                            setValue={(v) => {setIncomeType(v)}}
                        />
                    </Box>

                    {/* Second Column */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'bold' }}>Expected Annual Change:</Typography>

                        <CustomToggle
                            title="Distribution"
                            values={['None', 'Normal', 'Uniform']}
                            sideView={true}
                            width={100}
                            value={distributionType}
                            setValue={setDistributionType}
                        />

                        <CustomToggle
                            title="Rate/Unit"
                            values={['Fixed', 'Percentage']}
                            sideView={true}
                            width={100}
                            value={expectedChangeType}
                            setValue={setExpectedChangeType}
                        />

                        {distributionType === "None" && (
                            <CustomInput 
                                title="Value"
                                type="number"
                                adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                value={changeValue}
                                setValue={setChangeValue}
                            />
                        )}
                        
                        {distributionType === "Normal" && (
                            <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                                <CustomInput 
                                    title="Mean"
                                    type="number"
                                    adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                    value={changeMean}
                                    setValue={setChangeMean}
                                />
                                <CustomInput 
                                    title="Variance"
                                    type="number"
                                    adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                    value={changeVariance}
                                    setValue={setChangeVariance}
                                />
                            </Stack>
                        )}

                        {distributionType === "Uniform" && (
                            <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                                <CustomInput 
                                    title="Min"
                                    type="number"
                                    adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                    value={changeMin}
                                    setValue={setChangeMin}
                                />
                                <CustomInput 
                                    title="Max"
                                    type="number"
                                    adornment={expectedChangeType === 'Percentage' ? '%' : '$'}
                                    value={changeMax}
                                    setValue={setChangeMax}
                                />
                            </Stack>
                        )}
                    </Box>
                </Box>

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

export default Income;
