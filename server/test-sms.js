const smsService = require('./services/smsService');
require('dotenv').config();

async function testSMSConfiguration() {
    console.log('=== SMS Configuration Test ===\n');

    // Check environment variables
    console.log('1. Checking environment variables...');
    const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    let missingVars = [];

    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missingVars.push(varName);
            console.log(`   ❌ ${varName}: NOT SET`);
        } else {
            console.log(`   ✅ ${varName}: SET`);
        }
    });

    if (missingVars.length > 0) {
        console.log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
        console.log('Please set these variables in your .env file and restart the server.');
        return;
    }

    console.log('\n2. Testing SMS service initialization...');
    try {
        // Test if SMS service is properly configured
        if (smsService.isConfigured()) {
            console.log('   ✅ SMS service is properly configured');
        } else {
            console.log('   ❌ SMS service configuration failed');
            return;
        }
    } catch (error) {
        console.log(`   ❌ SMS service initialization error: ${error.message}`);
        return;
    }

    console.log('\n3. Testing phone number validation...');
    const testNumbers = [
        '+1234567890',
        '+44123456789',
        '+61412345678',
        '1234567890',
        'invalid'
    ];

    testNumbers.forEach(number => {
        const isValid = smsService.validatePhoneNumber(number);
        console.log(`   ${isValid ? '✅' : '❌'} ${number}: ${isValid ? 'Valid' : 'Invalid'}`);
    });

    console.log('\n4. Testing SMS sending (optional)...');
    console.log('   To test actual SMS sending, uncomment the test code below and provide a real phone number.');
    
    // Uncomment the following code to test actual SMS sending
    /*
    const testPhoneNumber = '+1234567890'; // Replace with your phone number
    const testCode = '123456';
    
    try {
        console.log(`   Sending test SMS to ${testPhoneNumber}...`);
        const result = await smsService.sendVerificationCode(testPhoneNumber, testCode);
        
        if (result.success) {
            console.log('   ✅ Test SMS sent successfully!');
        } else {
            console.log(`   ❌ Failed to send SMS: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ❌ SMS sending error: ${error.message}`);
    }
    */

    console.log('\n=== Test Complete ===');
    console.log('\nNext steps:');
    console.log('1. If all checks passed, your SMS configuration is ready');
    console.log('2. To test actual SMS sending, edit this file and uncomment the test code');
    console.log('3. Replace the test phone number with your actual phone number');
    console.log('4. Run: node test-sms.js');
    console.log('5. Check your phone for the test SMS');
}

// Run the test
testSMSConfiguration().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
}); 