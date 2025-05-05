import React, { useState, useContext, useEffect } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, Stack } from "@mui/material";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import {
  stackStyles,
  titleStyles,
} from "../../components/styles";  // Import your modular styles
import CustomDropdown from "../../components/customDropDown";
import ReactECharts from "echarts-for-react";
import "echarts-gl";
import { useLocation } from "react-router-dom";
import Plot from "react-plotly.js";
import { AppContext } from "../../context/appContext";


function parseFinalMetric2D(data, financialGoal, metric = "probability") {
  const results = [];

  data.values.forEach(({ value, simulations }) => {
    const [paramA, paramB] = value; // now from value = [2025, 2026]

    const finalValues = simulations.map(sim => {
      const last = sim[sim.length - 1];
      return last.investment.flat().reduce((sum, i) => sum + (i?.value ?? 0), 0);
    });

    let z;
    if (metric === "probability") {
      const successCount = finalValues.filter(v => v >= financialGoal).length;
      z = successCount / finalValues.length;
    } else if (metric === "median") {
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
  
  // Prepares z -> flatData + dataShape for echarts
function prepareSurfaceData(z, x, y) {
    return {
        flatData: z.flat(),
        shape: [y.length, x.length]
    };
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

  

const TwoDimensionalCharts = () => {
    // console.log(tempExploration);
    const location = useLocation();
    const chartData = location.state?.chartData || [];

    const param1 = chartData.years.parameter[0];
    const param2 = chartData.years.parameter[1];

    console.log(chartData);   

    const financialGoal = 7000;
    const [currChart, setCurrChart] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("");

    const chartTypes = ["Surface Plot", "Contour Plot"];
    // const multiQuantities = ["probability of success", "median total investments"];
    const lineChartQuantities = ["final probability of success", "final median total investments"];

    const finalProbResults = parseFinalMetric2D(chartData.years, financialGoal, "probability");
    console.log(finalProbResults); // inside parseFinalMetric2D

    const finalMedianResults = parseFinalMetric2D(chartData.years, financialGoal, "median");

    const probGrid = createGrid(finalProbResults);
    const medianGrid = createGrid(finalMedianResults);

    console.log("probability Grid: ");
    console.log(probGrid);
    console.log("median Grid: ");
    console.log(medianGrid);

    console.log("z flat map");
    console.log(probGrid.z.flat());
    console.log("z flat map");
    console.log(medianGrid.z.flat());

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

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default TwoDimensionalCharts;