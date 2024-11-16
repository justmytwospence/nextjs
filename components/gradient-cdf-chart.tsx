"use client";

import React, { useRef, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { useStore } from "@/store";
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

const xAxisRange = Array.from({ length: 401 }, (_, i) =>
  parseFloat((-0.2 + i * 0.001).toFixed(3))
);

const CHART_COLORS = ["#3b82f6", "#64748b", "#f43f5e"];

export default function GradientCdfChart({
  mappables,
}: {
  mappables: Mappable[];
}) {
  const chartRef = useRef<ChartJS<"line">>(null);
  const { setHoveredGradient } = useStore();

  // Compute gradients and get range
  const gradients = mappables.map((m) =>
    computeGradient(m.polyline.coordinates)
  );
  const allGradients = gradients.flat();
  const gradientMin = Math.max(Math.min(...allGradients), -0.3);
  const gradientMax = Math.min(Math.max(...allGradients), 0.3);

  // Compute CDFs
  const cdfs = gradients.map((g) => computeCdf(g, xAxisRange));

  const initialData = {
    labels: xAxisRange,
    datasets: mappables.map((route, i) => ({
      label: route.name || `Route ${i + 1}`,
      data: xAxisRange.map((x, j) => ({ x, y: cdfs[i][j] })),
      borderColor: CHART_COLORS[i % CHART_COLORS.length],
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.1,
      fill: false,
      pointRadius: 0,
    })),
  };

  const initialOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        min: gradientMin,
        max: gradientMax,
        ticks: {
          callback: (value) => `${(Number(value) * 100).toFixed(0)}%`,
        },
        title: {
          display: true,
          text: "Gradient",
        },
      },
      y: {
        min: 0,
        max: 1,
        ticks: {
          callback: (value) => `${(Number(value) * 100).toFixed(0)}%`,
        },
        title: {
          display: true,
          text: "CDF",
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: "Cumulative Density Function of Gradient",
      },
      legend: {
        display: mappables.length > 1,
        position: "top",
      },
      tooltip: {
        mode: "index" as const,
        callbacks: {
          title: (items) =>
            `Gradient: ${(items[0].parsed.x * 100).toFixed(1)}%`,
          label: (item) =>
            `${item.dataset.label}: ${(item.parsed.y * 100).toFixed(1)}%`,
        },
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    onHover: (event: ChartEvent, elements: any[], chart: ChartJS) => {
      if (!event?.native || !chart?.chartArea) {
        setHoveredGradient(null);
        return;
      }

      const rect = (
        event.native.target as HTMLCanvasElement
      ).getBoundingClientRect();
      const x = event.native.clientX - rect.left;
      const xAxis = chart.scales.x;

      if (x >= xAxis.left && x <= xAxis.right) {
        const value = xAxis.getValueForPixel(x);
        setHoveredGradient(value);
      } else {
        setHoveredGradient(null);
      }
    },
  };

  return (
    <div className="w-full h-full p-4">
      <Line ref={chartRef} data={initialData} options={initialOptions} />
    </div>
  );
}
