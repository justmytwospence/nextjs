"use client";

import { computeDistanceMiles, computeGradient } from "@/lib/geo";
import type { HoverIndexStore } from "@/store";
import {
  hoverIndexStore as defaultHoverIndexStore,
  gradientStore,
} from "@/store";
import { Mappable } from "@prisma/client";
import type { ChartData, ChartOptions } from "chart.js";
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

export default function ElevationChart({
  mappable,
  hoverIndexStore = defaultHoverIndexStore,
}: {
  mappable: Mappable;
  hoverIndexStore?: HoverIndexStore;
}) {
  const chartRef = useRef<ChartJS<"line">>(null);
  const { setHoverIndex } = hoverIndexStore();
  const { hoveredGradient } = gradientStore();

  // Compute values immediately
  const computedDistances = computeDistanceMiles(mappable.polyline.coordinates);
  const computedGradients = computeGradient(mappable.polyline.coordinates);
  const elevation = mappable.polyline.coordinates.map(
    (point) => point[2] * 3.28084
  );
  const elevationMin = Math.min(...elevation);
  const elevationMax = Math.max(...elevation);
  const elevationPadding = (elevationMax - elevationMin) * 0.1;
  const gradientMin = Math.max(Math.min(...computedGradients), -0.3);
  const gradientMax = Math.min(Math.max(...computedGradients), 0.3);

  // Initial chart configuration
  const initialData: ChartData<"line"> = {
    labels: computedDistances,
    datasets: [
      {
        label: "Elevation (ft)",
        data: elevation,
        borderColor: "black",
        backgroundColor: "transparent",
        yAxisID: "elevation",
        borderWidth: 2,
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
            return hoveredGradient && gradientValue >= hoveredGradient
              ? "rgba(255, 0, 0, 0.5)"
              : "rgba(128, 128, 128, 0.5)";
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
        min: Math.floor(elevationMin - elevationPadding),
        max: Math.ceil(elevationMax + elevationPadding),
        position: "left" as const,
        type: "linear" as const,
        title: {
          display: true,
          text: "Elevation (ft)",
        },
        ticks: {
          stepSize: 100,
          callback: function (value) {
            return Math.round(Number(value)).toLocaleString();
          },
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
    interface HoverIndexState {
      hoverIndex: number;
    }

    interface ChartRef {
      current: ChartJS<"line"> | null;
    }

    const unsubHoverIndex = hoverIndexStore.subscribe((state) => {
      if (!chartRef.current) return;
      const chart = chartRef.current as ChartJS<"line">;
      if (state.hoverIndex >= 0) {
        chart.setActiveElements([
          {
            datasetIndex: 0,
            index: state.hoverIndex,
          },
        ]);
        chart.tooltip?.setActiveElements(
          [
            {
              datasetIndex: 0,
              index: state.hoverIndex,
            },
          ],
          {
            x: chart.scales.x.getPixelForValue(
              computedDistances[state.hoverIndex]
            ),
            y: chart.scales.elevation.getPixelForValue(
              elevation[state.hoverIndex]
            ),
          }
        );
      } else {
        chart.setActiveElements([]);
        chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
      }
    });
    return unsubHoverIndex;
  }, [computedDistances, elevation, hoverIndexStore]);

  return <Line ref={chartRef} data={initialData} options={initialOptions} />;
}
