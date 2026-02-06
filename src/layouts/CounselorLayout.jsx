import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { counselorAPI } from '../services/api';

const CounselorLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  const counselorId = user?.counselorProfile?.id || user?.counselorProfile?._id;

  useEffect(() => {
    if (!counselorId) return;
    const id = setTimeout(() => {
      counselorAPI.getNewLeadsCount(counselorId)
        .then(({ data }) => setNewLeadsCount(data?.data?.newLeads ?? 0))
        .catch(() => setNewLeadsCount(0));
    }, 0);
    return () => clearTimeout(id);
  }, [counselorId]);

  const handleLogout = () => {
    logout();
    navigate('/counselor/login');
  };

  const navItems = [
    { path: '/counselor/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/counselor/leads', label: 'My Leads', icon: '📋' },
    { path: '/counselor/sessions', label: 'Sessions', icon: '📅' },
    { path: '/counselor/schools', label: 'Admissions Available', icon: '🏫' },
    { path: '/counselor/training', label: 'Training', icon: '🎓' },
    { path: '/counselor/todos', label: 'To-Dos', icon: '✅' },
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
            <h1 className="text-lg sm:text-xl font-bold text-primary-600">Counselor Portal</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Welcome back!</p>
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
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5 transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-primary-100 text-primary-700 font-medium shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
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
                {navItems.find(item => item.path === location.pathname)?.label || 'Counselor'}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {newLeadsCount > 0 && (
                <Link
                  to="/counselor/leads"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-sm hover:bg-amber-100 hover:border-amber-300 transition-colors"
                  title="New lead(s) assigned"
                >
                  <span className="relative inline-flex">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[10px] sm:text-xs font-bold text-white">
                      {newLeadsCount > 99 ? '99+' : newLeadsCount}
                    </span>
                  </span>
                  <span className="hidden sm:inline font-medium text-sm">New lead{newLeadsCount !== 1 ? 's' : ''} assigned</span>
                </Link>
              )}
              <div className="text-right hidden sm:block max-w-[140px] truncate">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user?.counselorProfile?.fullName || user?.username}
                </p>
                <p className="text-xs text-gray-500">Counselor</p>
              </div>
              <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-3 sm:px-4">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CounselorLayout;
