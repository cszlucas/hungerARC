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


function LineChart({ title, years, series, yLabel }) {
    const option = {
      title: { text: title },
      tooltip: { trigger: "axis" },
      legend: {},
      xAxis: {
        type: "category",
        data: years,
        name: "Year"
      },
      yAxis: {
        type: "value",
        name: yLabel
      },
      series
    };
  
    return (
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "60vh" }} // 👈 Increased height to 80% of viewport height
      />
    );
}

function SingleLineChart({ title, metricData, yLabel }) {
    const paramValues = Object.keys(metricData).map(Number).sort((a, b) => a - b);
    const yData = paramValues.map(param => metricData[param]);
  
    const option = {
      title: { text: title },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: paramValues,
        name: "Parameter Value"
      },
      yAxis: {
        type: "value",
        name: yLabel
      },
      series: [
        {
          name: title,
          type: "line",
          data: yData
        }
      ]
    };
  
    return (
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "60vh" }} // You can adjust height here
      />
    );
}

function calculateYearlySuccessProbabilities(data, financialGoal) {
  const result = {};

  data.values.forEach(({ value, simulations }) => {
    const yearlyCounts = {};

    simulations[0].forEach(({ year, investment }) => {
      const flatInvestments = investment[0];
      const total = flatInvestments.reduce((sum, i) => sum + (i?.value ?? 0), 0);
      if (!yearlyCounts[year]) yearlyCounts[year] = { success: 0, total: 0 };

      yearlyCounts[year].total += 1;
      if (total >= financialGoal) yearlyCounts[year].success += 1;
    });

    result[value[0]] = {};
    for (const year in yearlyCounts) {
      const { success, total } = yearlyCounts[year];
      result[value[0]][year] = success / total;
    }
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
    const yearlyTotals = {};

    simulations[0].forEach(({ year, investment }) => {
      const flatInvestments = investment[0];
      const total = flatInvestments.reduce((sum, i) => sum + (i?.value ?? 0), 0);
      if (!yearlyTotals[year]) yearlyTotals[year] = [];
      yearlyTotals[year].push(total);
    });

    result[value[0]] = {};
    for (const year in yearlyTotals) {
      result[value[0]][year] = median(yearlyTotals[year]);
    }
  });

  return result;
}

  
function calculateFinalYearSuccessProbabilities(data, financialGoal) {
  const result = {};

  data.values.forEach(({ value, simulations }) => {
    let successCount = 0;

    const finalYear = simulations[0][simulations[0].length - 1];
    const total = finalYear.investment[0].reduce((sum, i) => sum + (i?.value ?? 0), 0);

    if (total >= financialGoal) successCount += 1;
    result[value[0]] = successCount / 1;  // one simulation
  });

  return result;
}

    
function calculateFinalYearMedianInvestments(data) {
  const result = {};

  data.values.forEach(({ value, simulations }) => {
    const finalYear = simulations[0][simulations[0].length - 1];
    const total = finalYear.investment[0].reduce((sum, i) => sum + (i?.value ?? 0), 0);
    result[value[0]] = total;  // single value = median
  });

  return result;
}


function transformForLineChart(metricData) {
    const yearsSet = new Set();
  
    // Collect all years across all parameter values
    Object.values(metricData).forEach(yearDict => {
      Object.keys(yearDict).forEach(year => yearsSet.add(Number(year)));
    });
  
    const years = Array.from(yearsSet).sort((a, b) => a - b);
  
    const series = Object.entries(metricData).map(([paramValue, yearData]) => ({
      name: `duration = ${paramValue}`,
      type: "line",
      data: years.map(year => yearData[year] ?? null), // fill missing with null
    }));
  
    return { years, series };
}
  

const OneDimensionalCharts = () => {
    const location = useLocation();
    // const odeData = location.state?.odeData || [];
    const chartData = location.state?.chartData || [];
    console.log(chartData);
    const financialGoal = 9000;
    // const odeData = {
    //     "parameter": "duration",
    //     "values": [
    //       {
    //         "value": 20,
    //         "simulations": [
    //           [
    //             { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3000 }, { "name": "Brokerage", "value": 5000 }] },
    //             { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3500 }, { "name": "Brokerage", "value": 6000 }] }
    //           ],
    //           [
    //             { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 2800 }, { "name": "Brokerage", "value": 5200 }] },
    //             { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3600 }, { "name": "Brokerage", "value": 5800 }] }
    //           ]
    //         ]
    //       },
    //       {
    //         "value": 25,
    //         "simulations": [
    //           [
    //             { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3200 }, { "name": "Brokerage", "value": 5100 }] },
    //             { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3600 }, { "name": "Brokerage", "value": 6300 }] }
    //           ],
    //           [
    //             { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3000 }, { "name": "Brokerage", "value": 5000 }] },
    //             { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3400 }, { "name": "Brokerage", "value": 6200 }] }
    //           ]
    //         ]
    //       },
    //       {
    //         "value": 30,
    //         "simulations": [
    //           [
    //             { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3100 }, { "name": "Brokerage", "value": 5600 }] },
    //             { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3900 }, { "name": "Brokerage", "value": 5900 }] }
    //           ],
    //           [
    //             { "year": 2025, "investment": [{ "name": "Roth IRA", "value": 3500 }, { "name": "Brokerage", "value": 5700 }] },
    //             { "year": 2026, "investment": [{ "name": "Roth IRA", "value": 3700 }, { "name": "Brokerage", "value": 6000 }] }
    //           ]
    //         ]
    //       }
    //     ]
    // };
    
    const probabilityOfSuccessData = calculateYearlySuccessProbabilities(chartData.years, financialGoal);
    const medians = calculateYearlyMedianInvestments(chartData.years);
    const finalYearProbabilities = calculateFinalYearSuccessProbabilities(chartData.years, financialGoal);
    const finalMedians = calculateFinalYearMedianInvestments(chartData.years);

    console.log(finalYearProbabilities);
    console.log(finalMedians);

    console.log(probabilityOfSuccessData);
    const probData = transformForLineChart(probabilityOfSuccessData);
    const medianData = transformForLineChart(medians);


    // console.log(odeData);
    const [currChart, setCurrChart] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("");

    const chartTypes = ["Multi-Line Chart", "Line Chart of Selected Quantity"];
    const multiQuantities = ["probability of success", "median total investments"];
    const lineChartQuantities = ["final probability of success", "final median total investments"];

    // add edge case for when roth conversion is non numeric

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

                    {currChart === "Multi-Line Chart" && selectedQuantity === "probability of success" && (
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

                    {currChart === "Line Chart of Selected Quantity" && selectedQuantity === "final probability of success" && (

                        <SingleLineChart
                            title="Final-Year Probability of Success"
                            metricData={finalYearProbabilities}
                            yLabel="Probability"
                        />
                    )}


                    {currChart === "Line Chart of Selected Quantity" && selectedQuantity === "final median total investments" && (
                        <SingleLineChart
                            title="Final-Year Median Investment"
                            metricData={finalMedians}
                            yLabel="Investment ($)"
                        />
                    )}

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default OneDimensionalCharts;