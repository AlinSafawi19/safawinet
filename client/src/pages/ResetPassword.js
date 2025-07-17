import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { FiEye, FiEyeOff, FiLock, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import logo from '../assets/images/logo.png';

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
    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [tokenError, setTokenError] = useState('');

    // Password strength requirements
    const requirements = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    };

    // Check if token is valid
    useEffect(() => {
        if (!token) {
            setTokenError('Invalid reset link. Please request a new password reset.');
        }
    }, [token]);

    // Check password strength
    const checkPasswordStrength = (password) => {
        if (!password) {
            setPasswordStrength(null);
            return;
        }

        const checks = {
            length: password.length >= requirements.minLength,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /\d/.test(password),
            specialChars: /[^a-zA-Z0-9]/.test(password)
        };

        const score = Object.values(checks).filter(Boolean).length;
        const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';

        setPasswordStrength({
            checks,
            score,
            strength
        });
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

    // Toggle password visibility
    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < requirements.minLength) {
            newErrors.newPassword = `Password must be at least ${requirements.minLength} characters long`;
        } else if (passwordStrength && passwordStrength.score < 3) {
            newErrors.newPassword = 'Password does not meet security requirements';
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
                                Safawi<span className="text-logo-blue">Net</span>
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
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <span className="text-logo">
                                Safawi<span className="text-logo-blue">Net</span>
                            </span>
                        </div>
                        <h2 className="auth-title">Password Reset Successful</h2>
                    </div>

                    <div className="auth-success">
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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <span className="text-logo">
                            Safawi<span className="text-logo-blue">Net</span>
                        </span>
                    </div>
                    <h2 className="auth-title">Reset Your Password</h2>
                    <p className="auth-subtitle">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="newPassword" className="form-label">New Password</label>
                        <div className="input-group">
                            <input
                                ref={newPasswordRef}
                                type={showPasswords.new ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter your new password"
                                disabled={isLoading}
                                autoComplete="new-password"
                                className="form-input"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                disabled={isLoading}
                                className="input-toggle-btn"
                            >
                                {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <span className="form-error">{errors.newPassword}</span>
                        )}
                    </div>

                    {/* Password Strength Indicator */}
                    {passwordStrength && (
                        <div className="password-strength">
                            <div className="strength-bar">
                                <div className={`strength-fill strength-${passwordStrength.strength}`}></div>
                            </div>
                            <div className="strength-text">
                                Password Strength: <span className={`strength-label strength-${passwordStrength.strength}`}>
                                    {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                                </span>
                            </div>
                            <div className="strength-requirements">
                                <div className={`requirement ${passwordStrength.checks.length ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    At least {requirements.minLength} characters
                                </div>
                                <div className={`requirement ${passwordStrength.checks.uppercase ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    One uppercase letter
                                </div>
                                <div className={`requirement ${passwordStrength.checks.lowercase ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    One lowercase letter
                                </div>
                                <div className={`requirement ${passwordStrength.checks.numbers ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    One number
                                </div>
                                <div className={`requirement ${passwordStrength.checks.specialChars ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle />
                                    One special character
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                        <div className="input-group">
                            <input
                                ref={confirmPasswordRef}
                                type={showPasswords.confirm ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Confirm your new password"
                                disabled={isLoading}
                                autoComplete="new-password"
                                className="form-input"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                disabled={isLoading}
                                className="input-toggle-btn"
                            >
                                {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span className="form-error">{errors.confirmPassword}</span>
                        )}
                    </div>

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