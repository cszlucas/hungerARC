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
import "echarts-gl";
import { useLocation } from "react-router-dom";
import Plot from "react-plotly.js";
import { getParameterValuesByIndex } from "./odeCharts"; 
import { ProbabilityLineChart, parseProbabilityLineChartData } from "./ProbabilityLineChart";
import { parseShadedLineChartBands, ChartWithBands } from "./ShadedLineChart";
import { parseStackedBarDataByMode, GroupedStackedBarChart } from "./StackedBarChart";
import { AppContext } from "../../context/appContext";


export function parseFinalMetric2D(data, financialGoal, metric = "probability") {
  const results = [];

  data.values.forEach(({ value, simulations }) => {
    const [paramA, paramB] = value; // e.g. value = [2025, 1]

    let z;

    if (metric === "probability") {
      // Check how many simulations met the goal in the *last year where metGoal is defined*
      const successCount = simulations.filter(sim => {
        // Find the last year in the sim where metGoal is not null/undefined
        const last = [...sim].reverse().find(year => year?.metGoal?.[0] != null);
    
        return Array.isArray(last?.metGoal) && last.metGoal[0] === true;
      }).length;
    
      z = simulations.length > 0 ? successCount / simulations.length : 0;
    }
     else if (metric === "median") {
      // Compute median investment total in final year across all simulations
      const finalValues = simulations.map(sim => {
        const last = sim[sim.length - 1];
        return last.investment.flat().reduce((sum, i) => sum + (i?.value ?? 0), 0);
      });

      const sorted = finalValues.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      z = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    }

    results.push({ paramA, paramB, z });
  });

  return results;
}


  
function createGrid(pointArray) {
    const xVals = [...new Set(pointArray.map(p => p.paramA))].sort((a, b) => a - b);
    const yVals = [...new Set(pointArray.map(p => p.paramB))].sort((a, b) => a - b);
  
    // Build z[x][y]
    const zByXThenY = xVals.map(x =>
      yVals.map(y => {
        const match = pointArray.find(p => p.paramA === x && p.paramB === y);
        return match ? match.z : null;
      })
    );
  
    // ✅ Transpose to get z[y][x] which echarts wants
    const zMatrix = transpose(zByXThenY);
    return { x: xVals, y: yVals, z: zMatrix };
}
  

function transpose(matrix) {
    return matrix[0].map((_, colIdx) => matrix.map(row => row[colIdx]));
}
  

function PlotlySurfaceChart({ title, x, y, z, xLabel, yLabel, zLabel }) {
  return (
    <Plot
      data={[
        {
          type: "surface",
          z: z,       // 2D array: shape [y.length][x.length]
          x: x,       // 1D array for column labels (optional)
          y: y,       // 1D array for row labels (optional)
          colorscale: "Viridis",
        },
      ]}
      layout={{
        title: { text: title },
        autosize: true,
        scene: {
          xaxis: {
            title: { text: xLabel || "X Axis" },
          },
          yaxis: {
            title: { text: yLabel || "Y Axis" },
          },
          zaxis: {
            title: { text: zLabel || "Z Axis" },
          },
        },
        margin: { l: 0, r: 0, b: 0, t: 50 },
      }}
      style={{ width: "100%", height: "80vh" }}
    />
  );
}


function ContourChart({ title, x, y, z, xLabel = "X", yLabel = "Y", zLabel = "Z" }) {
  // Flatten z[y][x] to [ [xVal, yVal, zVal], ... ]
  const heatmapData = [];
  for (let j = 0; j < y.length; j++) {
    for (let i = 0; i < x.length; i++) {
      heatmapData.push([i, j, z[j][i]]);
    }
  }

  const zValues = heatmapData.map(p => p[2]);
  const zMin = Math.min(...zValues);
  const zMax = Math.max(...zValues);

  const option = {
    title: { text: title },
    tooltip: {
      formatter: function (params) {
        const xi = params.value[0];
        const yi = params.value[1];
        const zi = params.value[2];
        return `${xLabel}: ${x[xi]}<br/>${yLabel}: ${y[yi]}<br/>${zLabel}: ${zi}`;
      }
    },
    visualMap: {
      min: zMin,
      max: zMax,
      calculable: true,
      orient: "vertical",
      left: "left",
      inRange: {
        color: [
          "#313695", "#4575b4", "#74add1", "#abd9e9", "#ffffbf",
          "#fdae61", "#f46d43", "#d73027", "#a50026"
        ]
      }
    },
    xAxis: {
      type: "category",
      data: x,
      boundaryGap: true,
      name: xLabel
    },
    yAxis: {
      type: "category",
      data: y,
      boundaryGap: true,
      name: yLabel
    },
    series: [
      {
        type: "heatmap",
        data: heatmapData,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            borderColor: "#333",
            borderWidth: 1
          }
        }
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: "80vh" }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
}

