import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ChildDashboard from './pages/ChildDashboard';

function AppRouter() {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1a0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 60, animation: 'spin 2s linear infinite' }}>♟️</div>
      <div style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 24 }}>טוען...</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user || !profile) return <AuthPage />;

  if (profile.role === 'admin') return <AdminDashboard />;
  if (profile.role === 'teacher') return <TeacherDashboard />;
  return <ChildDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
