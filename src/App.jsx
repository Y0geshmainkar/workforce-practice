import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import AgentDashboard from './pages/AgentDashboard';
import ClientDashboard from './pages/ClientDashboard';
import PolicyList from './pages/PolicyList';
import PolicyDetail from './pages/PolicyDetail';
import CreateEditPolicy from './pages/CreateEditPolicy';
import ClientList from './pages/ClientList';
import AddClient from './pages/AddClient';
import Reminders from './pages/Reminders';
import { useAuth } from './context/AuthContext';

function RoleRedirect() {
  const { role } = useAuth();
  if (role === 'ADMIN') return <AgentDashboard />;
  return <ClientDashboard />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Both roles */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<RoleRedirect />} />
                <Route path="/policies/:id" element={<PolicyDetail />} />
                <Route path="/reminders" element={<Reminders />} />
              </Route>

              {/* ADMIN only */}
              <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route path="/policies" element={<PolicyList />} />
                <Route path="/policies/new" element={<CreateEditPolicy />} />
                <Route path="/policies/:id/edit" element={<CreateEditPolicy />} />
                <Route path="/clients" element={<ClientList />} />
                <Route path="/clients/new" element={<AddClient />} />
              </Route>

              {/* Default */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
