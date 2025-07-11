import React, { useState, useRef } from 'react';
import authService from '../services/authService';
import ButtonLoadingOverlay from './ButtonLoadingOverlay';
import { FiX, FiUpload } from 'react-icons/fi';

const ProfilePictureUpload = ({ onUploadSuccess, onUploadError, onCancel }) => {
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

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    onCancel?.();
  };

  return (
    <div className="profile-upload-modal">
      <div className="profile-upload-container">
        <div className="profile-upload-header">
          <h3 className="profile-upload-title">Upload Profile Picture</h3>
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="profile-upload-close"
            type="button"
          >
            <FiX />
          </button>
        </div>

        <div className="profile-upload-content">
          {!selectedFile ? (
            <div
              className="profile-upload-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="profile-upload-icon">
                <FiUpload />
              </div>
              <p className="profile-upload-text">Click to select or drag and drop an image</p>
              <p className="profile-upload-hint">
                JPG, PNG, GIF, or WebP (max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="profile-upload-input"
              />
            </div>
          ) : (
            <div className="profile-upload-preview">
              <img src={preview} alt="Preview" />
              <div className="profile-upload-info">
                <p className="profile-upload-file-name">{selectedFile.name}</p>
                <p className="profile-upload-file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="profile-upload-actions">
          {selectedFile ? (
            <>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="btn btn-primary"
                type="button"
              >
                {isUploading ? (
                  <ButtonLoadingOverlay isLoading={isUploading} />
                ) : (
                  <>
                    <FiUpload /> Upload Picture
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUploading}
                className="btn btn-secondary"
                type="button"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
              type="button"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureUpload; 