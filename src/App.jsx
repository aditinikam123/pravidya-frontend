import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts (small, always needed for shell)
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import CounselorLayout from './layouts/CounselorLayout';
import ManagementLayout from './layouts/ManagementLayout';

// Lazy-load pages for faster initial load (code splitting)
const AdmissionForm = lazy(() => import('./pages/public/AdmissionForm'));
const ThankYou = lazy(() => import('./pages/public/ThankYou'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const CounselorLogin = lazy(() => import('./pages/auth/CounselorLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminLeads = lazy(() => import('./pages/admin/Leads'));
const AdminCounselors = lazy(() => import('./pages/admin/Counselors'));
const AdminInstitutions = lazy(() => import('./pages/admin/Institutions'));
const CreateInstitution = lazy(() => import('./pages/admin/CreateInstitution'));
const EditInstitution = lazy(() => import('./pages/admin/EditInstitution'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const TrainingModules = lazy(() => import('./pages/admin/TrainingModules'));
const CounselorDashboard = lazy(() => import('./pages/counselor/Dashboard'));
const ManagementDashboard = lazy(() => import('./pages/management/Dashboard'));
const Questions = lazy(() => import('./pages/management/Questions'));
const CounselorLeads = lazy(() => import('./pages/counselor/Leads'));
const CounselorSessions = lazy(() => import('./pages/counselor/Sessions'));
const CounselorTraining = lazy(() => import('./pages/counselor/Training'));
const CounselorTodos = lazy(() => import('./pages/counselor/Todos'));
const CounselorSchools = lazy(() => import('./pages/counselor/Schools'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]" aria-label="Loading">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<AdmissionForm />} />
            <Route path="/admission" element={<AdmissionForm />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/counselor/login" element={<CounselorLogin />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="counselors" element={<AdminCounselors />} />
            <Route path="institutions" element={<AdminInstitutions />} />
            <Route path="institutions/create" element={<CreateInstitution />} />
            <Route path="institutions/:id/edit" element={<EditInstitution />} />
            <Route path="courses" element={<Navigate to="/admin/institutions" replace />} />
            <Route path="training" element={<Navigate to="/admin/training-modules" replace />} />
            <Route path="training-modules" element={<TrainingModules />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Management Routes */}
          <Route
            path="/management"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGEMENT']}>
                <ManagementLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/management/dashboard" replace />} />
            <Route path="dashboard" element={<ManagementDashboard />} />
            <Route path="questions" element={<Questions />} />
          </Route>

          {/* Counselor Routes */}
          <Route
            path="/counselor"
            element={
              <ProtectedRoute allowedRoles={['COUNSELOR']}>
                <CounselorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/counselor/dashboard" replace />} />
            <Route path="dashboard" element={<CounselorDashboard />} />
            <Route path="leads" element={<CounselorLeads />} />
            <Route path="sessions" element={<CounselorSessions />} />
            <Route path="training" element={<CounselorTraining />} />
            <Route path="todos" element={<CounselorTodos />} />
            <Route path="schools" element={<CounselorSchools />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
