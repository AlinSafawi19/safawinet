import React, { useState, useEffect } from 'react';
import { FiX, FiShield, FiKey, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';
import ButtonLoadingOverlay from './ButtonLoadingOverlay';

const BackupCodeModal = ({ isOpen, onClose, onSuccess, onCancel }) => {
    const [backupCode, setBackupCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle backup code submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!backupCode.trim()) {
            setError('Please enter a backup code');
            return;
        }

        // Validate backup code format (8 characters)
        if (backupCode.trim().length !== 8) {
            setError('Backup code must be exactly 8 characters');
            return;
        }

        // Return the backup code to parent component instead of making API call
        if (onSuccess) {
            onSuccess({ backupCode: backupCode.trim() });
        }
        handleClose();
    };

    // Close modal
    const handleClose = () => {
        if (!isLoading) {
            setBackupCode('');
            setError('');
            onClose();
        }
    };

    // Reset modal state when it opens
    useEffect(() => {
        if (isOpen) {
            setBackupCode('');
            setError('');
        }
    }, [isOpen]);

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
                        <FiShield />
                        Backup Code Verification
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="modal-close-btn"
                    >
                        <FiX />
                    </button>
                </div>

                <div className="modal-content">
                    <div className="modal-description">
                        <p className="description-text">
                            Enter one of your backup codes to access your account. 
                            Each backup code can only be used once.
                        </p>

                        <div className="security-notice">
                            <FiAlertCircle />
                            <span className="notice-text">
                                If you've lost all your backup codes, you'll need to contact support to regain access.
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="form-group">
                            <input
                                type="text"
                                id="backupCode"
                                value={backupCode}
                                onChange={(e) => setBackupCode(e.target.value)}
                                placeholder=" "
                                maxLength="8"
                                className="form-input"
                                autoComplete="off"
                                autoFocus
                            />
                            <label htmlFor="backupCode" className="form-label">Backup Code</label>
                        </div>

                        {error && (
                            <div className="form-error">{error}</div>
                        )}

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={onCancel || handleClose}
                                disabled={isLoading}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? <ButtonLoadingOverlay isLoading={isLoading} /> : 'Verify Code'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BackupCodeModal; 