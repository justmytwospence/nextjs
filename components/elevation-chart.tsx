"use client";

import { computeDistanceMiles, computeGradient } from "@/lib/geo";
import { useStore } from "@/store";
import { Mappable } from "@prisma/client";
import type { Chart, ChartData, ChartOptions } from "chart.js";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export default function ElevationChart({ mappable }: { mappable: Mappable }) {
  const chartRef = useRef<ChartJS<"line">>(null);
  const setHoverIndex = useStore((state) => state.setHoverIndex);

  // Compute values immediately
  const computedDistances = computeDistanceMiles(mappable.polyline.coordinates);
  const computedGradients = computeGradient(mappable.polyline.coordinates);
  const elevation = mappable.polyline.coordinates.map(
    (point) => point[2] * 3.28084
  );
  const gradientMin = Math.max(Math.min(...computedGradients), -0.3);
  const gradientMax = Math.min(Math.max(...computedGradients), 0.3);

  // Initial chart configuration
  const initialData: ChartData<"line"> = {
    labels: computedDistances,
    datasets: [
      {
        label: "Elevation (ft)",
        data: elevation,
        borderColor: "text-blue-500",
        backgroundColor: "text-blue-500/20",
        yAxisID: "elevation",
        pointBackgroundColor: "black",
      },
      {
        label: "Gradient (%)",
        data: computedGradients,
        borderColor: "transparent",
        yAxisID: "gradient",
        pointRadius: 0,
        fill: true,
        borderWidth: 0,
        segment: { borderColor: "transparent" },
      },
    ],
  };

  const initialOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },

    scales: {
      x: {
        type: "linear" as const,
        min: 0,
        max: Math.max(...computedDistances),
        ticks: {
          stepSize: 1,
          callback: function (value) {
            return value.toFixed(1);
          },
        },
        title: {
          display: true,
          text: "Miles",
        },
      },
      elevation: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Elevation (ft)",
        },
        ticks: {
          stepSize: 500,
          min: 0,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      gradient: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        min: gradientMin,
        max: gradientMax,
        title: {
          display: true,
          text: "Gradient (%)",
        },
        ticks: {
          stepSize: 0.01,
          callback: function (value) {
            return (value * 100).toFixed(0) + "%";
          },
        },
        grid: {
          drawOnChartArea: true,
          drawTicks: true,
          drawBorder: false,
        },
      },
    },

    plugins: {
      title: {
        display: true,
        text: "Elevation and Gradient Profile",
      },
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          title: function (context) {
            const label = context[0]?.label;
            return `Distance: ${parseFloat(label).toFixed(1)} miles`;
          },
          label: function (context) {
            const label = context.dataset.label || "";
            if (label === "Elevation (ft)") {
              return `Elevation: ${Math.round(
                context.parsed.y
              ).toLocaleString()} ft`;
            } else if (label === "Gradient (%)") {
              return `Gradient: ${(context.parsed.y * 100).toFixed(1)}%`;
            }
            return label;
          },
        },
      },
    },

    hover: {
      mode: "index" as const,
      intersect: false,
    },
    interaction: {
      intersect: false,
    },
    onHover: (event, elements, chart) => {
      if (!event?.native || !chart?.chartArea) {
        setHoverIndex(-1);
        return;
      }

      const elementsAtEvent = chart.getElementsAtEventForMode(
        event.native,
        "nearest",
        { intersect: false },
        false
      );

      if (elementsAtEvent.length > 0) {
        console.log(`Hovering over ${elementsAtEvent[0].index} on chart`);
        setHoverIndex(elementsAtEvent[0].index);
      } else {
        setHoverIndex(-1);
      }
    },
  };

  // hoverIndex
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    console.log("Subscribing to hoverIndex on chart");
    const unsub = useStore.subscribe(
      (state) => state.hoverIndex,
      (hoverIndex) => {
        console.log(`Receiving hoverIndex: ${hoverIndex} on chart`);
        chart.data.datasets[0].pointRadius = (ctx) =>
          ctx.dataIndex === hoverIndex ? 6 : 0;
        chart.update("none");
      }
    );

    return () => unsub();
  }, []);

  // hoveredGradient
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const unsub = useStore.subscribe(
      (state) => state.hoveredGradient,
      (hoveredGradient) => {
        console.log(hoveredGradient);
        chart.data.datasets[1].backgroundColor = (ctx) => {
          const gradientValue = computedGradients[ctx.dataIndex];
          return hoveredGradient !== null && gradientValue >= hoveredGradient
            ? "rgba(255, 0, 0, 0.2)"
            : "rgba(128, 128, 128, 0.2)";
        };
        chart.update("none");
      }
    );

    return () => unsub();
  }, []);

  return <Line ref={chartRef} data={initialData} options={initialOptions} />;
}
