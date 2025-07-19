const mongoose = require('mongoose');
const RoleTemplate = require('../models/RoleTemplate');
const User = require('../models/User');
const { config } = require('../config/config');

// Default role templates
const defaultTemplates = [
    {
        name: 'Admin',
        description: 'Full system access with all permissions',
        icon: 'FiShield',
        color: 'bg-gradient-to-r from-orange-500 to-red-500',
        isAdmin: true,
        isActive: true,
        isDefault: true,
        usageCount: 0,
        permissions: [
            {
                page: 'users',
                actions: ['view', 'view_own', 'add', 'edit', 'delete', 'export']
            },
            {
                page: 'audit-logs',
                actions: ['view', 'export']
            }
        ]
    },
    {
        name: 'Manager',
        description: 'Management access with user and audit log permissions',
        icon: 'FiUsers',
        color: 'bg-gradient-to-r from-teal-500 to-cyan-500',
        isAdmin: false,
        isActive: true,
        isDefault: true,
        usageCount: 0,
        permissions: [
            {
                page: 'users',
                actions: ['view', 'view_own', 'add', 'edit']
            },
            {
                page: 'audit-logs',
                actions: ['view', 'export']
            }
        ]
    },
    {
        name: 'Viewer',
        description: 'Read-only access to view users and audit logs',
        icon: 'FiEye',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        isAdmin: false,
        isActive: true,
        isDefault: true,
        usageCount: 0,
        permissions: [
            {
                page: 'users',
                actions: ['view', 'view_own']
            },
            {
                page: 'audit-logs',
                actions: ['view']
            }
        ]
    }
];

// Main seed function
const seedRoleTemplates = async () => {
    try {
        console.log('🌱 Starting role template seeding...');

        // Connect to MongoDB
        await mongoose.connect(config.database.uri);
        console.log('📦 Connected to MongoDB');

        // Find or create admin user
        let admin = await User.findOne({ username: 'alin' });
        if (!admin) {
            console.log('⚠️  Admin user not found. Creating admin user first...');
            const adminData = {
                username: 'alin',
                email: 'alinsafawi19@gmail.com',
                phone: '+96171882088',
                password: 'alin123M@',
                firstName: 'Alin',
                lastName: 'Safawi',
                isAdmin: true,
                isActive: true,
                role: 'admin',
                permissions: [
                    {
                        page: 'users',
                        actions: ['view', 'view_own', 'add', 'edit', 'delete', 'export']
                    },
                    {
                        page: 'audit-logs',
                        actions: ['view', 'export']
                    }
                ],
                userPreferences: {
                    timezone: 'Asia/Beirut',
                    language: 'english',
                    theme: 'light',
                    dateFormat: 'MMM DD, YYYY h:mm a',
                    autoLogoutTime: 30
                },
                welcomeEmailSent: false
            };
            admin = new User(adminData);
            await admin.save();
            console.log('✅ Admin user created for seeding');
        } else {
            console.log('✅ Admin user found');
        }

        // Clear existing role templates
        console.log('🗑️  Clearing existing role templates...');
        await RoleTemplate.deleteMany({});
        console.log('✅ Cleared all existing role templates');

        // Create default role templates
        console.log('🚀 Creating default role templates...');

        for (const templateData of defaultTemplates) {
            const template = new RoleTemplate({
                ...templateData,
                createdBy: admin._id,
                createdAt: new Date(),
                lastUsed: null
            });

            await template.save();
            console.log(`✅ Created template: ${templateData.name}`);
        }

        console.log('✅ Role template seeding completed successfully!');
        console.log('\n🔑 Admin Login Credentials:');
        console.log('Username: alin');
        console.log('Password: alin123M@');
        console.log('\n📝 Created 3 default role templates: Admin, Manager, and Viewer');

    } catch (error) {
        console.error('❌ Role template seeding failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
};

// Run seed if this file is executed directly
if (require.main === module) {
    seedRoleTemplates();
}

module.exports = { seedRoleTemplates }; 