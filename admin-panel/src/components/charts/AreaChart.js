'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function AreaChart({ data, options, title, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
      },
      filler: {
        propagate: false,
      },
    },
    interaction: {
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0,
        hoverRadius: 6,
      },
    },
    ...options,
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={defaultOptions} />
    </div>
  );
}
