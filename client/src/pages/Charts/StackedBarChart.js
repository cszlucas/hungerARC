import React from "react";
import ReactECharts from "echarts-for-react";

/**
 * React component that renders a grouped and stacked bar chart.
 */
export const GroupedStackedBarChart = ({ data, threshold = 0 }) => {
  const years = [...new Set(data.map(d => d.year))].sort();
  const categories = ["Investment", "Income", "Expense"];
  const itemNames = [...new Set(data.map(d => d.name))];

  const itemSums = {};
  itemNames.forEach(name => { itemSums[name] = 0; });
  data.forEach(({ name, value }) => {
    itemSums[name] += value;
  });

  const visibleItems = itemNames.filter(name => itemSums[name] >= threshold);
  const hasOther = itemNames.length !== visibleItems.length;

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

  const allSeries = [];

  [...visibleItems, ...(hasOther ? ["Other"] : [])].forEach(name => {
    categories.forEach(category => {
      allSeries.push({
        name: name,
        type: "bar",
        stack: category,
        emphasis: { focus: "series" },
        data: years.map(year => groupedData[year][category][name] || 0),
        itemStyle: name === "Other" ? { color: "#7fc97f" } : undefined,
      });
    });
  });

  const option = {
    title: { text: "" },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: function (params) {
        const year = params[0].axisValue;
        const lines = [`<strong>${year}</strong>`];
        const grouped = { Investment: [], Income: [], Expense: [] };

        params.forEach(p => {
          if (p.value > 0) {
            const cat = p.seriesIndex % 3;
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
      name: "Years"
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




/**
 * Parses simulation data into mean and median values for each year and category.
 */
export function parseGroupedStackedBarChartData(rawData) {
  const meanData = [];
  const medianData = [];

  rawData.forEach((yearData) => {
    const year = yearData.year;

    const processCategory = (categoryData, type) => {
      if (!categoryData) return;

      const itemMap = {};

      categoryData.forEach((simArray) => {
        simArray.forEach(({ name, value }) => {
          if (!itemMap[name]) itemMap[name] = [];
          itemMap[name].push(value ?? 0);
        });
      });

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

    // Taxes and earlyWithdrawals are flat numbers per sim
    processCategory(
      [yearData.taxes.map(val => ({ name: "Taxes", value: val }))],
      "expense"
    );
    processCategory(
      [yearData.earlyWithdrawals.map(val => ({ name: "Early Withdrawals", value: val }))],
      "income"
    );
  });

  return { meanData, medianData };
}


export function parseExplorationGroupedStackedBarChartData(rawData) {
  const meanData = [];
  const medianData = [];

  rawData.forEach((yearData) => {
    const year = yearData.year;

    const processCategory = (categoryData, type) => {
      if (!Array.isArray(categoryData)) return;

      const itemMap = {};

      categoryData.forEach((sim) => {
        // Handle three cases:
        // 1. sim = array of items: [{ name, value }, ...]
        // 2. sim = nested array: [[{ name, value }, ...]]
        // 3. sim = scalar number: 1234

        if (Array.isArray(sim)) {
          // Nested arrays case
          sim.forEach((entry) => {
            if (Array.isArray(entry)) {
              entry.forEach(({ name, value }) => {
                if (!itemMap[name]) itemMap[name] = [];
                itemMap[name].push(value ?? 0);
              });
            } else if (entry && typeof entry === "object" && "name" in entry) {
              const { name, value } = entry;
              if (!itemMap[name]) itemMap[name] = [];
              itemMap[name].push(value ?? 0);
            }
          });
        } else if (typeof sim === "object" && sim !== null && "name" in sim) {
          const { name, value } = sim;
          if (!itemMap[name]) itemMap[name] = [];
          itemMap[name].push(value ?? 0);
        } else if (typeof sim === "number") {
          const name = type === "expense" ? "Taxes" : "Early Withdrawals";
          if (!itemMap[name]) itemMap[name] = [];
          itemMap[name].push(sim);
        }
      });

      // Compute mean & median
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

  return { stackMeanData: meanData, stackMedianData: medianData };
}


export function parseStackedBarDataByMode(rawData, mode = "regular") {
  return mode === "exploration"
    ? parseExplorationGroupedStackedBarChartData(rawData)
    : parseGroupedStackedBarChartData(rawData);
}