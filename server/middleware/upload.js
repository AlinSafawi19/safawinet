const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir, { recursive: true });
}

// Configure multer for profile picture uploads
const profilePictureStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePicturesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = `profile-${req.user._id}-${uniqueSuffix}${fileExtension}`;
    cb(null, filename);
  }
});

// File filter for profile pictures
const profilePictureFilter = (req, file, cb) => {
  // Check file type
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed'), false);
  }
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return cb(new Error('File size too large. Maximum size is 5MB'), false);
  }
  
  cb(null, true);
};

// Create multer instance for profile pictures
const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: profilePictureFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Only one file at a time
  }
});

// Middleware to handle upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Function to delete old profile picture
const deleteOldProfilePicture = async (user) => {
  if (user.profilePicture && user.profilePicture.filename) {
    const oldFilePath = path.join(profilePicturesDir, user.profilePicture.filename);
    try {
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    } catch (error) {
    }
  }
};

// Function to get profile picture URL
const getProfilePictureUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/profile-pictures/${filename}`;
};

module.exports = {
  uploadProfilePicture,
  handleUploadError,
  deleteOldProfilePicture,
  getProfilePictureUrl,
  profilePicturesDir
}; 