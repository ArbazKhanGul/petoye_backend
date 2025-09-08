'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [otpHistory, setOtpHistory] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        console.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtpHistory = async () => {
    setLoadingOtp(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/otp-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOtpHistory(data.otpHistory);
      }
    } catch (error) {
      console.error('Error fetching OTP history:', error);
    } finally {
      setLoadingOtp(false);
    }
  };

  const fetchActivityLogs = async () => {
    setLoadingActivity(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/activity-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data.activityLogs);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchSessionHistory = async () => {
    setLoadingSession(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/session-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionHistory(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
    } finally {
      setLoadingSession(false);
    }
  };

  const revokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Admin revoked session' }),
      });

      if (response.ok) {
        alert('Session revoked successfully');
        fetchSessionHistory();
      } else {
        alert('Failed to revoke session');
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      alert('Error revoking session');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'otp':
        if (otpHistory.length === 0) fetchOtpHistory();
        break;
      case 'activity':
        if (activityLogs.length === 0) fetchActivityLogs();
        break;
      case 'sessions':
        if (sessionHistory.length === 0) fetchSessionHistory();
        break;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getTimeAgo = (minutes) => {
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user.fullName?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
                  <p className="text-gray-600">@{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.emailVerify 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.emailVerify ? 'Verified' : 'Unverified'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.accountHealth?.riskLevel === 'high' 
                  ? 'bg-red-100 text-red-800'
                  : user.accountHealth?.riskLevel === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                Risk: {user.accountHealth?.riskLevel || 'low'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Posts</h3>
            <p className="text-2xl font-bold text-gray-900">{user.stats?.postsCount || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Followers</h3>
            <p className="text-2xl font-bold text-gray-900">{user.stats?.followersCount || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Following</h3>
            <p className="text-2xl font-bold text-gray-900">{user.stats?.followingCount || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Tokens</h3>
            <p className="text-2xl font-bold text-gray-900">{user.tokens || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'activity', name: 'Activity Logs' },
                { id: 'otp', name: 'OTP History' },
                { id: 'sessions', name: 'Login Sessions' },
                { id: 'content', name: 'Content' },
                { id: 'interactions', name: 'Interactions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Account Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900">{user.fullName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Username</label>
                        <p className="text-gray-900">@{user.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{user.phoneNumber || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Country</label>
                        <p className="text-gray-900">{user.country || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-gray-900">{user.dateOfBirth ? formatDate(user.dateOfBirth) : 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Joined</label>
                        <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Active</label>
                        <p className="text-gray-900">{user.accountHealth?.lastActive ? formatDate(user.accountHealth.lastActive) : 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{user.bio}</p>
                  </div>
                )}

                {/* Account Health */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Email Verified</p>
                      <p className={`font-medium ${user.accountHealth?.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                        {user.accountHealth?.emailVerified ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Profile Complete</p>
                      <p className={`font-medium ${user.accountHealth?.profileComplete ? 'text-green-600' : 'text-yellow-600'}`}>
                        {user.accountHealth?.profileComplete ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Active Session</p>
                      <p className={`font-medium ${user.accountHealth?.hasActiveSession ? 'text-green-600' : 'text-gray-600'}`}>
                        {user.accountHealth?.hasActiveSession ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Risk Level</p>
                      <p className={`font-medium ${
                        user.accountHealth?.riskLevel === 'high' ? 'text-red-600' :
                        user.accountHealth?.riskLevel === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {(user.accountHealth?.riskLevel || 'low').toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Device Statistics */}
                {user.deviceStats && user.deviceStats.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Device Usage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {user.deviceStats.map((device, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Device Type</p>
                          <p className="font-medium text-gray-900">{device._id || 'Unknown'}</p>
                          <p className="text-sm text-gray-500 mt-1">{device.count} sessions</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity Logs Tab */}
            {activeTab === 'activity' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Activity Logs</h3>
                  <button
                    onClick={fetchActivityLogs}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={loadingActivity}
                  >
                    {loadingActivity ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                {loadingActivity ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No activity logs found</p>
                    ) : (
                      activityLogs.map((log, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {log.action}
                                </span>
                                {log.targetType && (
                                  <span className="text-sm text-gray-500">
                                    on {log.targetType}
                                  </span>
                                )}
                              </div>
                              {log.details && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {JSON.stringify(log.details)}
                                </p>
                              )}
                              {log.deviceInfo && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Device: {log.deviceInfo.deviceType} • {log.deviceInfo.osVersion}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {getTimeAgo(log.timeAgo)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(log.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* OTP History Tab */}
            {activeTab === 'otp' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">OTP History</h3>
                  <button
                    onClick={fetchOtpHistory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={loadingOtp}
                  >
                    {loadingOtp ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                {loadingOtp ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Expiry
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {otpHistory.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              No OTP records found
                            </td>
                          </tr>
                        ) : (
                          otpHistory.map((otp, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                  {otp.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {otp.value}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  otp.isUsed 
                                    ? 'bg-green-100 text-green-800' 
                                    : otp.isExpired
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {otp.isUsed ? 'Used' : otp.isExpired ? 'Expired' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(otp.expiration)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(otp.createdAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Login Sessions</h3>
                  <button
                    onClick={fetchSessionHistory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={loadingSession}
                  >
                    {loadingSession ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                {loadingSession ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessionHistory.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No sessions found</p>
                    ) : (
                      sessionHistory.map((session, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  session.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {session.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {session.deviceType} • {session.osVersion}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Device Model:</span>
                                  <span className="ml-2 text-gray-900">{session.deviceModel || 'Unknown'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">App Version:</span>
                                  <span className="ml-2 text-gray-900">{session.appVersion || 'Unknown'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Created:</span>
                                  <span className="ml-2 text-gray-900">{formatDate(session.createdAt)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Duration:</span>
                                  <span className="ml-2 text-gray-900">{Math.floor(session.duration / 60)}h {session.duration % 60}m</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              {session.isActive && (
                                <button
                                  onClick={() => revokeSession(session._id)}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Recent Posts */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Posts</h3>
                  {user.recentPosts && user.recentPosts.length > 0 ? (
                    <div className="space-y-4">
                      {user.recentPosts.map((post, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-900 mb-2">{post.content}</p>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{post.likesCount} likes • {post.commentsCount} comments</span>
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No posts found</p>
                  )}
                </div>

                {/* Pet Listings */}
                {user.petListings && user.petListings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pet Listings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.petListings.map((pet, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{pet.name}</h4>
                          <p className="text-sm text-gray-600">{pet.type} • {pet.gender}</p>
                          <p className="text-sm text-gray-500">{pet.currencySymbol}{pet.price}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatDate(pet.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactions Tab */}
            {activeTab === 'interactions' && (
              <div className="space-y-6">
                {/* Token Transactions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Token Transactions</h3>
                  {user.tokenTransactions && user.tokenTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {user.tokenTransactions.map((transaction, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {transaction.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(transaction.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No token transactions found</p>
                  )}
                </div>

                {/* Recent Likes */}
                {user.recentLikes && user.recentLikes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Likes</h3>
                    <div className="space-y-3">
                      {user.recentLikes.slice(0, 5).map((like, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <p className="text-sm text-gray-600">{like.post?.content || 'Post content not available'}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(like.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Comments */}
                {user.recentComments && user.recentComments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Comments</h3>
                    <div className="space-y-3">
                      {user.recentComments.slice(0, 5).map((comment, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <p className="text-sm text-gray-900">{comment.content}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(comment.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
