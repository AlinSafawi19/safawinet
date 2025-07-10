import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { FiMail, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';
import './ForgotPasswordModal.css';

const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
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
                Swal.fire({
                    icon: 'success',
                    title: 'Password Reset Email Sent!',
                    text: 'Check your inbox and spam folder.',
                    timer: 5000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
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
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><FiMail /> Forgot Password</h2>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        <FiX />
                    </button>
                </div>

                {!isSubmitted ? (
                    <div className="forgot-password-content">
                        <div className="info-section">
                            <p>
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                            <div className="security-notice">
                                <FiAlertCircle />
                                <span>
                                    For security reasons, we don't reveal whether an email exists in our system.
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="forgot-password-form">
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChange}
                                    placeholder="Enter your email address"
                                    disabled={isLoading}
                                    required
                                    autoComplete="email"
                                />
                                {error && (
                                    <span className="error-message">{error}</span>
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
                                    disabled={isLoading || !email.trim()}
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="success-content">
                        <div className="success-icon">
                            <FiCheckCircle />
                        </div>
                        <h3>Check Your Email</h3>
                        <p>
                            We've sent a password reset link to <strong>{email}</strong>.
                        </p>
                        <div className="email-instructions">
                            <h4>What to do next:</h4>
                            <ul>
                                <li>Check your email inbox</li>
                                <li>Look in your spam/junk folder if you don't see it</li>
                                <li>Click the reset link in the email</li>
                                <li>Create a new password</li>
                            </ul>
                        </div>
                        <div className="security-reminder">
                            <FiAlertCircle />
                            <span>
                                The reset link will expire in 1 hour for your security.
                            </span>
                        </div>
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleClose}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal; 