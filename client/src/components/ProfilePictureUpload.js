import React, { useState, useRef } from 'react';
import authService from '../services/authService';
import '../styles/ProfilePictureUpload.css';

const ProfilePictureUpload = ({ onUploadSuccess, onUploadError, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

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
          'Authorization': `Bearer ${authService.getToken()}`
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
          'Authorization': `Bearer ${authService.getToken()}`
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
};

export default ProfilePictureUpload; 