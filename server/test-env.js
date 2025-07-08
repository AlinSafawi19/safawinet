const path = require('path');
const fs = require('fs');

console.log('=== Environment Variables Debug ===');
console.log('Current working directory:', process.cwd());
console.log('.env file path:', path.join(process.cwd(), '.env'));

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('.env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('.env file size:', envContent.length, 'characters');
  console.log('First 200 characters of .env:');
  console.log(envContent.substring(0, 200));
} else {
  console.log('.env file does not exist');
}

// Try loading dotenv with explicit path
console.log('\n=== Loading dotenv with explicit path ===');
require('dotenv').config({ path: envPath });

console.log('\n=== Environment Variables Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);

console.log('\n=== All Environment Variables ===');
Object.keys(process.env).forEach(key => {
  if (key.startsWith('SMTP_') || key === 'NODE_ENV') {
    console.log(`${key}: ${process.env[key]}`);
  }
});

// Try alternative loading method
console.log('\n=== Alternative loading method ===');
const dotenv = require('dotenv');
const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result);

if (result.error) {
  console.log('Dotenv error:', result.error.message);
} 