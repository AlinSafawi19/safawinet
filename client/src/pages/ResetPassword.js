import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { FiEye, FiEyeOff, FiLock, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import logo from '../assets/images/logo.png';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

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
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="reset-password-header">
                        <div className="logo">
                            <img src={logo} alt="SafawiNet Logo" className="logo-image" />
                        </div>
                        <h2>Invalid Reset Link</h2>
                    </div>

                    <div className="error-content">
                        <div className="error-icon">
                            <FiAlertCircle />
                        </div>
                        <p>{tokenError}</p>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleRedirectToLogin}
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
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="reset-password-header">
                        <div className="logo">
                            <img src={logo} alt="SafawiNet Logo" className="logo-image" />
                        </div>
                        <h2>Password Reset Successful</h2>
                    </div>

                    <div className="success-content">
                        <div className="success-icon">
                            <FiCheckCircle />
                        </div>
                        <p>Your password has been reset successfully!</p>
                        <p>You can now log in with your new password.</p>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleRedirectToLogin}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="reset-password-header">
                    <div className="logo">
                        <img src={logo} alt="SafawiNet Logo" className="logo-image" />
                    </div>
                    <h2>Reset Your Password</h2>
                    <p>Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="reset-password-form">
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="password-input-container">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="Enter your new password"
                                disabled={isLoading}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => togglePasswordVisibility('new')}
                                disabled={isLoading}
                            >
                                {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <span className="error-message">{errors.newPassword}</span>
                        )}
                    </div>

                    {/* Password Strength Indicator */}
                    {passwordStrength && (
                        <div className="password-strength">
                            <div className="strength-bar">
                                <div 
                                    className={`strength-fill ${passwordStrength.strength}`}
                                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                ></div>
                            </div>
                            <div className="strength-text">
                                Password Strength: <span className={passwordStrength.strength}>
                                    {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                                </span>
                            </div>
                            <div className="requirements-list">
                                <div className={`requirement ${passwordStrength.checks.length ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle className="requirement-icon" />
                                    At least {requirements.minLength} characters
                                </div>
                                <div className={`requirement ${passwordStrength.checks.uppercase ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle className="requirement-icon" />
                                    One uppercase letter
                                </div>
                                <div className={`requirement ${passwordStrength.checks.lowercase ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle className="requirement-icon" />
                                    One lowercase letter
                                </div>
                                <div className={`requirement ${passwordStrength.checks.numbers ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle className="requirement-icon" />
                                    One number
                                </div>
                                <div className={`requirement ${passwordStrength.checks.specialChars ? 'met' : 'unmet'}`}>
                                    <FiCheckCircle className="requirement-icon" />
                                    One special character
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="password-input-container">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your new password"
                                disabled={isLoading}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => togglePasswordVisibility('confirm')}
                                disabled={isLoading}
                            >
                                {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span className="error-message">{errors.confirmPassword}</span>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleRedirectToLogin}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
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