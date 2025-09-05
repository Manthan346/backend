import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import AdminPage from './pages/Admin';
import SubjectManagement from './components/admin/SubjectManagement';
import { useAuth } from './hooks/useAuth';

const ProtectedRouteWithRoles = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRouteWithRoles roles={['student', 'teacher', 'admin']}>
              <Dashboard />
            </ProtectedRouteWithRoles>
          }
        />
        <Route
          path="/tests"
          element={
            <ProtectedRouteWithRoles roles={['teacher', 'admin']}>
              <Tests />
            </ProtectedRouteWithRoles>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRouteWithRoles roles={['admin']}>
              <AdminPage />
            </ProtectedRouteWithRoles>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRouteWithRoles roles={['teacher', 'admin']}>
              <SubjectManagement />
            </ProtectedRouteWithRoles>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
