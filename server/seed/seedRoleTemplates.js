const mongoose = require('mongoose');
const RoleTemplate = require('../models/RoleTemplate');
const User = require('../models/User');
const { config } = require('../config/config');

// Default role templates
const DEFAULT_ROLE_TEMPLATES = [
    {
        name: 'Administrator',
        description: 'Full access to all features and system administration',
        icon: 'FiAward',
        color: 'bg-gradient-to-r from-purple-500 to-pink-500',
        isAdmin: true,
        isDefault: true,
        permissions: [
            { page: 'users', actions: ['view', 'add', 'edit', 'delete'] }
        ]
    },
    {
        name: 'Manager',
        description: 'User management and operational oversight',
        icon: 'FiBriefcase',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        isAdmin: false,
        isDefault: true,
        permissions: [
            { page: 'users', actions: ['view', 'add', 'edit'] }
        ]
    },
    {
        name: 'Supervisor',
        description: 'Team oversight and advanced reporting',
        icon: 'FiUsers',
        color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
        isAdmin: false,
        isDefault: true,
        permissions: [
            { page: 'users', actions: ['view', 'add', 'edit'] }
        ]
    },
    {
        name: 'Viewer',
        description: 'Read-only access to all web app features',
        icon: 'FiEye',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        isAdmin: false,
        isDefault: true,
        permissions: [
            { page: 'users', actions: ['view'] }
        ]
    },
    {
        name: 'Support Agent',
        description: 'Customer support and user assistance',
        icon: 'FiUserCheck',
        color: 'bg-gradient-to-r from-teal-500 to-cyan-500',
        isAdmin: false,
        isDefault: true,
        permissions: [
            { page: 'users', actions: ['view', 'edit'] }
        ]
    },
    {
        name: 'Security Analyst',
        description: 'Security monitoring and threat analysis',
        icon: 'FiShield',
        color: 'bg-gradient-to-r from-orange-500 to-red-500',
        isAdmin: false,
        isDefault: false,
        permissions: [
            { page: 'users', actions: ['view', 'edit'] }
        ]
    },
    {
        name: 'Data Analyst',
        description: 'Data analysis and reporting capabilities',
        icon: 'FiSettings',
        color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
        isAdmin: false,
        isDefault: false,
        permissions: [
            { page: 'users', actions: ['view'] }
        ]
    },
    {
        name: 'Team Lead',
        description: 'Team leadership and project management',
        icon: 'FiUsers',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        isAdmin: false,
        isDefault: false,
        permissions: [
            { page: 'users', actions: ['view', 'add', 'edit'] }
        ]
    },
    {
        name: 'Auditor',
        description: 'System auditing and compliance review',
        icon: 'FiEye',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        isAdmin: false,
        isDefault: false,
        permissions: [
            { page: 'users', actions: ['view'] }
        ]
    },
    {
        name: 'Help Desk',
        description: 'Technical support and user assistance',
        icon: 'FiUserCheck',
        color: 'bg-gradient-to-r from-teal-500 to-cyan-500',
        isAdmin: false,
        isDefault: false,
        permissions: [
            { page: 'users', actions: ['view', 'edit'] }
        ]
    },
    {
        name: 'Guest User',
        description: 'Limited access for temporary users',
        icon: 'FiUserX',
        color: 'bg-gradient-to-r from-gray-500 to-gray-600',
        isAdmin: false,
        isDefault: false,
        permissions: [
            { page: 'users', actions: ['view'] }
        ]
    },
    {
        name: 'Power User',
        description: 'Advanced user with extended permissions',
        icon: 'FiLock',
        color: 'bg-gradient-to-r from-purple-500 to-pink-500',
        isAdmin: false,
        isDefault: false,
        permissions: [
            { page: 'users', actions: ['view', 'add', 'edit'] }
        ]
    }
];

// Function to seed role templates
const seedRoleTemplates = async () => {
    try {
        console.log('🌱 Starting role templates seeding...');

        // Connect to MongoDB
        await mongoose.connect(config.database.uri);
        console.log('📦 Connected to MongoDB');

        // Find admin user to set as creator
        const adminUser = await User.findOne({ isAdmin: true });
        if (!adminUser) {
            console.error('❌ No admin user found. Please run the main seed script first.');
            return;
        }

        let createdCount = 0;
        let skippedCount = 0;

        for (const templateData of DEFAULT_ROLE_TEMPLATES) {
            try {
                // Check if template already exists
                const existingTemplate = await RoleTemplate.findOne({ 
                    name: templateData.name,
                    isDefault: true 
                });

                if (existingTemplate) {
                    console.log(`⏭️  Template "${templateData.name}" already exists. Skipping.`);
                    skippedCount++;
                    continue;
                }

                // Create new template
                const template = new RoleTemplate({
                    ...templateData,
                    createdBy: adminUser._id
                });

                await template.save();
                console.log(`✅ Created template: ${templateData.name}`);
                createdCount++;

            } catch (error) {
                console.error(`❌ Error creating template "${templateData.name}":`, error.message);
            }
        }

        console.log('\n📋 Role Templates Seeding Summary:');
        console.log(`✅ Created: ${createdCount} templates`);
        console.log(`⏭️  Skipped: ${skippedCount} templates (already exist)`);
        console.log(`📊 Total: ${createdCount + skippedCount} templates processed`);

        // List all templates
        const allTemplates = await RoleTemplate.find({}).sort({ name: 1 });
        console.log('\n📋 Available Role Templates:');
        allTemplates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.name} - ${template.description}`);
            console.log(`   Permissions: ${template.permissions.length} page(s)`);
            console.log(`   Usage: ${template.usageCount} users`);
            console.log(`   Status: ${template.isActive ? 'Active' : 'Inactive'}${template.isDefault ? ' (Default)' : ''}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Role templates seeding failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedRoleTemplates();
}

module.exports = { seedRoleTemplates, DEFAULT_ROLE_TEMPLATES }; 