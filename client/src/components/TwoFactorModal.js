import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiShield, FiCheckCircle, FiAlertCircle, FiCopy, FiDownload } from 'react-icons/fi';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';
import googleAuthIcon from '../assets/images/google-authenticator-icon.png';
import FloatingInput from './FloatingInput';

const TwoFactorModal = ({ isOpen, onClose, onSuccess, mode = 'enable' }) => {
    const [step, setStep] = useState('setup'); // 'setup', 'qr-view', 'backup-view', 'verify', 'success'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');

    // Create API instance
    const createApiInstance = () => {
        const api = axios.create({
            baseURL: '/api',
            withCredentials: true,
            timeout: 10000
        });

        const token = localStorage.getItem('authToken');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        return api;
    };

    // Initialize 2FA setup
    useEffect(() => {
        if (isOpen && mode === 'enable' && step === 'setup') {
            // Don't auto-initialize, let user click the button
        }
    }, [isOpen, mode, step]);

    // Initialize 2FA setup
    const initialize2FASetup = async () => {
        setIsLoading(true);
        setError('');

        try {
            const api = createApiInstance();
            const response = await api.post('/auth/2fa/setup');

            if (response.data.success) {
                setQrCodeUrl(response.data.data.qrCodeUrl);
                setSecret(response.data.data.secret);
                setBackupCodes(response.data.data.backupCodes);
                setStep('qr-view');
            } else {
                setError(response.data.message || 'Failed to setup 2FA');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to setup 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle verification code submission
    const handleVerification = async (e) => {
        e.preventDefault();

        if (!verificationCode.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const api = createApiInstance();
            const endpoint = mode === 'enable' ? '/auth/2fa/enable' : '/auth/2fa/disable';
            const response = await api.post(endpoint, { code: verificationCode });

            if (response.data.success) {
                setStep('success');
                showSuccessToast(
                    mode === 'enable' ? '2FA Enabled!' : '2FA Disabled!',
                    response.data.message
                );
            } else {
                setError(response.data.message || 'Invalid verification code');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to verify code');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle disable 2FA
    const handleDisable2FA = async (e) => {
        e.preventDefault();

        if (!verificationCode.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const api = createApiInstance();
            const response = await api.post('/auth/2fa/disable', { code: verificationCode });

            if (response.data.success) {
                setStep('success');
                showSuccessToast('2FA Disabled!', response.data.message);
            } else {
                setError(response.data.message || 'Invalid verification code');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showSuccessToast('Copied!', 'Text copied to clipboard');
        }).catch(() => {
            showErrorToast('Copy Failed', 'Failed to copy to clipboard');
        });
    };

    // Download backup codes
    const downloadBackupCodes = () => {
        const codes = backupCodes.join('\n');
        const blob = new Blob([codes], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'safawinet-backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Handle step transitions
    const handleContinueToBackupCodes = () => {
        setStep('backup-view');
    };

    const handleContinueToVerification = () => {
        setStep('verify');
    };

    // Close modal
    const handleClose = () => {
        if (!isLoading) {
            // Always reset to setup step
            setStep('setup');
            setError('');
            setVerificationCode('');
            setQrCodeUrl('');
            setSecret('');
            setBackupCodes([]);
            onClose();
        }
    };

    // Reset modal state when it opens
    useEffect(() => {
        if (isOpen) {
            // Always start with setup step for both enable and disable modes
            setStep('setup');
            setError('');
            setVerificationCode('');
            setQrCodeUrl('');
            setSecret('');
            setBackupCodes([]);
        }
    }, [isOpen, mode]);

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
                    <h2 className="modal-title">
                        <span className="title-icon"><FiShield /></span>
                        {mode === 'enable' ? 'Enable Two-Factor Authentication' : 'Disable Two-Factor Authentication'}
                    </h2>
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
                    {step === 'setup' && mode === 'enable' && (
                        <div className="modal-description">
                            <p className="description-text">
                                Two-factor authentication adds an extra layer of security to your account.
                            </p>

                            <div className="info-text">
                                You'll need to enter a code from your authenticator app when signing in.
                            </div>

                            <div className="authenticator-suggestions">
                                <h4>Install Google Authenticator</h4>
                                <div className="app-suggestion">
                                    <div className="app-info">
                                        <h5>Google Authenticator</h5>
                                        <p>Simple, reliable, and widely supported authenticator app</p>
                                    </div>
                                    <div className='app-suggestion-icon'>
                                        <img
                                            src={googleAuthIcon}
                                            alt="Google Authenticator Icon"
                                            className="google-auth-icon"
                                            style={{ width: 48, height: 48, marginRight: 16, borderRadius: 8, background: '#fff', border: '1px solid #eee' }}
                                        />
                                        <div className="app-links">
                                            <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer" className="app-link">
                                                Android
                                            </a>
                                            <a href="https://apps.apple.com/us/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer" className="app-link">
                                                iOS
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="warning-text">
                                Install Google Authenticator before starting the setup.
                            </div>

                            <div className="important-text">
                                <h4><span className="important-icon"><FiAlertCircle /></span>Important: Remove Old Entries</h4>
                                <p>If you previously had 2FA enabled and disabled it, you must remove the old SafawiNet entry from your authenticator app before scanning the new QR code. Otherwise, the verification codes won't work.</p>
                                <ol className="important-list">
                                    <li>Open Google Authenticator</li>
                                    <li>Find the old "PermissionsSystem" entry</li>
                                    <li>Slide the entry to the left, then select trash icon</li>
                                    <li>Now scan the new QR code when you continue</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {step === 'setup' && mode === 'disable' && (
                        <div className="modal-description">
                            <p className="description-text">
                                To disable two-factor authentication, please enter the 6-digit code from your authenticator app.
                            </p>
                            <div className="warning-text">
                                Disabling 2FA will make your account less secure. Consider keeping it enabled.
                            </div>
                        </div>
                    )}

                    {step === 'qr-view' && mode === 'enable' && (
                        <div className="modal-description">
                            <p className="description-text">
                                Open your authenticator app and scan this QR code:
                            </p>
                            <div className="info-text">
                                If the QR code doesn't work, you can manually enter the secret key below.
                            </div>

                            <div className="warning-text">
                                If you previously had 2FA enabled, make sure to remove the old entry first!
                            </div>

                            <div className="qr-container">
                                {qrCodeUrl && (
                                    <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
                                )}
                            </div>

                            <div className="modal-description">
                                <h4>Manual Entry (if QR code doesn't work)</h4>
                                <FloatingInput
                                    type="password"
                                    id="secretKey"
                                    value={secret}
                                    onChange={() => { }} // Read-only, so no onChange needed
                                    label="Secret Key"
                                    readOnly
                                    copyable={true}
                                />
                            </div>

                            <div className="important-text">
                                <h4>Instructions:</h4>
                                <ol className="important-list">
                                    <li>Open Google Authenticator on your phone</li>
                                    <li><strong>Important:</strong> If you see an old "SafawiNet" entry, delete it first</li>
                                    <li>Tap the + button to add a new account</li>
                                    <li>Choose "Scan a QR code"</li>
                                    <li>Point your camera at the QR code above</li>
                                    <li>Once scanned, tap "Continue" below</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {step === 'backup-view' && mode === 'enable' && (
                        <div className="modal-description">
                            <p className="description-text">
                                Save these backup codes in a secure location. You can use them if you lose access to your authenticator app:
                            </p>
                            <div className="info-text">
                                If you lose your phone, you can use these backup codes to regain access to your account.
                            </div>

                            <div className="backup-codes-container">
                                <div className="backup-codes-grid">
                                    {backupCodes.map((code, index) => (
                                        <div key={index} className="backup-code">
                                            {code}
                                        </div>
                                    ))}
                                </div>
                                <div className="backup-actions">
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(backupCodes.join('\n'))}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        <FiCopy /> Copy All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={downloadBackupCodes}
                                        className="btn btn-primary btn-sm"
                                    >
                                        <FiDownload /> Download
                                    </button>
                                </div>
                            </div>

                            <div className="important-text">
                                <h4>Important:</h4>
                                <ul className="important-list">
                                    <li>Each backup code can only be used once</li>
                                    <li>Store them in a secure location (password manager, safe, etc.)</li>
                                    <li>You can regenerate new codes later if needed</li>
                                    <li>These codes are your backup if you lose your phone</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === 'verify' && mode === 'enable' && (
                        <div className="modal-description">
                            <p className="description-text">
                                Enter the 6-digit code from your authenticator app to complete setup:
                            </p>
                            <div className="info-text">
                                <p><strong>Note:</strong> TOTP codes change every 30 seconds. If the code doesn't work, wait for a new code to appear in your authenticator app.</p>
                            </div>

                            <form onSubmit={handleVerification} className="modal-form">
                                <FloatingInput
                                    type="text"
                                    id="verificationCode"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    label="6-digit verification code"
                                    maxLength="6"
                                    pattern="[0-9]{6}"
                                    autoComplete="one-time-code"
                                    required
                                    error={error}
                                />
                            </form>
                        </div>
                    )}

                    {step === 'verify' && mode === 'disable' && (
                        <div className="modal-description">
                            <p className="description-text">
                                To disable two-factor authentication, please enter the 6-digit code from your authenticator app.
                            </p>
                            <div className="warning-text">
                                Disabling 2FA will make your account less secure. Consider keeping it enabled.
                            </div>

                            <form onSubmit={handleDisable2FA} className="modal-form">
                                <FloatingInput
                                    type="text"
                                    id="disableVerificationCode"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    label="6-digit verification code"
                                    maxLength="6"
                                    pattern="[0-9]{6}"
                                    autoComplete="one-time-code"
                                    required
                                    error={error}
                                />
                            </form>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="success-content">
                            <div className="success-icon">
                                <FiCheckCircle />
                            </div>
                            <h3 className="success-message">
                                {mode === 'enable' ? '2FA Enabled Successfully!' : '2FA Disabled Successfully!'}
                            </h3>
                            <p className="success-subtitle">
                                {mode === 'enable'
                                    ? 'Your account is now protected with two-factor authentication. You\'ll need to enter a code from your authenticator app when signing in.'
                                    : 'Two-factor authentication has been disabled for your account. Your account is now less secure.'
                                }
                            </p>

                            {mode === 'enable' && backupCodes.length > 0 && (
                                <div className="important-text">
                                    <h4><span className="important-icon"><FiAlertCircle /></span>Important: Save Your Backup Codes</h4>
                                    <p>Make sure you've saved your backup codes in a secure location. You can use them if you lose access to your authenticator app.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {step === 'setup' && mode === 'enable' && (
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
                                type="button"
                                onClick={initialize2FASetup}
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? 'Starting Setup...' : 'Start Setup'}
                            </button>
                        </div>
                    )}

                    {step === 'setup' && mode === 'disable' && (
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
                                type="button"
                                onClick={() => setStep('verify')}
                                disabled={isLoading}
                                className="btn btn-danger"
                            >
                                Continue to Disable
                            </button>
                        </div>
                    )}

                    {step === 'qr-view' && mode === 'enable' && (
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
                                type="button"
                                onClick={handleContinueToBackupCodes}
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 'backup-view' && mode === 'enable' && (
                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={() => setStep('qr-view')}
                                disabled={isLoading}
                                className="btn btn-secondary"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleContinueToVerification}
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {step === 'verify' && mode === 'enable' && (
                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={() => setStep('backup-view')}
                                disabled={isLoading}
                                className="btn btn-secondary"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                onClick={handleVerification}
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? 'Verifying & Enabling...' : 'Verify & Enable'}
                            </button>
                        </div>
                    )}

                    {step === 'verify' && mode === 'disable' && (
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
                                disabled={isLoading}
                                className="btn btn-danger"
                            >
                                {isLoading ? 'Disabling 2FA...' : 'Disable 2FA'}
                            </button>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="success-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    handleClose();
                                    if (onSuccess) onSuccess();
                                }}
                                className="btn btn-primary"
                            >
                                Got it
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TwoFactorModal; 