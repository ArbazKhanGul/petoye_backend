'use client';

import { useState, useEffect } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import LineChart from '../../components/charts/LineChart';
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

  // Prepare token distribution chart
  const getTokenDistributionChartData = () => {
    if (!stats?.tokens?.distribution) return null;

    const sortedData = stats.tokens.distribution.sort((a, b) => {
      const order = ['0-9', '10-99', '100-499', '500-999', '1000+'];
      return order.indexOf(a._id) - order.indexOf(b._id);
    });

    return {
      labels: sortedData.map(item => `${item._id} tokens`),
      datasets: [
        {
          data: sortedData.map(item => item.count),
          backgroundColor: getChartColors(sortedData.length),
          borderColor: getChartColors(sortedData.length).map(color => 
            color.replace('0.8', '1')
          ),
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare post engagement chart
  const getPostEngagementChartData = () => {
    if (!stats?.posts?.engagement) return null;

    return {
      labels: stats.posts.engagement.map(item => item._id),
      datasets: [
        {
          label: 'Pet Posts',
          data: stats.posts.engagement.map(item => item.count),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',    // Green for high engagement
            'rgba(245, 158, 11, 0.8)',   // Amber for medium engagement
            'rgba(239, 68, 68, 0.8)',    // Red for low engagement
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare activity by hour chart
  const getActivityByHourChartData = () => {
    if (!stats?.activity?.byHour) return null;

    const hourData = Array.from({ length: 24 }, (_, hour) => {
      const data = stats.activity.byHour.find(item => item._id === hour);
      return data ? data.count : 0;
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Active Pet Lovers',
          data: hourData,
          backgroundColor: 'rgba(251, 146, 60, 0.8)',
          borderColor: 'rgba(251, 146, 60, 1)',
          borderWidth: 3,
          tension: 0.4,
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
      <div className="p-6 space-y-6 bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🐾 Pet Analytics Dashboard</h1>
            <p className="text-gray-600">Monitor your pet community's growth and engagement</p>
          </div>
          <button
            onClick={fetchDashboardStats}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.overview?.totalUsers || 0}
            icon="👥"
            trend={+12}
            color="orange"
            subtitle="All registered pet lovers"
          />
          <StatsCard
            title="Active Users"
            value={stats.overview?.activeUsers || 0}
            icon="🟢"
            trend={+8}
            color="green"
            subtitle="Last 30 days"
          />
          <StatsCard
            title="Total Posts"
            value={stats.overview?.totalPosts || 0}
            icon="📝"
            trend={+15}
            color="purple"
            subtitle="Pet moments shared"
          />
          <StatsCard
            title="PetTokens"
            value={stats.overview?.totalTokenTransactions || 0}
            icon="🪙"
            trend={+5}
            color="yellow"
            subtitle="Total transactions"
          />
          <StatsCard
            title="Referrals"
            value={stats.overview?.totalReferrals || 0}
            icon="🔗"
            trend={+20}
            color="red"
            subtitle="Community growth"
          />
        </div>

        {/* Charts Grid */}
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

          {/* User Verification Status */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              ✅ User Verification Status
            </h3>
            {getUserVerificationChartData() && (
              <DoughnutChart
                data={getUserVerificationChartData()}
                height={300}
              />
            )}
          </div>

          {/* Token Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              🪙 PetToken Distribution
            </h3>
            {getTokenDistributionChartData() && (
              <DoughnutChart
                data={getTokenDistributionChartData()}
                height={300}
              />
            )}
          </div>

          {/* Post Engagement */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              ❤️ Post Engagement Levels
            </h3>
            {getPostEngagementChartData() && (
              <BarChart
                data={getPostEngagementChartData()}
                height={300}
              />
            )}
          </div>

          {/* Activity by Hour */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              ⏰ User Activity by Hour (Last 7 Days)
            </h3>
            {getActivityByHourChartData() && (
              <LineChart
                data={getActivityByHourChartData()}
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
