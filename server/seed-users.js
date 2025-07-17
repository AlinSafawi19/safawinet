#!/usr/bin/env node

const { seedTestUsers } = require('./seed/seedUsers');

console.log('🎯 Starting 100 User Seed Script...');
console.log('This will create 100 test users with various roles and realistic data.');
console.log('');

seedTestUsers()
    .then(() => {
        console.log('');
        console.log('🎉 Seed completed successfully!');
        console.log('You can now test the pagination and filtering features with 100+ users.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Seed failed:', error);
        process.exit(1);
    }); 