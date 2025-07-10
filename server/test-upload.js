const fs = require('fs');
const path = require('path');

// Test the upload directory structure
console.log('=== Upload Directory Test ===');

const uploadsDir = path.join(__dirname, 'uploads');
const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');

console.log('Uploads directory:', uploadsDir);
console.log('Profile pictures directory:', profilePicturesDir);

// Check if directories exist
console.log('Uploads directory exists:', fs.existsSync(uploadsDir));
console.log('Profile pictures directory exists:', fs.existsSync(profilePicturesDir));

// List contents
if (fs.existsSync(uploadsDir)) {
  console.log('Uploads directory contents:', fs.readdirSync(uploadsDir));
}

if (fs.existsSync(profilePicturesDir)) {
  console.log('Profile pictures directory contents:', fs.readdirSync(profilePicturesDir));
}

// Test file creation
const testFile = path.join(profilePicturesDir, 'test.txt');
try {
  fs.writeFileSync(testFile, 'test content');
  console.log('Test file created successfully');
  fs.unlinkSync(testFile);
  console.log('Test file deleted successfully');
} catch (error) {
  console.error('Error with file operations:', error.message);
}

console.log('=== Test Complete ==='); 