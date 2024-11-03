"use client";

import { computeDistanceMiles, computeGradient } from '../lib/geo';
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Spinner } from '@/components/ui/spinner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

export default function ElevationChart({ route, maxGradient }) {
  if (!route) {
    return <Spinner className="w-6 h-6 text-blue-500" />;
  }

  const polyline = route.polyline.features[0].geometry;

  const distance = computeDistanceMiles(polyline);
  const elevationData = polyline.coordinates.map(point => point[2] * 3.28084); // Convert meters to feet for elevation
  const gradientData = computeGradient(polyline);

  const data = {
    labels: distance,
    datasets: [
      {
        label: 'Elevation (ft)',
        data: elevationData,
        borderColor: 'blue',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'elevation',
        pointRadius: 0
      },
      {
        label: 'Gradient (%)',
        data: gradientData,
        borderColor: 'gray',
        backgroundColor: 'rgba(128, 128, 128, 0.5)', // Transparent gray
        yAxisID: 'gradient',
        pointRadius: 0,
        fill: true,
        segment: {
          borderColor: ctx => ctx.p0.parsed.y > maxGradient ? 'red' : 'gray',
          backgroundColor: ctx => ctx.p0.parsed.y > maxGradient ? 'rgba(255, 0, 0, 0.5)' : 'rgba(128, 128, 128, 0.5)',
        },
      },
    ],
  };

  const options = {
    responsive: true,
    animation: false,
    plugins: {
      title: {
        display: true,
        text: 'Elevation and Gradient Profile',
      },
    },
    hover: {
      mode: 'index',
      intersect: false,
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'linear',
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
        type: 'linear',
        display: true,
        position: 'left',
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
        type: 'linear',
        display: true,
        position: 'right',
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
  };

  return <Line data={data} options={options} />;
};
