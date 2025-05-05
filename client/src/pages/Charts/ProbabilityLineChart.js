import React from "react";
import ReactECharts from "echarts-for-react";

/**
 * Parses raw simulation data and computes the probability of reaching a financial goal per year.
 * @param {Array} rawData - The simulation data array, with each entry containing a year and investment simulations.
 * @param {number} financialGoal - The financial threshold that determines success.
 * @returns {Object} An object containing startYear, endYear, and an array of probabilities.
 */
export function parseProbabilityLineChartData(rawData, financialGoal) {
  const startYear = rawData[0]?.year ?? 2025;
  const endYear = rawData[rawData.length - 1]?.year ?? startYear;

  const probabilities = rawData.map((yearData) => {
    const simulations = yearData.investments ?? [];
    if (simulations.length === 0) return 0;

    let successCount = 0;

    simulations.forEach((sim) => {
      const totalInvestment = sim.reduce((sum, item) => sum + (item?.value ?? 0), 0);
      if (totalInvestment >= financialGoal) {
        successCount += 1;
      }
    });

    return successCount / simulations.length;
  });

  return {
    startYear,
    endYear,
    probabilities,
  };
}

/**
 * Line chart that visualizes probability over time.
 * @param {Object} lineChart - Object containing startYear, endYear, and probabilities array.
 */
export const ProbabilityLineChart = ({ lineChart }) => {
  const { startYear, probabilities } = lineChart;
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
        name: "Probability",
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};
