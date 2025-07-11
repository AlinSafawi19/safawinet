import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import BackupCodeModal from '../components/BackupCodeModal';
import logo from '../assets/images/logo.png';
import ButtonLoadingOverlay from '../components/ButtonLoadingOverlay';
import { showErrorToast } from '../utils/sweetAlertConfig';
import { FiEye, FiEyeOff, FiShield, FiKey } from 'react-icons/fi';
import { FaLock } from 'react-icons/fa';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [identifierType, setIdentifierType] = useState('username');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showBackupCodeModal, setShowBackupCodeModal] = useState(false);
  const [backupCode, setBackupCode] = useState('');

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
      showErrorToast('Validation Error', 'Please enter your username, email, or phone number');
      return false;
    }

    if (!formData.password) {
      showErrorToast('Validation Error', 'Please enter your password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e, overrideBackupCode) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Use overrideBackupCode if provided, otherwise use backupCode from state
    const codeToUse = overrideBackupCode !== undefined ? overrideBackupCode : backupCode;

    try {
      const loginData = {
        identifier: formData.identifier.trim(),
        password: formData.password,
        rememberMe
      };

      if (twoFactorCode) {
        loginData.twoFactorCode = twoFactorCode;
      }

      if (codeToUse) {
        loginData.backupCode = codeToUse;
      }

      console.log('Login attempt with data:', {
        identifier: loginData.identifier,
        hasPassword: !!loginData.password,
        rememberMe: loginData.rememberMe,
        hasTwoFactorCode: !!loginData.twoFactorCode,
        hasBackupCode: !!loginData.backupCode,
        backupCode: loginData.backupCode,
        twoFactorCode: loginData.twoFactorCode
      });

      console.log('Current backupCode state:', backupCode, 'Override backupCode:', overrideBackupCode);

      const result = await authService.login(
        formData.identifier.trim(),
        formData.password,
        rememberMe,
        twoFactorCode,
        codeToUse
      );

      console.log('Login result:', result);

      if (result.success) {
        console.log('Login successful, calling onLoginSuccess');
        setAttempts(0);
        setRequiresTwoFactor(false);
        setTwoFactorCode('');
        setBackupCode('');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setAttempts(0);
      } else {
        showErrorToast('Login Failed', result.message);

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
      showErrorToast('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const { name } = e.target;

      // Navigate to next field or submit form
      switch (name) {
        case 'identifier':
          if (formData.identifier.trim()) {
            document.getElementById('password').focus();
          } else {
            // Stay on current field if empty
            return;
          }
          break;

        case 'password':
          if (formData.password.trim()) {
            // Submit form if password is filled
            handleSubmit(e);
          } else {
            // Stay on current field if empty
            return;
          }
          break;

        default:
          // For any other field, submit the form
          handleSubmit(e);
          break;
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src={logo} alt="SafawiNet Logo" className="logo-image" />
          </div>
          <p className="auth-welcome"><b>Welcome to SafawiNet!</b> Please sign in to continue</p>
        </div>

        {isBlocked && (
          <div className="auth-blocked">
            <span className="blocked-icon"><FaLock /></span>
            Too many login attempts. Please try again in {formatTime(blockTime)}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!requiresTwoFactor && (
            <>
              <div className="form-group">
                <input
                  type={getInputType()}
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleIdentifierChange}
                  onKeyPress={handleKeyPress}
                  placeholder=" "
                  disabled={isLoading || isBlocked}
                  autoComplete="username"
                  className="form-input"
                />
                <label htmlFor="identifier" className="form-label">{getLabel()}</label>
              </div>
            </>
          )}

          {!requiresTwoFactor && (
            <div className="form-group">
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder=" "
                  disabled={isLoading || isBlocked}
                  autoComplete="current-password"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isBlocked}
                  className="input-toggle-btn"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <label htmlFor="password" className="form-label">Password</label>
            </div>
          )}

          {requiresTwoFactor && (
            <div className="form-group">
              <div className="auth-2fa-notice">
                <FiShield />
                <span>Two-factor authentication required</span>
              </div>
              <div className="input-group">
                <input
                  type="text"
                  id="twoFactorCode"
                  name="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder=" "
                  disabled={isLoading || isBlocked}
                  autoComplete="one-time-code"
                  className="form-input verification-input"
                  maxLength="6"
                  pattern="[0-9]{6}"
                />
                <label htmlFor="twoFactorCode" className="form-label">6-digit code</label>
              </div>
              
              <div className="backup-code-section">
                <div className="backup-code-divider">
                  <span>or</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBackupCodeModal(true)}
                  disabled={isLoading || isBlocked}
                  className="btn btn-secondary btn-sm backup-code-btn"
                >
                  <FiKey />
                  Use Backup Code
                </button>
              </div>
            </div>
          )}

          {!requiresTwoFactor && (
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading || isBlocked}
                  className="form-checkbox"
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              <button
                type="button"
                disabled={isLoading || isBlocked}
                onClick={() => setShowForgotPassword(true)}
                className="link-btn"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isBlocked}
            className="btn btn-primary btn-full"
          >
            {isLoading ? <ButtonLoadingOverlay isLoading={isLoading} /> : 'Sign In'}
          </button>
        </form>

        {attempts > 0 && !isBlocked && (
          <div className="auth-attempts">
            <span className="attempts-count">Failed login attempts: {attempts}/5</span>
            <span className="attempts-warning">
              {attempts >= 3 ? 'Account will be temporarily locked after 5 attempts' : 'Please check your credentials'}
            </span>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          // Optionally show a success message
        }}
      />

      {/* Backup Code Modal */}
      <BackupCodeModal
        isOpen={showBackupCodeModal}
        onClose={() => setShowBackupCodeModal(false)}
        onSuccess={(data) => {
          console.log('BackupCodeModal onSuccess called with:', data);
          setShowBackupCodeModal(false);
          setTimeout(() => {
            console.log('Submitting form with backup code:', data.backupCode);
            handleSubmit(null, data.backupCode);
          }, 100);
        }}
        onCancel={() => setShowBackupCodeModal(false)}
      />
    </div>
  );
};

export default Login; 