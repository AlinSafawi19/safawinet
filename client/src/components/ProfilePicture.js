import React, { useState, useRef } from 'react';
import { getProfileDisplay, getInitialsColor } from '../utils/avatarUtils';
import authService from '../services/authService';
import '../styles/ProfilePicture.css';

const ProfilePicture = ({ 
  user, 
  size = 'medium', 
  className = '', 
  showUploadButton = false,
  onUploadClick = null,
  showRemoveButton = false,
  onRemoveClick = null,
  isUploadModal = false,
  onUploadSuccess = null,
  onUploadError = null,
  onCancel = null
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const profileDisplay = getProfileDisplay(user);
  const initialsColor = getInitialsColor(user?.username || user?.email || user?.firstName || '');

  const sizeClasses = {
    small: 'profile-picture--small',
    medium: 'profile-picture--medium',
    large: 'profile-picture--large',
    xlarge: 'profile-picture--xlarge'
  };

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
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
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

  const handleRemove = async () => {
    setIsUploading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile-picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // Update the user data in auth service
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          currentUser.profilePicture = null;
          authService.saveToStorage();
        }
        
        onUploadSuccess?.(null);
      } else {
        onUploadError?.(result.message || 'Remove failed');
      }
    } catch (error) {
      console.error('Remove error:', error);
      onUploadError?.('Remove failed. Please try again.');
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
      <div className="profile-picture-upload">
        <div className="profile-picture-upload__header">
          <h3>Profile Picture</h3>
          <button 
            className="profile-picture-upload__close"
            onClick={handleCancel}
            disabled={isUploading}
          >
            ×
          </button>
        </div>

        <div className="profile-picture-upload__content">
          {!selectedFile ? (
            <div 
              className={`profile-picture-upload__drop-zone ${isDragging ? 'profile-picture-upload__drop-zone--dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="profile-picture-upload__drop-zone-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <p>Click to select or drag and drop an image</p>
                <p className="profile-picture-upload__hint">
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
            <div className="profile-picture-upload__preview">
              <img src={preview} alt="Preview" className="profile-picture-upload__preview-image" />
              <div className="profile-picture-upload__preview-info">
                <p className="profile-picture-upload__filename">{selectedFile.name}</p>
                <p className="profile-picture-upload__filesize">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="profile-picture-upload__actions">
          {selectedFile ? (
            <>
              <button
                className="profile-picture-upload__btn profile-picture-upload__btn--primary"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Picture'}
              </button>
              <button
                className="profile-picture-upload__btn profile-picture-upload__btn--secondary"
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="profile-picture-upload__btn profile-picture-upload__btn--secondary"
              onClick={handleCancel}
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
    <div className={`profile-picture ${sizeClasses[size]} ${className}`}>
      {profileDisplay.type === 'image' ? (
        <>
          <img
            src={profileDisplay.value}
            alt={`${user?.firstName || user?.username || 'User'}'s profile picture`}
            className="profile-picture__image"
            onError={handleImageError}
          />
          <div 
            className="profile-picture__initials profile-picture__initials--fallback"
            style={{ backgroundColor: initialsColor }}
          >
            {profileDisplay.value}
          </div>
        </>
      ) : (
        <div 
          className="profile-picture__initials"
          style={{ backgroundColor: initialsColor }}
        >
          {profileDisplay.value}
        </div>
      )}
      
      {showUploadButton && (
        <button 
          className="profile-picture__upload-btn"
          onClick={handleUploadClick}
          title="Upload profile picture"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      )}
      
      {showRemoveButton && profileDisplay.type === 'image' && (
        <button 
          className="profile-picture__remove-btn"
          onClick={handleRemoveClick}
          title="Remove profile picture"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default ProfilePicture; 