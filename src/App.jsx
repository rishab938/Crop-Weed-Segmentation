import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ProtectedLayout } from './components/layout/ProtectedLayout';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Authenticated Application Pages
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import NewAnalysisPage from './pages/NewAnalysisPage';
import { ProcessingPipelinePage } from './pages/ProcessingPipelinePage';
import { FieldAnalysisPage } from './pages/FieldAnalysisPage';
import { TreatmentRoutePage } from './pages/TreatmentRoutePage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { SettingsPage } from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Marketing */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Flows */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Authenticated Application Shell Routes */}
          <Route
            element={
              <ProtectedRoute>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/analysis/new" element={<NewAnalysisPage />} />
            <Route path="/analysis/:id/processing" element={<ProcessingPipelinePage />} />
            <Route path="/analysis/:id" element={<FieldAnalysisPage />} />
            <Route path="/analysis/:id/treatment" element={<TreatmentRoutePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
