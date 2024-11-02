"use client";

import polyline from '@mapbox/polyline';
import * as turf from '@turf/turf';
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const ElevationChart = ({ stravaRoute, maxGradient }) => {
  if (!stravaRoute) {
    return <div>No data available</div>;
  }

  const summaryPolyline = polyline.toGeoJSON(stravaRoute.summaryPolyline);
  console.log(summaryPolyline)

  const distance = summaryPolyline.coordinates.reduce((acc, coord, index) => {
    if (index === 0) return [0];
    const from = turf.point([summaryPolyline.coordinates[index - 1][0], summaryPolyline.coordinates[index - 1][1]]);
    const to = turf.point([coord[0], coord[1]]);
    const distance = turf.distance(from, to);
    return [...acc, acc[index - 1] + distance];
  }, []).map(d => d.toFixed(2));
  console.log(distance)
  // Convert meters to feet for elevation
  const elevationData = summaryPolyline.coordinates.map(point => point.ele * 3.28084);
  console.log(elevationData)
  const gradientData = summaryPolyline.coordinates.map(point => point.gradient);
  console.log(gradientData)

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

export default ElevationChart;
