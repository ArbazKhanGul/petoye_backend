'use client';

import { COLORS } from '@/lib/colors';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DoughnutChart({ data, options, title, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12,
          },
          usePointStyle: true,
          padding: 20,
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
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
    cutout: '60%',
    ...options,
  };

  return (
    <div style={{ height }}>
      <Doughnut data={data} options={defaultOptions} />
    </div>
  );
}
