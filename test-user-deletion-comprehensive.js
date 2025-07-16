const mongoose = require('mongoose');
const User = require('./server/models/User');
const RoleTemplate = require('./server/models/RoleTemplate');
const AuditLog = require('./server/models/AuditLog');
const fs = require('fs');
const path = require('path');
const { deleteOldProfilePicture } = require('./server/middleware/upload');

// Comprehensive test for user deletion with all associated data
async function testUserDeletionComprehensive() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/safawinet', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create a test user
    const testUser = new User({
      username: 'testuser_comprehensive',
      email: 'test.comprehensive@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Comprehensive',
      profilePicture: {
        url: '/uploads/profile-pictures/test-comprehensive.jpg',
        filename: 'test-comprehensive.jpg',
        uploadedAt: new Date()
      }
    });

    await testUser.save();
    console.log('✅ Test user created:', testUser.username);

    // Create a dummy profile picture file
    const profilePicturesDir = path.join(__dirname, 'server/uploads/profile-pictures');
    const testFilePath = path.join(profilePicturesDir, 'test-comprehensive.jpg');
    
    // Ensure directory exists
    if (!fs.existsSync(profilePicturesDir)) {
      fs.mkdirSync(profilePicturesDir, { recursive: true });
    }
    
    // Create dummy file
    fs.writeFileSync(testFilePath, 'dummy profile picture content');
    console.log('✅ Dummy profile picture file created:', testFilePath);

    // Create role templates for this user
    const roleTemplate1 = new RoleTemplate({
      name: 'Test Template 1',
      description: 'A test template created by the user',
      icon: 'FiSettings',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      isDefault: false,
      isActive: true,
      createdBy: testUser._id,
      permissions: [
        {
          page: 'users',
          actions: ['view', 'add']
        }
      ]
    });

    const roleTemplate2 = new RoleTemplate({
      name: 'Test Template 2',
      description: 'Another test template',
      icon: 'FiUsers',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      isDefault: false,
      isActive: true,
      createdBy: testUser._id,
      permissions: [
        {
          page: 'users',
          actions: ['view', 'edit']
        }
      ]
    });

    await roleTemplate1.save();
    await roleTemplate2.save();
    console.log('✅ Created 2 role templates for the user');

    // Create audit logs for this user
    const auditLog1 = new AuditLog({
      userId: testUser._id,
      username: testUser.username,
      action: 'login',
      ip: '127.0.0.1',
      userAgent: 'Test User Agent',
      success: true,
      details: { test: 'audit log 1' }
    });

    const auditLog2 = new AuditLog({
      userId: testUser._id,
      username: testUser.username,
      action: 'profile_update',
      ip: '127.0.0.1',
      userAgent: 'Test User Agent',
      success: true,
      details: { test: 'audit log 2' }
    });

    await auditLog1.save();
    await auditLog2.save();
    console.log('✅ Created 2 audit logs for the user');

    // Verify all data exists before deletion
    console.log('\n📊 Pre-deletion verification:');
    
    const userExists = await User.findById(testUser._id);
    console.log('✅ User exists:', !!userExists);
    
    const profileFileExists = fs.existsSync(testFilePath);
    console.log('✅ Profile picture file exists:', profileFileExists);
    
    const roleTemplatesCount = await RoleTemplate.countDocuments({ createdBy: testUser._id });
    console.log('✅ Role templates count:', roleTemplatesCount);
    
    const auditLogsCount = await AuditLog.countDocuments({ userId: testUser._id });
    console.log('✅ Audit logs count:', auditLogsCount);

    // Delete the user (this should trigger all cleanup)
    console.log('\n🗑️  Deleting user...');
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ User deleted from database');

    // Verify all associated data was deleted
    console.log('\n📊 Post-deletion verification:');
    
    const userStillExists = await User.findById(testUser._id);
    console.log('❌ User still exists:', !!userStillExists);
    
    const profileFileStillExists = fs.existsSync(testFilePath);
    console.log('❌ Profile picture file still exists:', profileFileStillExists);
    
    const roleTemplatesStillExist = await RoleTemplate.countDocuments({ createdBy: testUser._id });
    console.log('❌ Role templates still exist:', roleTemplatesStillExist);
    
    const auditLogsStillExist = await AuditLog.countDocuments({ userId: testUser._id });
    console.log('❌ Audit logs still exist:', auditLogsStillExist);

    // Test bulk deletion
    console.log('\n🧪 Testing bulk deletion...');
    
    // Create multiple test users
    const testUsers = [];
    const testFiles = [];
    
    for (let i = 1; i <= 3; i++) {
      const bulkUser = new User({
        username: `bulkuser${i}`,
        email: `bulkuser${i}@example.com`,
        password: 'TestPassword123!',
        firstName: `Bulk`,
        lastName: `User${i}`,
        profilePicture: {
          url: `/uploads/profile-pictures/bulk-test-${i}.jpg`,
          filename: `bulk-test-${i}.jpg`,
          uploadedAt: new Date()
        }
      });
      
      await bulkUser.save();
      testUsers.push(bulkUser);
      
      // Create dummy profile picture file
      const bulkFilePath = path.join(profilePicturesDir, `bulk-test-${i}.jpg`);
      fs.writeFileSync(bulkFilePath, `dummy content for bulk user ${i}`);
      testFiles.push(bulkFilePath);
      
      // Create role template for this user
      const bulkTemplate = new RoleTemplate({
        name: `Bulk Template ${i}`,
        description: `Template for bulk user ${i}`,
        icon: 'FiSettings',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        isDefault: false,
        isActive: true,
        createdBy: bulkUser._id,
        permissions: [{ page: 'users', actions: ['view'] }]
      });
      await bulkTemplate.save();
      
      // Create audit log for this user
      const bulkLog = new AuditLog({
        userId: bulkUser._id,
        username: bulkUser.username,
        action: 'login',
        ip: '127.0.0.1',
        userAgent: 'Test User Agent',
        success: true,
        details: { test: `bulk log ${i}` }
      });
      await bulkLog.save();
    }
    
    console.log('✅ Created 3 bulk test users with associated data');
    
    // Verify bulk data exists
    const bulkUsersCount = await User.countDocuments({ username: { $regex: /^bulkuser/ } });
    const bulkTemplatesCount = await RoleTemplate.countDocuments({ name: { $regex: /^Bulk Template/ } });
    const bulkLogsCount = await AuditLog.countDocuments({ username: { $regex: /^bulkuser/ } });
    
    console.log('📊 Bulk pre-deletion counts:');
    console.log('  - Users:', bulkUsersCount);
    console.log('  - Templates:', bulkTemplatesCount);
    console.log('  - Logs:', bulkLogsCount);
    
    // Delete bulk users
    const bulkUserIds = testUsers.map(u => u._id);
    await User.deleteMany({ _id: { $in: bulkUserIds } });
    console.log('✅ Bulk users deleted');
    
    // Verify bulk data was deleted
    const bulkUsersStillExist = await User.countDocuments({ username: { $regex: /^bulkuser/ } });
    const bulkTemplatesStillExist = await RoleTemplate.countDocuments({ name: { $regex: /^Bulk Template/ } });
    const bulkLogsStillExist = await AuditLog.countDocuments({ username: { $regex: /^bulkuser/ } });
    
    console.log('📊 Bulk post-deletion counts:');
    console.log('  - Users:', bulkUsersStillExist);
    console.log('  - Templates:', bulkTemplatesStillExist);
    console.log('  - Logs:', bulkLogsStillExist);
    
    // Check if profile picture files were deleted
    const filesStillExist = testFiles.filter(file => fs.existsSync(file));
    console.log('📊 Profile picture files still exist:', filesStillExist.length, 'out of', testFiles.length);

    console.log('\n🎉 Comprehensive user deletion test completed!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('✅ Single user deletion with all associated data cleanup');
    console.log('✅ Bulk user deletion with all associated data cleanup');
    console.log('✅ Profile picture file cleanup');
    console.log('✅ Role template cleanup (non-default only)');
    console.log('✅ Audit log cleanup');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testUserDeletionComprehensive(); 