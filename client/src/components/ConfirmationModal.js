import React, { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import '../styles/ConfirmationModal.css';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning', // 'warning', 'danger', 'info'
    showIcon = true,
    loading = false,
    confirmDisabled = false
}) => {
    const modalRef = useRef(null);
    const confirmButtonRef = useRef(null);
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Focus the modal when it opens
            modalRef.current?.focus();

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Add escape key listener
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleEscape);

            return () => {
                document.removeEventListener('keydown', handleEscape);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen, onClose]);

    const handleConfirm = () => {
        if (!loading && !confirmDisabled) {
            onConfirm();
            onClose();
        }
    };

    const handleCancel = () => {
        if (!loading) {
            onClose();
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !loading) {
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.target === modalRef.current) {
            handleConfirm();
        }
    };

    const getIcon = () => {
        if (!showIcon) return null;

        const iconClass = `confirmation-modal-icon ${type}`;
        const iconMap = {
            warning: <FiAlertTriangle size={20} />,
            danger: <FiAlertCircle size={20} />,
            info: <FiInfo size={20} />
        };

        return (
            <div className={iconClass}>
                {iconMap[type] || iconMap.warning}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div
            className="confirmation-modal-overlay"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
            aria-describedby="confirmation-modal-message"
        >
            <div
                className="confirmation-modal"
                ref={modalRef}
                tabIndex={-1}
                onKeyDown={handleKeyDown}
            >
                <div className="confirmation-modal-header">
                    <div className="confirmation-modal-title-container">
                        {getIcon()}
                        <h3
                            id="confirmation-modal-title"
                            className={`confirmation-modal-title ${type}`}
                        >
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        disabled={loading}
                        ref={cancelButtonRef}
                        className="btn btn-secondary btn-md"
                    >
                        <FiX />
                    </button>
                </div>

                <div className="confirmation-modal-body">
                    <p
                        id="confirmation-modal-message"
                        className="confirmation-modal-message"
                    >
                        {message}
                    </p>
                </div>

                <div className="confirmation-modal-footer">
                    <button
                        className="btn btn-secondary btn-md"
                        onClick={handleCancel}
                        disabled={loading}
                        ref={cancelButtonRef}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn btn-primary btn-md ${type === 'warning' ? 'btn-warning' : 'btn-danger'}`}
                        onClick={handleConfirm}
                        disabled={loading || confirmDisabled}
                        ref={confirmButtonRef}
                    >
                        {loading ? (
                            <>
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal; 