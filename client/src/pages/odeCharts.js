import React, { useState, useContext, useEffect } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, 
    Switch, MenuItem, TextField, IconButton, Backdrop, Fade, Checkbox } from "@mui/material";
import theme from "../components/theme";
import Navbar from "../components/navbar";
import {
  stackStyles,
  titleStyles,
} from "../components/styles";  // Import your modular styles
import CustomDropdown from "../components/customDropDown";
import CustomInputBox from "../components/customInputBox";
import ReactECharts from "echarts-for-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { useLocation } from "react-router-dom";
import { AppContext } from "../context/appContext";

const OneDimensionalCharts = () => {
    const [currChart, setCurrChart] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("");

    const chartTypes = ["Multi-Line Chart", "Line Chart of Selected Quantity"];
    const multiQuantities = ["probability of success", "median total investments"];
    const lineChartQuantities = ["final value of probability of success", "final value of median total investments"];
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={""} />
            <Container>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
                    <Typography variant="h2" component="h1" sx={titleStyles}>  {/* change to name of currScenario */}
                        One Dimensional Exploration Charts
                    </Typography>
                </Stack>
                <Stack direction="column" spacing={2}>
                    <Stack direction="row" spacing={4} alignItems="start">
                        <CustomDropdown
                            label="Pick a Chart"
                            value={currChart}
                            menuItems={chartTypes}
                            setValue={setCurrChart}
                        />
                        {currChart === "Multi-Line Chart" && (
                            <CustomDropdown
                                label="Select a Quantity"
                                value={selectedQuantity}
                                menuItems={multiQuantities}
                                setValue={setSelectedQuantity}
                            />
                        )}
                        {currChart === "Line Chart of Selected Quantity" && (
                            <>
                                <CustomDropdown
                                    label="Select a Quantity"
                                    value={selectedQuantity}
                                    menuItems={lineChartQuantities}
                                    setValue={setSelectedQuantity}
                                />
                            </>
                        )}
                    </Stack>


                    {/* {currChart === "Line Chart" && (
                        <ProbabilityLineChart lineChart={probabilityLineChart} />
                    )}

                    {currChart === "Shaded Line Chart" && (
                        <ChartWithBands
                            shadedLineChart={parseShadedLineChartBands(chartData, currQuantity)}
                        />
                        // <>Testing Something</>
                        // <ShadedConfidenceChart/>
                        // <ShadedLineChart/>
                    )}

                    {currChart === "Stacked Bar Chart" && (
                        <GroupedStackedBarChart
                            data={currStat === "Median" ? medianData : meanData}
                            threshold={limit}
                        />
                    )} */}

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default OneDimensionalCharts;