'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { COLORS } from '../constants/colors';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    const adminInfo = localStorage.getItem('adminData');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (adminInfo) {
      setAdminData(JSON.parse(adminInfo));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminData');
    router.push('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      current: pathname === '/dashboard'
    },
    {
      name: 'User Management',
      href: '/dashboard/users',
      icon: '👥',
      current: pathname.startsWith('/dashboard/users')
    },
    {
      name: 'Post Management',
      href: '/dashboard/posts',
      icon: '📝',
      current: pathname.startsWith('/dashboard/posts')
    },
    {
      name: 'Token Management',
      href: '/dashboard/tokens',
      icon: '🪙',
      current: pathname.startsWith('/dashboard/tokens')
    },
    {
      name: 'Audit Logs',
      href: '/dashboard/audit',
      icon: '📋',
      current: pathname.startsWith('/dashboard/audit')
    },
  ];

  if (!adminData) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: COLORS.BACKGROUND }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.PRIMARY }}></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: COLORS.BACKGROUND }}>
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        style={{ backgroundColor: COLORS.SECONDARY_LIGHT }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4" style={{ borderBottom: `1px solid ${COLORS.BORDER_MUTED}` }}>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.PRIMARY }}>
                <span className="font-bold text-lg" style={{ color: COLORS.SECONDARY }}>🐾</span>
              </div>
              <span className="ml-2 text-xl font-bold" style={{ color: COLORS.TEXT }}>Petoye Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md transition-colors"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: item.current ? COLORS.PRIMARY : 'transparent',
                  color: item.current ? COLORS.SECONDARY : COLORS.TEXT_MUTED,
                }}
                onMouseEnter={(e) => {
                  if (!item.current) {
                    e.target.style.backgroundColor = COLORS.NEUTRAL_800;
                    e.target.style.color = COLORS.TEXT;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.current) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = COLORS.TEXT_MUTED;
                  }
                }}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Admin Info */}
          <div className="p-4" style={{ borderTop: `1px solid ${COLORS.BORDER_MUTED}` }}>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.SECONDARY }}>
                {adminData.fullName?.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>{adminData.fullName}</p>
                <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{adminData.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full text-left px-3 py-2 text-sm rounded-lg transition-colors"
              style={{ color: COLORS.TEXT_MUTED }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = COLORS.ACCENT;
                e.target.style.color = COLORS.TEXT;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = COLORS.TEXT_MUTED;
              }}
            >
              🚪 Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top navigation */}
        <header className="shadow-lg lg:hidden" style={{ backgroundColor: COLORS.SECONDARY_LIGHT }}>
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-md transition-colors"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold" style={{ color: COLORS.TEXT }}>🐾 Petoye Admin</h1>
            <div></div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: COLORS.BACKGROUND }}>
          {children}
        </main>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: COLORS.BACKGROUND_MODAL }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
