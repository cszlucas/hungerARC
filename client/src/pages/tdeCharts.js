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
import * as echarts from "echarts";
import "echarts-gl";
import { useLocation } from "react-router-dom";
import { AppContext } from "../context/appContext";


function parseFinalMetric2D(data, financialGoal, metric = "probability") {
    const results = [];
  
    data.values.forEach(({ value, simulations }) => {
      const [paramA, paramB] = value;
      const finalValues = simulations.map(sim => {
        const last = sim[sim.length - 1];
        return last.investment.reduce((sum, i) => sum + (i?.value ?? 0), 0);
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

  function SurfaceChart({ title, x, y, z }) {
    const { flatData, shape } = prepareSurfaceData(z, x, y);
  
    const zMin = Math.min(...flatData);
    const zMax = Math.max(...flatData);
  
    const option = {
      title: { text: title },
      tooltip: {},
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
      xAxis3D: {
        type: "category",
        name: "Duration",
        data: x
      },
      yAxis3D: {
        type: "category",
        name: "Contribution",
        data: y
      },
      zAxis3D: {
        type: "value",
        name: "Median Investment ($)",
        min: zMin,
        max: zMax
      },
      grid3D: {
        boxWidth: 100,
        boxDepth: 100,
        boxHeight: 150, // boost Z visibility
        viewControl: {
          projection: "perspective"
        },
        light: {
          main: { intensity: 1.2 },
          ambient: { intensity: 0.3 }
        }
      },
      series: [
        {
          type: "surface",
          shading: "color",
          data: flatData,
          dataShape: shape,
          wireframe: {
            show: true,
            lineStyle: { color: "#444", width: 1 }
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

function ContourChart({ title, x, y, z }) {
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
      tooltip: {},
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
        name: "Duration"
      },
      yAxis: {
        type: "category",
        data: y,
        boundaryGap: true,
        name: "Contribution"
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
    const location = useLocation();
    // const tdeData = location.state?.tdeData || [];

    const tdeData = {
        parameter: ["duration", "contribution"],
        values: [
          {
            value: [20, 100],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 3000 }, { name: "Brokerage", value: 2500 }] },
              { year: 2027, investment: [{ name: "IRA", value: 3100 }, { name: "Brokerage", value: 2600 }] }
            ]]
          },
          {
            value: [25, 100],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 3300 }, { name: "Brokerage", value: 2700 }] },
              { year: 2027, investment: [{ name: "IRA", value: 3400 }, { name: "Brokerage", value: 2800 }] }
            ]]
          },
          {
            value: [30, 100],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 3600 }, { name: "Brokerage", value: 2900 }] },
              { year: 2027, investment: [{ name: "IRA", value: 3700 }, { name: "Brokerage", value: 3100 }] }
            ]]
          },
          {
            value: [35, 100],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 3800 }, { name: "Brokerage", value: 3100 }] },
              { year: 2027, investment: [{ name: "IRA", value: 3900 }, { name: "Brokerage", value: 3200 }] }
            ]]
          },
      
          {
            value: [20, 200],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 4000 }, { name: "Brokerage", value: 3000 }] },
              { year: 2027, investment: [{ name: "IRA", value: 4100 }, { name: "Brokerage", value: 3200 }] }
            ]]
          },
          {
            value: [25, 200],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 4300 }, { name: "Brokerage", value: 3200 }] },
              { year: 2027, investment: [{ name: "IRA", value: 4400 }, { name: "Brokerage", value: 3400 }] }
            ]]
          },
          {
            value: [30, 200],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 4500 }, { name: "Brokerage", value: 3500 }] },
              { year: 2027, investment: [{ name: "IRA", value: 4600 }, { name: "Brokerage", value: 3600 }] }
            ]]
          },
          {
            value: [35, 200],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 4700 }, { name: "Brokerage", value: 3700 }] },
              { year: 2027, investment: [{ name: "IRA", value: 4800 }, { name: "Brokerage", value: 3800 }] }
            ]]
          },
      
          {
            value: [20, 300],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 5000 }, { name: "Brokerage", value: 3900 }] },
              { year: 2027, investment: [{ name: "IRA", value: 5100 }, { name: "Brokerage", value: 4000 }] }
            ]]
          },
          {
            value: [25, 300],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 5200 }, { name: "Brokerage", value: 4200 }] },
              { year: 2027, investment: [{ name: "IRA", value: 5300 }, { name: "Brokerage", value: 4400 }] }
            ]]
          },
          {
            value: [30, 300],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 5400 }, { name: "Brokerage", value: 4500 }] },
              { year: 2027, investment: [{ name: "IRA", value: 5500 }, { name: "Brokerage", value: 4600 }] }
            ]]
          },
          {
            value: [35, 300],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 5600 }, { name: "Brokerage", value: 4700 }] },
              { year: 2027, investment: [{ name: "IRA", value: 5700 }, { name: "Brokerage", value: 4800 }] }
            ]]
          },
      
          {
            value: [20, 400],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 5800 }, { name: "Brokerage", value: 4900 }] },
              { year: 2027, investment: [{ name: "IRA", value: 5900 }, { name: "Brokerage", value: 5000 }] }
            ]]
          },
          {
            value: [25, 400],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 6000 }, { name: "Brokerage", value: 5100 }] },
              { year: 2027, investment: [{ name: "IRA", value: 6100 }, { name: "Brokerage", value: 5200 }] }
            ]]
          },
          {
            value: [30, 400],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 6200 }, { name: "Brokerage", value: 5300 }] },
              { year: 2027, investment: [{ name: "IRA", value: 6300 }, { name: "Brokerage", value: 5400 }] }
            ]]
          },
          {
            value: [35, 400],
            simulations: [[
              { year: 2026, investment: [{ name: "IRA", value: 6400 }, { name: "Brokerage", value: 5500 }] },
              { year: 2027, investment: [{ name: "IRA", value: 6500 }, { name: "Brokerage", value: 5600 }] }
            ]]
          }
        ]
    };
      

    const financialGoal = 7000;
    const [currChart, setCurrChart] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("");

    const chartTypes = ["Surface Plot", "Contour Plot"];
    // const multiQuantities = ["probability of success", "median total investments"];
    const lineChartQuantities = ["final probability of success", "final median total investments"];

    const finalProbResults = parseFinalMetric2D(tdeData, financialGoal, "probability");
    console.log(finalProbResults); // inside parseFinalMetric2D

    const finalMedianResults = parseFinalMetric2D(tdeData, financialGoal, "median");

    const probGrid = createGrid(finalProbResults);
    const medianGrid = createGrid(finalMedianResults);

    const testGrid = {
        x: [20, 25, 30],
        y: [100, 200, 300],
        z: [
            [0.2, 0.4, 0.6],
            [0.3, 0.5, 0.7],
            [0.1, 0.4, 0.8]
        ]
    };

    const grid = {
        x: [20, 25, 30],
        y: [100, 200, 300],
        z: [
          [5000, 5200, 5500],
          [6200, 6600, 7000],
          [7500, 8000, 8600]
        ]
    };

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
                        // <SurfaceChart
                        //     title="Final-Year Probability of Success"
                        //     x={probGrid.x}
                        //     y={probGrid.y}
                        //     z={probGrid.z}
                        // />
                        <SurfaceChart title="Test Surface" {...probGrid} />

                    )}

                    {currChart === "Surface Plot" && selectedQuantity === "final median total investments" && (
                        // <SurfaceChart
                        //     title="Final-Year Median Investment"
                        //     {...medianGrid}
                        // />
                        <SurfaceChart title="Final Median Test" {...medianGrid} />
                    )}

                    {currChart === "Contour Plot" && selectedQuantity === "final probability of success" && (
                        <ContourChart title="Final-Year Probability of Success" {...probGrid} />

                    )}

                    {currChart === "Contour Plot" && selectedQuantity === "final median total investments" && (
                        <ContourChart title="Final-Year Median Investment" {...medianGrid} />

                    )}

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default TwoDimensionalCharts;