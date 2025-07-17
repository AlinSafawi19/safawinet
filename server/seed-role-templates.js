#!/usr/bin/env node

const { seedRoleTemplates } = require('./seed/seedRoleTemplates');

console.log('🎯 Starting 100 Role Template Seed Script...');
console.log('This will create 100 role templates with various permissions and realistic data.');
console.log('');

seedRoleTemplates()
    .then(() => {
        console.log('');
        console.log('🎉 Role template seed completed successfully!');
        console.log('You can now test the role template filtering and pagination features with 100+ templates.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Role template seed failed:', error);
        process.exit(1);
    }); 