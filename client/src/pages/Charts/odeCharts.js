import React, { useState, useContext, useEffect } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Stack, Checkbox } from "@mui/material";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import {
  stackStyles,
  titleStyles,
} from "../../components/styles";  // Import your modular styles
import CustomDropdown from "../../components/customDropDown";
import ReactECharts from "echarts-for-react";
import { useLocation } from "react-router-dom";
import CustomInputBox from "../../components/customInputBox";
import { ProbabilityLineChart, parseProbabilityLineChartData } from "./ProbabilityLineChart";
import { parseShadedLineChartBands, ChartWithBands } from "./ShadedLineChart";
import { parseStackedBarDataByMode, GroupedStackedBarChart } from "./StackedBarChart";
import { AppContext } from "../../context/appContext";


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

export function calculateYearlySuccessProbabilities(data) {
  const result = {};

  data.values.forEach(({ value, simulations }) => {
    const yearlyCounts = {};

    simulations.forEach(simulation => {
      simulation.forEach(({ year, metGoal }) => {
        if (!yearlyCounts[year]) {
          yearlyCounts[year] = { success: 0, total: 0 };
        }

        yearlyCounts[year].total += 1;
        if (Array.isArray(metGoal) && metGoal[0] === true) {
          yearlyCounts[year].success += 1;
        }
      });
    });

    result[value[0]] = {};
    for (const year in yearlyCounts) {
      const { success, total } = yearlyCounts[year];
      result[value[0]][year] = total > 0 ? success / total : 0;
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

  
export function calculateFinalYearSuccessProbabilities(data) {
  const result = {};

  data.values.forEach(({ value, simulations }) => {
    let successCount = 0;
    const totalSimulations = simulations.length;

    simulations.forEach(sim => {
      // Find the last year with a non-null metGoal
      const lastDefined = [...sim].reverse().find(year => year?.metGoal?.[0] != null);

      if (Array.isArray(lastDefined?.metGoal) && lastDefined.metGoal[0] === true) {
        successCount += 1;
      }
    });

    result[value[0]] = totalSimulations > 0 ? successCount / totalSimulations : 0;
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


function transformForLineChart(metricData, parameter) {
  // Collect all years from all parameter entries
  const yearsSet = new Set();
  Object.values(metricData).forEach(yearObj => {
    Object.keys(yearObj).forEach(year => yearsSet.add(Number(year)));
  });
  const years = Array.from(yearsSet).sort((a, b) => a - b);

  // Outer keys = parameter values
  const series = Object.entries(metricData).map(([paramValue, yearObj]) => ({
    name: `${parameter} = ${paramValue}`,
    type: "line",
    data: years.map(year => yearObj[year] ?? null),
  }));

  return { years, series };
}


export function getParameterValuesByIndex(dataset, index) {
  const entries = dataset.years?.values ?? [];
  const valueSet = new Set();

  entries.forEach(entry => {
    const val = entry.value?.[index];
    if (val !== undefined) {
      valueSet.add(val);
    }
  });

  return [...valueSet];
}

/**
 * Filters and flattens raw parameterized simulation data.
 * 
 * @param {Object} rawParamData - Original parameterized simulation data.
 * @param {number} paramIndex - Index of the parameter to filter on (e.g., 1 for second parameter).
 * @param {number|string} selectedValue - Selected value to match (e.g., 1000).
 * @returns {Array} Flattened array of yearly simulation data.
 */
export function flattenChartDataByParam(rawParamData, paramIndex, selectedValue) {
  if (
    !rawParamData?.years ||
    !Array.isArray(rawParamData.years.values) ||
    typeof paramIndex !== "number"
  ) {
    console.error("❌ Invalid input data or parameter index.");
    return [];
  }

  const matchingEntries = rawParamData.years.values.filter(entry => {
    const paramValues = entry.value;
    return paramValues?.[paramIndex] === selectedValue;
  });

  const flatData = [];

  matchingEntries.forEach(entry => {
    const { simulations } = entry;
    if (!Array.isArray(simulations)) return;

    const nYears = simulations[0]?.length ?? 0;

    for (let yearIdx = 0; yearIdx < nYears; yearIdx++) {
      const yearData = {
        year: simulations[0][yearIdx].year,
        investments: [],
        income: [],
        discretionary: [],
        nonDiscretionary: [],
        taxes: [],
        earlyWithdrawals: [],
        metGoal: [] // ✅ Add metGoal array
      };

      simulations.forEach(sim => {
        const simYear = sim[yearIdx];
        if (!simYear) return;

        yearData.investments.push(simYear.investment?.[0] ?? []);
        yearData.income.push(simYear.income?.[0] ?? []);
        yearData.discretionary.push(simYear.discretionary?.[0] ?? []);
        yearData.nonDiscretionary.push(simYear.nonDiscretionary?.[0] ?? []);
        yearData.taxes.push(simYear.taxes?.[0] ?? 0);
        yearData.earlyWithdrawals.push(simYear.earlyWithdrawals?.[0] ?? 0);
        yearData.metGoal.push(simYear.metGoal?.[0] ?? false); // ✅ Add metGoal for this sim
      });

      flatData.push(yearData);
    }
  });

  return flatData;
}


export function normalizeChartDataValues(chartData) {
  if (
    !chartData?.years?.values ||
    !Array.isArray(chartData.years.values)
  ) {
    console.error("❌ Invalid chartData format");
    return chartData;
  }

  const normalized = {
    ...chartData,
    years: {
      ...chartData.years,
      values: chartData.years.values.map(entry => ({
        ...entry,
        value: Array.isArray(entry.value) ? entry.value : [entry.value],
      }))
    }
  };

  return normalized;
}



const OneDimensionalCharts = () => {
    const location = useLocation();
    // const odeData = location.state?.odeData || [];
    let chartData = location.state?.chartData || [];
    console.log(chartData);
    const {currScenario} = useContext(AppContext);
    const financialGoal = currScenario.financialGoal;

    const parameter = chartData.years.parameter[0];
  
    if (parameter === "Roth Optimizer Flag")
    {
      chartData = normalizeChartDataValues(chartData);
    }
    const paramValues = getParameterValuesByIndex(chartData, 0);
    console.log(paramValues);

    const probabilityOfSuccessData = calculateYearlySuccessProbabilities(chartData.years, financialGoal);
    const medians = calculateYearlyMedianInvestments(chartData.years);
    const finalYearProbabilities = calculateFinalYearSuccessProbabilities(chartData.years, financialGoal);
    const finalMedians = calculateFinalYearMedianInvestments(chartData.years);

    // console.log(finalYearProbabilities);
    // console.log(finalMedians);

    // console.log(probabilityOfSuccessData);
    // console.log(medians);


    const probData = transformForLineChart(probabilityOfSuccessData, parameter);
    const medianData = transformForLineChart(medians, parameter);
    // console.log(probData);
    // console.log(medianData);


    
    
    // console.log(odeData);
    const [currChart, setCurrChart] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("");
    const [parameterValue, setParameterValue] = useState(paramValues[0]);
    const [currQuantity, setCurrQuantity] = useState("Total Investments");
    const [rawDataSubset, setRawDataSubset] = useState([]);

    const paramIndex = 0;
    const rawParamData = chartData;

    useEffect(() => {
      if (!rawParamData || parameterValue == null) return;
  
      const subset = flattenChartDataByParam(rawParamData, paramIndex, parameterValue);
      setRawDataSubset(subset);
    }, [parameterValue]);
    
    const [currStat, setCurrStat] = useState("Median");
    const [aggThres, setAggThres] = useState(false);
    const [limit, setLimit] = useState(0);
    
    useEffect(() => {
    }, [limit]);

    let chartTypes = ["Probability Line Chart", "Shaded Line Chart", "Stacked Bar Chart", "Multi-Line Chart", "Line Chart of Selected Quantity"];
    if (parameter === "Roth Optimizer Flag")
    {
      chartTypes = ["Probability Line Chart", "Shaded Line Chart", "Stacked Bar Chart", "Multi-Line Chart"];
    }
    const multiQuantities = ["probability of success", "median total investments"];
    const lineChartQuantities = ["final probability of success", "final median total investments"];
    const shadedQuantities = ["Total Investments", "Total Income", "Total Expenses", "Early Withdrawal Tax", "Percentage of Total Discretionary Expenses Incurred"];
    
    // add edge case for when roth conversion is non numeric
    // setRawDataSubset(flattenChartDataByParam(chartData, 0, parameterValue));
    const probLineData = parseProbabilityLineChartData(rawDataSubset, financialGoal);
    const shadedLineData = parseShadedLineChartBands(rawDataSubset, currQuantity);
    const {stackMeanData, stackMedianData} = parseStackedBarDataByMode(rawDataSubset, "exploration");
    console.log(rawDataSubset);
    
    console.log(stackMeanData);
    console.log(stackMedianData);

    console.log(probLineData);
    console.log(shadedLineData);
    // console.log(stackedBarData);
    // console.log(rawDataSubset);
    
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
                        {(
                          currChart === "Probability Line Chart" ||
                          currChart === "Shaded Line Chart" ||
                          currChart === "Stacked Bar Chart"
                        ) && (
                          <CustomDropdown
                            label={parameter}
                            value={parameterValue}
                            menuItems={paramValues}
                            setValue={setParameterValue}
                          />
                        )}
                        {currChart === "Shaded Line Chart" && (
                            <CustomDropdown
                              label={"Select a Quantity"}
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

                    {currChart === "Probability Line Chart" && (
                        <ProbabilityLineChart lineChart={probLineData} />
                    )}

                    {currChart === "Shaded Line Chart" && (
                        <ChartWithBands
                            shadedLineChart={parseShadedLineChartBands(rawDataSubset, currQuantity)}
                        />
                    )}

                    {currChart === "Stacked Bar Chart" && (
                        <GroupedStackedBarChart
                            data={currStat === "Median" ? stackMedianData : stackMeanData}
                            threshold={limit}
                        />
                    )}

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default OneDimensionalCharts;