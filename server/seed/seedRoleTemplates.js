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
            { page: 'users', actions: ['view', 'add', 'edit', 'delete', 'export'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
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
            { page: 'users', actions: ['view', 'add', 'edit', 'export'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
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
            { page: 'users', actions: ['view_own'] },
            { page: 'audit-logs', actions: ['view_own'] }
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