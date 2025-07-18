import React, { useState, useEffect } from 'react';
import { FiX, FiShield } from 'react-icons/fi';
import FloatingInput from './FloatingInput';

const BackupCodeModal = ({ isOpen, onClose, onSuccess, onCancel }) => {
    const [backupCode, setBackupCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

        setIsLoading(true);
        setError('');

        try {
            // Return the backup code to parent component instead of making API call
            if (onSuccess) {
                await onSuccess({ backupCode: backupCode.trim() });
            }
            handleClose();
        } catch (error) {
            setError(error.message || 'Failed to verify backup code');
        } finally {
            setIsLoading(false);
        }
    };

    // Close modal
    const handleClose = () => {
        if (!isLoading) {
            setBackupCode('');
            setError('');
            setIsLoading(false);
            onClose();
        }
    };

    // Reset modal state when it opens
    useEffect(() => {
        if (isOpen) {
            setBackupCode('');
            setError('');
            setIsLoading(false);
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
                        <span className="title-icon"><FiShield /></span>
                        Backup Code Verification
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
                    <div className="modal-description">
                        <p className="description-text">
                            Enter one of your backup codes to access your account.
                            Each backup code can only be used once.
                        </p>

                        <div className="info-text">
                            If you've lost all your backup codes, you'll need to contact support to regain access.
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <FloatingInput
                            type="text"
                            id="backupCode"
                            value={backupCode}
                            onChange={(e) => setBackupCode(e.target.value)}
                            label="Backup Code"
                            error={error}
                            maxLength="8"
                            autoComplete="off"
                            autoFocus
                        />

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
                                {isLoading ? 'Verifying Code...' : 'Verify Code'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BackupCodeModal; 