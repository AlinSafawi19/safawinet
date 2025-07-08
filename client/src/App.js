import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LoadingOverlay from './components/LoadingOverlay';
import authService from './services/authService';

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
        <LoadingOverlay isLoading={true} />
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
        <LoadingOverlay isLoading={true} />
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

  return <Dashboard onLogout={handleLogout} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
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
