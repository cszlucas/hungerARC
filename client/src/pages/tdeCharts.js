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
import ReactECharts from "echarts-for-react";
import { useLocation } from "react-router-dom";
import { AppContext } from "../context/appContext";



function parseYearlyMetric2D(data, financialGoal, metric = "probability") {
    const results = [];
  
    data.values.forEach(({ value, simulations }) => {
      const [paramA, paramB] = value;
      const yearlyTotals = {}; // year -> list of totals
  
      simulations.forEach(sim => {
        sim.forEach(({ year, investment }) => {
          const total = investment.reduce((sum, item) => sum + (item?.value ?? 0), 0);
          if (!yearlyTotals[year]) yearlyTotals[year] = [];
          yearlyTotals[year].push(total);
        });
      });
  
      for (const [yearStr, totals] of Object.entries(yearlyTotals)) {
        const year = parseInt(yearStr);
        let z;
  
        if (metric === "probability") {
          const successCount = totals.filter(t => t >= financialGoal).length;
          z = successCount / totals.length;
        } else if (metric === "median") {
          const sorted = totals.slice().sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          z = sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
        }
  
        results.push({ paramA, paramB, year, z });
      }
    });
  
    return results;
}
  


const TwoDimensionalCharts = () => {
    const location = useLocation();
    // const tdeData = location.state?.tdeData || [];
    const [currChart, setCurrChart] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("");

    const chartTypes = ["Surface Plot", "Contour Plot"];
    const multiQuantities = ["probability of success", "median total investments"];
    const lineChartQuantities = ["final probability of success", "final median total investments"];

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={""} />
            <Container>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
                    <Typography variant="h2" component="h1" sx={titleStyles}>  {/* change to name of currScenario */}
                        Two Dimensional Exploration Charts
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
                        {currChart === "Surface Plot" && (
                            <CustomDropdown
                                label="Select a Quantity"
                                value={selectedQuantity}
                                menuItems={multiQuantities}
                                setValue={setSelectedQuantity}
                            />
                        )}
                        {currChart === "Contour Plot" && (
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

                    {/* {currChart === "Multi-Line Chart" && selectedQuantity === "probability of success" && (
                         <LineChart
                            title="Per-Year Probability of Success"
                            years={probData.years}
                            series={probData.series}
                            yLabel="Probability"
                       />
                    )}

                    {currChart === "Multi-Line Chart" && selectedQuantity === "median total investments" && (
                        <LineChart
                            title="Per-Year Median Investment"
                            years={medianData.years}
                            series={medianData.series}
                            yLabel="Investment ($)"
                        />
                    )}

                    {currChart === "Line Chart of Selected Quantity" && selectedQuantity === "final value of probability of success" && (
                        <SingleLineChart
                            title="Final-Year Probability of Success"
                            metricData={finalYearProbabilities}
                            yLabel="Probability"
                        />
                    )}

                    {currChart === "Line Chart of Selected Quantity" && selectedQuantity === "final value of median total investments" && (
                        <SingleLineChart
                            title="Final-Year Median Investment"
                            metricData={finalMedians}
                            yLabel="Investment ($)"
                        />
                    )} */}

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default TwoDimensionalCharts;