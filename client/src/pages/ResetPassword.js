import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import FloatingInput from '../components/FloatingInput';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import passwordStrengthAnalyzer from '../utils/passwordStrength';
import '../styles/pageoneform.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    // Add refs for input fields
    const newPasswordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [tokenError, setTokenError] = useState('');

    // Check if token is valid
    useEffect(() => {
        if (!token) {
            setTokenError('Invalid reset link. Please request a new password reset.');
        }
    }, [token]);

    // Check password strength using the analyzer
    const checkPasswordStrength = (password) => {
        if (!password) {
            setPasswordStrength(null);
            return;
        }

        const analysis = passwordStrengthAnalyzer.analyzePassword(password);
        setPasswordStrength(analysis);
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field-specific errors
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Check password strength for new password
        if (name === 'newPassword') {
            checkPasswordStrength(value);
        }
    };

    // Handle Enter key navigation
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            const { name } = e.target;

            // Navigate to next field or submit form
            switch (name) {
                case 'newPassword':
                    if (formData.newPassword.trim()) {
                        document.getElementById('confirmPassword').focus();
                    } else {
                        // Stay on current field if empty
                        return;
                    }
                    break;

                case 'confirmPassword':
                    // Check for empty fields and navigate to them
                    if (!formData.newPassword.trim()) {
                        document.getElementById('newPassword').focus();
                        return;
                    }
                    if (!formData.confirmPassword.trim()) {
                        // Stay on confirm field if empty
                        return;
                    }

                    // All fields are filled, trigger form submission
                    handleSubmit(e);
                    break;

                default:
                    break;
            }
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters long';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const result = await authService.resetPassword(token, formData.newPassword);

            if (result.success) {
                setIsSuccess(true);
            } else {
                setErrors({
                    newPassword: result.message || 'Failed to reset password'
                });
            }
        } catch (error) {
            console.error('Password reset error:', error);
            setErrors({
                newPassword: 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle redirect to login
    const handleRedirectToLogin = () => {
        navigate('/login');
    };

    if (tokenError) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <span className="text-logo">
                                Permissions<span className="text-logo-colored">System</span>
                            </span>
                        </div>
                        <h2 className="auth-title">Invalid Reset Link</h2>
                    </div>

                    <div className="auth-error">
                        <div className="error-icon">
                            <FiAlertCircle />
                        </div>
                        <p className="error-message">{tokenError}</p>
                        <button
                            type="button"
                            onClick={handleRedirectToLogin}
                            className="btn btn-secondary"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="container">
                <div className="container-card">
                    <div className="container-header">
                        <div className="container-logo">
                            <span className="text-logo">
                                Permissions<span className="text-logo-colored">System</span>
                            </span>
                        </div>
                        <p className="sub-text">Password Reset Successful</p>
                    </div>

                    <div className="success-content">
                        <div className="success-icon">
                            <FiCheckCircle />
                        </div>
                        <p className="success-message">Your password has been reset successfully!</p>
                        <p className="success-subtitle">You can now log in with your new password.</p>
                        <button
                            type="button"
                            onClick={handleRedirectToLogin}
                            className="btn btn-primary"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="container-card">
                <div className="container-header">
                    <div className="container-logo">
                        <span className="text-logo">
                            Permissions<span className="text-logo-blue">System</span>
                        </span>
                    </div>
                    <p className="sub-text"><b>Reset Your Password!</b> Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="container-form">
                    <FloatingInput
                        ref={newPasswordRef}
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        label="New Password"
                        error={errors.newPassword}
                        disabled={isLoading}
                        autoComplete="new-password"
                        required
                    />

                    {/* Password Strength Indicator */}
                    {passwordStrength && (
                        <div className="password-strength">
                            <div className="strength-bar">
                                <div
                                    className={`strength-fill strength-${passwordStrength.level}`}
                                    style={{ width: `${passwordStrength.score}%` }}
                                ></div>
                            </div>
                            <div className="strength-text">
                                Password Strength: <span className={`strength-label strength-${passwordStrength.level}`}>
                                    {passwordStrength.level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <span className="strength-score">({passwordStrength.score}/100)</span>
                            </div>
                            <div className="strength-requirements">
                                <div className={`requirement ${passwordStrength.details.length >= 8 ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    At least 8 characters
                                </div>
                                <div className={`requirement ${passwordStrength.details.hasUppercase ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    One uppercase letter
                                </div>
                                <div className={`requirement ${passwordStrength.details.hasLowercase ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    One lowercase letter
                                </div>
                                <div className={`requirement ${passwordStrength.details.hasNumbers ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    One number
                                </div>
                                <div className={`requirement ${passwordStrength.details.hasSpecialChars ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    One special character
                                </div>
                                {passwordStrength.details.hasRepeatingChars && (
                                    <div className="requirement unmet warning">
                                        <FiX />
                                        Avoid repeating characters
                                    </div>
                                )}
                                {passwordStrength.details.hasSequentialChars && (
                                    <div className="requirement unmet warning">
                                        <FiX />
                                        Avoid sequential characters
                                    </div>
                                )}
                                {passwordStrength.details.hasCommonPatterns && (
                                    <div className="requirement unmet warning">
                                        <FiX />
                                        Avoid common patterns
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <FloatingInput
                        ref={confirmPasswordRef}
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        label="Confirm New Password"
                        error={errors.confirmPassword}
                        disabled={isLoading}
                        autoComplete="new-password"
                        required
                    />

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={handleRedirectToLogin}
                            disabled={isLoading}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {isLoading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword; 