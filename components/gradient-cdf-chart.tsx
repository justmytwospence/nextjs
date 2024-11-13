import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { computeCdf, computeGradient } from "@/lib/geo";
import { Mappable } from "@prisma/client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Move calculation outside component
const xAxisRange = Array.from({ length: 401 }, (_, i) =>
  parseFloat((-0.2 + i * 0.001).toFixed(3))
);

const CHART_COLORS = ["text-blue-500", "text-slate-400", "text-rose-500"];

export default function GradientCdfChart({
  routes,
  onHoverGradient,
  gradients,
}: {
  routes: Mappable[];
  onHoverGradient?: (gradient: number | null) => void;
  gradients: number[][];
}) {
  const [cdfs, setCdfs] = useState<number[][]>([]);

  useEffect(() => {
    setCdfs(gradients.map((g) => computeCdf(g, xAxisRange)));
  }, [gradients]);

  if (routes.length === 0) return null;

  const allGradients = gradients.flat();
  const gradientMin = Math.max(Math.min(...allGradients), -0.3);
  const gradientMax = Math.min(Math.max(...allGradients), 0.3);

  const data = {
    labels: xAxisRange,
    datasets: routes.map((route, index) => ({
      label: route.name,
      data: cdfs[index] || [],
      borderColor: getComputedStyle(document.documentElement).getPropertyValue(
        `--${CHART_COLORS[index % CHART_COLORS.length]}`
      ), // Color code the lines
      backgroundColor: getComputedStyle(
        document.documentElement
      ).getPropertyValue(`--${CHART_COLORS[index % CHART_COLORS.length]}`), // Ensure legend color matches line color
      fill: false,
      pointRadius: 0,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    plugins: {
      title: {
        display: true,
        text: "Cumulative Density Function of Gradient",
      },
      legend: {
        display: routes.length > 1,
        position: "top" as const,
        labels: {
          usePointStyle: true, // Use point style for legend
          pointStyle: "line", // Use line style for legend
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          title: function (context) {
            const label = context[0]?.label;
            return `Gradient: ${(parseFloat(label) * 100).toFixed(1)}%`;
          },
          label: function (context) {
            const label = context.dataset.label || "";
            return `${label}: ${(context.parsed.y * 100).toFixed(1)}%`;
          },
        },
      },
    },
    hover: {
      mode: "index" as const,
      intersect: false,
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    onHover: (event, elements, chart) => {
      if (!event?.native || !chart?.chartArea) {
        onHoverGradient?.(null);
        return;
      }

      const chartArea = chart.chartArea;
      const x = event.native.offsetX;

      if (x < chartArea.left || x > chartArea.right) {
        onHoverGradient?.(null);
        return;
      }

      // Calculate gradient value at hover position
      const relativeX =
        (x - chartArea.left) / (chartArea.right - chartArea.left);
      const gradientValue =
        gradientMin + relativeX * (gradientMax - gradientMin);
      onHoverGradient?.(gradientValue);
    },
    scales: {
      x: {
        type: "linear" as const,
        min: gradientMin,
        max: gradientMax,
        ticks: {
          stepSize: 0.01,
          min: -0.2,
          max: 0.2,
          callback: function (value) {
            return (value * 100).toFixed(0) + "%"; // Format as percentage with 2 decimal places
          },
        },
        title: {
          display: true,
          text: "Gradient",
        },
      },
      y: {
        type: "linear" as const,
        title: {
          display: true,
          text: "CDF",
        },
        ticks: {
          callback: function (value) {
            return (value * 100).toFixed(0) + "%"; // Format as percentage with 2 decimal places
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-full" onMouseLeave={() => onHoverGradient?.(null)}>
      <Line data={data} options={options} />
    </div>
  );
}
