import React, { useState, useContext } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Button, Stack, Box, Switch, MenuItem, TextField, IconButton, Backdrop, Fade } from "@mui/material";
import theme from "../components/theme";
import Navbar from "../components/navbar";
import {
  stackStyles,
  titleStyles,
} from "../components/styles";  // Import your modular styles
import CustomDropdown from "../components/customDropDown";
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

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Filler, Legend);

const ProbabilityLineChart = ({ lineChart }) => {
    const { startYear, endYear, probabilities } = lineChart;
  
    // Generate x-axis years based on startYear and number of probabilities
    const years = Array.from({ length: probabilities.length }, (_, i) => startYear + i);
  
    const option = {
      title: {
        text: "Probability Over Time",
      },
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        type: "category",
        data: years,
        name: "Year",
        boundaryGap: false,
        nameLocation: "middle",
        nameGap: 30,
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 1,
        name: "Probability",
        nameLocation: "middle",
        nameGap: 50,
      },
      series: [
        {
          data: probabilities,
          type: "line",
          smooth: true,
          symbol: "circle",
        //   areaStyle: {}, // Optional: for filled area under the line
          name: "Probability",
        },
      ],
    };
  
    return <ReactECharts option={option} style={{ height: 400 }} />;
};


const ChartWithBands = ({ shadedLineChart }) => {
    const options = {
        plugins: {
          legend: {
            labels: {
              filter: function (legendItem, chartData) {
                // Only show non-"Lower" labels in the legend
                return !legendItem.text.includes("Lower");
              },
            },
          },
        },
    };
    const {
      startYear,
      median,
      spread = 25, // default spread if not passed
    } = shadedLineChart;
  
    const labels = Array.from({ length: median.length }, (_, i) => startYear + i);
  
    const makeBand = (percentage) => {
      const offset = spread * (percentage / 100);
      return {
        lower: median.map((m) => m - offset),
        upper: median.map((m) => m + offset),
      };
    };
  
    const bands = [
      { range: "10–90%", percent: 80, color: "rgba(122, 173, 255, 0.1)" },
      { range: "20–80%", percent: 60, color: "rgba(77, 144, 251, 0.15)" },
      { range: "30–70%", percent: 40, color: "rgba(33, 117, 253, 0.2)" },
      { range: "40–60%", percent: 20, color: "rgba(0, 98, 255, 0.25)" },
    ];
  
    const datasets = [];
  
    // Add all confidence bands
    bands.forEach(({ percent, range, color }) => {
      const { lower, upper } = makeBand(percent);
      datasets.push(
        {
          label: `${range} Lower`,
          data: lower,
          fill: false,
          borderColor: "transparent",
          pointRadius: 0,
        //   hidden: true, // ✅ Hides from legend
        },
        {
          label: range,
          data: upper,
          fill: "-1",
          backgroundColor: color,
          borderColor: "transparent",
          pointRadius: 0,
        }
      );
    });
  
    // Add median line
    datasets.push({
      label: "Median",
      data: median,
      borderColor: "#000",
      pointBackgroundColor: "#000",
      backgroundColor: "#000", // ✅ Ensures legend box is solid black
      tension: 0.4,
      fill: false,
    });
  
    const data = {
      labels,
      datasets,
    };
  
    return <Line data={data} options={options}/>;
};
  

