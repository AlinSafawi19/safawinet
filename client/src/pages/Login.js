import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import BackupCodeModal from '../components/BackupCodeModal';
import FloatingInput from '../components/FloatingInput';
import Checkbox from '../components/Checkbox';
import { showErrorToast } from '../utils/sweetAlertConfig';
import { FiShield, FiKey } from 'react-icons/fi';
import { FaLock } from 'react-icons/fa';
import '../styles/pageoneform.css';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    identifier: '',
    password: '',
    twoFactorCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [identifierType, setIdentifierType] = useState('username');
  const [rememberMe, setRememberMe] = useState(false);
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

  const clearErrors = () => {
    setErrors({
      identifier: '',
      password: '',
      twoFactorCode: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleIdentifierChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      identifier: value
    }));

    // Clear identifier error when user starts typing
    if (errors.identifier) {
      setErrors(prev => ({
        ...prev,
        identifier: ''
      }));
    }

    // Auto-detect input type
    if (value.includes('@')) {
      setIdentifierType('email');
    } else if (/^\d+$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
      setIdentifierType('phone');
    } else {
      setIdentifierType('username');
    }
  };

  const handleTwoFactorCodeChange = (e) => {
    const value = e.target.value;
    setTwoFactorCode(value);

    // Clear two-factor error when user starts typing
    if (errors.twoFactorCode) {
      setErrors(prev => ({
        ...prev,
        twoFactorCode: ''
      }));
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
    const newErrors = {
      identifier: '',
      password: '',
      twoFactorCode: ''
    };
    let isValid = true;

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Please enter your username, email, or phone number';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Please enter your password';
      isValid = false;
    }

    if (requiresTwoFactor && !twoFactorCode.trim()) {
      newErrors.twoFactorCode = 'Please enter your 6-digit authentication code';
      isValid = false;
    }

    if (requiresTwoFactor && twoFactorCode.trim() && !/^\d{6}$/.test(twoFactorCode.trim())) {
      newErrors.twoFactorCode = 'Please enter a valid 6-digit code';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e, overrideBackupCode) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    clearErrors();

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

      const result = await authService.login(
        formData.identifier.trim(),
        formData.password,
        rememberMe,
        twoFactorCode,
        codeToUse
      );

      if (result.success) {
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
        // Handle specific field errors from server response
        if (result.fieldErrors) {
          setErrors(prev => ({
            ...prev,
            ...result.fieldErrors
          }));
        } else {
          showErrorToast('Login Failed', result.message);
        }

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

        case 'twoFactorCode':
          if (twoFactorCode.trim()) {
            // Submit form if two-factor code is filled
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
    <div className="container">
      <div className="container-card">
        <div className="container-header">
          <div className="container-logo">
            <span className="text-logo">
              Permissions<span className="text-logo-colored">System</span>
            </span>
          </div>
          <p className="sub-text"><b>Welcome to PermissionsSystem!</b> Please sign in to continue</p>
        </div>

        {isBlocked && (
          <div className="warning-text">
            <FaLock /> Too many login attempts. Please try again in {formatTime(blockTime)}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="container-form">
          {!requiresTwoFactor && (
            <FloatingInput
              type={getInputType()}
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleIdentifierChange}
              onKeyPress={handleKeyPress}
              label={getLabel()}
              error={errors.identifier}
              disabled={isLoading || isBlocked}
              autoComplete="username"
            />
          )}

          {!requiresTwoFactor && (
            <FloatingInput
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              label="Password"
              error={errors.password}
              disabled={isLoading || isBlocked}
              autoComplete="current-password"
            />
          )}

          {requiresTwoFactor && (
            <div className="form-group">
              <div className="title-text">
                <FiShield />
                Two-factor authentication required
              </div>
              <FloatingInput
                type="text"
                id="twoFactorCode"
                name="twoFactorCode"
                value={twoFactorCode}
                onChange={handleTwoFactorCodeChange}
                onKeyPress={handleKeyPress}
                label="6-digit code"
                error={errors.twoFactorCode}
                disabled={isLoading || isBlocked}
                autoComplete="one-time-code"
                maxLength="6"
                pattern="[0-9]{6}"
              />

              <div className="backup-code-section">
                <div className="backup-code-divider">
                  <span>or</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBackupCodeModal(true)}
                  disabled={isLoading || isBlocked}
                  className="btn btn-secondary btn-sm"
                >
                  <span className="btn-icon"><FiKey /></span>
                  Use Backup Code
                </button>
              </div>
            </div>
          )}

          {!requiresTwoFactor && (
            <div className="form-options">
              <Checkbox
                id="remember-me"
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading || isBlocked}
                label="Remember me"
                size="medium"
              />
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowForgotPassword(true);
                }}
                className='lnk'
              >
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isBlocked}
            className="btn btn-primary"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {attempts > 0 && !isBlocked && (
          <div className="warning-text">
            Failed login attempts: {attempts}/5,
            {attempts >= 3 ? ' Account will be temporarily locked after 5 attempts' : ' Please check your credentials'}
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
        }}
      />

      {/* Backup Code Modal */}
      <BackupCodeModal
        isOpen={showBackupCodeModal}
        onClose={() => setShowBackupCodeModal(false)}
        onSuccess={(data) => {
          setShowBackupCodeModal(false);
          setTimeout(() => {
            handleSubmit(null, data.backupCode);
          }, 100);
        }}
        onCancel={() => setShowBackupCodeModal(false)}
      />
    </div>
  );
};

export default Login; 