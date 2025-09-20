'use client';

import { COLORS } from '@/lib/colors';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BarChart({ data, options, title, height = 300 }) {
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
          color: '#FFFFFF',
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#FFFFFF',
      },
      tooltip: {
        backgroundColor: '#1E1E1E',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#F4CE05',
        borderWidth: 1,
      },
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
          color: 'rgba(255,255,255,0.7)',
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(244,206,5,0.3)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: 'rgba(255,255,255,0.7)',
        },
        beginAtZero: true,
      },
    },
    ...options,
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={defaultOptions} />
    </div>
  );
}
