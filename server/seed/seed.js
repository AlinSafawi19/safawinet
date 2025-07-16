const mongoose = require('mongoose');
const User = require('../models/User');
const { config } = require('../config/config');

// Available pages and actions for the system
const AVAILABLE_PAGES = [
    'dashboard',
    'users',
    'audit-logs',
    'knowledge-guide',
    'profile',
    'reports',
    'analytics',
    'notifications',
    'settings',
    'backups',
    'integrations',
    'security',
    'help',
    'support'
];

const AVAILABLE_ACTIONS = ['view', 'view_own', 'add', 'edit', 'delete', 'export'];

// Role Templates with clear permissions
const ROLE_TEMPLATES = {
    admin: {
        name: 'Administrator',
        description: 'Full access to all features and system administration',
        permissions: AVAILABLE_PAGES.map(page => ({
            page,
            actions: AVAILABLE_ACTIONS
        }))
    },
    viewer: {
        name: 'Viewer',
        description: 'Read-only access to all web app features',
        permissions: AVAILABLE_PAGES.map(page => ({
            page,
            actions: ['view']
        }))
    },
    manager: {
        name: 'Manager',
        description: 'User management and operational oversight',
        permissions: [
            { page: 'dashboard', actions: ['view'] },
            { page: 'users', actions: ['view', 'add', 'edit'] },
            { page: 'audit-logs', actions: ['view'] },
            { page: 'knowledge-guide', actions: ['view'] },
            { page: 'profile', actions: ['view', 'edit'] },
            { page: 'reports', actions: ['view', 'add', 'edit'] },
            { page: 'analytics', actions: ['view', 'add', 'edit'] },
            { page: 'notifications', actions: ['view'] },
            { page: 'settings', actions: ['view'] },
            { page: 'help', actions: ['view'] },
            { page: 'support', actions: ['view'] }
        ]
    },
    supervisor: {
        name: 'Supervisor',
        description: 'Team oversight and advanced reporting',
        permissions: [
            { page: 'dashboard', actions: ['view'] },
            { page: 'users', actions: ['view', 'add', 'edit'] },
            { page: 'audit-logs', actions: ['view'] },
            { page: 'knowledge-guide', actions: ['view'] },
            { page: 'profile', actions: ['view', 'edit'] },
            { page: 'reports', actions: ['view', 'add', 'edit'] },
            { page: 'analytics', actions: ['view', 'add', 'edit'] },
            { page: 'notifications', actions: ['view', 'add'] },
            { page: 'settings', actions: ['view'] },
            { page: 'backups', actions: ['view'] },
            { page: 'help', actions: ['view'] },
            { page: 'support', actions: ['view'] }
        ]
    }
};

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
    role: 'admin',
    permissions: ROLE_TEMPLATES.admin.permissions,
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
        console.log('Role: Administrator (Full Access)');
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
            role: 'manager',
            createdBy: adminId,
            permissions: ROLE_TEMPLATES.manager.permissions,
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
            role: 'viewer',
            createdBy: adminId,
            permissions: ROLE_TEMPLATES.viewer.permissions,
            userPreferences: {
                timezone: 'Asia/Beirut',
                language: 'english',
                theme: 'light',
                dateFormat: 'MMM dd, yyyy h:mm a',
                autoLogoutTime: 30
            }
        },
        {
            username: 'supervisor',
            email: 'supervisor@safawinet.com',
            phone: '+1234567893',
            password: 'Supervisor@123',
            firstName: 'Sarah',
            lastName: 'Supervisor',
            isAdmin: false,
            isActive: true,
            role: 'supervisor',
            createdBy: adminId,
            permissions: ROLE_TEMPLATES.supervisor.permissions,
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
                console.log(`✅ Created sample user: ${userData.username} (${ROLE_TEMPLATES[userData.role].name})`);
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
        const admin = await createAdminUser();

        // Create sample users (optional - uncomment if needed)
        await createSampleUsers(admin._id);

        console.log('✅ Database seeding completed successfully!');
        console.log('\n📋 Role Templates:');
        console.log('1. Administrator - Full access to all features and system administration');
        console.log('2. Manager - User management and operational oversight');
        console.log('3. Supervisor - Team oversight and advanced reporting');
        console.log('4. Viewer - Read-only access to all web app features');
        console.log('\n👥 Sample Users Created:');
        console.log('- alin (Administrator) - Full access');
        console.log('- manager (Manager) - User management + operational access');
        console.log('- supervisor (Supervisor) - Team oversight + advanced reporting');
        console.log('- viewer (Viewer) - Read-only access to all features');

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

module.exports = { seedDatabase, ROLE_TEMPLATES }; 