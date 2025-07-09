import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/EmailVerification.css';

const EmailVerification = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState('verifying');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (!token) {
            setVerificationStatus('error');
            setError('No verification token provided');
            return;
        }

        verifyEmail(token);
    }, [searchParams]);

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
            const response = await axios.post('/api/auth/send-email-verification', {}, {
                withCredentials: true
            });
            
            if (response.data.success) {
                setMessage('Verification email sent! Please check your inbox.');
                setError('');
            } else {
                setError('Failed to send verification email. Please try again.');
            }
        } catch (error) {
            setError('Failed to send verification email. Please try again.');
        }
    };

    return (
        <div className="email-verification">
            <div className="verification-container">
                <div className="verification-header">
                    <h1>📧 Email Verification</h1>
                    <p>Verifying your email address...</p>
                </div>

                <div className="verification-content">
                    {verificationStatus === 'verifying' && (
                        <div className="verifying-state">
                            <div className="loading-spinner"></div>
                            <p>Verifying your email address...</p>
                        </div>
                    )}

                    {verificationStatus === 'success' && (
                        <div className="success-state">
                            <div className="success-icon">✅</div>
                            <h2>Email Verified Successfully!</h2>
                            <p>{message}</p>
                            <button 
                                className="btn btn-primary"
                                onClick={handleReturnToDashboard}
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    )}

                    {verificationStatus === 'error' && (
                        <div className="error-state">
                            <div className="error-icon">❌</div>
                            <h2>Verification Failed</h2>
                            <p className="error-message">{error}</p>
                            
                            <div className="error-actions">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={handleResendVerification}
                                >
                                    Resend Verification Email
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleReturnToDashboard}
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="verification-footer">
                    <p>If you're having trouble, please contact support.</p>
                </div>
            </div>
        </div>
    );
};

export default EmailVerification; 