import { useState, useEffect } from 'react';
import { adminAPI, presenceAPI, leadAPI, managementAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inactivityAlerts, setInactivityAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [availableCounselors, setAvailableCounselors] = useState([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [releasedAppointments, setReleasedAppointments] = useState([]);
  const [loadingReleased, setLoadingReleased] = useState(false);
  const [showReleasedModal, setShowReleasedModal] = useState(false);

  useEffect(() => {
    // Load all data in parallel for faster initial load
    Promise.all([
      fetchDashboardData(),
      fetchInactivityAlerts(),
      fetchReleasedAppointments()
    ]).catch(error => {
      console.error('Error loading dashboard data:', error);
    });
    
    // Refresh alerts every 2 minutes
    const interval = setInterval(() => {
      fetchInactivityAlerts();
      fetchReleasedAppointments();
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchReleasedAppointments = async () => {
    setLoadingReleased(true);
    try {
      const response = await managementAPI.getReleasedAppointments();
      setReleasedAppointments(response.data.data);
    } catch (error) {
      console.error('Failed to load released appointments:', error);
    } finally {
      setLoadingReleased(false);
    }
    return Promise.resolve();
  };

  const handleReassignAppointment = async (sessionId, newCounselorId) => {
    try {
      await managementAPI.reassignAppointment({
        sessionId,
        newCounselorId
      });
      toast.success('Appointment reassigned successfully');
      fetchReleasedAppointments();
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reassign appointment');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
    return Promise.resolve();
  };

  const fetchInactivityAlerts = async () => {
    try {
      const response = await presenceAPI.getInactivityAlerts();
      setInactivityAlerts(response.data.data.alerts || []);
    } catch (error) {
      console.error('Failed to load inactivity alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
    return Promise.resolve();
  };

  const handleReassignClick = async (alert) => {
    setSelectedAlert(alert);
    setShowReassignModal(true);
    try {
      const response = await leadAPI.getAvailableCounselors({
        excludeCounselorId: alert.counselorId
      });
      setAvailableCounselors(response.data.data.counselors || []);
    } catch (error) {
      toast.error('Failed to load available counselors');
    }
  };

  const handleReassignSubmit = async () => {
    if (!selectedCounselorId || !selectedAlert) return;

    setReassigning(true);
    try {
      // If it's a session reassignment
      if (selectedAlert.sessionId) {
        await managementAPI.reassignAppointment({
          sessionId: selectedAlert.sessionId,
          newCounselorId: selectedCounselorId
        });
        toast.success('Appointment reassigned successfully');
      } else {
        // Reassign each affected lead
        for (const lead of selectedAlert.leads) {
          await leadAPI.assign(lead.id, selectedCounselorId, `Reassigned due to counselor inactivity (${selectedAlert.inactiveMinutes || 'N/A'} min)`);
        }
        toast.success(`Reassigned ${selectedAlert.leads.length} lead(s) successfully`);
      }
      setShowReassignModal(false);
      setSelectedAlert(null);
      fetchInactivityAlerts();
      fetchReleasedAppointments();
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reassign');
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Overview of admissions platform</p>
      </div>

      {/* Stats Grid - Show immediately even if loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats?.leads?.total || 0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Auto Assigned</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats?.leads?.assignment?.auto || 0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enrolled</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats?.leads?.enrolled || 0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Counselors</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats?.counselors?.active || 0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Classification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead Classification</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">RAW</span>
              <span className="font-bold text-gray-900">
                {stats?.leads?.classification?.raw || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">VERIFIED</span>
              <span className="font-bold text-gray-900">
                {stats?.leads?.classification?.verified || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">PRIORITY</span>
              <span className="font-bold text-gray-900">
                {stats?.leads?.classification?.priority || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Auto Assigned</span>
              <span className="font-bold text-green-600">
                {stats?.leads?.assignment?.auto || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Manual Assigned</span>
              <span className="font-bold text-blue-600">
                {stats?.leads?.assignment?.manual || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Unassigned</span>
              <span className="font-bold text-red-600">
                {stats?.leads?.assignment?.unassigned || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Recent Leads (24h)</span>
              <span className="font-bold text-gray-900">
                {stats?.recent?.leads || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Recent Activity</span>
              <span className="font-bold text-gray-900">
                {stats?.recent?.activity || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Released Appointments */}
      {releasedAppointments.total > 0 && (
        <div className="card border-l-4 border-orange-500">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-orange-600">📅</span>
                Released Appointments
                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  {releasedAppointments.total}
                </span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Appointments requiring reassignment
              </p>
            </div>
            <button
              onClick={() => setShowReleasedModal(true)}
              className="btn-primary text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {releasedAppointments.releasedSessions?.slice(0, 3).map((session, idx) => (
              <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{session.lead?.studentName}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>Parent: {session.lead?.parentName}</div>
                      <div>Scheduled: {new Date(session.scheduledDate).toLocaleString()}</div>
                      <div className="text-xs text-red-600 mt-1">Released from: {session.counselor?.user?.username}</div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await leadAPI.getAvailableCounselors({
                          excludeCounselorId: session.counselorId
                        });
                        setAvailableCounselors(response.data.data.counselors || []);
                        setSelectedAlert({
                          sessionId: session.id,
                          leads: [{ id: session.lead?.id, studentName: session.lead?.studentName, parentName: session.lead?.parentName }],
                          counselorId: session.counselorId
                        });
                        setShowReassignModal(true);
                      } catch (error) {
                        toast.error('Failed to load counselors');
                      }
                    }}
                    className="btn-primary text-xs ml-4"
                  >
                    Reassign
                  </button>
                </div>
              </div>
            ))}
            {releasedAppointments.total > 3 && (
              <button
                onClick={() => setShowReleasedModal(true)}
                className="w-full text-sm text-primary-600 hover:text-primary-700 py-2"
              >
                View {releasedAppointments.total - 3} more...
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inactivity Alerts */}
      {inactivityAlerts.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-red-600">🚨</span>
                Inactivity Alerts
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {inactivityAlerts.length}
                </span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Counselors inactive for more than 30 minutes
              </p>
            </div>
            <button
              onClick={fetchInactivityAlerts}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {inactivityAlerts.map((alert, index) => (
              <div
                key={index}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{alert.counselorName}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>Inactive for: <span className="font-semibold">{alert.inactiveMinutes} minutes</span></div>
                      <div>Status: <span className="font-semibold">{alert.currentStatus}</span></div>
                      <div>Affected Leads: <span className="font-semibold text-red-600">{alert.affectedLeads}</span></div>
                      {alert.lastActivityAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last active: {new Date(alert.lastActivityAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {alert.requiresReassignment && alert.leads.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-red-700 mb-1">Leads requiring reassignment:</div>
                        <div className="flex flex-wrap gap-1">
                          {alert.leads.slice(0, 5).map((lead, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white border border-red-300 rounded text-xs">
                              {lead.studentName}
                            </span>
                          ))}
                          {alert.leads.length > 5 && (
                            <span className="px-2 py-1 bg-white border border-red-300 rounded text-xs">
                              +{alert.leads.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {alert.requiresReassignment && (
                    <button
                      onClick={() => handleReassignClick(alert)}
                      className="btn-primary text-sm ml-4"
                    >
                      Reassign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Counselors */}
      {stats?.topCounselors && stats.topCounselors.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Counselors</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 text-gray-700">Counselor</th>
                  <th className="text-right py-2 px-4 text-gray-700">Enrolled Leads</th>
                </tr>
              </thead>
              <tbody>
                {stats.topCounselors.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-4">{item.counselorName}</td>
                    <td className="py-2 px-4 text-right font-semibold">
                      {item.enrolledCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reassignment Modal */}
      {showReassignModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reassign Leads</h2>
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedAlert(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                {selectedAlert.sessionId ? (
                  <>
                    <div className="font-semibold text-gray-900 mb-2">
                      Session Reassignment
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedAlert.leads.length} appointment(s) need reassignment
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-gray-900 mb-2">
                      Counselor: {selectedAlert.counselorName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Inactive for {selectedAlert.inactiveMinutes} minutes
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedAlert.leads.length} lead(s) need reassignment
                    </div>
                  </>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Counselor <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCounselorId}
                  onChange={(e) => setSelectedCounselorId(e.target.value)}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select Counselor</option>
                  {availableCounselors.map((counselor) => (
                    <option key={counselor.id} value={counselor.id}>
                      {counselor.fullName} - {counselor.presenceStatus} (Load: {counselor.loadPercentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affected Leads
                </label>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {selectedAlert.leads.map((lead, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded mb-1 text-sm">
                      <span className="font-medium">{lead.studentName}</span> - {lead.parentName}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedAlert(null);
                  }}
                  className="btn-secondary"
                  disabled={reassigning}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassignSubmit}
                  className="btn-primary"
                  disabled={reassigning || !selectedCounselorId}
                >
                  {reassigning 
                    ? 'Reassigning...' 
                    : selectedAlert.sessionId
                      ? `Reassign Session`
                      : `Reassign ${selectedAlert.leads.length} Lead(s)`
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Released Appointments Modal */}
      {showReleasedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Released Appointments</h2>
                <button
                  onClick={() => {
                    setShowReleasedModal(false);
                    fetchReleasedAppointments();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Released Sessions */}
              {releasedAppointments.releasedSessions?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Cancelled Sessions</h3>
                  <div className="space-y-3">
                    {releasedAppointments.releasedSessions.map((session, idx) => (
                      <div key={idx} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{session.lead?.studentName}</div>
                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                              <div>Lead ID: {session.lead?.leadId}</div>
                              <div>Parent: {session.lead?.parentName} ({session.lead?.parentMobile})</div>
                              <div>Course: {session.lead?.course?.name || 'N/A'}</div>
                              <div>Scheduled: {new Date(session.scheduledDate).toLocaleString()}</div>
                              <div className="text-xs text-red-600 mt-1">
                                Previous Counselor: {session.counselor?.user?.username || 'N/A'}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const response = await leadAPI.getAvailableCounselors({
                                  excludeCounselorId: session.counselorId
                                });
                                setAvailableCounselors(response.data.data.counselors || []);
                                setSelectedAlert({
                                  sessionId: session.id,
                                  leads: [{ id: session.lead?.id, studentName: session.lead?.studentName, parentName: session.lead?.parentName }],
                                  counselorId: session.counselorId
                                });
                                setShowReassignModal(true);
                              } catch (error) {
                                toast.error('Failed to load counselors');
                              }
                            }}
                            className="btn-primary text-sm ml-4"
                          >
                            Reassign
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unassigned Leads */}
              {releasedAppointments.unassignedLeads?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Unassigned Leads</h3>
                  <div className="space-y-3">
                    {releasedAppointments.unassignedLeads.map((lead, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{lead.studentName}</div>
                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                              <div>Lead ID: {lead.leadId}</div>
                              <div>Parent: {lead.parentName} ({lead.parentMobile})</div>
                              <div>Course: {lead.course?.name || 'N/A'}</div>
                              <div>Submitted: {new Date(lead.submittedAt).toLocaleString()}</div>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const response = await leadAPI.getAvailableCounselors({
                                  language: lead.preferredLanguage
                                });
                                setAvailableCounselors(response.data.data.counselors || []);
                                setSelectedAlert({
                                  leads: [{ id: lead.id, studentName: lead.studentName, parentName: lead.parentName }],
                                  counselorId: null
                                });
                                setShowReassignModal(true);
                              } catch (error) {
                                toast.error('Failed to load counselors');
                              }
                            }}
                            className="btn-primary text-sm ml-4"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {releasedAppointments.total === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No released appointments found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
