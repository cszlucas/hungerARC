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
  const {
    startYear,
    endYear,
    p10_90,
    p20_80,
    p30_70,
    p40_60,
    median,
  } = shadedLineChart;

  const labels = Array.from({ length: median.length }, (_, i) => startYear + i);

  const datasets = [
    // 10-90% Band
    {
      label: "10–90%",
      data: p10_90.upper,
      fill: "-1", // Fill between upper and lower
      backgroundColor: "rgba(122, 173, 255, 0.1)",
      borderColor: "transparent",
      pointRadius: 0,
    },
    {
      label: "10–90% Lower",
      data: p10_90.lower,
      fill: false,
      borderColor: "transparent",
      pointRadius: 0,
    },

    // 20-80% Band
    {
      label: "20–80%",
      data: p20_80.upper,
      fill: "-1",
      backgroundColor: "rgba(77, 144, 251, 0.15)",
      borderColor: "transparent",
      pointRadius: 0,
    },
    {
      label: "20–80% Lower",
      data: p20_80.lower,
      fill: false,
      borderColor: "transparent",
      pointRadius: 0,
    },

    // 30-70% Band
    {
      label: "30–70%",
      data: p30_70.upper,
      fill: "-1",
      backgroundColor: "rgba(33, 117, 253, 0.2)",
      borderColor: "transparent",
      pointRadius: 0,
    },
    {
      label: "30–70% Lower",
      data: p30_70.lower,
      fill: false,
      borderColor: "transparent",
      pointRadius: 0,
    },

    // 40-60% Band
    {
      label: "40–60%",
      data: p40_60.upper,
      fill: "-1",
      backgroundColor: "rgba(0, 98, 255, 0.25)",
      borderColor: "transparent",
      pointRadius: 0,
    },
    {
      label: "40–60% Lower",
      data: p40_60.lower,
      fill: false,
      borderColor: "transparent",
      pointRadius: 0,
    },

    // Median Line
    {
      label: "Median",
      data: median,
      borderColor: "#000",
      pointBackgroundColor: "#000",
      backgroundColor: "#000",
      tension: 0.4,
      fill: false,
    },
  ];

  const data = {
    labels,
    datasets,
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          filter: function (legendItem) {
            // Only show the Upper bands + Median in the legend
            return (
              legendItem.text.includes("10–90%") ||
              legendItem.text.includes("20–80%") ||
              legendItem.text.includes("30–70%") ||
              legendItem.text.includes("40–60%") ||
              legendItem.text === "Median"
            );
          },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

const GroupedStackedBarChart = ({ data, threshold = 0 }) => {
  const years = [...new Set(data.map(d => d.year))].sort();
  const categories = ["Investment", "Income", "Expense"];
  const itemNames = [...new Set(data.map(d => d.name))];

  // 1. Sum totals to apply threshold
  const itemSums = {};
  itemNames.forEach(name => { itemSums[name] = 0; });
  data.forEach(({ name, value }) => {
    itemSums[name] += value;
  });
  const visibleItems = itemNames.filter(name => itemSums[name] >= threshold);
  const hasOther = itemNames.length !== visibleItems.length;

  // 2. Build mapping: year → { Investment: [], Income: [], Expense: [] }
  const groupedData = {};
  years.forEach(year => {
    groupedData[year] = { Investment: {}, Income: {}, Expense: {} };
  });

  data.forEach(({ year, type, name, value }) => {
    const category = type.charAt(0).toUpperCase() + type.slice(1);
    const group = groupedData[year];
    const key = visibleItems.includes(name) ? name : "Other";
    if (!group[category][key]) {
      group[category][key] = 0;
    }
    group[category][key] += value;
  });

  // 3. Build the series: one bar per item name per category
  const allSeries = [];

  [...visibleItems, ...(hasOther ? ["Other"] : [])].forEach(name => {
    categories.forEach(category => {
      allSeries.push({
        name: name,
        type: "bar",
        stack: category, // stack inside each category (Investment, Income, Expense)
        emphasis: { focus: "series" },
        data: years.map(year => groupedData[year][category][name] || 0),
        itemStyle: name === "Other" ? { color: "#7fc97f" } : undefined,
      });
    });
  });

  const option = {
    title: { text: "Grouped and Stacked Bar Chart" },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: function (params) {
        const year = params[0].axisValue;
        const lines = [`<strong>${year}</strong>`];
        const grouped = { Investment: [], Income: [], Expense: [] };

        params.forEach(p => {
          if (p.value > 0) {
            const cat = p.seriesIndex % 3; // 0=Investment, 1=Income, 2=Expense
            const category = ["Investment", "Income", "Expense"][cat];
            const colorBox = `<span style="display:inline-block;margin-right:6px;
              border-radius:3px;width:10px;height:10px;
              background-color:${p.color}"></span>`;
            grouped[category].push(`${colorBox}${p.seriesName}: ${p.value.toLocaleString()}`);
          }
        });

        categories.forEach(cat => {
          if (grouped[cat].length > 0) {
            lines.push(`<u>${cat}</u>`);
            lines.push(...grouped[cat]);
          }
        });

        return lines.join("<br>");
      }
    },
    legend: { type: "scroll" },
    grid: { containLabel: true },
    xAxis: {
      type: "category",
      data: years,
    },
    yAxis: {
      type: "value",
      name: "Amount",
    },
    series: allSeries,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 500 }}
      key={`chart-${threshold}-${data?.length ?? 0}`}
    />
  );
};











  

