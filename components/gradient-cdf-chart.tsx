import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { computeCdf, computeGradient } from "@/lib/geo";
import { Mappable } from "@prisma/client";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Move calculation outside component
const xAxisRange = Array.from({ length: 61 }, (_, i) => parseFloat((-0.2 + i * 0.01).toFixed(2)));

export default function GradientCdfChart({
  selectedRoute1,
  selectedRoute2
}: {
  selectedRoute1: Mappable | null,
  selectedRoute2: Mappable | null
}) {
  const [gradients1, setGradients1] = useState<number[]>([]);
  const [gradients2, setGradients2] = useState<number[]>([]);
  const [cdf1, setCdf1] = useState<number[]>([]);
  const [cdf2, setCdf2] = useState<number[]>([]);

  // First useEffect to calculate gradients
  useEffect(() => {
    if (selectedRoute1 && selectedRoute2) {
      const polyline1 = selectedRoute1.polyline || selectedRoute1.summaryPolyline;
      const geom1 = polyline1.features[0].geometry;
      const polyline2 = selectedRoute2.polyline || selectedRoute2.summaryPolyline;
      const geom2 = polyline2.features[0].geometry;

      const newGradients1 = computeGradient(geom1);
      const newGradients2 = computeGradient(geom2);

      setGradients1(newGradients1);
      setGradients2(newGradients2);

      // Calculate CDFs immediately after setting gradients
      setCdf1(computeCdf(newGradients1, xAxisRange));
      setCdf2(computeCdf(newGradients2, xAxisRange));
    }
  }, [selectedRoute1, selectedRoute2]);

  // Remove second useEffect as it's no longer needed

  if (!selectedRoute1 || !selectedRoute2) {
    return null;
  }

  const gradientMin = Math.max(Math.min(...[...gradients1, ...gradients2]), -0.3);
  const gradientMax = Math.min(Math.max(...[...gradients1, ...gradients2]), 0.3);

  const data = {
    labels: xAxisRange,
    datasets: [
      {
        label: selectedRoute1.name,
        data: cdf1,
        borderColor: "rgba(75,192,192,1)",
        fill: false,
        pointRadius: 0,
      },
      {
        label: selectedRoute2.name,
        data: cdf2,
        borderColor: "rgba(153,102,255,1)",
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    animation: {
      duration: 0 // general animation time
    },
    plugins: {
      title: {
        display: true,
        text: "Cumulative Density Function of Gradient",
      },
      legend: {
        display: true,
        position: "top" as const,
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

  return <Line data={data} options={options} />;
};
