import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { counselorAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CounselorLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.counselorProfile?.id || user?.counselorProfile?._id) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Use id (Prisma) or _id (Mongoose) for compatibility
      const counselorId = user?.counselorProfile?.id || user?.counselorProfile?._id;
      if (!counselorId) {
        toast.error('Counselor profile not found');
        setLoading(false);
        return;
      }
      const response = await counselorAPI.getLeads(counselorId);
      setLeads(response.data.data.leads);
    } catch (error) {
      console.error('Failed to load leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      FOLLOW_UP: 'bg-orange-100 text-orange-800',
      ENROLLED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      ON_HOLD: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Assigned Leads</h1>
        <p className="text-gray-600 mt-1">Manage leads assigned to you</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No leads assigned yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Lead ID</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Student</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Parent Contact</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Course</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-primary-600">{lead.leadId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{lead.studentName}</div>
                      <div className="text-sm text-gray-500">{lead.currentClass}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{lead.parentName}</div>
                        <div className="text-sm text-gray-500">{lead.parentMobile}</div>
                        <div className="text-xs text-gray-400">{lead.parentEmail}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {lead.course?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {format(new Date(lead.submittedAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-primary-600 hover:text-primary-700 text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselorLeads;
