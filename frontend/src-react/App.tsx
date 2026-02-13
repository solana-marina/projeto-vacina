import React from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { RoleRoute } from './components/routing/RoleRoute';
import { useAuth } from './context/AuthContext';
import { AdminMonitoringPage } from './features/admin/AdminMonitoringPage';
import { AdminSchedulePage } from './features/admin/AdminSchedulePage';
import { AdminSchoolsPage } from './features/admin/AdminSchoolsPage';
import { AdminUsersPage } from './features/admin/AdminUsersPage';
import { LoginPage } from './features/auth/LoginPage';
import { ActiveSearchPage } from './features/health/ActiveSearchPage';
import { DashboardsPage } from './features/health/DashboardsPage';
import { PendingPage } from './features/school/PendingPage';
import { StudentDetailPage } from './features/school/StudentDetailPage';
import { StudentsPage } from './features/school/StudentsPage';
import { HEALTH_ROLES, SCHOOL_ROLES } from './lib/constants';

function RootRedirect() {
  const { isAuthenticated, getDefaultRoute } = useAuth();
  return <Navigate to={isAuthenticated ? getDefaultRoute() : '/auth/login'} replace />;
}

function AppShell() {
  const location = useLocation();
  return (
    <MainLayout currentPath={location.pathname}>
      <Outlet />
    </MainLayout>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/auth/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/school" element={<Navigate to="/school/students" replace />} />
          <Route
            path="/school/students"
            element={
              <RoleRoute allowed={SCHOOL_ROLES}>
                <StudentsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/school/students/:id"
            element={
              <RoleRoute allowed={SCHOOL_ROLES}>
                <StudentDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="/school/pending"
            element={
              <RoleRoute allowed={SCHOOL_ROLES}>
                <PendingPage />
              </RoleRoute>
            }
          />

          <Route path="/health" element={<Navigate to="/health/search" replace />} />
          <Route
            path="/health/search"
            element={
              <RoleRoute allowed={HEALTH_ROLES}>
                <ActiveSearchPage />
              </RoleRoute>
            }
          />
          <Route
            path="/health/dashboards"
            element={
              <RoleRoute allowed={HEALTH_ROLES}>
                <DashboardsPage />
              </RoleRoute>
            }
          />

          <Route path="/admin" element={<Navigate to="/admin/students" replace />} />
          <Route
            path="/admin/students"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <StudentsPage adminMode />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/students/:id"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <StudentDetailPage adminMode />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/schools"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <AdminSchoolsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <AdminUsersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/schedule"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <AdminSchedulePage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/dashboards"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <DashboardsPage adminMode />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/monitoring"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <AdminMonitoringPage />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>

      <Toaster position="top-right" richColors />
    </>
  );
}
