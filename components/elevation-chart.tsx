"use client";

import { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { computeDistanceMiles, computeGradient } from '../lib/geo';
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Title, Tooltip, ScaleOptions } from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Spinner } from '@/components/ui/spinner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

export default function ElevationChart({ route, maxGradient }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!route) {
    return <Spinner className="w-6 h-6 text-blue-500" />;
  }

  const polyline = route.polyline.features[0].geometry;

  const distance = computeDistanceMiles(polyline);
  const elevationData = polyline.coordinates.map(point => point[2] * 3.28084); 
  const gradientData = computeGradient(polyline);

  const createChartData = (isLarge = false) => ({
    labels: distance,
    datasets: [
      {
        label: 'Elevation (ft)',
        data: elevationData,
        borderColor: 'blue',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'elevation',
        pointRadius: isLarge ? 1 : 0,
        borderWidth: isLarge ? 2 : 1
      },
      {
        label: 'Gradient (%)',
        data: gradientData,
        borderColor: 'gray',
        backgroundColor: 'rgba(128, 128, 128, 0.5)', // Transparent gray
        yAxisID: 'gradient',
        pointRadius: isLarge ? 1 : 0,
        fill: true,
        borderWidth: isLarge ? 2 : 1,
        segment: {
          borderColor: ctx => ctx.p0.parsed.y > maxGradient ? 'red' : 'gray',
          backgroundColor: ctx => ctx.p0.parsed.y > maxGradient ? 'rgba(255, 0, 0, 0.5)' : 'rgba(128, 128, 128, 0.5)',
        },
      },
    ],
  });

  const gradientMin = Math.max(Math.min(...gradientData), -0.3);
  const gradientMax = Math.min(Math.max(...gradientData), 0.3);

  const createChartOptions = (isLarge = false) => ({
    responsive: true,
    animation: {
      duration: 0 // Set duration to 0 to disable animation
    },
    plugins: {
      title: {
        display: true,
        text: 'Elevation and Gradient Profile',
      },
    },
    hover: {
      intersect: false,
    },
    interaction: {
      intersect: false,
    },
    scales: {
      x: {
        type: 'linear' as const,
        min: 0,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Miles'
        },
      },
      elevation: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Elevation (ft)',
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
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: gradientMin,
        max: gradientMax,
        title: {
          display: true,
          text: 'Gradient (%)',
        },
        ticks: {
          stepSize: 0.01,
          callback: function (value) {
            return (value * 100).toFixed(0) + '%'; // Format as percentage
          },
        },
        grid: {
          drawOnChartArea: true,
          drawTicks: true,
          drawBorder: false,
        },
      },
    },
    maintainAspectRatio: !isLarge,
    ...(!isLarge && { aspectRatio: 2 }),
  });

  return (
    <>
      <div 
        onClick={() => setDialogOpen(true)} 
        className="cursor-pointer hover:opacity-90 transition-opacity"
      >
        <Line data={createChartData()} options={createChartOptions()} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