function flattenChartDataByTwoParams(rawParamData, paramAIndex, valueA, paramBIndex, valueB) {
  console.log("rawParamData:", rawParamData);
  console.log("paramAIndex:", paramAIndex, "valueA:", valueA);
  console.log("paramBIndex:", paramBIndex, "valueB:", valueB);

  if (
    !rawParamData?.values ||
    typeof paramAIndex !== "number" ||
    typeof paramBIndex !== "number"
  ) {
    console.error("❌ Invalid input data or parameter indices.");
    return [];
  }

  const matchingEntries = rawParamData.values.filter(entry => {
    return (
      entry.value?.[paramAIndex] === valueA &&
      entry.value?.[paramBIndex] === valueB
    );
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
        metGoal: []  // ✅ added here
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
        yearData.metGoal.push(simYear.metGoal?.[0] ?? false);  // ✅ added here
      });

      flatData.push(yearData);
    }
  });

  return flatData;
}



const TwoDimensionalCharts = () => {
    // console.log(tempExploration);
    const location = useLocation();
    const chartData = location.state?.chartData || [];
    
    

    const param1 = chartData.years.parameter[0];
    const param2 = chartData.years.parameter[1];

    const param1Values = getParameterValuesByIndex(chartData, 0);
    const param2Values = getParameterValuesByIndex(chartData, 1);
    console.log(chartData);   

    const {currScenario} = useContext(AppContext);
    const financialGoal = currScenario.financialGoal;
    const [currChart, setCurrChart] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("");
    const [parameterValue1, setParameterValue1] = useState(param1Values[0]);
    const [parameterValue2, setParameterValue2] = useState(param2Values[0]);
    const [currQuantity, setCurrQuantity] = useState("Total Investments");
    const [rawDataSubset, setRawDataSubset] = useState([]);

    // console.log(parameterValue1);
    // console.log(parameterValue2);
    // console.log(chartData)
    useEffect(() => {
        if (!chartData || parameterValue1 == null || parameterValue2 == null) return;
    
        const subset = flattenChartDataByTwoParams(chartData.years, 0, parameterValue1, 1, parameterValue2);
        // console.log(subset);
        setRawDataSubset(subset);
    }, [parameterValue1, parameterValue2]);

    const [currStat, setCurrStat] = useState("Median");
    const [aggThres, setAggThres] = useState(false);
    const [limit, setLimit] = useState(0);
    
    useEffect(() => {
    }, [limit]);
    

    const chartTypes = ["Probability Line Chart", "Shaded Line Chart", "Stacked Bar Chart", "Surface Plot", "Contour Plot"];
    // const multiQuantities = ["probability of success", "median total investments"];
    const lineChartQuantities = ["final probability of success", "final median total investments"];
    const shadedQuantities = ["Total Investments", "Total Income", "Total Expenses", "Early Withdrawal Tax", "Percentage of Total Discretionary Expenses Incurred"];

    const finalProbResults = parseFinalMetric2D(chartData.years, financialGoal, "probability");
    // console.log(finalProbResults); // inside parseFinalMetric2D

    const finalMedianResults = parseFinalMetric2D(chartData.years, financialGoal, "median");

    const probGrid = createGrid(finalProbResults);
    const medianGrid = createGrid(finalMedianResults);

    // console.log(rawDataSubset);
    const probLineData = parseProbabilityLineChartData(rawDataSubset, financialGoal);
    const shadedLineData = parseShadedLineChartBands(rawDataSubset, currQuantity);
    const {stackMeanData, stackMedianData} = parseStackedBarDataByMode(rawDataSubset, "exploration");

    // console.log("probability Grid: ");
    // console.log(probGrid);
    // console.log("median Grid: ");
    // console.log(medianGrid);

    // console.log("z flat map");
    // console.log(probGrid.z.flat());
    // console.log("z flat map");
    // console.log(medianGrid.z.flat());

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
                                menuItems={lineChartQuantities}
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

                        {(
                          currChart === "Probability Line Chart" ||
                          currChart === "Shaded Line Chart" ||
                          currChart === "Stacked Bar Chart"
                        ) && (
                          <>
                            <CustomDropdown
                              label={param1}
                              value={parameterValue1}
                              menuItems={param1Values}
                              setValue={setParameterValue1}
                            />
                            <CustomDropdown
                              label={param2}
                              value={parameterValue2}
                              menuItems={param2Values}
                              setValue={setParameterValue2}
                            /> 
                          </>
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

                    {currChart === "Surface Plot" && selectedQuantity === "final probability of success" && (
                        <PlotlySurfaceChart title="Final-Year Probability of Success" {...probGrid} xLabel={param1} yLabel={param2} zLabel="Final Probability of Success" />

                    )}

                    {currChart === "Surface Plot" && selectedQuantity === "final median total investments" && (
                        <PlotlySurfaceChart title="Final-Year Median Investment" {...medianGrid} xLabel={param1} yLabel={param2} zLabel = "Final Median Total Investments"/>
                    )}

                    {currChart === "Contour Plot" && selectedQuantity === "final probability of success" && (
                        <ContourChart title="Final-Year Probability of Success" {...probGrid} xLabel={param1} yLabel={param2} zLabel="Final Probability of Success" />

                    )}

                    {currChart === "Contour Plot" && selectedQuantity === "final median total investments" && (
                        <ContourChart title="Final-Year Median Investment" {...medianGrid} xLabel={param1} yLabel={param2} zLabel="Final Median Total Investments" />

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

export default TwoDimensionalCharts;