function parseProbabilityLineChartData(rawData) {
  const startYear = rawData[0]?.year ?? 2025;
  const endYear = rawData[rawData.length - 1]?.year ?? startYear;

  const probabilities = rawData.map((yearData) => {
    const sims = yearData.income ?? [];

    if (sims.length === 0) return 0;

    let successCount = 0;

    sims.forEach((sim) => {
      // sim is an array of income items for a single run
      const totalIncome = sim.reduce((sum, item) => sum + (item?.value ?? 0), 0);
      if (totalIncome > 0) successCount += 1;
    });

    return successCount / sims.length;
  });

  return {
    startYear,
    endYear,
    probabilities
  };
}
   
function parseGroupedStackedBarChartData(rawData) {
  const meanData = [];
  const medianData = [];

  rawData.forEach((yearData) => {
    const year = yearData.year;

    const processCategory = (categoryData, type) => {
      if (!categoryData) return;

      // Loop over each simulation
      const itemMap = {};

      categoryData.forEach((sim) => {
        if (Array.isArray(sim)) {
          sim.forEach(({ name, value }) => {
            if (!itemMap[name]) itemMap[name] = [];
            itemMap[name].push(value ?? 0);
          });
        } else {
          // case: taxes/earlyWithdrawals (numbers)
          const name = type === "expense" ? "Taxes" : "Early Withdrawals";
          if (!itemMap[name]) itemMap[name] = [];
          itemMap[name].push(sim ?? 0);
        }
      });

      // Now compute mean and median
      Object.entries(itemMap).forEach(([name, values]) => {
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;

        const sorted = values.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];

        meanData.push({ year, type, name, value: mean });
        medianData.push({ year, type, name, value: median });
      });
    };

    processCategory(yearData.investments, "investment");
    processCategory(yearData.income, "income");
    processCategory(yearData.discretionary, "expense");
    processCategory(yearData.nonDiscretionary, "expense");
    processCategory(yearData.taxes, "expense");
    processCategory(yearData.earlyWithdrawals, "income");
  });

  return { meanData, medianData };
}


