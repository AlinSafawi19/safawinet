import React, { useState, useRef } from 'react';
import authService from '../services/authService';
import { FiX, FiUpload, FiUser } from 'react-icons/fi';

const ProfilePictureUpload = ({ onUploadSuccess, onUploadError, onCancel }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0); // Add key to force re-render
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
    // Clear the input value so the same file can be selected again
    e.target.value = '';
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
      const result = await authService.uploadProfilePicture(selectedFile);

      if (result.success) {
        onUploadSuccess?.(result.profilePicture);
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
    // Clear the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Force re-render of file input
    setFileInputKey(prev => prev + 1);
    onCancel?.();
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setPreview(null);
    // Clear the file input value so it can be used again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Force re-render of file input
    setFileInputKey(prev => prev + 1);
  };

  const handleDropzoneClick = (e) => {
    // Don't trigger if clicking on the file input itself
    if (e.target === fileInputRef.current) {
      return;
    }
    
    // Directly trigger the file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title"><span className="title-icon"><FiUser /></span> Upload Profile Picture</h2>

          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="btn btn-danger btn-md"
            type="button"
          >
            <FiX />
          </button>
        </div>

        <div className="modal-content">
          {!selectedFile ? (
            <div
              className="modal-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleDropzoneClick}
            >
              <div className="modal-icon">
                <FiUpload />
              </div>
              <p className="info-text">
                Click to select or drag and drop an image!
                <br />
                JPG, PNG, GIF, or WebP (max 5MB)
              </p>
              <input
                key={fileInputKey}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="profile-upload-input"
              />
            </div>
          ) : (
            <div className="modal-preview">
              <img src={preview} alt="Preview" />
              <div className="modal-info">
                <p className="modal-file-name">{selectedFile.name}</p>
                <p className="modal-file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          <div className="form-actions">
            {selectedFile ? (
              <>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="btn btn-primary"
                  type="button"
                >
                  {isUploading ? 'ApplyingProfile Picture...' : 'Apply Profile Picture'}
                </button>
                <button
                  onClick={handleResetFile}
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
    </div>
  );
};

export default ProfilePictureUpload; 