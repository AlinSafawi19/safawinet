import React from 'react';
import '../styles/LoadingOverlay.css';

const LoadingOverlay = ({ 
  isLoading = false, 
  message = 'Loading...', 
  overlayType = 'full',
  className = ''
}) => {
  if (!isLoading) return null;

  const overlayClass = `loading-overlay ${overlayType} ${className}`.trim();

  return (
    <div className={overlayClass}>
      <div className="loading-content classy">
        {message && <p className="loading-message classy-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingOverlay; 