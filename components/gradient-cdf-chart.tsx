import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { computeCdf, computeGradient } from '@/lib/geo';
import { StravaRoute } from '@prisma/client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GradientCdfChart = ({ selectedRoute1, selectedRoute2 }: { routes: { StravaRoute, StravaRoute } }) => {
  const [cdf1, setCdf1] = useState([]);
  const [cdf2, setCdf2] = useState([]);

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
        label: selectedRoute1.name, // Use route name for Course 1
        data: cdf1.map(point => point.y),
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
        pointRadius: 0,
      },
      {
        label: selectedRoute2.name, // Use route name for Course 2
        data: cdf2.map(point => point.y),
        borderColor: 'rgba(153,102,255,1)',
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    animation: false,
    plugins: {
      title: {
        display: true,
        text: 'Cumulative Density Function of Gradient',
      },
      legend: {
        display: true,
        position: 'top',
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

export default GradientCdfChart;
