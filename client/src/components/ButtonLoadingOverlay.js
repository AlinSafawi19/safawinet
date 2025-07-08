import React from 'react';
import '../styles/ButtonLoadingOverlay.css';

const ButtonLoadingOverlay = ({
    isLoading = false,
    message = 'Loading...',
    size = 'medium',
    variant = 'default',
    className = ''
}) => {
    if (!isLoading) return null;

    const overlayClass = `button-loading-overlay ${size} ${variant} ${className}`.trim();

      return (
    <div className={overlayClass}>
      <div className="button-loading-content">
        <div className="button-loading-spinner">
          <div className="spinner-ring"></div>
        </div>
        {message && message !== 'Loading...' && (
          <span className="button-loading-text">{message}</span>
        )}
      </div>
    </div>
  );
};

export default ButtonLoadingOverlay; 