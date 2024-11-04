import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { computeCdf, computeGradient } from '@/lib/geo';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function GradientCdfChart({ selectedRoute1, selectedRoute2 }) {
  const [cdf1, setCdf1] = useState<number[]>([]);
  const [cdf2, setCdf2] = useState<number[]>([]);

  const xAxisRange = Array.from({ length: 61 }, (_, i) => parseFloat((-0.2 + i * 0.01).toFixed(2)));

  useEffect(() => {
    if (selectedRoute1 && selectedRoute2) {

      const polyline1 = selectedRoute1.polyline.features[0].geometry;
      const polyline2 = selectedRoute2.polyline.features[0].geometry;
      const gradients1 = computeGradient(polyline1);
      const gradients2 = computeGradient(polyline2);

      setCdf1(computeCdf(gradients1, xAxisRange));
      setCdf2(computeCdf(gradients2, xAxisRange));
    }
  }, [selectedRoute1, selectedRoute2]);

  if (!selectedRoute1 || !selectedRoute2) {
    return null;
  }

  const data = {
    labels: xAxisRange,
    datasets: [
      {
        label: selectedRoute1.name, 
        data: cdf1,
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
        pointRadius: 0,
      },
      {
        label: selectedRoute2.name,
        data: cdf2,
        borderColor: 'rgba(153,102,255,1)',
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
        text: 'Cumulative Density Function of Gradient',
      },
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    hover: {
      mode: 'index' as const,
      intersect: false,
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'linear' as const,
        ticks: {
          stepSize: 0.01,
          min: -0.2,
          max: 0.2,
          callback: function (value) {
            return (value * 100).toFixed(0) + '%'; // Format as percentage with 2 decimal places
          },
        },
        title: {
          display: true,
          text: 'Gradient',
        },
      },
      y: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'CDF',
        },
        ticks: {
          callback: function (value) {
            return (value * 100).toFixed(0) + '%'; // Format as percentage with 2 decimal places
          },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};