function parseShadedLineChartBands(rawData, quantity) {
  const getCategory = (entry) => {
    if (quantity === "Total Investments") return entry.investments;
    if (quantity === "Total Income") return entry.income;
    if (quantity === "Total Expenses") {
      return [
        ...(entry.discretionary ?? []),
        ...(entry.nonDiscretionary ?? []),
        ...(entry.taxes != null ? entry.taxes.map(v => ({ value: v })) : [])
      ];
    }
    if (quantity === "Early Withdrawal Tax") {
      return entry.earlyWithdrawals != null
        ? entry.earlyWithdrawals.map(v => ({ value: v }))
        : [];
    }
    if (quantity === "Percentage of Total Discretionary Expenses Incurred") {
      return entry.discretionary ?? [];
    }
    return [];
  };

  const startYear = rawData[0]?.year ?? 2025;
  const endYear = rawData[rawData.length - 1]?.year ?? startYear;

  const percentilesByYear = rawData.map((yearData) => {
    const sims = getCategory(yearData);

    if (sims.length === 0) return null;

    const totalsPerSim = sims.map((arrOrVal) => {
      if (Array.isArray(arrOrVal)) {
        return arrOrVal.reduce((sum, item) => sum + (item?.value ?? 0), 0);
      } else {
        return arrOrVal?.value ?? 0;
      }
    });

    totalsPerSim.sort((a, b) => a - b);

    const getPercentile = (p) => {
      const index = (p / 100) * (totalsPerSim.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      if (lower === upper) {
        return totalsPerSim[lower];
      }
      // Linear interpolation
      const weight = index - lower;
      return totalsPerSim[lower] * (1 - weight) + totalsPerSim[upper] * weight;
    };

    return {
      p10: getPercentile(10),
      p20: getPercentile(20),
      p30: getPercentile(30),
      p40: getPercentile(40),
      p60: getPercentile(60),
      p70: getPercentile(70),
      p80: getPercentile(80),
      p90: getPercentile(90),
      median: getPercentile(50),
    };
  });

  // Split out bands
  const bands = {
    startYear,
    endYear,
    p10_90: { lower: [], upper: [] },
    p20_80: { lower: [], upper: [] },
    p30_70: { lower: [], upper: [] },
    p40_60: { lower: [], upper: [] },
    median: [],
  };

  percentilesByYear.forEach((p) => {
    if (!p) {
      bands.p10_90.lower.push(null);
      bands.p10_90.upper.push(null);
      bands.p20_80.lower.push(null);
      bands.p20_80.upper.push(null);
      bands.p30_70.lower.push(null);
      bands.p30_70.upper.push(null);
      bands.p40_60.lower.push(null);
      bands.p40_60.upper.push(null);
      bands.median.push(null);
    } else {
      bands.p10_90.lower.push(p.p10);
      bands.p10_90.upper.push(p.p90);
      bands.p20_80.lower.push(p.p20);
      bands.p20_80.upper.push(p.p80);
      bands.p30_70.lower.push(p.p30);
      bands.p30_70.upper.push(p.p70);
      bands.p40_60.lower.push(p.p40);
      bands.p40_60.upper.push(p.p60);
      bands.median.push(p.median);
    }
  });

  return bands;
}

const Charts = () => {
    const location = useLocation();
    // const chartData = location.state?.chartData || [];
    // console.log(chartData);
    const chartData = [
      {
        "year": 2025,
        "income": [
          [
            {
              "name": "salary",
              "value": 75829.14175491624
            }
          ],
          [
            {
              "name": "salary",
              "value": 76559.87176177483
            }
          ],
          [
            {
              "name": "salary",
              "value": 76411.21799101612
            }
          ]
        ],
        "investments": [
          [
            {
              "name": "Cash",
              "value": 69229.14175491624
            },
            {
              "name": "S&P 500",
              "value": 51262.884769215816
            },
            {
              "name": "tax-exempt bonds",
              "value": 21969.80775823535
            },
            {
              "name": "S&P 500",
              "value": 10004.497763995649
            },
            {
              "name": "S&P 500",
              "value": 9000.976529981806
            }
          ],
          [
            {
              "name": "Cash",
              "value": 69959.87176177483
            },
            {
              "name": "S&P 500",
              "value": 51776.504094846954
            },
            {
              "name": "tax-exempt bonds",
              "value": 22189.930326362977
            },
            {
              "name": "S&P 500",
              "value": 10007.73072221461
            },
            {
              "name": "S&P 500",
              "value": 9000.706013969817
            }
          ],
          [
            {
              "name": "Cash",
              "value": 69811.21799101612
            },
            {
              "name": "S&P 500",
              "value": 51672.72017566182
            },
            {
              "name": "tax-exempt bonds",
              "value": 22145.451503855067
            },
            {
              "name": "S&P 500",
              "value": 10005.422843879292
            },
            {
              "name": "S&P 500",
              "value": 9001.717833270548
            }
          ]
        ],
        "discretionary": [
          [
            {
              "name": "vacation",
              "value": 1200
            },
            {
              "name": "streaming services",
              "value": 500
            }
          ],
          [
            {
              "name": "vacation",
              "value": 1200
            },
            {
              "name": "streaming services",
              "value": 500
            }
          ],
          [
            {
              "name": "vacation",
              "value": 1200
            },
            {
              "name": "streaming services",
              "value": 500
            }
          ]
        ],
        "nonDiscretionary": [
          [
            {
              "name": "food",
              "value": 5000
            }
          ],
          [
            {
              "name": "food",
              "value": 5000
            }
          ],
          [
            {
              "name": "food",
              "value": 5000
            }
          ]
        ],
        "taxes": [
          0,
          0,
          0
        ],
        "earlyWithdrawals": [
          0,
          0,
          0
        ]
      },
      {
        "year": 2026,
        "income": [
          [
            {
              "name": "salary",
              "value": 78020.31355155479
            }
          ],
          [
            {
              "name": "salary",
              "value": 79288.52902363286
            }
          ],
          [
            {
              "name": "salary",
              "value": 77643.61813862572
            }
          ]
        ],
        "investments": [
          [
            {
              "name": "Cash",
              "value": 122895.43774174283
            },
            {
              "name": "S&P 500",
              "value": 131705.38656053878
            },
            {
              "name": "tax-exempt bonds",
              "value": 56445.165668802336
            },
            {
              "name": "S&P 500",
              "value": 10010.63527676521
            },
            {
              "name": "S&P 500",
              "value": 16006.839770962168
            }
          ],
          [
            {
              "name": "Cash",
              "value": 123610.52870029311
            },
            {
              "name": "S&P 500",
              "value": 132727.39694459335
            },
            {
              "name": "tax-exempt bonds",
              "value": 56883.17011911144
            },
            {
              "name": "S&P 500",
              "value": 10013.844699805872
            },
            {
              "name": "S&P 500",
              "value": 16007.04155573195
            }
          ],
          [
            {
              "name": "Cash",
              "value": 123133.54511392185
            },
            {
              "name": "S&P 500",
              "value": 132301.35518949866
            },
            {
              "name": "tax-exempt bonds",
              "value": 56700.58079549943
            },
            {
              "name": "S&P 500",
              "value": 10012.710745800456
            },
            {
              "name": "S&P 500",
              "value": 16003.043417260906
            }
          ]
        ],
        "discretionary": [
          [
            {
              "name": "vacation",
              "value": 1200.36
            },
            {
              "name": "streaming services",
              "value": 500.15
            }
          ],
          [
            {
              "name": "vacation",
              "value": 1200.36
            },
            {
              "name": "streaming services",
              "value": 500.15
            }
          ],
          [
            {
              "name": "vacation",
              "value": 1200.36
            },
            {
              "name": "streaming services",
              "value": 500.15
            }
          ]
        ],
        "nonDiscretionary": [
          [
            {
              "name": "food",
              "value": 5001.5
            }
          ],
          [
            {
              "name": "food",
              "value": 5001.5
            }
          ],
          [
            {
              "name": "food",
              "value": 5001.5
            }
          ]
        ],
        "taxes": [
          16838.013982601966,
          17038.96473448808,
          16998.08494752943
        ],
        "earlyWithdrawals": [
          0,
          0,
          0
        ]
      },
      {
        "year": 2027,
        "income": [
          [
            {
              "name": "salary",
              "value": 80017.90265410267
            }
          ],
          [
            {
              "name": "salary",
              "value": 81441.30274355428
            }
          ],
          [
            {
              "name": "salary",
              "value": 80772.60784396705
            }
          ]
        ],
        "investments": [
          [
            {
              "name": "Cash",
              "value": 177340.65883686207
            },
            {
              "name": "S&P 500",
              "value": 250253.9714146676
            },
            {
              "name": "tax-exempt bonds",
              "value": 107251.70203485756
            },
            {
              "name": "S&P 500",
              "value": 10014.236522558625
            },
            {
              "name": "S&P 500",
              "value": 23013.66443446045
            }
          ],
          [
            {
              "name": "Cash",
              "value": 178540.77595813805
            },
            {
              "name": "S&P 500",
              "value": 252163.9616554508
            },
            {
              "name": "tax-exempt bonds",
              "value": 108070.2692809075
            },
            {
              "name": "S&P 500",
              "value": 10017.300399837322
            },
            {
              "name": "S&P 500",
              "value": 23017.31830129335
            }
          ],
          [
            {
              "name": "Cash",
              "value": 177770.84861988502
            },
            {
              "name": "S&P 500",
              "value": 251202.19150986904
            },
            {
              "name": "tax-exempt bonds",
              "value": 107658.08207565815
            },
            {
              "name": "S&P 500",
              "value": 10018.395155013714
            },
            {
              "name": "S&P 500",
              "value": 23010.61839739872
            }
          ]
        ],
        "discretionary": [
          [
            {
              "name": "vacation",
              "value": 1200.7201079999998
            },
            {
              "name": "streaming services",
              "value": 500.3000449999999
            }
          ],
          [
            {
              "name": "vacation",
              "value": 1200.7201079999998
            },
            {
              "name": "streaming services",
              "value": 500.3000449999999
            }
          ],
          [
            {
              "name": "vacation",
              "value": 1200.7201079999998
            },
            {
              "name": "streaming services",
              "value": 500.3000449999999
            }
          ]
        ],
        "nonDiscretionary": [
          [
            {
              "name": "food",
              "value": 5003.00045
            }
          ],
          [
            {
              "name": "food",
              "value": 5003.00045
            }
          ],
          [
            {
              "name": "food",
              "value": 5003.00045
            }
          ]
        ],
        "taxes": [
          17216.73799159285,
          17267.698710076747,
          17166.166069369665
        ],
        "earlyWithdrawals": [
          0,
          0,
          0
        ]
      }
    ];

    const probabilityLineChart = parseProbabilityLineChartData(chartData);
    // console.log(probabilityLineChart);
    const {meanData, medianData} = parseGroupedStackedBarChartData(chartData);
    // console.log(meanData);
    // console.log(medianData);
    
    const [currChart, setCurrChart] = useState("");
    const [currQuantity, setCurrQuantity] = useState("Total Investments");
    const [currStat, setCurrStat] = useState("Median");
    const [aggThres, setAggThres] = useState(false);
    const [limit, setLimit] = useState(0);
    useEffect(() => {
    }, [limit]);
    const chartTypes = ["Line Chart", "Shaded Line Chart", "Stacked Bar Chart"];
    const shadedQuantities = ["Total Investments", "Total Income", "Total Expenses", "Early Withdrawal Tax", "Percentage of Total Discretionary Expenses Incurred"];
    
    const shadedLineChartData = parseShadedLineChartBands(chartData, currQuantity);
    console.log(shadedLineChartData);

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
                    )}

                </Stack>
            </Container>
        </ThemeProvider>
    );
};

export default Charts;