'use client';

import { COLORS } from '@/lib/colors';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LineChart({ data, options, title, height = 300 }) {
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
        mode: 'index',
        intersect: false,
        backgroundColor: '#1E1E1E',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#F4CE05',
        borderWidth: 1,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
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
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
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
