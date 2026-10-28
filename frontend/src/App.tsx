import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Auth
import { AppLayout } from './components/AppLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Protected Application Pages
import { DashboardPage } from './pages/DashboardPage';
import { CustomerDirectoryPage } from './pages/CustomerDirectoryPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { DataImportPage } from './pages/DataImportPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { ModelWorkspacePage } from './pages/ModelWorkspacePage';
import { CustomerSegmentationPage } from './pages/CustomerSegmentationPage';
import { ChurnInvestigatorPage } from './pages/ChurnInvestigatorPage';
import { DecisionLabPage } from './pages/DecisionLabPage';
import { CampaignTrackingPage } from './pages/CampaignTrackingPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpMethodologyPage } from './pages/HelpMethodologyPage';

// Simple Protected Route check
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('retainiq_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected App Workspace */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect to Dashboard */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers" element={<CustomerDirectoryPage />} />
          <Route path="customers/:id" element={<CustomerProfilePage />} />
          <Route path="import" element={<DataImportPage />} />
          <Route path="quality" element={<DataQualityPage />} />
          <Route path="segments" element={<CustomerSegmentationPage />} />
          <Route path="models" element={<ModelWorkspacePage />} />
          <Route path="investigator" element={<ChurnInvestigatorPage />} />
          <Route path="decision-lab" element={<DecisionLabPage />} />
          <Route path="campaigns" element={<CampaignTrackingPage />} />
          <Route path="assistant" element={<AIAssistantPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="methodology" element={<HelpMethodologyPage />} />
        </Route>

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
