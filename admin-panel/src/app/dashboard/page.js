'use client';

import { useState, useEffect } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import BarChart from '../../components/charts/BarChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import AreaChart from '../../components/charts/AreaChart';
import { COLORS } from '../../constants/colors';

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
        <div className="flex items-center justify-center h-64" style={{ backgroundColor: COLORS.BACKGROUND }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto" style={{ borderColor: COLORS.PRIMARY }}></div>
            <p className="mt-4 font-medium" style={{ color: COLORS.PRIMARY }}>Loading pet analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64" style={{ backgroundColor: COLORS.BACKGROUND }}>
          <div className="text-center">
            <div className="text-xl mb-4" style={{ color: COLORS.ACCENT }}>⚠️ {error}</div>
            <button
              onClick={fetchDashboardStats}
              className="px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-300"
              style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.SECONDARY }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = COLORS.PRIMARY_DARK;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = COLORS.PRIMARY;
              }}
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
      <div className="p-6 space-y-8 min-h-screen" style={{ backgroundColor: COLORS.BACKGROUND }}>
        {/* Streamlined Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.TEXT }}>🐾 Pet Analytics Dashboard</h1>
            <p style={{ color: COLORS.TEXT_MUTED }}>Monitor your pet community's growth and engagement</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 rounded-xl shadow-sm" style={{ backgroundColor: COLORS.BACKGROUND_CARD, border: `1px solid ${COLORS.BORDER_MUTED}` }}>
              <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Last Updated:</span>
              <span className="text-sm font-bold ml-2" style={{ color: COLORS.PRIMARY }}>{new Date().toLocaleTimeString()}</span>
            </div>
            <button
              onClick={fetchDashboardStats}
              className="px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center"
              style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.SECONDARY }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = COLORS.PRIMARY_DARK;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = COLORS.PRIMARY;
              }}
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
            variant="primary"
            subtitle="Pet lovers"
          />
          <StatsCard
            title="Active Users"
            value={stats.overview?.activeUsers || 0}
            icon="🟢"
            trend={+8}
            variant="success"
            subtitle="This month"
          />
          <StatsCard
            title="Total Posts"
            value={stats.overview?.totalPosts || 0}
            icon="📝"
            trend={+15}
            variant="accent"
            subtitle="Pet moments"
          />
          <StatsCard
            title="PetTokens"
            value={stats.overview?.totalTokenTransactions || 0}
            icon="🪙"
            trend={+5}
            variant="warning"
            subtitle="Transactions"
          />
          <StatsCard
            title="Referrals"
            value={stats.overview?.totalReferrals || 0}
            icon="🔗"
            trend={+20}
            variant="primary"
            subtitle="New members"
          />
        </div>

        {/* Essential Charts Grid - Simplified */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: COLORS.BACKGROUND_CARD, border: `1px solid ${COLORS.BORDER_MUTED}` }}>
            <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: COLORS.TEXT }}>
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
          <div className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: COLORS.BACKGROUND_CARD, border: `1px solid ${COLORS.BORDER_MUTED}` }}>
            <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: COLORS.TEXT }}>
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
          <div className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: COLORS.BACKGROUND_CARD, border: `1px solid ${COLORS.BORDER_MUTED}` }}>
            <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: COLORS.TEXT }}>
              ✅ User Verification Status
            </h3>
            {getUserVerificationChartData() && (
              <DoughnutChart
                data={getUserVerificationChartData()}
                height={300}
              />
            )}
          </div>

          {/* Quick Stats Summary */}
          <div className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: COLORS.BACKGROUND_CARD, border: `1px solid ${COLORS.BORDER_MUTED}` }}>
            <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: COLORS.TEXT }}>
              📊 Quick Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: `${COLORS.PRIMARY}20` }}>
                <span className="font-medium" style={{ color: COLORS.TEXT }}>💬 Total Comments</span>
                <span className="font-bold text-lg" style={{ color: COLORS.PRIMARY }}>{stats.overview?.totalComments || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: `${COLORS.EMERALD_500}20` }}>
                <span className="font-medium" style={{ color: COLORS.TEXT }}>❤️ Total Likes</span>
                <span className="font-bold text-lg" style={{ color: COLORS.EMERALD_500 }}>{stats.overview?.totalLikes || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: `${COLORS.BLUE_500}20` }}>
                <span className="font-medium" style={{ color: COLORS.TEXT }}>� Total Follows</span>
                <span className="font-bold text-lg" style={{ color: COLORS.BLUE_500 }}>{stats.overview?.totalFollows || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: `${COLORS.AMBER_500}20` }}>
                <span className="font-medium" style={{ color: COLORS.TEXT }}>🐾 Pet Listings</span>
                <span className="font-bold text-lg" style={{ color: COLORS.AMBER_500 }}>{stats.overview?.totalPetListings || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="p-6 rounded-xl shadow-lg" style={{ backgroundColor: COLORS.BACKGROUND_CARD, border: `1px solid ${COLORS.BORDER_MUTED}` }}>
            <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: COLORS.TEXT }}>
              🆕 Recent Pet Lovers
            </h3>
            <div className="space-y-3">
              {stats.users?.recent?.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: COLORS.NEUTRAL_800, border: `1px solid ${COLORS.BORDER_MUTED}` }}>
                  <div>
                    <div className="font-semibold" style={{ color: COLORS.TEXT }}>{user.fullName}</div>
                    <div className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold`} style={{
                      backgroundColor: user.emailVerify ? `${COLORS.EMERALD_500}20` : `${COLORS.ACCENT}20`,
                      color: user.emailVerify ? COLORS.EMERALD_500 : COLORS.ACCENT,
                      border: `1px solid ${user.emailVerify ? COLORS.EMERALD_500 : COLORS.ACCENT}`
                    }}>
                      {user.emailVerify ? '✅ Verified' : '⏳ Pending'}
                    </div>
                    <div className="text-sm mt-1 font-medium" style={{ color: COLORS.TEXT_MUTED }}>
                      {format(parseISO(user.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users by Tokens */}
          <div className="p-6 rounded-xl shadow-lg" style={{ backgroundColor: COLORS.BACKGROUND_CARD, border: `1px solid ${COLORS.BORDER_MUTED}` }}>
            <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: COLORS.TEXT }}>
              🏆 Top PetToken Earners
            </h3>
            <div className="space-y-3">
              {stats.users?.topByTokens?.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: COLORS.NEUTRAL_800, border: `1px solid ${COLORS.BORDER_MUTED}` }}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3`} style={{
                      backgroundColor: index === 0 ? COLORS.PRIMARY :
                                     index === 1 ? COLORS.GRAY_400 :
                                     index === 2 ? COLORS.AMBER_500 :
                                     COLORS.NEUTRAL_600,
                      color: COLORS.SECONDARY
                    }}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: COLORS.TEXT }}>{user.fullName}</div>
                      <div className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>@{user.username}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg" style={{ color: COLORS.PRIMARY }}>{user.tokens} 🪙</div>
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
