"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Mappable } from "@prisma/client";
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
import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { computeDistanceMiles, computeGradient } from "@/lib/geo";

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
  maxGradient,
  onHover,
  hoverIndex = -1,
  gradients,
}: {
  mappable: Mappable;
  maxGradient: number;
  onHover: (index: number) => void;
  hoverIndex?: number;
  gradients: number[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!mappable) {
    return <Spinner className="w-6 h-6 text-[hsl(var(--chart-primary))]" />;
  }

  const distance = computeDistanceMiles(mappable.polyline);
  const elevationData = mappable.polyline.coordinates.map(
    (point) => point[2] * 3.28084
  );
  const gradientData = computeGradient(mappable.polyline);

  const createChartData = (isLarge = false) => ({
    labels: distance,
    datasets: [
      {
        label: "Elevation (ft)",
        data: elevationData,
        borderColor: "text-blue-500",
        backgroundColor: "text-blue-500/20",
        yAxisID: "elevation",
        pointRadius: (ctx) => (ctx.dataIndex === hoverIndex ? 6 : 0),
        pointBackgroundColor: "black",
        borderWidth: isLarge ? 2 : 1,
      },
      {
        label: "Gradient (%)",
        data: gradients,
        borderColor: "transparent", // Remove the border line
        backgroundColor: "rgba(128, 128, 128, 0.2)", // Make gradient area less transparent gray
        yAxisID: "gradient",
        pointRadius: 0,
        fill: true,
        borderWidth: 0, // Remove the border line
        segment: {
          borderColor: "transparent",
          backgroundColor: "rgba(128, 128, 128, 0.5)",
        },
      },
    ],
  });

  const gradientMin = Math.max(Math.min(...gradientData), -0.3);
  const gradientMax = Math.min(Math.max(...gradientData), 0.3);

  const createChartOptions = (isLarge = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Set duration to 0 to disable animation
    },
    plugins: {
      title: {
        display: true,
        text: "Elevation and Gradient Profile",
      },
      legend: {
        display: false, // Remove the legend
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
              return `Elevation: ${context.parsed.y.toFixed(0)} ft`;
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
    scales: {
      x: {
        type: "linear" as const,
        min: 0,
        max: Math.max(...distance),
        ticks: {
          stepSize: 1,
          callback: function (value) {
            return value.toFixed(1); // Format as one decimal point
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
          drawOnChartArea: false, // Disable grid lines for y1 axis
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
            return (value * 100).toFixed(0) + "%"; // Format as percentage
          },
        },
        grid: {
          drawOnChartArea: true,
          drawTicks: true,
          drawBorder: false,
        },
      },
    },
    onHover: (event, elements, chart) => {
      if (!event?.native || !chart?.chartArea) {
        onHover(-1);
        return;
      }

      const chartArea = chart.chartArea;
      const x = event.native.offsetX;
      const y = event.native.offsetY;

      if (
        x < chartArea.left ||
        x > chartArea.right ||
        y < chartArea.top ||
        y > chartArea.bottom
      ) {
        onHover(-1);
        return;
      }

      // Calculate relative x position within chart area
      const relativeX =
        (x - chartArea.left) / (chartArea.right - chartArea.left);
      const maxDistance = Math.max(...distance);
      const hoverDistance = relativeX * maxDistance;

      // Find closest point with bounds checking
      const index = distance.findIndex((d) => d >= hoverDistance);
      if (index >= 0 && index < mappable.polyline.coordinates.length) {
        onHover(index);
      } else {
        onHover(-1);
      }
    },
  });

  return (
    <>
      <div className="w-full h-full">
        <Line data={createChartData()} options={createChartOptions()} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTitle />
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-[1200px]">
          <div className="h-[600px]">
            <Line
              data={createChartData(true)}
              options={createChartOptions(true)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
