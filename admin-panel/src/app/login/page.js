'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens
        localStorage.setItem('adminToken', data.authToken);
        localStorage.setItem('adminRefreshToken', data.refreshToken);
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-auto flex items-center justify-center">
            <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">🐾</span>
            </div>
            <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Petoye</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-800">
            🔐 Admin Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-medium">
            Access your pet community dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-orange-100" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-orange-200 placeholder-gray-500 text-gray-900 rounded-t-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-orange-50"
                placeholder="📧 Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-orange-200 placeholder-gray-500 text-gray-900 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-orange-50"
                placeholder="🔒 Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">
              ❌ {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                '🚀 Sign in to Dashboard'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
