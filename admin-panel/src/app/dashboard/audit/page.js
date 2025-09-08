'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        action: actionFilter,
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'USER_CREATE':
        return '👤➕';
      case 'USER_UPDATE':
        return '👤✏️';
      case 'USER_DELETE':
        return '👤🗑️';
      case 'POST_DELETE':
        return '📝🗑️';
      case 'TOKEN_ADJUSTMENT':
        return '🪙⚙️';
      case 'ADMIN_LOGIN':
        return '🔓';
      case 'ADMIN_LOGOUT':
        return '🔒';
      case 'DATA_EXPORT':
        return '📊📤';
      default:
        return '📋';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'USER_DELETE':
      case 'POST_DELETE':
        return 'text-red-600 bg-red-50';
      case 'USER_CREATE':
        return 'text-green-600 bg-green-50';
      case 'USER_UPDATE':
      case 'TOKEN_ADJUSTMENT':
        return 'text-blue-600 bg-blue-50';
      case 'ADMIN_LOGIN':
        return 'text-purple-600 bg-purple-50';
      case 'ADMIN_LOGOUT':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Track all admin actions and system changes</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Action
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="USER_CREATE">User Create</option>
                <option value="USER_UPDATE">User Update</option>
                <option value="USER_DELETE">User Delete</option>
                <option value="POST_DELETE">Post Delete</option>
                <option value="TOKEN_ADJUSTMENT">Token Adjustment</option>
                <option value="ADMIN_LOGIN">Admin Login</option>
                <option value="ADMIN_LOGOUT">Admin Logout</option>
                <option value="DATA_EXPORT">Data Export</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getActionIcon(log.action)}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {log.adminId?.fullName?.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {log.adminId?.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.adminId?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {log.targetType || '-'}
                        </div>
                        {log.targetId && (
                          <div className="text-xs text-gray-500 font-mono">
                            {log.targetId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {log.details && typeof log.details === 'object' ? (
                            <div className="space-y-1">
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="text-xs">
                                  <span className="font-medium">{key}:</span>{' '}
                                  <span className="text-gray-600">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-600">{log.details || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div className="space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
