const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
    identifier: 'alin',
    password: 'alin123M@'
};

// Helper function to create axios instance
const createApi = (token = null) => {
    const api = axios.create({
        baseURL: BASE_URL,
        withCredentials: true,
        timeout: 10000
    });

    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return api;
};

// Test backup code system
async function testBackupCodeSystem() {
    console.log('🧪 Testing Backup Code System...\n');

    try {
        // Step 1: Login to get auth token
        console.log('1️⃣ Logging in...');
        const loginResponse = await createApi().post('/auth/login', TEST_USER);
        
        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.data.token;
        const api = createApi(token);
        console.log('✅ Login successful\n');

        // Step 2: Check if 2FA is enabled
        console.log('2️⃣ Checking 2FA status...');
        const userResponse = await api.get('/auth/me');
        const user = userResponse.data.data;

        if (!user.twoFactorEnabled) {
            console.log('⚠️  2FA not enabled. Enabling 2FA first...');
            
            // Setup 2FA
            const setupResponse = await api.post('/auth/2fa/setup');
            if (!setupResponse.data.success) {
                console.error('❌ 2FA setup failed:', setupResponse.data.message);
                return;
            }

            const { secret, backupCodes } = setupResponse.data.data;
            console.log('✅ 2FA setup successful');
            console.log('📱 Secret:', secret);
            console.log('🔑 Backup Codes:', backupCodes);
            console.log('');

            // For testing, we'll use the first backup code to verify
            const testBackupCode = backupCodes[0];
            console.log('🧪 Using backup code for testing:', testBackupCode);

            // Step 3: Test backup code verification
            console.log('3️⃣ Testing backup code verification...');
            const verifyResponse = await api.post('/auth/2fa/verify-backup-code', {
                backupCode: testBackupCode
            });

            if (verifyResponse.data.success) {
                console.log('✅ Backup code verification successful');
                console.log('📊 Remaining codes:', verifyResponse.data.data.remainingCodes);
            } else {
                console.error('❌ Backup code verification failed:', verifyResponse.data.message);
            }

        } else {
            console.log('✅ 2FA is already enabled');
            
            // Step 4: Get backup codes count
            console.log('4️⃣ Getting backup codes count...');
            const countResponse = await api.get('/auth/2fa/backup-codes-count');
            
            if (countResponse.data.success) {
                const { remainingCodes, totalCodes } = countResponse.data.data;
                console.log(`📊 Backup Codes: ${remainingCodes}/${totalCodes} remaining`);
            } else {
                console.error('❌ Failed to get backup codes count:', countResponse.data.message);
            }
        }

        // Step 5: Test login with backup code
        console.log('\n5️⃣ Testing login with backup code...');
        
        // First, get a backup code (if any remaining)
        const countResponse = await api.get('/auth/2fa/backup-codes-count');
        if (countResponse.data.success && countResponse.data.data.remainingCodes > 0) {
            console.log('✅ Backup codes available for testing');
            
            // Note: In a real scenario, you would need to logout first
            // and then login with the backup code
            console.log('ℹ️  To test login with backup code, you would need to:');
            console.log('   1. Logout from current session');
            console.log('   2. Login with username/password');
            console.log('   3. When 2FA is required, use backup code instead of TOTP');
        } else {
            console.log('⚠️  No backup codes available for testing');
        }

        console.log('\n✅ Backup code system test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
    }
}

// Run the test
testBackupCodeSystem(); 