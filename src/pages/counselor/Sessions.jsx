import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sessionAPI, leadAPI, counselorAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format, isToday } from 'date-fns';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'SCHEDULED', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Missed' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
];

const SESSION_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Online', label: 'Video' },
  { value: 'Offline', label: 'In-person' },
];

const LEAD_STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'ENROLLED', label: 'Enrolled' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

const OUTCOME_OPTIONS = [
  { value: 'Interested', label: 'Interested' },
  { value: 'Follow-up', label: 'Follow-up' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Converted', label: 'Converted' },
];

const CounselorSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [notesContent, setNotesContent] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [outcome, setOutcome] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    leadId: '',
    scheduledDate: '',
    scheduledTime: '',
    mode: 'Online',
  });
  const [leadsForSchedule, setLeadsForSchedule] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [videoSessionTheme, setVideoSessionTheme] = useState(() => localStorage.getItem('videoSessionTheme') || 'dark');
  const [videoSessionMinimized, setVideoSessionMinimized] = useState(false);
  const [videoSessionMaximized, setVideoSessionMaximized] = useState(true);

  const toggleVideoSessionTheme = () => {
    setVideoSessionTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('videoSessionTheme', next);
      return next;
    });
  };

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, typeFilter, dateFilter, todayOnly]);

  const fetchSessions = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.mode = typeFilter;
      if (todayOnly) params.date = format(new Date(), 'yyyy-MM-dd');
      else if (dateFilter) params.date = dateFilter;
      const response = await sessionAPI.getAll(params);
      setSessions(response.data.data.sessions || []);
    } catch (error) {
      if (!silent) toast.error('Failed to load sessions');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchMyLeads = async () => {
    const counselorId = user?.counselorProfile?.id || user?.counselorProfile?._id;
    if (!counselorId) {
      setLeadsForSchedule([]);
      setLoadingLeads(false);
      return;
    }
    setLoadingLeads(true);
    try {
      const res = await counselorAPI.getLeads(counselorId);
      const list = res.data?.data?.leads || [];
      setLeadsForSchedule(list);
    } catch (_) {
      setLeadsForSchedule([]);
      toast.error('Failed to load your assigned leads');
    } finally {
      setLoadingLeads(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (todayOnly) {
      const d = new Date(s.scheduledDate);
      if (!isToday(d)) return false;
    }
    if (dateFilter) {
      const sessionDay = format(new Date(s.scheduledDate), 'yyyy-MM-dd');
      if (sessionDay !== dateFilter) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        (s.lead?.studentName || '').toLowerCase().includes(q) ||
        (s.lead?.leadId || '').toLowerCase().includes(q) ||
        (s.lead?.parentName || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const historySessions = [...completedSessions].sort(
    (a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)
  );

  const getLeadStatusLabel = (status) => {
    if (status === undefined || status === null || status === '') return '—';
    const str = String(status).trim();
    if (!str) return '—';
    const opt = LEAD_STATUS_OPTIONS.find((o) => o.value === str || o.value === str.toUpperCase().replace(/\s+/g, '_'));
    if (opt) return opt.label;
    return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusBadge = (session) => {
    const d = new Date(session.scheduledDate);
    const isPast = d < new Date();
    if (session.status === 'SCHEDULED' && isPast)
      return { label: 'Missed', className: 'bg-amber-100 text-amber-800' };
    const map = {
      SCHEDULED: { label: 'Upcoming', className: 'bg-blue-100 text-blue-800' },
      COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
      RESCHEDULED: { label: 'Rescheduled', className: 'bg-yellow-100 text-yellow-800' },
    };
    return map[session.status] || { label: session.status, className: 'bg-gray-100 text-gray-800' };
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleForm.leadId || !scheduleForm.scheduledDate || !scheduleForm.scheduledTime) {
      toast.error('Please fill lead, date and time');
      return;
    }
    setSubmitting(true);
    try {
      const dt = new Date(`${scheduleForm.scheduledDate}T${scheduleForm.scheduledTime}`);
      await sessionAPI.create({
        lead: scheduleForm.leadId,
        scheduledDate: dt.toISOString(),
        mode: scheduleForm.mode,
      });
      toast.success('Session scheduled');
      setShowScheduleModal(false);
      setScheduleForm({ leadId: '', scheduledDate: '', scheduledTime: '', mode: 'Online' });
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSession) return;
    setSubmitting(true);
    try {
      await sessionAPI.update(selectedSession.id, { remarks: notesContent });
      toast.success('Notes saved');
      setShowNotesModal(false);
      setSelectedSession(null);
      setNotesContent('');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to save notes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession || !rescheduleDate) return;
    setSubmitting(true);
    try {
      const dt = rescheduleDate.includes('T')
        ? new Date(rescheduleDate)
        : new Date(rescheduleDate + 'T09:00:00');
      await sessionAPI.update(selectedSession.id, {
        scheduledDate: dt.toISOString(),
        status: 'RESCHEDULED',
      });
      toast.success('Session rescheduled');
      setShowRescheduleModal(false);
      setSelectedSession(null);
      setRescheduleDate('');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkMissed = async () => {
    if (!selectedSession) return;
    setSubmitting(true);
    try {
      await sessionAPI.update(selectedSession.id, { status: 'CANCELLED' });
      toast.success('Session marked as missed');
      setShowOutcomeModal(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (err) {
      toast.error('Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLeadAndOutcome = async () => {
    if (!selectedSession?.leadId) return;
    setSubmitting(true);
    try {
      if (leadStatus) await leadAPI.update(selectedSession.leadId, { status: leadStatus });
      await sessionAPI.update(selectedSession.id, {
        status: 'COMPLETED',
        remarks: [selectedSession.remarks, outcome ? `Outcome: ${outcome}` : ''].filter(Boolean).join('\n'),
        followUpRequired: !!followUpDate,
        followUpDate: followUpDate ? new Date(followUpDate + 'T12:00:00').toISOString() : null,
      });
      toast.success('Session completed and lead updated');
      setShowOutcomeModal(false);
      setSelectedSession(null);
      setLeadStatus('');
      setFollowUpDate('');
      setOutcome('');
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const openNotes = (session) => {
    setSelectedSession(session);
    setNotesContent(session.remarks || '');
    setShowNotesModal(true);
  };

  const openReschedule = (session) => {
    setSelectedSession(session);
    setRescheduleDate(format(new Date(session.scheduledDate), "yyyy-MM-dd'T'HH:mm").slice(0, 16));
    setShowRescheduleModal(true);
  };

  const openVideoSession = (session) => {
    setSelectedSession(session);
    setLeadStatus(session.lead?.status || '');
    setNotesContent(session.remarks || '');
    setChatMessages([]);
    setChatInput('');
    setVideoSessionMinimized(false);
    setVideoSessionMaximized(true);
    setShowVideoModal(true);
  };

  const handleEndVideoSession = () => {
    const sessionId = selectedSession?.id;
    const remarks = notesContent;
    setShowVideoModal(false);
    setSelectedSession(null);
    setVideoSessionMinimized(false);
    setVideoSessionMaximized(true);
    setChatMessages([]);
    setChatInput('');
    if (sessionId) {
      sessionAPI
        .update(sessionId, { status: 'COMPLETED', remarks })
        .then(() => {
          toast.success('Session ended. Notes saved.');
          fetchSessions();
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || 'Failed to save');
        });
    }
  };

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [
      ...prev,
      { role: 'counselor', text, time: new Date().toISOString() },
    ]);
    setChatInput('');
  };

  const openOutcomeModal = (session) => {
    setSelectedSession(session);
    setLeadStatus(session.lead?.status || '');
    setFollowUpDate(session.followUpDate ? format(new Date(session.followUpDate), 'yyyy-MM-dd') : '');
    setOutcome('');
    setShowOutcomeModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Counseling Sessions</h1>
          <p className="text-gray-600 mt-1">Manage student counseling meetings</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setTodayOnly(false);
              fetchMyLeads();
              setShowScheduleModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-all shadow-md shadow-primary-500/25 hover:shadow-lg active:scale-[0.98]"
          >
            <span className="text-lg">+</span>
            Schedule Session
          </button>
          <button
            type="button"
            onClick={() => setTodayOnly((t) => !t)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all border shadow-sm ${
              todayOnly ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {todayOnly ? 'See all sessions' : "Today's Sessions"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search by student or lead ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
          >
            {SESSION_TYPE_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
          {(dateFilter || todayOnly) && (
            <button
              type="button"
              onClick={() => { setDateFilter(''); setTodayOnly(false); }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear date
            </button>
          )}
        </div>
      </div>

      {/* Session Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Sessions</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-soft">
            No sessions match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => {
              const statusInfo = getStatusBadge(session);
              const isVideo = session.mode === 'Online';
              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft hover:shadow-soft-lg transition-shadow duration-200 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {session.lead?.studentName || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5 truncate" title="Course / Class interested">
                        {[session.lead?.currentClass, session.lead?.course?.name, session.lead?.institution?.name].filter(Boolean).join(' • ') || session.lead?.leadId || '—'}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      {isVideo ? (
                        <span className="text-blue-600" title="Video">📹</span>
                      ) : (
                        <span className="text-green-600" title="In-person">👤</span>
                      )}
                      {isVideo ? 'Video' : 'In-person'}
                    </span>
                    <span>•</span>
                    <span>{format(new Date(session.scheduledDate), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {(session.status === 'SCHEDULED' || session.status === 'RESCHEDULED') && new Date(session.scheduledDate) >= new Date() && (
                      <button
                        type="button"
                        onClick={() => openVideoSession(session)}
                        className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        <span>▶</span> Start Session
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openVideoSession(session)}
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      title="Open Chat"
                    >
                      💬
                    </button>
                    <button
                      type="button"
                      onClick={() => openNotes(session)}
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      title="Add Notes"
                    >
                      📝
                    </button>
                    <button
                      type="button"
                      onClick={() => openReschedule(session)}
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      title="Reschedule"
                    >
                      📅
                    </button>
                    {(session.status === 'SCHEDULED' || session.status === 'RESCHEDULED') && (
                      <button
                        type="button"
                        onClick={() => openOutcomeModal(session)}
                        className="p-2 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                        title="Mark Missed"
                      >
                        ⚠
                      </button>
                    )}
                    {(session.status === 'SCHEDULED' || session.status === 'RESCHEDULED') && new Date(session.scheduledDate) < new Date() && (
                      <button
                        type="button"
                        onClick={() => openOutcomeModal(session)}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Complete & set outcome
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session History Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-soft overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 px-5 py-4 border-b border-gray-100">Session History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-700">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Student</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Type</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Lead status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Duration</th>
                <th className="text-left px-5 py-3 font-medium text-gray-700">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {historySessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">No completed sessions yet</td>
                </tr>
              ) : (
                historySessions.slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-700">{format(new Date(s.scheduledDate), 'MMM d, yyyy h:mm a')}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{s.lead?.studentName || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{s.mode === 'Online' ? 'Video' : 'In-person'}</td>
                    <td className="px-5 py-3 text-gray-600">{getLeadStatusLabel(s.lead?.status)}</td>
                    <td className="px-5 py-3 text-gray-600">—</td>
                    <td className="px-5 py-3 text-gray-600">
                      {s.remarks?.includes('Outcome:') ? s.remarks.replace(/^.*Outcome:\s*/i, '').split('\n')[0] : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Schedule Session</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student / Lead</label>
                <select
                  value={scheduleForm.leadId}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, leadId: e.target.value }))}
                  className="input-field w-full"
                  required
                  disabled={loadingLeads}
                >
                  <option value="">
                    {loadingLeads ? 'Loading your leads...' : leadsForSchedule.length === 0 ? 'No assigned leads' : 'Select lead'}
                  </option>
                  {leadsForSchedule.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.studentName} ({l.leadId})
                    </option>
                  ))}
                </select>
                {!loadingLeads && leadsForSchedule.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">You have no leads assigned yet. Ask admin to assign leads to you.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={scheduleForm.scheduledTime}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session type</label>
                <select
                  value={scheduleForm.mode}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, mode: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="Online">Video</option>
                  <option value="Offline">In-person</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary">
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Notes Modal */}
      {showNotesModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowNotesModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Session Notes</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedSession.lead?.studentName} • {format(new Date(selectedSession.scheduledDate), 'MMM d, yyyy')}</p>
            <textarea
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              rows={6}
              className="input-field w-full"
              placeholder="Add discussion notes..."
            />
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowNotesModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button type="button" onClick={handleSaveNotes} disabled={submitting} className="flex-1 btn-primary">{submitting ? 'Saving...' : 'Save Notes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRescheduleModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reschedule Session</h3>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">{selectedSession.lead?.studentName}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New date & time</label>
                <input
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="input-field w-full"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary">{submitting ? 'Updating...' : 'Reschedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Missed / Outcome Modal */}
      {showOutcomeModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowOutcomeModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Session outcome</h3>
            <p className="text-sm text-gray-600 mb-4">{selectedSession.lead?.studentName}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead status</label>
                <select
                  value={leadStatus}
                  onChange={(e) => setLeadStatus(e.target.value)}
                  className="input-field w-full"
                >
                  {LEAD_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Select outcome</option>
                  {OUTCOME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-6">
              <button
                type="button"
                onClick={handleUpdateLeadAndOutcome}
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Saving...' : 'Save & complete session'}
              </button>
              <button
                type="button"
                onClick={handleMarkMissed}
                disabled={submitting}
                className="text-sm text-amber-600 hover:text-amber-800"
              >
                Mark as missed only
              </button>
              <button type="button" onClick={() => setShowOutcomeModal(false)} className="text-sm text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Video Session Interface Modal - Minimized floating bar */}
      {showVideoModal && selectedSession && videoSessionMinimized && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border transition-colors ${
            videoSessionTheme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <span className="font-medium truncate max-w-[180px]">
            Session: {selectedSession.lead?.studentName}
          </span>
          <button
            type="button"
            onClick={() => setVideoSessionMinimized(false)}
            className="px-3 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
          >
            Expand
          </button>
          <button
            type="button"
            onClick={handleEndVideoSession}
            className="px-3 py-1.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-sm font-medium transition-colors"
          >
            End Session
          </button>
        </div>
      )}

      {/* Video Session Interface Modal - Full screen or windowed */}
      {showVideoModal && selectedSession && !videoSessionMinimized && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden transition-all duration-300 shadow-2xl border ${
            videoSessionMaximized
              ? 'inset-0 rounded-none'
              : 'top-4 right-4 left-4 md:left-auto w-full md:w-[min(calc(100vw-2rem),900px)] h-[min(calc(100vh-2rem),85vh)] rounded-2xl'
          } ${
            videoSessionTheme === 'dark'
              ? 'bg-gradient-to-br from-purple-950 via-gray-900 to-fuchsia-950 text-white border-white/10'
              : 'bg-gradient-to-br from-gray-100 via-purple-50 to-fuchsia-50 text-gray-900 border-gray-200'
          }`}
          onClick={() => {}}
        >
          {/* Header with window controls */}
          <div
            className={`flex items-center justify-between gap-3 px-4 py-2.5 backdrop-blur-md border-b transition-colors flex-shrink-0 ${
              videoSessionTheme === 'dark'
                ? 'bg-white/5 border-white/10'
                : 'bg-white/70 border-gray-200/80'
            }`}
          >
            <h3 className={`font-semibold truncate text-sm sm:text-base ${videoSessionTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Session: {selectedSession.lead?.studentName}
            </h3>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setVideoSessionMinimized(true)}
                className={`p-2 rounded-lg transition-colors hover:opacity-80 ${
                  videoSessionTheme === 'dark' ? 'text-white/90 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-200/80'
                }`}
                title="Minimize"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 14H4v-4h16v4z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setVideoSessionMaximized((m) => !m)}
                className={`p-2 rounded-lg transition-colors hover:opacity-80 ${
                  videoSessionTheme === 'dark' ? 'text-white/90 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-200/80'
                }`}
                title={videoSessionMaximized ? 'Restore down' : 'Maximize'}
              >
                {videoSessionMaximized ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 8h4V4h12v12h-4v4H4V8zm4 8v-4h8V8H8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={handleEndVideoSession}
                className={`p-2 rounded-lg transition-colors hover:opacity-80 ${
                  videoSessionTheme === 'dark' ? 'text-white/90 hover:bg-red-500/30 hover:text-red-300' : 'text-gray-600 hover:bg-red-100 hover:text-red-600'
                }`}
                title="Close (End Session)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="w-px h-5 mx-0.5 bg-current opacity-30" aria-hidden="true" />
              <button
                type="button"
                onClick={toggleVideoSessionTheme}
                className={`p-2 rounded-lg transition-colors ${
                  videoSessionTheme === 'dark'
                    ? 'text-white/90 hover:bg-white/10'
                    : 'text-gray-600 hover:bg-gray-200/80'
                }`}
                title={videoSessionTheme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {videoSessionTheme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-0">
            {/* Left: Video area (~70%) */}
            <div className="flex-1 flex flex-col p-5 gap-4">
              <div
                className={`flex-1 rounded-2xl backdrop-blur-sm flex items-center justify-center min-h-[220px] shadow-inner transition-colors ${
                  videoSessionTheme === 'dark'
                    ? 'bg-purple-900/40 border border-white/10'
                    : 'bg-purple-200/50 border border-gray-200/80'
                }`}
              >
                <div className={`text-center ${videoSessionTheme === 'dark' ? 'text-purple-200' : 'text-purple-800'}`}>
                  <p className="text-5xl mb-3 opacity-90">📹</p>
                  <p className={`text-lg font-medium ${videoSessionTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Video window</p>
                  <p className={`text-sm mt-1 ${videoSessionTheme === 'dark' ? 'text-purple-300/80' : 'text-purple-600/90'}`}>(Integrate with your video provider)</p>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium backdrop-blur-sm transition-colors ${
                    videoSessionTheme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                      : 'bg-white/80 hover:bg-white border border-gray-300 text-gray-800 shadow-sm'
                  }`}
                >
                  🎤 Mic
                </button>
                <button
                  type="button"
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium backdrop-blur-sm transition-colors ${
                    videoSessionTheme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                      : 'bg-white/80 hover:bg-white border border-gray-300 text-gray-800 shadow-sm'
                  }`}
                >
                  📷 Camera
                </button>
                <button
                  type="button"
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium backdrop-blur-sm transition-colors ${
                    videoSessionTheme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                      : 'bg-white/80 hover:bg-white border border-gray-300 text-gray-800 shadow-sm'
                  }`}
                >
                  🖥 Share screen
                </button>
              </div>
            </div>
            {/* Right: Sidebar (~30%) */}
            <div
              className={`w-full lg:w-96 flex flex-col gap-4 p-4 backdrop-blur-md border-t lg:border-t-0 lg:border-l overflow-y-auto rounded-t-2xl lg:rounded-t-none lg:rounded-l-2xl transition-colors ${
                videoSessionTheme === 'dark'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/60 border-gray-200/80'
              }`}
            >
              {/* Student details */}
              <div
                className={`rounded-2xl backdrop-blur-sm p-4 flex-shrink-0 transition-colors ${
                  videoSessionTheme === 'dark'
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-white/80 border border-gray-200/80 shadow-sm'
                }`}
              >
                <h4 className={`font-medium mb-3 ${videoSessionTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Student details</h4>
                <p className={`text-sm ${videoSessionTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>{selectedSession.lead?.studentName}</p>
                <p className={`text-sm ${videoSessionTheme === 'dark' ? 'text-white/80' : 'text-gray-600'}`}>{selectedSession.lead?.parentName} • {selectedSession.lead?.parentMobile}</p>
                <p className={`text-sm mt-3 mb-1 ${videoSessionTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Lead status</p>
                <div className="flex gap-2">
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                    className={`flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${
                      videoSessionTheme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white placeholder-white/50'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  >
                    {LEAD_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className={videoSessionTheme === 'dark' ? 'bg-purple-900 text-white' : 'bg-white text-gray-900'}>{o.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedSession?.leadId || !leadStatus) return;
                      try {
                        await leadAPI.update(selectedSession.leadId, { status: leadStatus });
                        toast.success('Lead status updated');
                        await fetchSessions(true);
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to update lead status');
                      }
                    }}
                    className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-sm font-medium transition-colors shadow-lg shadow-fuchsia-500/20"
                  >
                    Save
                  </button>
                </div>
              </div>
              {/* Chat */}
              <div
                className={`rounded-2xl backdrop-blur-sm p-4 flex-1 min-h-0 flex flex-col min-h-[140px] transition-colors ${
                  videoSessionTheme === 'dark'
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-white/80 border border-gray-200/80 shadow-sm'
                }`}
              >
                <h4 className={`font-medium mb-2 ${videoSessionTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Chat</h4>
                <div
                  className={`flex-1 rounded-xl min-h-[80px] p-3 text-sm overflow-y-auto space-y-2 mb-3 ${
                    videoSessionTheme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-gray-50/80 border border-gray-200'
                  }`}
                >
                  {chatMessages.length === 0 ? (
                    <p className={videoSessionTheme === 'dark' ? 'text-white/60' : 'text-gray-500'}>No messages yet. Type below to send.</p>
                  ) : (
                    chatMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`text-right ${
                          videoSessionTheme === 'dark'
                            ? m.role === 'counselor' ? 'text-fuchsia-200' : 'text-white/90'
                            : m.role === 'counselor' ? 'text-fuchsia-600' : 'text-gray-700'
                        }`}
                      >
                        <span className={`block text-xs ${videoSessionTheme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{format(new Date(m.time), 'h:mm a')}</span>
                        <span className="block break-words">{m.text}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); } }}
                    placeholder="Type a message..."
                    className={`flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${
                      videoSessionTheme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white placeholder-white/50'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={sendChatMessage}
                    className="px-4 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-sm font-medium transition-colors shadow-lg shadow-fuchsia-500/20"
                  >
                    Send
                  </button>
                </div>
              </div>
              {/* Session notes */}
              <div
                className={`rounded-2xl backdrop-blur-sm p-4 flex-1 min-h-0 flex flex-col transition-colors ${
                  videoSessionTheme === 'dark'
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-white/80 border border-gray-200/80 shadow-sm'
                }`}
              >
                <h4 className={`font-medium mb-2 ${videoSessionTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Session notes</h4>
                <textarea
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="Discussion notes..."
                  className={`flex-1 min-h-[100px] w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 ${
                    videoSessionTheme === 'dark'
                      ? 'bg-white/10 border border-white/20 text-white placeholder-white/50'
                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={async () => {
                    await sessionAPI.update(selectedSession.id, { remarks: notesContent });
                    toast.success('Notes saved');
                  }}
                  className="mt-3 w-full py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-sm font-medium transition-colors shadow-lg shadow-fuchsia-500/20"
                >
                  Save notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CounselorSessions;
