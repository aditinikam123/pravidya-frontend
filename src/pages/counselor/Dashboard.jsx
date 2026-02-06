import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { counselorAPI } from '../../services/api';
import { usePresenceTracking } from '../../hooks/usePresenceTracking';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const CounselorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const counselorId = user?.counselorProfile?.id || user?.counselorProfile?._id;
  const { presence, recordLogin } = usePresenceTracking(counselorId);

  useEffect(() => {
    if (counselorId) {
      fetchStats();
      // Record login on dashboard load
      recordLogin();
    }
  }, [user, counselorId, recordLogin]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Use id (Prisma) or _id (Mongoose) for compatibility
      const counselorId = user?.counselorProfile?.id || user?.counselorProfile?._id;
      if (!counselorId) {
        toast.error('Counselor profile not found');
        setLoading(false);
        return;
      }
      const response = await counselorAPI.getStats(counselorId);
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'AWAY':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const hasNewLeads = (stats?.newLeads ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Counselor Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.counselorProfile?.fullName || user?.username}!</p>
      </div>

      {hasNewLeads && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex items-center gap-4 shadow-soft">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-900">You have {stats.newLeads} new assigned lead{stats.newLeads !== 1 ? 's' : ''}</p>
            <p className="text-sm text-amber-700 mt-0.5">View and respond to them in My Leads.</p>
          </div>
          <Link
            to="/counselor/leads"
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors"
          >
            View My Leads
          </Link>
        </div>
      )}

      {/* Presence Status Card */}
      <div className="card border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {loading ? (
                <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
              ) : (
                <div
                  className={`w-4 h-4 rounded-full ${
                    presence.status === 'ACTIVE' || presence.status === 'ONLINE'
                      ? 'bg-green-500 animate-pulse'
                      : presence.status === 'AWAY'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`}
                />
              )}
              <h3 className="text-lg font-semibold text-gray-900">Live Presence Status</h3>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {loading ? (
                <div className="h-9 w-24 rounded-xl bg-gray-100 animate-pulse" />
              ) : (
                <span className={`px-4 py-2 rounded-xl border-2 font-medium ${getStatusColor(presence.status)}`}>
                  {presence.status}
                </span>
              )}
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Login Time:</span>
                  <span>{loading ? '—' : formatTime(presence.lastLoginAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Active Today:</span>
                  <span className="text-blue-600 font-semibold">{loading ? '—' : `${presence.activeMinutesToday || 0} minutes`}</span>
                </div>
                {(loading || presence.lastActivityAt) && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Last Activity:</span>
                    <span>{loading ? '—' : formatTime(presence.lastActivityAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-sm text-gray-600">Total Active</p>
            <p className="text-2xl font-bold text-blue-600">{loading ? '—' : (presence.totalActiveMinutes || 0)}</p>
            <p className="text-xs text-gray-500">minutes</p>
            {!loading && (
              <div className="mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Active
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500">
            💡 Your activity is being tracked automatically. Stay active to maintain your status.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assigned Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? <span className="inline-block h-8 w-10 bg-gray-200 rounded animate-pulse" /> : (stats?.totalLeads ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Leads</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {loading ? <span className="inline-block h-8 w-10 bg-gray-200 rounded animate-pulse" /> : (stats?.newLeads ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🆕</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enrolled</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {loading ? <span className="inline-block h-8 w-10 bg-gray-200 rounded animate-pulse" /> : (stats?.enrolled ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workload Status */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Workload Status</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Current Load</span>
              <span className="font-semibold">
                {loading ? '—' : `${stats?.currentLoad ?? 0} / ${stats?.maxCapacity ?? 0}`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all ${
                  loading ? 'bg-gray-300 w-0' : (stats?.loadPercentage || 0) < 50
                    ? 'bg-green-500'
                    : (stats?.loadPercentage || 0) < 80
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={loading ? {} : { width: `${Math.min(stats?.loadPercentage || 0, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {loading ? '—' : `${stats?.loadPercentage ?? 0}% capacity utilized`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-7 w-20 rounded-full bg-gray-100 animate-pulse" />
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  stats?.availability === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {stats?.availability || 'N/A'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/counselor/leads"
            className="p-5 border-2 border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-semibold text-gray-900">View My Leads</p>
                <p className="text-sm text-gray-600">Manage assigned leads</p>
              </div>
            </div>
          </Link>
          <Link
            to="/counselor/sessions"
            className="p-5 border-2 border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-semibold text-gray-900">Schedule Sessions</p>
                <p className="text-sm text-gray-600">Manage counseling sessions</p>
              </div>
            </div>
          </Link>
          <Link
            to="/counselor/training"
            className="p-5 border-2 border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <div>
                <p className="font-semibold text-gray-900">Training Materials</p>
                <p className="text-sm text-gray-600">Access training content</p>
              </div>
            </div>
          </Link>
          <Link
            to="/counselor/todos"
            className="p-5 border-2 border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-gray-900">My To-Dos</p>
                <p className="text-sm text-gray-600">Manage personal tasks</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CounselorDashboard;
