'use client';

import { useState, useEffect } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import BarChart from '../../components/charts/BarChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import AreaChart from '../../components/charts/AreaChart';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setError(null);
      } else {
        setError('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate chart colors
  const getChartColors = (count) => {
    const colors = [
      'rgba(251, 146, 60, 0.8)',   // Orange
      'rgba(245, 158, 11, 0.8)',   // Amber  
      'rgba(34, 197, 94, 0.8)',    // Green
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(139, 92, 246, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(6, 182, 212, 0.8)',    // Cyan
      'rgba(16, 185, 129, 0.8)',   // Emerald
    ];
    return colors.slice(0, count);
  };

  // Prepare user growth chart data
  const getUserGrowthChartData = () => {
    if (!stats?.users?.growth) return null;

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
      const data = stats.users.growth.find(item => item._id === date);
      return {
        date: format(subDays(new Date(), 29 - i), 'MMM dd'),
        count: data ? data.count : 0
      };
    });

    return {
      labels: last30Days.map(day => day.date),
      datasets: [
        {
          label: 'New Pet Lovers',
          data: last30Days.map(day => day.count),
          borderColor: 'rgba(251, 146, 60, 1)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  // Prepare posts growth chart data
  const getPostsGrowthChartData = () => {
    if (!stats?.posts?.growth) return null;

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
      const data = stats.posts.growth.find(item => item._id === date);
      return {
        date: format(subDays(new Date(), 29 - i), 'MMM dd'),
        count: data ? data.count : 0
      };
    });

    return {
      labels: last30Days.map(day => day.date),
      datasets: [
        {
          label: 'New Pet Posts',
          data: last30Days.map(day => day.count),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare user verification status chart
  const getUserVerificationChartData = () => {
    if (!stats?.users?.verificationStatus) return null;

    const labels = stats.users.verificationStatus.map(item => 
      item._id ? 'Verified' : 'Unverified'
    );
    const data = stats.users.verificationStatus.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-orange-600 font-medium">Loading pet analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
            <button
              onClick={fetchDashboardStats}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 font-medium shadow-lg"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) return null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen">
        {/* Streamlined Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🐾 Pet Analytics Dashboard</h1>
            <p className="text-gray-600">Monitor your pet community's growth and engagement</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-orange-200 shadow-sm">
              <span className="text-sm text-gray-500">Last Updated:</span>
              <span className="text-sm font-bold text-orange-600 ml-2">{new Date().toLocaleTimeString()}</span>
            </div>
            <button
              onClick={fetchDashboardStats}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center"
            >
              🔄 <span className="ml-1">Refresh</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.overview?.totalUsers || 0}
            icon="👥"
            trend={+12}
            color="orange"
            subtitle="Pet lovers"
          />
          <StatsCard
            title="Active Users"
            value={stats.overview?.activeUsers || 0}
            icon="🟢"
            trend={+8}
            color="green"
            subtitle="This month"
          />
          <StatsCard
            title="Total Posts"
            value={stats.overview?.totalPosts || 0}
            icon="📝"
            trend={+15}
            color="purple"
            subtitle="Pet moments"
          />
          <StatsCard
            title="PetTokens"
            value={stats.overview?.totalTokenTransactions || 0}
            icon="🪙"
            trend={+5}
            color="yellow"
            subtitle="Transactions"
          />
          <StatsCard
            title="Referrals"
            value={stats.overview?.totalReferrals || 0}
            icon="🔗"
            trend={+20}
            color="red"
            subtitle="New members"
          />
        </div>

        {/* Essential Charts Grid - Simplified */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              📈 Pet Lover Growth (Last 30 Days)
            </h3>
            {getUserGrowthChartData() && (
              <AreaChart
                data={getUserGrowthChartData()}
                height={300}
              />
            )}
          </div>

          {/* Posts Growth Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              📱 Pet Posts Created (Last 30 Days)
            </h3>
            {getPostsGrowthChartData() && (
              <BarChart
                data={getPostsGrowthChartData()}
                height={300}
              />
            )}
          </div>

    
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              🆕 Recent Pet Lovers
            </h3>
            <div className="space-y-3">
              {stats.users?.recent?.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                  <div>
                    <div className="font-semibold text-gray-800">{user.fullName}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      user.emailVerify ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {user.emailVerify ? '✅ Verified' : '⏳ Pending'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 font-medium">
                      {format(parseISO(user.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users by Tokens */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              🏆 Top PetToken Earners
            </h3>
            <div className="space-y-3">
              {stats.users?.topByTokens?.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                      'bg-gradient-to-r from-orange-500 to-amber-500'
                    }`}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{user.fullName}</div>
                      <div className="text-sm text-gray-600">@{user.username}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600 text-lg">{user.tokens} 🪙</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
