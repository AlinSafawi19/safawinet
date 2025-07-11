import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { FiMail, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import ButtonLoadingOverlay from './ButtonLoadingOverlay';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    // Handle input changes
    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) {
            setError('');
        }
    };

    // Validate email
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await authService.forgotPassword(email.trim());

            if (result.success) {
                setIsSubmitted(true);
            } else {
                setError(result.message || 'Failed to send reset email');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Close modal
    const handleClose = () => {
        if (!isLoading) {
            setEmail('');
            setError('');
            setIsSubmitted(false);
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
                    <h2 className="modal-title"><FiMail /> Forgot Password</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="modal-close-btn"
                    >
                        <FiX />
                    </button>
                </div>

                {!isSubmitted ? (
                    <div className="modal-content">
                        <div className="modal-description">
                            <p className="description-text">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                            <div className="security-notice">
                                <FiAlertCircle />
                                <span className="notice-text">
                                    For security reasons, we don't reveal whether an email exists in our system.
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group floating-label">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChange}
                                    placeholder=""
                                    disabled={isLoading}
                                    autoComplete="email"
                                    className="form-input"
                                />
                                <label htmlFor="email" className="form-label">Email Address</label>
                                {error && (
                                    <span className="form-error">{error}</span>
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
                                    className="btn btn-primary"
                                >
                                    {isLoading ? <ButtonLoadingOverlay isLoading={isLoading} /> : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="modal-content">
                        <div className="success-content">
                            <div className="success-icon">
                                <FiCheckCircle />
                            </div>
                            <h3 className="success-title">Check Your Email</h3>
                            <p className="success-message">
                                We've sent a password reset link to <strong>{email}</strong>.
                            </p>
                            <div className="instructions">
                                <h4 className="instructions-title">What to do next:</h4>
                                <ul className="instructions-list">
                                    <li>Check your email inbox</li>
                                    <li>Look in your spam/junk folder if you don't see it</li>
                                    <li>Click the reset link in the email</li>
                                    <li>Create a new password</li>
                                </ul>
                            </div>
                            <div className="security-notice">
                                <FiAlertCircle />
                                <span className="notice-text">
                                    The reset link will expire in 1 hour for your security.
                                </span>
                            </div>
                            <div className="success-actions">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="btn btn-primary"
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal; 