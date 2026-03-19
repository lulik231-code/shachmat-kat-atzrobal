מצוין! רואה את App.js פתוח ✅
מחקי את כל התוכן (Ctrl+A ואז Delete) והדביקי את זה:
javascriptimport React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import './styles/global.css';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterChildPage from './pages/RegisterChildPage';
import RegisterTeacherPage from './pages/RegisterTeacherPage';
import WaitingApprovalPage from './pages/WaitingApprovalPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ChildDashboard from './pages/ChildDashboard';
import ChessGamePage from './pages/ChessGamePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LoadingScreen from './components/LoadingScreen';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !profile) return <Navigate to="/" replace />;
  if (!profile.is_approved) return <Navigate to="/waiting" replace />;
  if (profile.is_suspended) return <Navigate to="/waiting?suspended=true" replace />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const DashboardRoute = () => {
  const { profile } = useAuth();
  if (!profile) return <Navigate to="/" replace />;
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (profile.role === 'child') return <Navigate to="/child" replace />;
  return <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={
        user && profile && profile.is_approved ? <Navigate to="/dashboard" replace />
        : user && profile && !profile.is_approved ? <Navigate to="/waiting" replace />
        : <LandingPage />
      } />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/register/child" element={<RegisterChildPage />} />
      <Route path="/register/teacher" element={<RegisterTeacherPage />} />
      <Route path="/waiting" element={<WaitingApprovalPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/child" element={<ProtectedRoute allowedRoles={['child']}><ChildDashboard /></ProtectedRoute>} />
      <Route path="/game/:gameId" element={<ProtectedRoute><ChessGamePage /></ProtectedRoute>} />
      <Route path="/game/robot" element={<ProtectedRoute><ChessGamePage robotMode /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;Add forgot password
