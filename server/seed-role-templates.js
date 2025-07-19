#!/usr/bin/env node

const { seedRoleTemplates } = require('./seed/seedRoleTemplates');

console.log('🎯 Starting Role Template Seed Script...');
console.log('This will clear existing templates and create 3 default role templates: Admin, Manager, and Viewer.');
console.log('');

seedRoleTemplates()
    .then(() => {
        console.log('');
        console.log('🎉 Role template seed completed successfully!');
        console.log('Created 3 default role templates with appropriate permissions.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Role template seed failed:', error);
        process.exit(1);
    }); 