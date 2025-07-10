import React from 'react';

const ButtonLoadingOverlay = ({
  isLoading = false
}) => {
  if (!isLoading) return null;

  return (
    <div className="button-loading-overlay">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default ButtonLoadingOverlay; 