const { seedRoleTemplates100 } = require('./seed/seedRoleTemplates100');

console.log('🚀 Starting 100 Role Templates Seeding...');
console.log('This will create 100 different role templates with various permission combinations.');
console.log('');

seedRoleTemplates100()
    .then(() => {
        console.log('');
        console.log('✅ Seeding completed successfully!');
        console.log('📊 100 role templates have been created in the database.');
        console.log('');
        console.log('🔑 You can now log in with:');
        console.log('   Username: alin');
        console.log('   Password: alin123M@');
        console.log('');
        console.log('📝 The templates include:');
        console.log('   - Admin roles (Super Admin, System Administrator, IT Administrator)');
        console.log('   - Management roles (Operations Manager, Department Manager, Team Lead)');
        console.log('   - HR roles (HR Manager, HR Specialist, Recruiter)');
        console.log('   - Security roles (Security Manager, Security Analyst, Compliance Officer)');
        console.log('   - Viewer roles (Auditor, Analyst, Viewer, Observer)');
        console.log('   - Limited roles (Guest, Trainee, Intern)');
        console.log('   - And many more combinations with different departments and functions');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }); 