import React, { useState, useContext, useEffect } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Stack, Checkbox } from "@mui/material";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import {
  stackStyles,
  titleStyles,
} from "../../components/styles";  // Import your modular styles
import CustomDropdown from "../../components/customDropDown";
import CustomInputBox from "../../components/customInputBox";
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
import { parseProbabilityLineChartData, ProbabilityLineChart } from "./ProbabilityLineChart";
import { parseShadedLineChartBands, ChartWithBands } from "./ShadedLineChart";
import { parseGroupedStackedBarChartData, GroupedStackedBarChart } from "./StackedBarChart";
import { useLocation } from "react-router-dom";
import { AppContext } from "../../context/appContext";

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Filler, Legend);


const Charts = () => {
    const location = useLocation();
    const chartData = location.state?.chartData || [];
    console.log(chartData.years);
    const [currChart, setCurrChart] = useState("");
    const [currQuantity, setCurrQuantity] = useState("Total Investments");
    const [currStat, setCurrStat] = useState("Median");
    const [aggThres, setAggThres] = useState(false);
    const [limit, setLimit] = useState(0);
    const {currScenario} = useContext(AppContext);
    
    console.log(currScenario);

    console.log("chartData isArray?", Array.isArray(chartData));
    console.log("chartData:", chartData);
    const probabilityLineChart = parseProbabilityLineChartData(chartData.years, currScenario.financialGoal);
    const {meanData, medianData} = parseGroupedStackedBarChartData(chartData.years);
    // console.log(meanData);
    // console.log(medianData);
    
    useEffect(() => {
    }, [limit]);
    const chartTypes = ["Line Chart", "Shaded Line Chart", "Stacked Bar Chart"];
    const shadedQuantities = ["Total Investments", "Total Income", "Total Expenses", "Early Withdrawal Tax", "Percentage of Total Discretionary Expenses Incurred"];
    
    // console.log(shadedLineChartData);
    
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
                        <ProbabilityLineChart lineChart={probabilityLineChart} />
                    )}

                    {currChart === "Shaded Line Chart" && (
                        <ChartWithBands
                            shadedLineChart={parseShadedLineChartBands(chartData.years, currQuantity)}
                        />
                    )}

                    {currChart === "Stacked Bar Chart" && (
                        <GroupedStackedBarChart
                            data={currStat === "Median" ? medianData : meanData}
                            threshold={limit}
                        />
                    )}

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default Charts;