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
import { useEffect, useRef } from "react";
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
  const { setHoverIndex } = useStore();

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
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "transparent",
        yAxisID: "elevation",
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: "black",
        tension: 0.1,
      },
      {
        label: "Gradient (%)",
        data: computedGradients,
        borderColor: "transparent",
        yAxisID: "gradient",
        pointRadius: 0,
        fill: true,
        borderWidth: 0,
        segment: {
          backgroundColor: (ctx) => {
            const gradientValue = ctx.p0.parsed.y;
            return gradientValue >= 0
              ? "rgba(255, 0, 0, 0.4)"
              : "rgba(128, 128, 128, 0.4)";
          },
        },
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
            return Number(value).toFixed(1);
          },
        },
        title: {
          display: true,
          text: "Miles",
        },
      },
      elevation: {
        display: true,
        min: 0,
        position: "left" as const,
        type: "linear" as const,
        title: {
          display: true,
          text: "Elevation (ft)",
        },
        ticks: {
          stepSize: 500,
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
            return (Number(value) * 100).toFixed(0) + "%";
          },
        },
        grid: {
          drawOnChartArea: true,
          drawTicks: true,
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
    interaction: {
      mode: "index",
      intersect: false,
    },
    onHover: (event, elements, chart) => {
      if (!event?.native || !chart?.chartArea) {
        setHoverIndex(-1);
        return;
      }

      const elementsAtEvent = chart.getElementsAtEventForMode(
        event.native,
        "index",
        { intersect: false },
        false
      );

      if (elementsAtEvent.length > 0) {
        setHoverIndex(elementsAtEvent[0].index);
      } else {
        setHoverIndex(-1);
      }
    },
  };

  // hoverIndex
  useEffect(() => {
    const unsubHoverIndex = useStore.subscribe(
      (state) => state.hoverIndex,
      (hoverIndex) => {
        if (!chartRef.current) return;
        const chart = chartRef.current;
        if (hoverIndex >= 0) {
          chart.setActiveElements([
            {
              datasetIndex: 0,
              index: hoverIndex,
            },
          ]);
          chart.tooltip?.setActiveElements(
            [
              {
                datasetIndex: 0,
                index: hoverIndex,
              },
            ],
            {
              x: chart.scales.x.getPixelForValue(computedDistances[hoverIndex]),
              y: chart.scales.elevation.getPixelForValue(elevation[hoverIndex]),
            }
          );
        } else {
          chart.setActiveElements([]);
          chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
        }
      }
    );
    return unsubHoverIndex;
  }, [computedDistances, elevation]);

  // hoveredGradient
  useEffect(() => {
    const unsubHoveredGradient = useStore.subscribe(
      (state) => state.hoveredGradient,
      (hoveredGradient) => {
        if (!chartRef.current) return;

        // Update the gradient segment colors
        chartRef.current.data.datasets[1].segment = {
          backgroundColor: (ctx) => {
            if (hoveredGradient) {
              const gradientValue = ctx.p0.parsed.y;
              return gradientValue >= hoveredGradient
                ? "rgba(255, 0, 0, 0.4)"
                : "rgba(128, 128, 128, 0.4)";
            }
          },
        };

        console.log(chartRef.current.data.datasets[1].label);
        chartRef.current.data.datasets[1].label = "foobar";
        console.log(chartRef.current.data.datasets[1].label);
        chartRef.current.update();
        console.log(chartRef.current.data.datasets[1].label);
      }
    );
    return unsubHoveredGradient;
  }, []);

  return <Line ref={chartRef} data={initialData} options={initialOptions} />;
}
