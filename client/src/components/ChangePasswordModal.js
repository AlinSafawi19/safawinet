import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { FiEye, FiEyeOff, FiLock, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import Swal from 'sweetalert2';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);

    // Password strength requirements
    const requirements = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    };

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

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

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
            const result = await authService.changePassword(
                formData.currentPassword,
                formData.newPassword
            );

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Changed Successfully!',
                    text: 'Your password has been updated.',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });

                // Reset form
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setPasswordStrength(null);
                setShowPasswords({
                    current: false,
                    new: false,
                    confirm: false
                });

                // Close modal and notify parent
                onClose();
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setErrors({
                    currentPassword: result.message || 'Failed to change password'
                });
            }
        } catch (error) {
            console.error('Password change error:', error);
            setErrors({
                currentPassword: 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Close modal
    const handleClose = () => {
        if (!isLoading) {
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPasswordStrength(null);
            setErrors({});
            onClose();
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><FiLock /> Change Password</h2>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="password-form">
                    <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <div className="password-input-container">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                id="currentPassword"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                placeholder="Enter your current password"
                                disabled={isLoading}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => togglePasswordVisibility('current')}
                                disabled={isLoading}
                            >
                                {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                        {errors.currentPassword && (
                            <span className="error-message">{errors.currentPassword}</span>
                        )}
                    </div>

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
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isLoading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                        >
                            {isLoading ? 'Changing Password...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal; 