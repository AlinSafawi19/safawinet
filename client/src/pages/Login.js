import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import '../styles/Login.css';
import logo from '../assets/images/logo.png';
import ButtonLoadingOverlay from '../components/ButtonLoadingOverlay';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifierType, setIdentifierType] = useState('username');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isUserAuthenticated()) {
        const isValid = await authService.validateToken();
        if (isValid && onLoginSuccess) {
          onLoginSuccess();
        }
      }
    };
    checkAuth();
  }, [onLoginSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleIdentifierChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      identifier: value
    }));

    // Auto-detect input type
    if (value.includes('@')) {
      setIdentifierType('email');
    } else if (/^\d+$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
      setIdentifierType('phone');
    } else {
      setIdentifierType('username');
    }

    setError(''); // Clear error when user types
  };

  const getInputType = () => {
    switch (identifierType) {
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  };

  const getPlaceholder = () => {
    switch (identifierType) {
      case 'email':
        return 'Enter your email';
      case 'phone':
        return 'Enter your phone number';
      default:
        return 'Enter your username, email, or phone';
    }
  };

  const getLabel = () => {
    switch (identifierType) {
      case 'email':
        return 'Email';
      case 'phone':
        return 'Phone Number';
      default:
        return 'Username, Email, or Phone';
    }
  };

  const validateForm = () => {
    if (!formData.identifier.trim()) {
      setError('Please enter your username, email, or phone number');
      return false;
    }

    if (!formData.password) {
      setError('Please enter your password');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(
        formData.identifier.trim(),
        formData.password,
        rememberMe
      );

      if (result.success) {
        setAttempts(0);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setError(result.message);

        if (result.retryAfter) {
          setIsBlocked(true);
          setBlockTime(result.retryAfter);

          // Countdown timer
          const timer = setInterval(() => {
            setBlockTime(prev => {
              if (prev <= 1) {
                setIsBlocked(false);
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setAttempts(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <img src={logo} alt="SafawiNet Logo" className="logo-image-login" />
          </div>
          <p><b>Welcome to SafawiNet!</b> Please sign in to continue</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {isBlocked && (
          <div className="blocked-message">
            <span className="blocked-icon">🔒</span>
            Too many login attempts. Please try again in {formatTime(blockTime)}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="identifier">{getLabel()}</label>
            <input
              type={getInputType()}
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleIdentifierChange}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholder()}
              disabled={isLoading || isBlocked}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                disabled={isLoading || isBlocked}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || isBlocked}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading || isBlocked}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="forgot-password"
              disabled={isLoading || isBlocked}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading || isBlocked}
            style={{ position: 'relative', minHeight: '44px' }}
          >
            <span style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
              Sign In
            </span>
            {isLoading && (
              <ButtonLoadingOverlay isLoading={true} />
            )}
          </button>
        </form>

        {attempts > 0 && !isBlocked && (
          <div className="attempts-warning">
            Failed login attempts: {attempts}/5
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 