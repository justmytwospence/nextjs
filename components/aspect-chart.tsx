import { ArcElement, Chart as ChartJS, Legend, RadialLinearScale, Tooltip } from 'chart.js';
import type { FeatureCollection } from 'geojson';
import { useMemo } from 'react';
import { PolarArea } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

export interface AspectChartProps {
  aspectPoints: FeatureCollection;

}

export function AspectChart({ aspectPoints }: AspectChartProps) {
  const aspects = aspectPoints.features.map(feature => feature.properties?.aspect);
  
  const chartData = useMemo(() => {
    const aspectCounts = aspects.reduce((acc, aspect) => {
      if (aspect) {
        acc[aspect] = (acc[aspect] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const aspectMap = {
      N: 'North',
      NE: 'Northeast',
      E: 'East',
      SE: 'Southeast',
      S: 'South',
      SW: 'Southwest',
      W: 'West',
      NW: 'Northwest'
    };

    const counts = directions.map(dir => aspectCounts[aspectMap[dir as keyof typeof aspectMap]] || 0);
    const total = counts.reduce((sum, count) => sum + count, 0);

    return {
      labels: directions,
      datasets: [{
        data: counts,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(201, 203, 207, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderWidth: 1
      }]
    };
  }, [aspects]);

  const options = {
    responsive: true,
    scales: {
      r: {
        startAngle: -22.5,
        ticks: {
          display: true,
          callback: function(value: number) {
            return `${Math.round((value / this.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0)) * 100)}%`;
          },
          backdropColor: 'transparent'  // Makes the background transparent
        },
        beginAtZero: true
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            const value = context.raw;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${percentage}%`;
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <PolarArea data={chartData} options={options} />
    </div>
  );
}
