const nodemailer = require('nodemailer');
require('dotenv').config();

const debugEmail = async () => {
    console.log('=== Email Service Debug ===');
    
    // Display environment variables
    console.log('\nEnvironment Variables:');
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET (' + process.env.SMTP_PASS.length + ' chars)' : 'NOT SET');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
    
    // Test different SMTP configurations
    const configs = [
        {
            name: 'Gmail with App Password',
            config: {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            }
        },
        {
            name: 'Gmail with OAuth2 (if configured)',
            config: {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            }
        }
    ];
    
    for (const testConfig of configs) {
        console.log(`\n--- Testing ${testConfig.name} ---`);
        
        try {
            const transporter = nodemailer.createTransport(testConfig.config);
            
            // Test connection
            await new Promise((resolve, reject) => {
                transporter.verify((error, success) => {
                    if (error) {
                        console.log('❌ Connection failed:', error.message);
                        reject(error);
                    } else {
                        console.log('✅ Connection successful');
                        resolve();
                    }
                });
            });
            
            // Test sending a simple email
            const testEmail = {
                from: `"Test" <${process.env.SMTP_USER}>`,
                to: process.env.SMTP_USER,
                subject: 'Email Test - ' + new Date().toISOString(),
                text: 'This is a test email to verify SMTP configuration.',
                html: '<p>This is a test email to verify SMTP configuration.</p>'
            };
            
            const result = await transporter.sendMail(testEmail);
            console.log('✅ Test email sent successfully!');
            console.log('Message ID:', result.messageId);
            
        } catch (error) {
            console.log('❌ Test failed:', error.message);
            console.log('Error code:', error.code);
            console.log('Full error:', error);
        }
    }
    
    console.log('\n=== Debug Complete ===');
    console.log('\nIf all tests failed, please:');
    console.log('1. Enable 2-Step Verification on your Gmail account');
    console.log('2. Generate an App Password: https://myaccount.google.com/apppasswords');
    console.log('3. Update SMTP_PASS in your .env file with the 16-character app password');
    console.log('4. Remove any spaces from the app password');
};

debugEmail().catch(console.error); 