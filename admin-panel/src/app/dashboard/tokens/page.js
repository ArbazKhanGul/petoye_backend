'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

export default function TokensPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, typeFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        type: typeFilter,
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/tokens/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustTokens = async (formData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/tokens/adjust`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Tokens adjusted successfully');
        setShowAdjustModal(false);
        fetchTransactions();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to adjust tokens');
      }
    } catch (error) {
      console.error('Error adjusting tokens:', error);
      alert('Error adjusting tokens');
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'referral':
        return '👥';
      case 'admin_adjustment':
        return '⚙️';
      default:
        return '🪙';
    }
  };

  const getTransactionColor = (amount) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Token Management</h1>
          <p className="text-white opacity-70">Manage user tokens and transactions</p>
        </div>

        {/* Actions and Filters */}
        <div className="bg-surface p-6 rounded-lg shadow border border-primary mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Transaction Type
                </label>
                <select
                  className="px-3 py-2 border border-primary bg-dark text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="like">Likes</option>
                  <option value="referral">Referrals</option>
                  <option value="admin_adjustment">Admin Adjustments</option>
                </select>
              </div>
            </div>
            <div>
              <button
                onClick={() => setShowAdjustModal(true)}
                className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-dark transition-colors duration-200"
              >
                Adjust User Tokens
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-surface rounded-lg shadow border border-primary">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-primary">
              <thead className="bg-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-primary">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-white opacity-70">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {transaction.user?.fullName?.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.user?.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{transaction.user?.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getTransactionIcon(transaction.type)}</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {transaction.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${getTransactionColor(transaction.amount)}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
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

        {/* Adjust Tokens Modal */}
        {showAdjustModal && (
          <AdjustTokensModal
            onClose={() => setShowAdjustModal(false)}
            onAdjust={handleAdjustTokens}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function AdjustTokensModal({ onClose, onAdjust }) {
  const [formData, setFormData] = useState({
    userId: '',
    amount: 0,
    reason: '',
  });
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchUsers();
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        search: searchTerm,
        limit: '10',
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.userId || !formData.amount || !formData.reason) {
      alert('Please fill in all fields');
      return;
    }
    onAdjust(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Adjust User Tokens</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search User</label>
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {users.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                {users.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"
                    onClick={() => {
                      setFormData({ ...formData, userId: user._id });
                      setSearchTerm(user.fullName);
                      setUsers([]);
                    }}
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
                      {user.fullName?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{user.fullName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              placeholder="Enter amount (positive to add, negative to deduct)"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              placeholder="Reason for adjustment"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
            >
              Adjust Tokens
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
