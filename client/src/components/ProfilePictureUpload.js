import React, { useState, useRef } from 'react';
import authService from '../services/authService';

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
    <div>
      <div>
        <h3>Profile Picture</h3>
        <button
          onClick={handleCancel}
          disabled={isUploading}
        >
          <FiTimes />
        </button>
      </div>

      <div>
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <p>Click to select or drag and drop an image</p>
              <p >
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
          <div>
            <img src={preview} alt="Preview" />
            <div>
              <p>{selectedFile.name}</p>
              <p>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        {selectedFile ? (
          <>
            <button
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? <ButtonLoadingOverlay isLoading={isUploading} /> : 'Upload Picture'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
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