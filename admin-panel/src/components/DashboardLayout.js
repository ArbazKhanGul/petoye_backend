'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-orange-600 to-amber-600 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-orange-500">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">🐾</span>
              </div>
              <span className="ml-2 text-xl font-bold text-white">Petoye Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-orange-200 hover:text-white"
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
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  item.current
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'text-orange-100 hover:bg-orange-500 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Admin Info */}
          <div className="p-4 border-t border-orange-500">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-orange-600 text-sm font-bold">
                {adminData.fullName?.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{adminData.fullName}</p>
                <p className="text-xs text-orange-200">{adminData.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full text-left px-3 py-2 text-sm text-orange-100 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
            >
              🚪 Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top navigation */}
        <header className="bg-gradient-to-r from-orange-600 to-amber-600 shadow-lg lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-md text-orange-100 hover:text-white"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold text-white">🐾 Petoye Admin</h1>
            <div></div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
