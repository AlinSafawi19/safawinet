const mongoose = require('mongoose');
const User = require('./server/models/User');

// Test profile picture functionality
async function testProfilePicture() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/safawinet', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create a test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe'
    });

    await testUser.save();
    console.log('✅ Test user created:', testUser.username);

    // Test profile initials generation
    console.log('✅ Profile initials:', testUser.profileInitials);

    // Test updating profile initials
    testUser.firstName = 'Jane';
    testUser.lastName = 'Smith';
    await testUser.updateProfileInitials();
    console.log('✅ Updated profile initials:', testUser.profileInitials);

    // Test profile picture fields
    testUser.profilePicture = {
      url: '/uploads/profile-pictures/test-image.jpg',
      filename: 'test-image.jpg',
      uploadedAt: new Date()
    };
    await testUser.save();
    console.log('✅ Profile picture set:', testUser.profilePicture);

    // Test removing profile picture
    testUser.profilePicture = {
      url: null,
      filename: null,
      uploadedAt: null
    };
    await testUser.save();
    console.log('✅ Profile picture removed');

    // Clean up
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test user deleted');

    console.log('\n🎉 All profile picture tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testProfilePicture(); 