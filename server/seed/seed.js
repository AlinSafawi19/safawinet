const mongoose = require('mongoose');
const User = require('../models/User');
const { config } = require('../config/config');

// Available pages and actions for the system
const AVAILABLE_PAGES = [
    'users'
];

const AVAILABLE_ACTIONS = ['view', 'add', 'edit', 'delete'];

// Base admin user data
const adminUser = {
    username: 'alin',
    email: 'alinsafawi19@gmail.com',
    phone: '+96171882088',
    password: 'alin123M@', // This will be hashed automatically
    firstName: 'Alin',
    lastName: 'Safawi',
    isAdmin: true,
    isActive: true,
    permissions: AVAILABLE_PAGES.map(page => ({
        page,
        actions: AVAILABLE_ACTIONS
    })),
    userPreferences: {
        timezone: 'Asia/Beirut',
        language: 'english',
        theme: 'light',
        dateFormat: 'MMM dd, yyyy h:mm a',
        autoLogoutTime: 30
    }
};

// Function to create admin user
const createAdminUser = async () => {
    try {
        // Check if admin user already exists
        const existingAdmin = await User.findOne({ username: 'alin' });

        if (existingAdmin) {
            console.log('Admin user already exists. Skipping creation.');
            return existingAdmin;
        }

        // Create admin user with welcomeEmailSent explicitly set to false
        const adminData = {
            ...adminUser,
            welcomeEmailSent: false
        };

        const admin = new User(adminData);
        await admin.save();

        // Verify the welcomeEmailSent field was set correctly
        const savedAdmin = await User.findOne({ username: 'alin' });

        console.log('✅ Admin user created successfully!');
        console.log('Username: alin');
        console.log('Email: alinsafawi19@gmail.com');
        console.log('Password: alin123M@');
        console.log('Welcome Email Sent:', savedAdmin.welcomeEmailSent, '(will be sent on first login)');
        console.log('⚠️  Please change the password after first login!');

        return admin;
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        throw error;
    }
};

// Function to create sample regular users (optional)
const createSampleUsers = async (adminId) => {
    const sampleUsers = [
        {
            username: 'manager',
            email: 'manager@safawinet.com',
            phone: '+1234567891',
            password: 'Manager@123',
            firstName: 'John',
            lastName: 'Manager',
            isAdmin: false,
            isActive: true,
            createdBy: adminId,
            permissions: [
                { page: 'users', actions: ['view', 'add', 'edit'] }
            ],
            userPreferences: {
                timezone: 'Asia/Beirut',
                language: 'english',
                theme: 'light',
                dateFormat: 'MMM dd, yyyy h:mm a',
                autoLogoutTime: 30
            }
        },
        {
            username: 'viewer',
            email: 'viewer@safawinet.com',
            phone: '+1234567892',
            password: 'Viewer@123',
            firstName: 'Jane',
            lastName: 'Viewer',
            isAdmin: false,
            isActive: true,
            createdBy: adminId,
            permissions: [
                { page: 'users', actions: ['view'] }
            ],
            userPreferences: {
                timezone: 'Asia/Beirut',
                language: 'english',
                theme: 'light',
                dateFormat: 'MMM dd, yyyy h:mm a',
                autoLogoutTime: 30
            }
        }
    ];

    try {
        for (const userData of sampleUsers) {
            const existingUser = await User.findOne({ username: userData.username });
            if (!existingUser) {
                const user = new User({
                    ...userData,
                    welcomeEmailSent: false
                });
                await user.save();
                console.log(`✅ Created sample user: ${userData.username}`);
            } else {
                console.log(`⏭️  Sample user ${userData.username} already exists. Skipping.`);
            }
        }
    } catch (error) {
        console.error('❌ Error creating sample users:', error.message);
    }
};

// Main seed function
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Connect to MongoDB
        await mongoose.connect(config.database.uri);
        console.log('📦 Connected to MongoDB');

        // Create admin user
        await createAdminUser();
        //const admin = await createAdminUser();

        // Create sample users (optional - uncomment if needed)
        // await createSampleUsers(admin._id);

        console.log('✅ Database seeding completed successfully!');
        console.log('\n📋 Available users:');
        console.log('1. Admin - Full access to all pages and actions');
        console.log('2. Manager - Limited access (view + add/edit on users page)');
        console.log('3. Viewer - Read-only access to users page');

    } catch (error) {
        console.error('❌ Database seeding failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
};

// Run seed if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = {
    seedDatabase,
    createAdminUser,
    createSampleUsers,
    AVAILABLE_PAGES,
    AVAILABLE_ACTIONS
}; 