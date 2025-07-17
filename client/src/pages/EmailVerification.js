import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiMail, FiCheckCircle, FiXCircle, FiArrowLeft } from 'react-icons/fi';

const EmailVerification = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState('verifying');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const hasAttemptedVerification = useRef(false);
    const currentToken = useRef('');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setVerificationStatus('error');
            setError('No verification token provided');
            return;
        }

        // Only attempt verification if we haven't tried with this token before
        if (!hasAttemptedVerification.current || currentToken.current !== token) {
            currentToken.current = token;
            hasAttemptedVerification.current = true;
            verifyEmail(token);
        }
    }, []); // Remove searchParams dependency to prevent multiple calls

    const verifyEmail = async (token) => {
        try {
            const response = await axios.post('/api/auth/verify-email', { token });

            if (response.data.success) {
                setVerificationStatus('success');
                setMessage('Email verified successfully! You can now close this window and return to your dashboard.');
            } else {
                setVerificationStatus('error');
                setError(response.data.message || 'Email verification failed');
            }
        } catch (error) {
            setVerificationStatus('error');
            setError(error.response?.data?.message || 'Email verification failed. Please try again.');
        }
    };

    const handleReturnToDashboard = () => {
        navigate('/dashboard');
    };

    const handleResendVerification = async () => {
        try {
            setVerificationStatus('verifying');
            setError('');
            
            const response = await axios.post('/api/auth/send-email-verification', {}, {
                withCredentials: true
            });

            if (response.data.success) {
                setVerificationStatus('success');
                setMessage('Verification email sent! Please check your inbox and click the verification link.');
            } else {
                setVerificationStatus('error');
                setError('Failed to send verification email. Please try again.');
            }
        } catch (error) {
            setVerificationStatus('error');
            setError('Failed to send verification email. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <h1 className="auth-title">
                            <FiMail className="auth-icon" /> Email Verification
                        </h1>
                        <p className="auth-subtitle">Verifying your email address</p>
                    </div>
                </div>

                <div className="verification-content">
                    {verificationStatus === 'verifying' && (
                        <div className="verification-loading">
                            <div className="loading-spinner"></div>
                            <p className="loading-text">Verifying your email address...</p>
                        </div>
                    )}

                    {verificationStatus === 'success' && (
                        <div className="verification-success">
                            <div className="success-icon">
                                <FiCheckCircle />
                            </div>
                            <h2 className="success-title">Email Verified Successfully!</h2>
                            <p className="success-message">{message}</p>
                            <button
                                onClick={handleReturnToDashboard}
                                className="btn btn-primary"
                            >
                                <FiArrowLeft /> Return to Dashboard
                            </button>
                        </div>
                    )}

                    {verificationStatus === 'error' && (
                        <div className="verification-error">
                            <div className="error-icon">
                                <FiXCircle />
                            </div>
                            <h2 className="error-title">Verification Failed</h2>
                            <p className="error-message">{error}</p>

                            <div className="error-actions">
                                <button
                                    onClick={handleResendVerification}
                                    className="btn btn-secondary"
                                >
                                    <FiMail /> Resend Verification Email
                                </button>
                                <button
                                    onClick={handleReturnToDashboard}
                                    className="btn btn-primary"
                                >
                                    <FiArrowLeft /> Return to Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="auth-footer">
                    <p className="footer-text">If you're having trouble, please contact support.</p>
                </div>
            </div>
        </div>
    );
};

export default EmailVerification; 