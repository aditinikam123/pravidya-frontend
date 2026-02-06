import { useState, useEffect } from 'react';
import { adminAPI, leadAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [leadStats, setLeadStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [dashboardRes, statsRes] = await Promise.all([
        adminAPI.getDashboard(),
        leadAPI.getStats(),
      ]);
      setDashboardData(dashboardRes.data.data);
      setLeadStats(statsRes.data.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-1">Comprehensive insights and statistics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">Total Leads</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {leadStats?.total || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Auto Assigned</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {leadStats?.assignment?.auto || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Manual Assigned</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {leadStats?.assignment?.manual || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Enrolled</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {leadStats?.status?.enrolled || 0}
          </p>
        </div>
      </div>

      {/* Classification Breakdown */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Classification</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {leadStats?.classification?.raw || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">RAW</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {leadStats?.classification?.verified || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">VERIFIED</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {leadStats?.classification?.priority || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">PRIORITY</p>
          </div>
        </div>
      </div>

      {/* Counselor Performance */}
      {dashboardData?.topCounselors && dashboardData.topCounselors.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Counselors</h2>
          <div className="space-y-3">
            {dashboardData.topCounselors.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <span className="font-medium">{item.counselorName}</span>
                </div>
                <span className="font-bold text-primary-600">
                  {item.enrolledCount} enrolled
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
