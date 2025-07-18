import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { FiEye, FiEyeOff, FiLock, FiCheckCircle, FiX } from 'react-icons/fi';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';
import FloatingInput from './FloatingInput';
import passwordStrengthAnalyzer from '../utils/passwordStrength';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);

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
                case 'currentPassword':
                    if (formData.currentPassword.trim()) {
                        document.getElementById('newPassword').focus();
                    } else {
                        // Stay on current field if empty
                        return;
                    }
                    break;

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
                    if (!formData.currentPassword.trim()) {
                        document.getElementById('currentPassword').focus();
                        return;
                    }
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

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters long';
        } else if (passwordStrength && passwordStrength.score < 40) {
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
            return; // Errors are displayed inline, no need for SweetAlert
        }

        setIsLoading(true);
        setErrors({});

        try {
            const result = await authService.changePassword(
                formData.currentPassword,
                formData.newPassword
            );

            if (result.success) {
                showSuccessToast('Password Changed Successfully!', 'Your password has been updated.');

                // Reset form
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setPasswordStrength(null);

                // Close modal and notify parent
                onClose();
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setErrors({
                    currentPassword: result.message || 'Failed to change password'
                });
                showErrorToast('Password Change Failed', result.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            setErrors({
                currentPassword: 'An unexpected error occurred. Please try again.'
            });
            showErrorToast('Password Change Failed', 'An unexpected error occurred. Please try again.');
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
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title"><span className="title-icon"><FiLock /></span> Change Password</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="btn btn-danger btn-md"
                    >
                        <FiX />
                    </button>
                </div>

                <div className="modal-content">
                    <form onSubmit={handleSubmit} className="modal-form">
                        <FloatingInput
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            required
                            autoComplete="current-password"
                            label="Current Password"
                            error={errors.currentPassword}
                        />

                        <FloatingInput
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            required
                            autoComplete="new-password"
                            label="New Password"
                            error={errors.newPassword}
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
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            required
                            autoComplete="new-password"
                            label="Confirm New Password"
                            error={errors.confirmPassword}
                        />

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal; 