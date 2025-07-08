import React from "react";
import { Line } from "react-chartjs-2";

/**
 * ChartWithBands - Displays a line chart with shaded percentile bands
 */
export const ChartWithBands = ({ shadedLineChart }) => {
  const {
    startYear,
    p10_90,
    p20_80,
    p30_70,
    p40_60,
    median,
  } = shadedLineChart;

  const labels = Array.from({ length: median.length }, (_, i) => startYear + i);

  const datasets = [
    {
      label: "10–90%",
      data: p10_90.upper,
      fill: "-1",
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

  const data = { labels, datasets };

  const options = {
    plugins: {
      legend: {
        labels: {
          filter: (legendItem) =>
            ["10–90%", "20–80%", "30–70%", "40–60%", "Median"].includes(legendItem.text),
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Year",
          font: { size: 14 },
        },
      },
      y: {
        title: {
          display: true,
          text: "Value ($)",
          font: { size: 14 },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

/**
 * Parses raw data into shaded band percentiles for a line chart.
 */
export function parseShadedLineChartBands(rawData, quantity) {
  if (!Array.isArray(rawData)) {
    console.error("❌ rawData is not an array:", rawData);
    return {
      startYear: 2025,
      endYear: 2025,
      p10_90: { lower: [], upper: [] },
      p20_80: { lower: [], upper: [] },
      p30_70: { lower: [], upper: [] },
      p40_60: { lower: [], upper: [] },
      median: [],
    };
  }

  const getCategory = (entry) => {
    if (quantity === "Total Investments") return entry.investments;
    if (quantity === "Total Income") return entry.income;
    if (quantity === "Total Expenses") {
      const nSims = Math.max(
        entry.discretionary?.length ?? 0,
        entry.nonDiscretionary?.length ?? 0,
        entry.taxes?.length ?? 0
      );

      const sims = [];
      for (let i = 0; i < nSims; i++) {
        const dItems = entry.discretionary?.[i] ?? [];
        const ndItems = entry.nonDiscretionary?.[i] ?? [];
        const taxEntry = entry.taxes?.[i];
        const taxItems = Array.isArray(taxEntry)
          ? taxEntry
          : typeof taxEntry === "number"
          ? [taxEntry]
          : [];

        const dSum = dItems.reduce((sum, item) => sum + (item?.value ?? 0), 0);
        const ndSum = ndItems.reduce((sum, item) => sum + (item?.value ?? 0), 0);
        const tSum = taxItems.reduce((sum, val) => sum + (val ?? 0), 0);
        sims.push({ value: dSum + ndSum + tSum });
      }
      return sims;
    }

    if (quantity === "Early Withdrawal Tax") {
      return entry.earlyWithdrawals?.map(v => ({ value: v })) ?? [];
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
    if (!sims || sims.length === 0) return null;

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
      if (lower === upper) return totalsPerSim[lower];
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
