const emailService = require('./services/emailService');
require('dotenv').config();

const testEmail = async () => {
    console.log('=== Testing Email Service ===');
    
    // Test user object
    const testUser = {
        firstName: 'Alin',
        username: 'alin',
        email: 'alinsafawi19@gmail.com',
        isAdmin: true
    };
    
    console.log('Environment variables:');
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    
    try {
        console.log('\nSending welcome email...');
        const result = await emailService.sendWelcomeEmail(testUser);
        
        if (result.success) {
            console.log('✅ Welcome email sent successfully!');
        } else {
            console.log('❌ Failed to send welcome email:', result.error);
        }
    } catch (error) {
        console.error('❌ Email test error:', error.message);
        console.error('Full error:', error);
    }
};

testEmail(); 