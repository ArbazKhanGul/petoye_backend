'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS } from '../../constants/colors';

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6000/api'}/admin/auth/login`, {
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: COLORS.BACKGROUND }}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-auto flex items-center justify-center">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: COLORS.PRIMARY }}>
              <span className="text-2xl" style={{ color: COLORS.SECONDARY }}>🐾</span>
            </div>
            <span className="ml-3 text-3xl font-bold" style={{ color: COLORS.PRIMARY }}>Petoye</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: COLORS.TEXT }}>
            🔐 Admin Sign In
          </h2>
          <p className="mt-2 text-center text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>
            Access your pet community dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6 p-8 rounded-2xl shadow-xl" style={{ backgroundColor: COLORS.BACKGROUND_CARD, border: `1px solid ${COLORS.BORDER_MUTED}` }} onSubmit={handleSubmit}>
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
                className="appearance-none rounded-none relative block w-full px-4 py-3 rounded-t-xl focus:outline-none focus:ring-2 focus:z-10 sm:text-sm"
                style={{ 
                  backgroundColor: COLORS.NEUTRAL_800,
                  border: `1px solid ${COLORS.BORDER_MUTED}`,
                  color: COLORS.TEXT,
                  focusRingColor: COLORS.PRIMARY
                }}
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
                className="appearance-none rounded-none relative block w-full px-4 py-3 rounded-b-xl focus:outline-none focus:ring-2 focus:z-10 sm:text-sm"
                style={{ 
                  backgroundColor: COLORS.NEUTRAL_800,
                  border: `1px solid ${COLORS.BORDER_MUTED}`,
                  color: COLORS.TEXT,
                  focusRingColor: COLORS.PRIMARY
                }}
                placeholder="🔒 Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg font-medium" style={{ backgroundColor: `${COLORS.ACCENT}20`, border: `2px solid ${COLORS.ACCENT}`, color: COLORS.ACCENT }}>
              ❌ {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border-transparent text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ 
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.SECONDARY,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = COLORS.PRIMARY_DARK;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = COLORS.PRIMARY;
                }
              }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: COLORS.SECONDARY }}></div>
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
