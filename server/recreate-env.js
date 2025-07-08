const fs = require('fs');
const path = require('path');

console.log('=== Recreating .env file from scratch ===');

const envPath = path.join(process.cwd(), '.env');
const backupPath = path.join(process.cwd(), '.env.backup');

try {
  // Create backup of current file
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, backupPath);
    console.log('Backup created as .env.backup');
  }
  
  // Define the correct .env content
  const envContent = `NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/safawinet
DB_USER=your-db-username
DB_PASSWORD=your-db-password
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=your-super-secret-cookie-key-change-this-in-production
COOKIE_DOMAIN=localhost
CSRF_SECRET=your-csrf-secret-key-change-this-in-production
SMTP_USER=alinsafawi19@gmail.com
SMTP_PASS=gfcp mfgm mszr ipsg
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_BLOCK_DURATION_MS=1800000
`;

  // Delete the existing file and create a new one
  if (fs.existsSync(envPath)) {
    fs.unlinkSync(envPath);
    console.log('Deleted existing .env file');
  }
  
  // Write the new file with proper UTF-8 encoding
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Created new .env file with proper encoding');
  
  // Verify the new file
  const newBuffer = fs.readFileSync(envPath);
  console.log('New file size:', newBuffer.length, 'bytes');
  console.log('New first 10 bytes:', Array.from(newBuffer.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
  const newContent = newBuffer.toString('utf8');
  console.log('New content length:', newContent.length);
  console.log('First 200 characters of new file:');
  console.log(newContent.substring(0, 200));
  
  console.log('\n=== Testing environment variables ===');
  require('dotenv').config({ path: envPath });
  
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('PORT:', process.env.PORT);
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  
  // Show all environment variables that were loaded
  console.log('\n=== All loaded environment variables ===');
  const loadedVars = Object.keys(process.env).filter(key => 
    key.startsWith('SMTP_') || 
    key === 'NODE_ENV' || 
    key === 'PORT' || 
    key === 'MONGODB_URI' ||
    key === 'JWT_SECRET'
  );
  
  if (loadedVars.length > 0) {
    loadedVars.forEach(key => {
      const value = key.includes('SECRET') || key.includes('PASS') ? '***HIDDEN***' : process.env[key];
      console.log(`${key}: ${value}`);
    });
  } else {
    console.log('No environment variables were loaded');
  }
  
  console.log('\n=== Success! Environment variables should now be working ===');
  
} catch (error) {
  console.error('Error recreating .env file:', error.message);
} 