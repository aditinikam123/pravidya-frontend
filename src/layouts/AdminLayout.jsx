import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/leads', label: 'Leads', icon: '📋' },
    { path: '/admin/counselors', label: 'Counselors', icon: '👥' },
    { path: '/admin/institutions', label: 'Institutions', icon: '🏛️' },
    { path: '/admin/training-modules', label: 'Training', icon: '🎓' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-soft-lg z-40 transform transition-transform duration-200 ease-out lg:translate-x-0 border-r border-gray-100 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-primary-600">Admissions Platform</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Admin Panel</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Close menu"
          >
            <span className="text-xl">×</span>
          </button>
        </div>
        <nav className="p-3 overflow-y-auto max-h-[calc(100vh-5rem)]">
          {navItems.map((item) => {
            const isInstitutions = item.path === '/admin/institutions';
            const isActive = isInstitutions ? location.pathname.startsWith('/admin/institutions') : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5 transition-all duration-200 ${
                  isActive
                    ? isInstitutions
                      ? 'bg-[#e0e7ff] text-[#4F46E5] font-semibold rounded-[10px]'
                      : 'bg-primary-100 text-primary-700 font-medium shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:ml-64 min-h-screen flex flex-col">
        <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-20 border-b border-gray-100">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-base sm:text-xl font-semibold text-gray-800 truncate">
                {navItems.find(item => item.path === location.pathname)?.label || 'Admin'}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block max-w-[120px] lg:max-w-none truncate">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.username}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm py-2 px-3 sm:px-4"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
