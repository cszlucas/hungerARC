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


function calculateYearlySuccessProbabilities(data, financialGoal) {
    const result = {};
  
    data.values.forEach(({ value, simulations }) => {
      const yearlyCounts = {};    // { year: { success: x, total: y } }
  
      simulations.forEach(simulation => {
        simulation.forEach(({ year, investment }) => {
          const total = investment.reduce((sum, i) => sum + (i?.value ?? 0), 0);
          if (!yearlyCounts[year]) {
            yearlyCounts[year] = { success: 0, total: 0 };
          }
          yearlyCounts[year].total += 1;
          if (total >= financialGoal) {
            yearlyCounts[year].success += 1;
          }
        });
      });
  
      result[value] = {};
  
      Object.entries(yearlyCounts).forEach(([year, { success, total }]) => {
        result[value][year] = success / total;
      });
    });
  
    return result;
}

function median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
}

function calculateYearlyMedianInvestments(data) {
    const result = {};
  
    data.values.forEach(({ value, simulations }) => {
      const yearlyTotals = {}; // { year: [totals] }
  
      simulations.forEach(simulation => {
        simulation.forEach(({ year, investment }) => {
          const total = investment.reduce((sum, i) => sum + (i?.value ?? 0), 0);
          if (!yearlyTotals[year]) {
            yearlyTotals[year] = [];
          }
          yearlyTotals[year].push(total);
        });
      });
  
      result[value] = {};
      for (const year in yearlyTotals) {
        result[value][year] = median(yearlyTotals[year]);
      }
    });
  
    return result;
}
  
  

const OneDimensionalCharts = () => {
    const location = useLocation();
    // const odeData = location.state?.odeData || [];
    const financialGoal = 9000;
    const odeData = {
        "parameter": "duration",
        "values": [
          {
            "value": 20,
            "simulations": [
              [
                { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3000 }, { "name": "Brokerage", "value": 5000 }] },
                { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3500 }, { "name": "Brokerage", "value": 6000 }] }
              ],
              [
                { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 2800 }, { "name": "Brokerage", "value": 5200 }] },
                { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3600 }, { "name": "Brokerage", "value": 5800 }] }
              ]
            ]
          },
          {
            "value": 25,
            "simulations": [
              [
                { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3200 }, { "name": "Brokerage", "value": 5100 }] },
                { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3600 }, { "name": "Brokerage", "value": 6300 }] }
              ],
              [
                { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3000 }, { "name": "Brokerage", "value": 5000 }] },
                { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3400 }, { "name": "Brokerage", "value": 6200 }] }
              ]
            ]
          },
          {
            "value": 30,
            "simulations": [
              [
                { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3100 }, { "name": "Brokerage", "value": 5600 }] },
                { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3900 }, { "name": "Brokerage", "value": 5900 }] }
              ],
              [
                { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3500 }, { "name": "Brokerage", "value": 5700 }] },
                { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3700 }, { "name": "Brokerage", "value": 6000 }] }
              ]
            ]
          }
        ]
    };
    
    const probabilityOfSuccessData = calculateYearlySuccessProbabilities(odeData, financialGoal);
    const medians = calculateYearlyMedianInvestments(odeData);

    console.log(odeData);
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