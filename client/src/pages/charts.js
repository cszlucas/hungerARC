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
  

const GroupedStackedBarChart = ({ data, threshold = 0 }) => {
    const years = Array.from(new Set(data.map((d) => d.year))).sort();
    const categories = ["Investment", "Income", "Expense"];
    const rawItemNames = Array.from(new Set(data.map((d) => d.name)));
  
    // Step 1: Sum all values per item
    const itemSums = {};
    rawItemNames.forEach((name) => (itemSums[name] = 0));
    data.forEach((item) => {
      itemSums[item.name] += item.value;
    });
  
    // Step 2: Get visible items above threshold
    const visibleItems = rawItemNames.filter((name) => itemSums[name] >= threshold);
    // console.log("Visible Items (Above Threshold):", visibleItems);
    // Step 3: Build axis labels (e.g., "Investment", "Income", etc. per year)
    const xAxisLabels = [];
    const xAxisYears = [];
    years.forEach((year) => {
      categories.forEach((cat) => {
        xAxisLabels.push(cat);
        xAxisYears.push(year);
      });
    });
  
    // Step 4: Initialize valueMap ONLY for visible items
    const valueMap = {};
    visibleItems.forEach((name) => {
      valueMap[name] = new Array(xAxisLabels.length).fill(0);
    });
  
    // Step 5: Fill valueMap with visible + "Other"
    data.forEach(({ year, type, name, value }) => {
      const category = type.charAt(0).toUpperCase() + type.slice(1);
      const yearIndex = years.indexOf(year);
      const base = yearIndex * categories.length;
      const index = base + categories.indexOf(category);
  
      if (visibleItems.includes(name)) {
        valueMap[name][index] += value;
      } else {
        if (!valueMap["Other"]) {
          valueMap["Other"] = new Array(xAxisLabels.length).fill(0);
        }
        valueMap["Other"][index] += value;
      }
    });
  
    // Step 6: Build series
    const series = Object.entries(valueMap)
      .filter(([, values]) => values.some((v) => v > 0)) // Skip empty series
      .map(([name, values]) => {
        const isOther = name === "Other";
        return {
          name,
          type: "bar",
          stack: (params) => {
            const catIndex = params.dataIndex % categories.length;
            return categories[catIndex];
          },
          data: values,
          emphasis: { focus: "series" },
          itemStyle: isOther ? { color: "#7fc97f" } : undefined, // force green for Other
        };
      });
    
    // console.log("Final Rendered Series:", series.map(s => s.name));

  
    // Step 7: Chart configuration
    const option = {
      title: { text: "Grouped and Stacked Bar Chart" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (params) {
          const index = params[0].dataIndex;
          const categoryIndex = index % categories.length;
          const category = categories[categoryIndex];
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
        },
      },
      legend: { type: "scroll" },
      xAxis: [
        {
          type: "category",
          data: xAxisLabels,
          axisLabel: {
            interval: 0,
            formatter: (value) => value,
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
            formatter: (value, index) => (index % categories.length === 1 ? value : ""),
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
  
    return (<ReactECharts
        option={option}
        key={`chart-${threshold ?? 0}-${data?.length ?? 0}`} // fallback if null/undefined
        style={{ height: 500 }}
    />);
  };
  

const Charts = () => {
    const location = useLocation();
    const chartData = location.state?.chartData || [];
    console.log(chartData);
    const [currChart, setCurrChart] = useState("");
    const [currQuantity, setCurrQuantity] = useState("");
    const [currStat, setCurrStat] = useState("Median");
    const [aggThres, setAggThres] = useState(false);
    const [limit, setLimit] = useState(0);
    useEffect(() => {
    }, [limit]);
    const chartTypes = ["Line Chart", "Shaded Line Chart", "Stacked Bar Chart"];
    const shadedQuantities = ["Total Investments", "Total Income", "Total Expenses", "Early Withdrawal Tax", "Percentage of Total Discretionary Expenses Incurred"];

    const quantityKeyMap = {
        "Total Investments": "investments",
        "Total Income": "income",
        "Total Expenses": "expenses", // we'll sum multiple fields
        "Early Withdrawal Tax": "earlyWithdrawals",
        "Percentage of Total Discretionary Expenses Incurred": "discretionary"
      };
      
      const getMedianForQuantity = (chart, quantity) => {
        const key = quantityKeyMap[quantity];
      
        if (!chart || !quantity) return [];
      
        if (quantity === "Total Expenses") {
          const d = chart.discretionary || [];
          const nd = chart.nonDiscretionary || [];
          const t = chart.taxes || [];
          return d.map((val, i) => (val ?? 0) + (nd[i] ?? 0) + (t[i] ?? 0));
        }
      
        return chart[key] || [];
      };
      

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
                            <>
                                <CustomDropdown
                                    label="Pick Mean or Median"
                                    value={currStat}
                                    menuItems={["Mean", "Median"]}
                                    setValue={setCurrStat}
                                />

                                <Stack direction="row" alignItems="center" sx={{ mb: 5, gap:0.5 }}>
                                    <Typography variant="body1" sx={{ fontWeight: "medium", width: 200 }}>
                                        Aggregation Threshold
                                    </Typography>
                                    <Checkbox
                                        checked={aggThres}
                                        onChange={e => setAggThres(e.target.checked)}
                                    />
                                </Stack>

                                {aggThres && (
                                    <CustomInputBox
                                        title="Threshold Limit"
                                        type="number"
                                        value={limit}
                                        setValue={setLimit}
                                        inputProps={{ min: 0 }}
                                    />
                                )}
                            </>
                        )}
                    </Stack>


                    {currChart === "Line Chart" && (
                        <ProbabilityLineChart lineChart={chartData.probabilityChart} />
                    )}

                    {currChart === "Shaded Line Chart" && (
                        <ChartWithBands
                            shadedLineChart={{
                                startYear: chartData.shadedChart.startYear,
                                spread: 500,
                                median: getMedianForQuantity(chartData.shadedChart, currQuantity)
                            }}
                        />
                        // <ShadedConfidenceChart/>
                        // <ShadedLineChart/>
                    )}

                    {currChart === "Stacked Bar Chart" && (
                        <GroupedStackedBarChart
                            data={currStat === "Median" ? chartData.barChartMedian : chartData.barChartAverage}
                            threshold={limit}
                        />
                    )}

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default Charts;