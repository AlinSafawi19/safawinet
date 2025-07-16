const mongoose = require('mongoose');
const RoleTemplate = require('./server/models/RoleTemplate');
const User = require('./server/models/User');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safawinet';

async function testRoleTemplateScope() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create test users
        const user1 = new User({
            username: 'testuser1',
            email: 'testuser1@example.com',
            firstName: 'Test',
            lastName: 'User1',
            password: 'password123'
        });
        await user1.save();

        const user2 = new User({
            username: 'testuser2',
            email: 'testuser2@example.com',
            firstName: 'Test',
            lastName: 'User2',
            password: 'password123'
        });
        await user2.save();

        console.log('Created test users');

        // Create test templates
        const defaultTemplate = new RoleTemplate({
            name: 'Default Template',
            description: 'A default template',
            icon: 'FiSettings',
            color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
            isDefault: true,
            isActive: true,
            createdBy: user1._id,
            permissions: [
                {
                    page: 'users',
                    actions: ['view', 'add']
                }
            ]
        });
        await defaultTemplate.save();

        const user1Template = new RoleTemplate({
            name: 'User1 Template',
            description: 'A template created by user1',
            icon: 'FiUsers',
            color: 'bg-gradient-to-r from-green-500 to-emerald-500',
            isDefault: false,
            isActive: true,
            createdBy: user1._id,
            permissions: [
                {
                    page: 'users',
                    actions: ['view', 'edit']
                }
            ]
        });
        await user1Template.save();

        const user2Template = new RoleTemplate({
            name: 'User2 Template',
            description: 'A template created by user2',
            icon: 'FiShield',
            color: 'bg-gradient-to-r from-purple-500 to-pink-500',
            isDefault: false,
            isActive: true,
            createdBy: user2._id,
            permissions: [
                {
                    page: 'users',
                    actions: ['view', 'add']
                }
            ]
        });
        await user2Template.save();

        console.log('Created test templates');

        // Test 1: Check what user1 can see
        console.log('\n=== Test 1: User1 Scope ===');
        const user1Templates = await RoleTemplate.getPaginatedTemplatesForUser({
            page: 1,
            limit: 10,
            status: 'all',
            userId: user1._id
        });
        console.log('User1 can see templates:', user1Templates.map(t => ({ name: t.name, isDefault: t.isDefault, createdBy: t.createdBy })));

        // Test 2: Check what user2 can see
        console.log('\n=== Test 2: User2 Scope ===');
        const user2Templates = await RoleTemplate.getPaginatedTemplatesForUser({
            page: 1,
            limit: 10,
            status: 'all',
            userId: user2._id
        });
        console.log('User2 can see templates:', user2Templates.map(t => ({ name: t.name, isDefault: t.isDefault, createdBy: t.createdBy })));

        // Test 3: Check duplicate name detection for user1
        console.log('\n=== Test 3: Duplicate Name Check (User1) ===');
        const duplicateNameCheck = await RoleTemplate.checkDuplicateNameInUserScope('User1 Template', user1._id);
        console.log('Duplicate name check for "User1 Template" (should find existing):', duplicateNameCheck ? 'Found' : 'Not found');

        const newNameCheck = await RoleTemplate.checkDuplicateNameInUserScope('New Template', user1._id);
        console.log('New name check for "New Template" (should not find):', newNameCheck ? 'Found' : 'Not found');

        // Test 4: Check duplicate permissions detection
        console.log('\n=== Test 4: Duplicate Permissions Check ===');
        const samePermissions = [
            {
                page: 'users',
                actions: ['view', 'add']
            }
        ];

        const duplicatePermissionsUser1 = await RoleTemplate.checkDuplicatePermissionsInUserScope(samePermissions, user1._id);
        console.log('Duplicate permissions check for User1 (should find default template):', duplicatePermissionsUser1 ? `Found: ${duplicatePermissionsUser1.name}` : 'Not found');

        const duplicatePermissionsUser2 = await RoleTemplate.checkDuplicatePermissionsInUserScope(samePermissions, user2._id);
        console.log('Duplicate permissions check for User2 (should find default template):', duplicatePermissionsUser2 ? `Found: ${duplicatePermissionsUser2.name}` : 'Not found');

        // Test 5: Check that user2 cannot see user1's template
        console.log('\n=== Test 5: User Isolation ===');
        const user2CannotSeeUser1Template = user2Templates.find(t => t.name === 'User1 Template');
        console.log('User2 cannot see User1 template:', user2CannotSeeUser1Template ? 'ERROR: Can see' : 'Correct: Cannot see');

        console.log('\n=== All Tests Completed ===');

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        // Clean up test data
        await RoleTemplate.deleteMany({ name: { $in: ['Default Template', 'User1 Template', 'User2 Template'] } });
        await User.deleteMany({ username: { $in: ['testuser1', 'testuser2'] } });
        await mongoose.disconnect();
        console.log('Cleaned up test data and disconnected');
    }
}

testRoleTemplateScope(); 