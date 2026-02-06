import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    if (error.response?.status === 404) {
      console.error('404 Error:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        response: error.response?.data
      });
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    
    // Handle 404 with better error message
    if (error.response?.status === 404) {
      const message = error.response?.data?.message || 'Route not found';
      error.message = message;
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (username, password, role = null) => {
    const endpoint = role === 'ADMIN' ? '/auth/admin/login' : '/auth/login';
    return api.post(endpoint, { username, password });
  },
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Lead APIs
export const leadAPI = {
  create: (data) => api.post('/leads', data),
  getAll: (params) => api.get('/leads', { params }),
  search: (query, params = {}) => api.get('/leads/search', { params: { q: query, ...params } }),
  exportTemplate: () =>
    api.get('/leads/export-template', { responseType: 'blob' }),
  export: (params) =>
    api.get('/leads/export', { params, responseType: 'blob' }),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/leads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importPreview: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/leads/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importExecute: (file, duplicateDecisions = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicateDecisions', JSON.stringify(duplicateDecisions));
    return api.post('/leads/import/execute', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importErrorReport: (errorReportRows) =>
    api.post('/leads/import/error-report', { errorReportRows }, { responseType: 'blob' }),
  getFormFields: () => api.get('/leads/form-fields'),
  getById: (id) => api.get(`/leads/${id}`),
  delete: (id) => api.delete(`/leads/${id}`),
  update: (id, data) => api.put(`/leads/${id}`, data),
  assign: (id, counselorId, reason) =>
    api.post(`/leads/${id}/assign`, { counselorId, reason }),
  getAvailableCounselors: (params) => api.get('/leads/available-counselors', { params }),
  getStats: () => api.get('/leads/stats/overview'),
};

// Counselor APIs
export const counselorAPI = {
  getAll: (params) => api.get('/counselors', { params }),
  getAllForAssignment: () => api.get('/counselors/all'), // Get ALL counselors for manual assignment
  exportTemplate: () =>
    api.get('/counselors/export-template', { responseType: 'blob' }),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/counselors/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getById: (id) => api.get(`/counselors/${id}`),
  create: (data) => api.post('/counselors', data),
  update: (id, data) => api.put(`/counselors/${id}`, data),
  delete: (id) => api.delete(`/counselors/${id}`),
  getLeads: (id) => api.get(`/counselors/${id}/leads`),
  getStats: (id) => api.get(`/counselors/${id}/stats`),
  getNewLeadsCount: (id) => api.get(`/counselors/${id}/new-leads-count`),
  filterByLanguage: (language, availability) => api.get('/counselors/filter', { 
    params: { language, availability } 
  }),
};

// Institution APIs
export const institutionAPI = {
  getAll: (params) => api.get('/institutions', { params }),
  getById: (id) => api.get(`/institutions/${id}`),
  create: (data) => api.post('/institutions', data),
  update: (id, data) => api.put(`/institutions/${id}`, data),
  delete: (id, options = {}) => {
    const qs = options.force ? '?force=true' : '';
    return api.delete(`/institutions/${id}${qs}`);
  },
};

// Course APIs
export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getAllGrouped: (params) => api.get('/courses', { params: { ...params, grouped: 'true' } }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Session APIs
export const sessionAPI = {
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  create: (data) => api.post('/sessions', data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
};

// Training APIs
export const trainingAPI = {
  getAll: (params) => api.get('/training', { params }),
  getById: (id) => api.get(`/training/${id}`),
  create: (formData) => api.post('/training', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/training/${id}`, data),
  delete: (id) => api.delete(`/training/${id}`),
};

// Todo APIs
export const todoAPI = {
  getAll: (params) => api.get('/todos', { params }),
  getById: (id) => api.get(`/todos/${id}`),
  create: (data) => api.post('/todos', data),
  update: (id, data) => api.put(`/todos/${id}`, data),
  delete: (id) => api.delete(`/todos/${id}`),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
  createUser: (data) => api.post('/admin/users', data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
};

// School APIs (Phase-1)
export const schoolAPI = {
  getAll: (params) => api.get('/schools', { params }),
  getById: (id) => api.get(`/schools/${id}`),
  create: (data) => api.post('/schools', data),
  update: (id, data) => api.put(`/schools/${id}`, data),
  delete: (id) => api.delete(`/schools/${id}`),
  addPocket: (id, data) => api.post(`/schools/${id}/pockets`, data),
};

// Presence APIs (Phase-1)
export const presenceAPI = {
  recordLogin: () => api.post('/presence/login'),
  updateActivity: () => api.post('/presence/activity'),
  getStatus: (counselorId) => api.get('/presence/status', { params: { counselorId } }),
  getActive: () => api.get('/presence/active'),
  getAttendance: (date) => api.get('/presence/attendance', { params: { date } }),
  getAbsent: (date) => api.get('/presence/absent', { params: { date } }),
  checkInactivity: (counselorId) => api.post('/presence/check-inactivity', { counselorId }),
  checkAllInactivity: () => api.post('/presence/check-all-inactivity'),
  getInactivityAlerts: () => api.get('/presence/inactivity-alerts'),
};

// Training Module APIs (Phase-1)
export const trainingModuleAPI = {
  getAll: (params) => api.get('/training-modules', { params }),
  getById: (id) => api.get(`/training-modules/${id}`),
  create: (formData) => api.post('/training-modules', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/training-modules/${id}`, data),
  delete: (id) => api.delete(`/training-modules/${id}`),
  updateProgress: (id, status) => api.post(`/training-modules/${id}/progress`, { status }),
  getProgress: (id) => api.get(`/training-modules/${id}/progress`),
};

// Question-Response APIs (Phase-1)
export const questionAPI = {
  getAll: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  submitResponse: (id, data) => api.post(`/questions/${id}/responses`, data),
  addScore: (responseId, data) => api.post(`/responses/${responseId}/scores`, data),
  getCounselorResponses: (counselorId) => api.get(`/counselors/${counselorId}/responses`),
};

// Management APIs (Phase-1)
export const managementAPI = {
  getDashboard: () => api.get('/management/dashboard'),
  getAttendanceReport: (params) => api.get('/management/attendance-report', { params }),
  getReleasedAppointments: () => api.get('/management/released-appointments'),
  reassignAppointment: (data) => api.post('/management/reassign-appointment', data),
  getCounselorPerformance: (counselorId) => api.get('/management/counselor-performance', { params: { counselorId } }),
};

export default api;
