"use client";

import React, { useRef, useEffect } from "react";
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

  useEffect(() => {
    if (!chartRef.current || mappables.length === 0) return;

    // Compute gradients and get range
    const gradients = mappables.map((m) =>
      computeGradient(m.polyline.coordinates)
    );
    const allGradients = gradients.flat();
    const gradientMin = Math.max(Math.min(...allGradients), -0.3);
    const gradientMax = Math.min(Math.max(...allGradients), 0.3);

    // Compute CDFs
    const cdfs = mappables.map((m) =>
      computeCdf(m.polyline.coordinates, xAxisRange)
    );

    const chart = chartRef.current;
    chart.data = {
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

    chart.options = {
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
          callbacks: {
            title: (items) =>
              `Gradient: ${(items[0].parsed.x * 100).toFixed(1)}%`,
            label: (item) =>
              `${item.dataset.label}: ${(item.parsed.y * 100).toFixed(1)}%`,
          },
        },
      },
    };

    chart.update();
  }, [mappables]);

  return (
    <div className="w-full h-full p-4">
      <Line
        ref={chartRef}
        data={{ labels: [], datasets: [] }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
        }}
      />
    </div>
  );
}
