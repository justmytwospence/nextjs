"use client";

import { computeCdf, computeGradient } from "@/lib/geo";
import { gradientStore } from "@/store";
import { Mappable } from "@prisma/client";
import type { ChartEvent, ChartOptions } from "chart.js";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useRef, useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CHART_COLORS = ["#3b82f6", "#64748b", "#f43f5e"];

export default function GradientCdfChart({
  mappables,
}: {
  mappables: Mappable[];
}) {
  const chartRef = useRef<ChartJS<"line">>(null);
  const { setHoveredGradient } = gradientStore();
  const [isGradientLocked, setIsGradientLocked] = useState(false);

  // Compute gradients and get range
  const gradients = mappables.map((m) =>
    computeGradient(m.polyline.coordinates)
  );

  const allGradients = gradients.flat();
  const gradientMin = Math.min(...allGradients);
  const gradientMax = Math.max(...allGradients);
  const xAxisRange = Array.from(
    { length: Math.round((gradientMax - gradientMin) / 0.001) + 1 },
    (_, i) => parseFloat((gradientMin + i * 0.001).toFixed(3))
  );

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

  const initialOptions: ChartOptions<"line"> = {
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
      mode: "index" as const,
      intersect: false,
    },
    onHover: (event: ChartEvent, elements: any[], chart: ChartJS) => {
      if (!event?.native || !chart?.chartArea) {
        if (!isGradientLocked) setHoveredGradient(null);
        return;
      }

      if (isGradientLocked) return;

      const rect = (
        event.native.target as HTMLCanvasElement
      ).getBoundingClientRect();
      const x = (event.native as MouseEvent).clientX - rect.left;
      const xAxis = chart.scales.x;

      if (x >= xAxis.left && x <= xAxis.right) {
        const value = xAxis.getValueForPixel(x);
        setHoveredGradient(value ?? null);
      } else {
        setHoveredGradient(null);
      }
    },
    onClick: (event: ChartEvent, elements: any[], chart: ChartJS) => {
      if (!event?.native || !chart?.chartArea) return;

      const rect = (
        event.native.target as HTMLCanvasElement
      ).getBoundingClientRect();
      const x = (event.native as MouseEvent).clientX - rect.left;
      const xAxis = chart.scales.x;

      if (x >= xAxis.left && x <= xAxis.right) {
        const value = xAxis.getValueForPixel(x);
        setHoveredGradient(value);
        setIsGradientLocked(true);
      }
    },
  };

  return (
    <div
      className="w-full h-full p-4"
      onMouseLeave={() => {
        setIsGradientLocked(false);
      }}
    >
      <Line ref={chartRef} data={initialData} options={initialOptions} />
    </div>
  );
}
