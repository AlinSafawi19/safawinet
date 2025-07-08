const mongoose = require('mongoose');
const User = require('../models/User');
const { config } = require('../config/config');

const checkDatabase = async () => {
    try {
        console.log('🔍 Checking database content...');

        // Connect to MongoDB
        await mongoose.connect(config.database.uri);
        console.log('📦 Connected to MongoDB');

        // Get all users
        const users = await User.find({}).select('-password').sort({ createdAt: 1 });

        console.log('\n📊 Database Content Summary:');
        console.log(`Total users: ${users.length}`);

        if (users.length === 0) {
            console.log('❌ No users found in database. Run "npm run seed" to create initial data.');
            return;
        }

        console.log('\n👥 Users in Database:');
        console.log('='.repeat(80));

        users.forEach((user, index) => {
            console.log(`\n${index + 1}. User Details:`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Phone: ${user.phone || 'N/A'}`);
            console.log(`   Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
            console.log(`   Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
            console.log(`   Created: ${user.createdAt.toLocaleString()}`);
            console.log(`   Last Login: ${user.lastLogin ? user.lastLogin.toLocaleString() : 'Never'}`);

            if (user.permissions && user.permissions.length > 0) {
                console.log(`   Permissions:`);
                user.permissions.forEach(perm => {
                    console.log(`     - ${perm.page}: ${perm.actions.join(', ')}`);
                });
            } else {
                console.log(`   Permissions: None assigned`);
            }

            if (user.createdBy) {
                console.log(`   Created By: ${user.createdBy}`);
            }

            console.log('-'.repeat(40));
        });

        // Summary statistics
        const adminCount = users.filter(u => u.isAdmin).length;
        const activeCount = users.filter(u => u.isActive).length;

        console.log('\n📈 Summary Statistics:');
        console.log(`   Total Users: ${users.length}`);
        console.log(`   Admin Users: ${adminCount}`);
        console.log(`   Active Users: ${activeCount}`);
        console.log(`   Inactive Users: ${users.length - activeCount}`);

        // Check for admin user
        const adminUser = users.find(u => u.username === 'admin');
        if (adminUser) {
            console.log('\n✅ Admin user found and configured correctly!');
        } else {
            console.log('\n❌ Admin user not found. Run "npm run seed" to create it.');
        }

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📦 Disconnected from MongoDB');
    }
};

// Run if this file is executed directly
if (require.main === module) {
    checkDatabase();
}

module.exports = { checkDatabase }; 