const GroupedStackedBarChart = ({ data }) => {
    const years = Array.from(new Set(data.map((d) => d.year))).sort();
    const categories = ["Investment", "Income", "Expense"];
    const itemNames = Array.from(new Set(data.map((d) => d.name)));
  
    // Build [year, category] combo labels
    const xAxisLabels = [];
    const xAxisYears = [];
  
    years.forEach((year) => {
      categories.forEach((cat) => {
        xAxisLabels.push(cat);     // Category labels
        xAxisYears.push(year);     // For bottom xAxis ticks
      });
    });
  
    // Map: item -> index-based data array matching xAxisLabels
    const valueMap = {};
    itemNames.forEach((name) => {
      valueMap[name] = new Array(xAxisLabels.length).fill(0);
    });
  
    data.forEach(({ year, type, name, value }) => {
      const category = type.charAt(0).toUpperCase() + type.slice(1);
      years.forEach((y, i) => {
        if (y === year) {
          const base = i * categories.length;
          const index = base + categories.indexOf(category);
          valueMap[name][index] += value;
        }
      });
    });
  
    // Build stacked series by item name
    const series = itemNames.map((name) => ({
      name,
      type: "bar",
      stack: (params) => xAxisLabels[params.dataIndex], // Stack by category
      data: valueMap[name],
      emphasis: { focus: "series" },
    }));
  
    const option = {
      title: { text: "Grouped and Stacked Bar Chart" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (params) {
            const index = params[0].dataIndex;
            const categoryIndex = index % 3;
            const category = ["Investment", "Income", "Expense"][categoryIndex];
            const year = xAxisYears[index];
          
            const lines = [`<strong>${year} ${category}</strong>`];
          
            params.forEach((p) => {
              if (xAxisLabels[p.dataIndex] === category && p.value > 0) {
                const colorBox = `<span style="display:inline-block;margin-right:6px;
                                    border-radius:3px;width:10px;height:10px;
                                    background-color:${p.color}"></span>`;
                lines.push(`${colorBox}${p.seriesName}: ${p.value}`);
              }
            });
          
            return lines.join("<br>");
        }
      },
      legend: { type: "scroll" },
      xAxis: [
        {
          type: "category",
          data: xAxisLabels,
          axisLabel: {
            interval: 0,
            formatter: (value, index) => value,
          },
        },
        {
          type: "category",
          position: "bottom",
          axisTick: { show: false },
          splitLine: { show: false },
          data: xAxisYears,
          axisLabel: {
            interval: 0,
            formatter: (value, index) => {
              // Show year under the center (Income) of each 3-bar group
              return index % 3 === 1 ? value : "";
            },
            margin: 20,
            fontWeight: "bold",
            color: "#666",
          },
        },
      ],
      yAxis: {
        type: "value",
        name: "Amount",
      },
      grid: { containLabel: true },
      series,
    };
  
    return <ReactECharts option={option} style={{ height: 500 }} />;
  };

const Charts = () => {
    const [currChart, setCurrChart] = useState("");
    const [currQuantity, setCurrQuantity] = useState("");
    const [currStat, setCurrStat] = useState("");
    const chartTypes = ["Line Chart", "Shaded Line Chart", "Stacked Bar Chart"];
    const shadedQuantities = ["Total Investments", "Total Income", "Total Expenses", "Early Withdrawal Tax", "Percentage of Total Discretionary Expenses Incurred"];
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={""} />
            <Container>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
                    <Typography variant="h2" component="h1" sx={titleStyles}>  {/* change to name of currScenario */}
                        Your Current Scenario Charts
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
                        {currChart === "Shaded Line Chart" && (
                            <CustomDropdown
                                label="Select a Quantity"
                                value={currQuantity}
                                menuItems={shadedQuantities}
                                setValue={setCurrQuantity}
                            />
                        )}
                        {currChart === "Stacked Bar Chart" && (
                            <CustomDropdown
                                label="Pick Mean or Median"
                                value={currStat}
                                menuItems={["Mean", "Median"]}
                                setValue={setCurrStat}
                            />
                        )}
                    </Stack>


                    {currChart === "Line Chart" && (
                        <ProbabilityLineChart
                            lineChart={{
                            startYear: 2025,
                            probabilities: [0.9, 0.8, 0.7],
                            endYear: 2028,
                        }}
                        />
                    )}

                    {currChart === "Shaded Line Chart" && (
                        <ChartWithBands
                        shadedLineChart={{
                          startYear: 2020,
                          median: [20, 50, 60, 77, 120],
                          spread: 25,
                        }}
                      />
                        // <ShadedConfidenceChart/>
                        // <ShadedLineChart/>
                    )}

                    {currChart === "Stacked Bar Chart" && (
                        <GroupedStackedBarChart
                            data={[
                                { year: 2025, type: "investment", name: "401k", value: 12000 },
                                { year: 2025, type: "investment", name: "Roth IRA", value: 6000 },
                                { year: 2025, type: "income", name: "Salary", value: 90000 },
                                { year: 2025, type: "income", name: "Bonus", value: 10000 },
                                { year: 2025, type: "expense", name: "Rent", value: 30000 },
                                { year: 2025, type: "expense", name: "Groceries", value: 8000 },
                            
                                { year: 2026, type: "investment", name: "401k", value: 15000 },
                                { year: 2026, type: "income", name: "Salary", value: 95000 },
                                { year: 2026, type: "expense", name: "Rent", value: 31000 },
                            ]}
                      />
                    )}

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default Charts;