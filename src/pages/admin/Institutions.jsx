import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { institutionAPI } from '../../services/api';
import toast from 'react-hot-toast';
const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'];
const STANDARD_RANGES = ['1-5', '6-10', '11-12'];
const STREAM_OPTIONS = ['Science', 'Commerce', 'Arts'];

const AdminInstitutions = () => {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingInstitution, setDeletingInstitution] = useState(null);
  const [forceDeleteDetails, setForceDeleteDetails] = useState(null); // { courses, leads } when first delete fails

  const defaultBoardsByStandard = () => ({ '1-5': [], '6-10': [], '11-12': [] });
  const defaultAdmissionsOpenByStandard = () => ({ '1-5': true, '6-10': true, '11-12': true });
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // All | School | College
  const [viewSchoolModal, setViewSchoolModal] = useState(null); // institution (School details view)
  const [openAdmissionModal, setOpenAdmissionModal] = useState(null); // { institution, admissionsOpenGrades: number[], admissionsOpenStreams: string[] }
  const [openAdmissionSaving, setOpenAdmissionSaving] = useState(false);

  const getAdmissionsByStandard = (inst) => {
    const adm = inst?.admissionsOpenByStandard;
    if (adm && typeof adm === 'object') {
      return { '1-5': adm['1-5'] !== false, '6-10': adm['6-10'] !== false, '11-12': adm['11-12'] !== false };
    }
    return defaultAdmissionsOpenByStandard();
  };

  // Grades this school offers (from boardGradeMap set at creation)
  const getSchoolOfferedGrades = (inst) => {
    const map = inst?.boardGradeMap;
    if (!map || typeof map !== 'object') return [];
    const set = new Set();
    Object.values(map).forEach((g) => {
      if (g && typeof g === 'object') {
        [].concat(g.primary || [], g.middle || [], g.high || []).forEach((n) => set.add(Number(n)));
      }
    });
    return [...set].filter((g) => g >= 1 && g <= 12).sort((a, b) => a - b);
  };

  // Grades by board (for Open Admission modal – show CBSE, State Board, IB, etc. with their grades)
  const getSchoolOfferedGradesByBoard = (inst) => {
    const map = inst?.boardGradeMap;
    if (!map || typeof map !== 'object') return [];
    return Object.entries(map)
      .filter(([, g]) => g && typeof g === 'object' && ([].concat(g.primary || [], g.middle || [], g.high || []).length > 0))
      .map(([boardName, g]) => ({
        board: boardName,
        primary: (g.primary || []).map(Number).filter((n) => n >= 1 && n <= 5).sort((a, b) => a - b),
        middle: (g.middle || []).map(Number).filter((n) => n >= 6 && n <= 10).sort((a, b) => a - b),
        high: (g.high || []).map(Number).filter((n) => n >= 11 && n <= 12).sort((a, b) => a - b),
      }));
  };

  // Per-grade admissions: prefer admissionsOpenGrades (array of 1-12), else derive from admissionsOpenByStandard
  const getAdmissionsOpenGrades = (inst) => {
    const grades = inst?.admissionsOpenGrades;
    if (Array.isArray(grades) && grades.length >= 0) {
      const nums = grades.map((g) => Number(g)).filter((g) => g >= 1 && g <= 12);
      if (nums.length > 0 || grades.length === 0) return [...new Set(nums)].sort((a, b) => a - b);
    }
    const byRange = getAdmissionsByStandard(inst);
    const out = [];
    if (byRange['1-5']) out.push(1, 2, 3, 4, 5);
    if (byRange['6-10']) out.push(6, 7, 8, 9, 10);
    if (byRange['11-12']) out.push(11, 12);
    return out;
  };

  const saveOpenAdmission = async () => {
    if (!openAdmissionModal?.institution) return;
    const inst = openAdmissionModal.institution;
    const id = inst.id || inst._id;
    const grades = Array.isArray(openAdmissionModal.admissionsOpenGrades) ? openAdmissionModal.admissionsOpenGrades : [];
    const streams = Array.isArray(openAdmissionModal.admissionsOpenStreams) ? openAdmissionModal.admissionsOpenStreams : [];
    setOpenAdmissionSaving(true);
    try {
      await institutionAPI.update(id, {
        name: inst.name,
        type: inst.type,
        address: inst.address ?? '',
        city: inst.city ?? '',
        state: inst.state ?? '',
        isActive: inst.isActive !== false,
        boardsOffered: inst.boardsOffered ?? [],
        standardsAvailable: inst.standardsAvailable ?? [],
        streamsOffered: inst.streamsOffered ?? [],
        boardsByStandard: inst.boardsByStandard ?? null,
        boardGradeMap: inst.boardGradeMap ?? null,
        logoUrl: inst.logoUrl ?? null,
        admissionsOpenGrades: grades,
        admissionsOpenStreams: streams,
      });
      toast.success('Admissions updated. Counselors can now see which grades are open.');
      setOpenAdmissionModal(null);
      fetchInstitutions();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update admissions');
    } finally {
      setOpenAdmissionSaving(false);
    }
  };

  // Single fetch on mount — empty deps to avoid duplicate API calls
  useEffect(() => {
    fetchInstitutions();
  }, []);

  const filteredInstitutions = institutions.filter((inst) => {
    const matchesSearch = !searchQuery.trim() || (inst.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchesType = typeFilter === 'All' || inst.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: institutions.length,
    colleges: institutions.filter((i) => i.type === 'College').length,
    schools: institutions.filter((i) => i.type === 'School').length,
    active: institutions.filter((i) => i.isActive).length,
  };

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const response = await institutionAPI.getAll();
      const list = response?.data?.data?.institutions;
      setInstitutions(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    navigate('/admin/institutions/create');
  };

  const handleEdit = (institution) => {
    const instId = institution.id || institution._id;
    navigate(`/admin/institutions/${instId}/edit`);
  };

  const handleDelete = (institution) => {
    setDeletingInstitution(institution);
    setForceDeleteDetails(null);
  };

  const confirmDelete = async (force = false) => {
    if (!deletingInstitution) return;
    
    setSubmitting(true);
    setForceDeleteDetails(null);
    try {
      const id = deletingInstitution.id || deletingInstitution._id;
      await institutionAPI.delete(id, force ? { force: 'true' } : {});
      toast.success('Institution deleted successfully');
      setDeletingInstitution(null);
      setForceDeleteDetails(null);
      fetchInstitutions();
    } catch (error) {
      const data = error.response?.data;
      const details = data?.details || {};
      const hasLeads = (details.leads || 0) > 0;
      const hasCourses = (details.courses || 0) > 0;

      // Only offer force delete on first attempt (not when force delete itself failed)
      if (!force && hasLeads && !hasCourses && data?.message?.includes('Cannot delete institution')) {
        setForceDeleteDetails(details);
      } else {
        toast.error(data?.message || 'Failed to delete institution');
        setForceDeleteDetails(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Premium header */}
      <div
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 rounded-2xl p-6"
        style={{
          background: 'linear-gradient(90deg, #eef2ff, #f8fafc)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#111827' }}>
            🏫 Institutions Management
          </h1>
          <p className="mt-1 text-sm sm:text-base" style={{ color: '#6B7280' }}>
            Manage all schools and colleges connected to the platform
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all hover:opacity-95 shrink-0"
          style={{ backgroundColor: '#4F46E5' }}
        >
          <span>➕</span>
          <span>Add Institution</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>🏫 Total Institutions</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#111827' }}>{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>🎓 Colleges</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#111827' }}>{stats.colleges}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>🏫 Schools</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#111827' }}>{stats.schools}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>🟢 Active</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#111827' }}>{stats.active}</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          type="text"
          placeholder="🔍 Search institution..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:flex-1 sm:min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[#111827] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5]"
        />
        <div className="flex gap-2 shrink-0">
          {['All', 'School', 'College'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setTypeFilter(opt)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                typeFilter === opt
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white border border-gray-200 text-[#6B7280] hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Institution cards */}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
        {loading ? (
          <div className="col-span-full text-center py-12 text-[#6B7280]">Loading...</div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="col-span-full text-center py-12 text-[#6B7280]">
            {institutions.length === 0 ? 'No institutions found' : 'No institutions match your search or filter'}
          </div>
        ) : (
          filteredInstitutions.map((institution) => (
            <div
              key={institution.id || institution._id}
              className="bg-white rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                padding: '20px',
              }}
            >
              {/* Top row: Logo + Name + Status */}
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {institution.logoUrl ? (
                    <>
                      <img
                        src={institution.logoUrl}
                        alt={`${institution.name} logo`}
                        className="w-12 h-12 rounded-xl object-contain bg-gray-100 shrink-0 border border-gray-200"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.classList.remove('hidden'); }}
                      />
                      <span className="hidden w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
                        {(institution.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <span className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
                      {(institution.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <h3 className="font-bold flex-1 min-w-0" style={{ fontSize: '18px', color: '#111827' }}>
                    {institution.name}
                  </h3>
                </div>
                <span
                  className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: institution.isActive ? '#DCFCE7' : '#FEE2E2',
                    color: institution.isActive ? '#166534' : '#991B1B',
                  }}
                >
                  {institution.isActive ? '🟢 Active' : 'Inactive'}
                </span>
              </div>
              <div className="mb-4">
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-[#6B7280]"
                >
                  {institution.type}
                </span>
              </div>

              {/* School-only: Boards & Grades by range */}
              {institution.type === 'School' && (
                <div className="space-y-2 text-sm mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100" style={{ color: '#6B7280' }}>
                  {institution.boardGradeMap && typeof institution.boardGradeMap === 'object' && Object.keys(institution.boardGradeMap).length > 0 ? (
                    <>
                      <p className="flex items-start gap-2">
                        <span>📚</span>
                        <span>
                          <strong className="text-[#111827]">Boards:</strong>{' '}
                          {Object.keys(institution.boardGradeMap).join(', ')}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span>🎓</span>
                        <span>
                          <strong className="text-[#111827]">Grade range:</strong>{' '}
                          {Object.values(institution.boardGradeMap)
                            .flatMap((g) => {
                              const parts = [];
                              if (Array.isArray(g?.primary) && g.primary.length > 0) parts.push('Primary');
                              if (Array.isArray(g?.middle) && g.middle.length > 0) parts.push('Middle');
                              if (Array.isArray(g?.high) && g.high.length > 0) parts.push('High');
                              return parts;
                            })
                            .filter((p, i, a) => a.indexOf(p) === i)
                            .join(' & ') || '—'}
                        </span>
                      </p>
                      {Array.isArray(institution.streamsOffered) && institution.streamsOffered.length > 0 && (
                        <p className="flex items-start gap-2">
                          <span>🔬</span>
                          <span>
                            <strong className="text-[#111827]">Streams:</strong>{' '}
                            {institution.streamsOffered.join(', ')}
                          </span>
                        </p>
                      )}
                    </>
                  ) : institution.boardsByStandard && typeof institution.boardsByStandard === 'object' ? (
                    <>
                      {['1-5', '6-10', '11-12'].map((key) => {
                        const arr = institution.boardsByStandard[key];
                        if (!Array.isArray(arr) || arr.length === 0) return null;
                        const label = key === '1-5' ? '1–5' : key === '6-10' ? '6–10' : '11–12';
                        return (
                          <p key={key} className="flex items-start gap-2">
                            <span>🎓</span>
                            <span>
                              <strong className="text-[#111827]">Grades {label}:</strong>{' '}
                              {arr.join(', ')}
                            </span>
                          </p>
                        );
                      })}
                      {Array.isArray(institution.streamsOffered) && institution.streamsOffered.length > 0 && (
                        <p className="flex items-start gap-2">
                          <span>🔬</span>
                          <span>
                            <strong className="text-[#111827]">Streams:</strong>{' '}
                            {institution.streamsOffered.join(', ')}
                          </span>
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="flex items-start gap-2">
                        <span>📚</span>
                        <span>
                          <strong className="text-[#111827]">Boards:</strong>{' '}
                          {Array.isArray(institution.boardsOffered) && institution.boardsOffered.length > 0
                            ? institution.boardsOffered.join(', ')
                            : '—'}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span>🎓</span>
                        <span>
                          <strong className="text-[#111827]">Grades:</strong>{' '}
                          {Array.isArray(institution.standardsAvailable) && institution.standardsAvailable.length > 0
                            ? institution.standardsAvailable.join(', ')
                            : '—'}
                        </span>
                      </p>
                      {Array.isArray(institution.streamsOffered) && institution.streamsOffered.length > 0 && (
                        <p className="flex items-start gap-2">
                          <span>🔬</span>
                          <span><strong className="text-[#111827]">Streams:</strong> {institution.streamsOffered.join(', ')}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Middle: Location + Courses */}
              <div className="space-y-2 text-sm mb-5" style={{ color: '#6B7280' }}>
                {(institution.city || institution.state) && (
                  <p className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{[institution.city, institution.state].filter(Boolean).join(', ') || institution.address || '—'}</span>
                  </p>
                )}
                {institution.address && !institution.city && (
                  <p className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{institution.address}</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <span>🏙</span>
                  <span>City: {institution.city || '—'}</span>
                </p>
                {institution.type !== 'School' && (
                  <p className="flex items-center gap-2">
                    <span>📚</span>
                    <span>Courses: {institution.courses?.length ?? 0}</span>
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100 flex-wrap">
                {institution.type === 'School' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewSchoolModal(institution)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-sm font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      title="View school details"
                    >
                      <span>👁</span>
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const offered = getSchoolOfferedGrades(institution);
                        const current = getAdmissionsOpenGrades(institution);
                        const filtered = current.filter((g) => offered.includes(g));
                        const offeredStreams = institution.streamsOffered ?? [];
                        const currentStreams = Array.isArray(institution.admissionsOpenStreams) ? institution.admissionsOpenStreams : offeredStreams;
                        const filteredStreams = currentStreams.filter((s) => offeredStreams.includes(s));
                        setOpenAdmissionModal({
                          institution,
                          admissionsOpenGrades: offered.length ? filtered : [],
                          admissionsOpenStreams: offeredStreams.length ? filteredStreams : [],
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-sm font-medium border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Open admission for particular classes/grades"
                    >
                      <span>🟢</span>
                      <span>Open Admission</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleEdit(institution)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-sm font-medium border-2 border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/10 transition-colors"
                >
                  <span>✏</span>
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(institution)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-sm font-medium border-2 border-red-500 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span>🗑</span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingInstitution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Institution</h2>
              {forceDeleteDetails ? (
                <>
                  <p className="text-gray-600 mb-2">
                    <strong>{deletingInstitution.name}</strong> has <strong>{forceDeleteDetails.leads}</strong> lead{forceDeleteDetails.leads !== 1 ? 's' : ''} associated with it.
                  </p>
                  <p className="text-gray-600 mb-6">
                    Do you want to delete the institution anyway? This will permanently delete the institution and all its leads. This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => { setForceDeleteDetails(null); setDeletingInstitution(null); }}
                      className="btn-secondary"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmDelete(true)}
                      className="btn-primary bg-red-600 hover:bg-red-700"
                      disabled={submitting}
                    >
                      {submitting ? 'Deleting...' : 'Yes, delete institution and leads'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete <strong>{deletingInstitution.name}</strong>? 
                    This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeletingInstitution(null)}
                      className="btn-secondary"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmDelete(false)}
                      className="btn-primary bg-red-600 hover:bg-red-700"
                      disabled={submitting}
                    >
                      {submitting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View School Details modal */}
      {viewSchoolModal && viewSchoolModal.type === 'School' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  {viewSchoolModal.logoUrl ? (
                    <img
                      src={viewSchoolModal.logoUrl}
                      alt={`${viewSchoolModal.name} logo`}
                      className="w-14 h-14 rounded-xl object-contain bg-gray-100 border border-gray-200 shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 shrink-0">
                      {(viewSchoolModal.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate">{viewSchoolModal.name}</h2>
                    <p className="text-sm text-gray-500">School details</p>
                  </div>
                </div>
                <button onClick={() => setViewSchoolModal(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 shrink-0" aria-label="Close">×</button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">School</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${viewSchoolModal.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                    {viewSchoolModal.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {(viewSchoolModal.address || viewSchoolModal.city || viewSchoolModal.state) && (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="font-medium text-gray-800 mb-1">📍 Address</p>
                    <p className="text-gray-600">
                      {[viewSchoolModal.address, viewSchoolModal.city, viewSchoolModal.state].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                )}

                {viewSchoolModal.boardGradeMap && typeof viewSchoolModal.boardGradeMap === 'object' && Object.keys(viewSchoolModal.boardGradeMap).length > 0 ? (
                  <div className="space-y-3">
                    <p className="font-medium text-gray-800">📚 Boards & grades</p>
                    {Object.entries(viewSchoolModal.boardGradeMap).map(([boardName, grades]) => {
                      const primary = Array.isArray(grades?.primary) ? [...grades.primary].sort((a, b) => a - b) : [];
                      const middle = Array.isArray(grades?.middle) ? [...grades.middle].sort((a, b) => a - b) : [];
                      const high = Array.isArray(grades?.high) ? [...grades.high].sort((a, b) => a - b) : [];
                      return (
                        <div key={boardName} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                          <h3 className="font-semibold text-gray-900 mb-2">{boardName}</h3>
                          <ul className="space-y-1.5 text-gray-700">
                            {primary.length > 0 && (
                              <li><strong>Primary (1–5):</strong> Grades {primary.join(', ')}</li>
                            )}
                            {middle.length > 0 && (
                              <li><strong>Middle (6–10):</strong> Grades {middle.join(', ')}</li>
                            )}
                            {high.length > 0 && (
                              <li><strong>High (11–12):</strong> Grades {high.join(', ')}</li>
                            )}
                            {primary.length === 0 && middle.length === 0 && high.length === 0 && (
                              <li className="text-gray-500">No grades configured</li>
                            )}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  (Array.isArray(viewSchoolModal.boardsOffered) && viewSchoolModal.boardsOffered.length > 0) || (viewSchoolModal.boardsByStandard && typeof viewSchoolModal.boardsByStandard === 'object') ? (
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                      <p className="font-medium text-gray-800 mb-2">📚 Boards</p>
                      <p className="text-gray-700">
                        {Array.isArray(viewSchoolModal.boardsOffered) && viewSchoolModal.boardsOffered.length > 0
                          ? viewSchoolModal.boardsOffered.join(', ')
                          : '—'}
                      </p>
                      {viewSchoolModal.boardsByStandard && typeof viewSchoolModal.boardsByStandard === 'object' && (
                        <div className="mt-2 space-y-1 text-gray-600">
                          {['1-5', '6-10', '11-12'].map((key) => {
                            const arr = viewSchoolModal.boardsByStandard[key];
                            if (!Array.isArray(arr) || arr.length === 0) return null;
                            const label = key === '1-5' ? 'Grades 1–5' : key === '6-10' ? 'Grades 6–10' : 'Grades 11–12';
                            return <p key={key}>{label}: {arr.join(', ')}</p>;
                          })}
                        </div>
                      )}
                    </div>
                  ) : null
                )}

                {Array.isArray(viewSchoolModal.streamsOffered) && viewSchoolModal.streamsOffered.length > 0 && (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="font-medium text-gray-800 mb-1">🔬 Streams (11–12)</p>
                    <p className="text-gray-600">{viewSchoolModal.streamsOffered.join(', ')}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setViewSchoolModal(null)} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700">Close</button>
                <button onClick={() => { setViewSchoolModal(null); handleEdit(viewSchoolModal); }} className="px-4 py-2 rounded-lg bg-[#4F46E5] text-white hover:opacity-90">Edit school</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open Admission modal – set which specific grades (1–12) have admissions open (visible to counselors) */}
      {openAdmissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Open Admission – {openAdmissionModal.institution.name}</h2>
                <button onClick={() => setOpenAdmissionModal(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">×</button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Choose which grades and streams have admissions open. Only options offered by this school (set at creation) are listed.</p>
              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                {(() => {
                  const inst = openAdmissionModal.institution;
                  const byBoard = getSchoolOfferedGradesByBoard(inst);
                  const offeredStreams = Array.isArray(inst.streamsOffered) ? inst.streamsOffered : [];
                  if (!byBoard.length && !offeredStreams.length) {
                    return (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        No boards, grades or streams configured for this school. Edit the school and set boards, grades & streams first.
                      </p>
                    );
                  }
                  const openGrades = openAdmissionModal.admissionsOpenGrades || [];
                  const openSet = new Set(openGrades.map(Number));
                  const openStreams = openAdmissionModal.admissionsOpenStreams || [];
                  const openStreamSet = new Set(openStreams);
                  const toggleGrade = (grade) => {
                    const prev = openAdmissionModal.admissionsOpenGrades || [];
                    const checked = openSet.has(grade);
                    const next = checked ? prev.filter((g) => Number(g) !== grade) : [...prev, grade].map(Number).sort((a, b) => a - b);
                    setOpenAdmissionModal((p) => ({ ...p, admissionsOpenGrades: next }));
                  };
                  const selectAllForBoard = (boardGrades, checked) => {
                    const prev = openAdmissionModal.admissionsOpenGrades || [];
                    const prevSet = new Set(prev.map(Number));
                    const nextSet = new Set(prevSet);
                    boardGrades.forEach((g) => (checked ? nextSet.add(g) : nextSet.delete(g)));
                    const next = [...nextSet].sort((a, b) => a - b);
                    setOpenAdmissionModal((p) => ({ ...p, admissionsOpenGrades: next }));
                  };
                  const toggleStream = (stream) => {
                    const prev = openAdmissionModal.admissionsOpenStreams || [];
                    const next = openStreamSet.has(stream) ? prev.filter((s) => s !== stream) : [...prev, stream];
                    setOpenAdmissionModal((p) => ({ ...p, admissionsOpenStreams: next }));
                  };
                  const selectAllStreams = (checked) => {
                    setOpenAdmissionModal((p) => ({ ...p, admissionsOpenStreams: checked ? [...offeredStreams] : [] }));
                  };
                  const allStreamsSelected = offeredStreams.length > 0 && offeredStreams.every((s) => openStreamSet.has(s));
                  const someStreamsSelected = offeredStreams.some((s) => openStreamSet.has(s));
                  return (
                    <>
                      {byBoard.map(({ board, primary, middle, high }) => {
                        const allGrades = [...primary, ...middle, ...high].filter((g) => g >= 1 && g <= 12).sort((a, b) => a - b);
                        if (!allGrades.length) return null;
                        const allSelected = allGrades.every((g) => openSet.has(g));
                        const someSelected = allGrades.some((g) => openSet.has(g));
                        return (
                          <div key={board} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Grades for {board}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 shrink-0 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  ref={(el) => el && (el.indeterminate = someSelected && !allSelected)}
                                  onChange={() => selectAllForBoard(allGrades, !allSelected)}
                                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>Select All</span>
                              </label>
                              <span className="text-gray-500 text-sm">(Grades 1–12)</span>
                              {allGrades.map((grade) => (
                                <label key={`${board}-${grade}`} className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-sm">
                                  <input
                                    type="checkbox"
                                    checked={openSet.has(grade)}
                                    onChange={() => toggleGrade(grade)}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="text-gray-700">Grade {grade}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {offeredStreams.length > 0 && (
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Streams (for 11–12)</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 shrink-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allStreamsSelected}
                                ref={(el) => el && (el.indeterminate = someStreamsSelected && !allStreamsSelected)}
                                onChange={() => selectAllStreams(!allStreamsSelected)}
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>Select All</span>
                            </label>
                            {offeredStreams.map((stream) => (
                              <label key={stream} className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={openStreamSet.has(stream)}
                                  onChange={() => toggleStream(stream)}
                                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-gray-700">{stream}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setOpenAdmissionModal(null)} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700">Cancel</button>
                <button onClick={saveOpenAdmission} disabled={openAdmissionSaving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50">
                  {openAdmissionSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInstitutions;
