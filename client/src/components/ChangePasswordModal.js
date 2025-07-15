import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { FiEye, FiEyeOff, FiLock, FiCheckCircle, FiX } from 'react-icons/fi';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';

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
    // Add focus state for floating label
    const [inputFocus, setInputFocus] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    });

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

    // Helper to get floating label class
    const getFloatingLabelClass = (field) => {
        let cls = 'form-group floating-label';
        if (inputFocus[field]) cls += ' focused';
        if (formData[field]) cls += ' filled';
        return cls;
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title"><FiLock /> Change Password</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="modal-close-btn"
                    >
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className={getFloatingLabelClass('currentPassword')}>
                        <div className="input-group">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                id="currentPassword"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                onKeyPress={handleKeyPress}
                                onFocus={() => setInputFocus(f => ({ ...f, currentPassword: true }))}
                                onBlur={() => setInputFocus(f => ({ ...f, currentPassword: false }))}
                                disabled={isLoading}
                                required
                                autoComplete="current-password"
                                className="form-input"
                                placeholder=""
                            />
                            <label htmlFor="currentPassword" className="form-label">Current Password</label>
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                disabled={isLoading}
                                className="input-toggle-btn"
                            >
                                {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                        {errors.currentPassword && (
                            <span className="form-error">{errors.currentPassword}</span>
                        )}
                    </div>

                    <div className={getFloatingLabelClass('newPassword')}>
                        <div className="input-group">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                onKeyPress={handleKeyPress}
                                onFocus={() => setInputFocus(f => ({ ...f, newPassword: true }))}
                                onBlur={() => setInputFocus(f => ({ ...f, newPassword: false }))}
                                disabled={isLoading}
                                required
                                autoComplete="new-password"
                                className="form-input"
                                placeholder=""
                            />
                            <label htmlFor="newPassword" className="form-label">New Password</label>
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
                                <div
                                    className={`strength-fill strength-${passwordStrength.strength}`}
                                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                ></div>
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

                    <div className={getFloatingLabelClass('confirmPassword')}>
                        <div className="input-group">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onKeyPress={handleKeyPress}
                                onFocus={() => setInputFocus(f => ({ ...f, confirmPassword: true }))}
                                onBlur={() => setInputFocus(f => ({ ...f, confirmPassword: false }))}
                                disabled={isLoading}
                                required
                                autoComplete="new-password"
                                className="form-input"
                                placeholder=""
                            />
                            <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
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
    );
};

export default ChangePasswordModal; 