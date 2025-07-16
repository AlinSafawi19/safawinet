const mongoose = require('mongoose');
const User = require('./server/models/User');
const fs = require('fs');
const path = require('path');
const { deleteOldProfilePicture } = require('./server/middleware/upload');

// Test user deletion with profile picture cleanup
async function testUserDeletionWithProfilePicture() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/safawinet', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create a test user with profile picture
    const testUser = new User({
      username: 'testuser_deletion',
      email: 'test.deletion@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Deletion',
      profilePicture: {
        url: '/uploads/profile-pictures/test-deletion.jpg',
        filename: 'test-deletion.jpg',
        uploadedAt: new Date()
      }
    });

    await testUser.save();
    console.log('✅ Test user created:', testUser.username);
    console.log('✅ Profile picture set:', testUser.profilePicture);

    // Create a dummy profile picture file
    const profilePicturesDir = path.join(__dirname, 'server/uploads/profile-pictures');
    const testFilePath = path.join(profilePicturesDir, 'test-deletion.jpg');
    
    // Ensure directory exists
    if (!fs.existsSync(profilePicturesDir)) {
      fs.mkdirSync(profilePicturesDir, { recursive: true });
    }
    
    // Create dummy file
    fs.writeFileSync(testFilePath, 'dummy profile picture content');
    console.log('✅ Dummy profile picture file created:', testFilePath);

    // Verify file exists
    if (fs.existsSync(testFilePath)) {
      console.log('✅ Profile picture file exists before deletion');
    } else {
      console.log('❌ Profile picture file not found before deletion');
    }

    // Test the deleteOldProfilePicture function directly
    console.log('\n🧪 Testing deleteOldProfilePicture function...');
    await deleteOldProfilePicture(testUser);
    
    // Check if file was deleted
    if (!fs.existsSync(testFilePath)) {
      console.log('✅ Profile picture file successfully deleted by deleteOldProfilePicture');
    } else {
      console.log('❌ Profile picture file still exists after deleteOldProfilePicture');
    }

    // Test user deletion (recreate file first)
    fs.writeFileSync(testFilePath, 'dummy profile picture content again');
    console.log('✅ Recreated profile picture file for deletion test');

    // Delete the user (this should trigger profile picture deletion)
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ User deleted from database');

    // Check if file was deleted during user deletion
    if (!fs.existsSync(testFilePath)) {
      console.log('✅ Profile picture file successfully deleted during user deletion');
    } else {
      console.log('❌ Profile picture file still exists after user deletion');
    }

    console.log('\n🎉 User deletion with profile picture cleanup test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testUserDeletionWithProfilePicture(); 