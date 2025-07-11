import React, { useState, useRef } from 'react';
import { getProfileDisplay, getInitialsColor, generateInitials } from '../utils/avatarUtils';
import authService from '../services/authService';
import ButtonLoadingOverlay from './ButtonLoadingOverlay';
import { FiX } from 'react-icons/fi';

const ProfilePicture = ({
  user,
  showUploadButton = false,
  onUploadClick = null,
  showRemoveButton = false,
  onRemoveClick = null,
  isUploadModal = false,
  onUploadSuccess = null,
  onUploadError = null,
  onCancel = null
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const profileDisplay = getProfileDisplay(user);
  const initialsColor = getInitialsColor(user?.username || user?.email || user?.firstName || '');

  const handleImageError = (e) => {
    // If image fails to load, fall back to initials
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  const handleUploadClick = () => {
    if (onUploadClick) {
      onUploadClick();
    }
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    if (onRemoveClick) {
      onRemoveClick();
    }
  };

  // Upload functionality
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError?.('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onUploadError?.('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update the user data in auth service
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          currentUser.profilePicture = result.data.profilePicture;
          authService.saveToStorage();
        }

        onUploadSuccess?.(result.data.profilePicture);
      } else {
        onUploadError?.(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    onCancel?.();
  };

  // If this is the upload modal, render the upload interface
  if (isUploadModal) {
    return (
      <div className="upload-modal">
        <div className="upload-header">
          <h3 className="upload-title">Profile Picture</h3>
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="upload-close-btn"
          >
            <FiX />
          </button>
        </div>

        <div className="upload-content">
          {!selectedFile ? (
            <div
              className="upload-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <p className="upload-text">Click to select or drag and drop an image</p>
                <p className="upload-hint">
                  JPG, PNG, GIF, or WebP (max 5MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="upload-preview">
              <img src={preview} alt="Preview" className="preview-image" />
              <div className="preview-info">
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="upload-actions">
          {selectedFile ? (
            <>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="btn btn-primary"
              >
                {isUploading ? <ButtonLoadingOverlay isLoading={isUploading} /> : 'Upload Picture'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUploading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Regular profile picture display
  return (
    <div className="profile-picture">
      {profileDisplay.type === 'image' ? (
        <>
          <img
            src={profileDisplay.value}
            alt={`${user?.firstName || user?.username || 'User'}'s profile picture`}
            onError={handleImageError}
            className="profile-image"
          />
          <div
            className="profile-initials"
            style={{ backgroundColor: initialsColor, display: 'none' }}
          >
            {user?.profileInitials || generateInitials(user)}
          </div>
        </>
      ) : (
        <div
          className="profile-initials"
          style={{ backgroundColor: initialsColor }}
        >
          {profileDisplay.value}
        </div>
      )}

      {showUploadButton && (
        <button
          onClick={handleUploadClick}
          title="Upload profile picture"
          className="upload-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )}

      {showRemoveButton && profileDisplay.type === 'image' && (
        <button
          onClick={handleRemoveClick}
          title="Remove profile picture"
          className="remove-btn"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ProfilePicture; 