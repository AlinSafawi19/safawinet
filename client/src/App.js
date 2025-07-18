import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import './styles/Modal.css';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import authService from './services/authService';
import AuditLogs from './pages/AuditLogs';
import KnowledgeGuide from './pages/KnowledgeGuide';
import EmailVerification from './pages/EmailVerification';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Users from './pages/Users';
import CreateUser from './pages/CreateUser';
import RoleTemplates from './pages/RoleTemplates';
import EditUser from './pages/EditUser';
import { applyUserTheme } from './utils/themeUtils';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use routing-specific auth check that doesn't validate token
        const isAuth = authService.isAuthenticatedForRouting();
        console.log('ProtectedRoute auth check:', isAuth);
        setIsAuthenticated(isAuth);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="App">

      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Login Page component
const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is already authenticated for routing
        const isAuth = authService.isAuthenticatedForRouting();
        console.log('LoginPage auth check:', isAuth);
        if (isAuth) {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLoginSuccess = () => {
    console.log('Login successful, redirecting to dashboard');
    navigate('/dashboard', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="App">

      </div>
    );
  }

  return (
    <div className="App">
      <Login onLoginSuccess={handleLoginSuccess} />
    </div>
  );
};

// Dashboard Page component
const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login', { replace: true });
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <Dashboard />
    </DashboardLayout>
  );
};

// Audit Logs Page component
const AuditLogsPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login', { replace: true });
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <AuditLogs />
    </DashboardLayout>
  );
};

// Knowledge Guide Page component
const KnowledgeGuidePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login', { replace: true });
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <KnowledgeGuide />
    </DashboardLayout>
  );
};

// Profile Page component
const ProfilePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login', { replace: true });
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <Profile />
    </DashboardLayout>
  );
};

// Users Page component
const UsersPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login', { replace: true });
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <Users />
    </DashboardLayout>
  );
};

// Create User Page component
const CreateUserPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login', { replace: true });
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <CreateUser />
    </DashboardLayout>
  );
};

// Role Templates Page component
const RoleTemplatesPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login', { replace: true });
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <RoleTemplates />
    </DashboardLayout>
  );
};

function App() {
  // Apply user theme on app load
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      applyUserTheme(user);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/knowledge-guide"
          element={
            <ProtectedRoute>
              <KnowledgeGuidePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/create"
          element={
            <ProtectedRoute>
              <CreateUserPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EditUser />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/role-templates"
          element={
            <ProtectedRoute>
              <RoleTemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
