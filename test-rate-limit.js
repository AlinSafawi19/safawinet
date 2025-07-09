const axios = require('axios');

// Test rate limiting by making multiple requests quickly
async function testRateLimit() {
    console.log('Testing rate limiting...');
    
    const baseURL = 'http://localhost:5000/api';
    const token = 'your-test-token'; // Replace with actual token
    
    const api = axios.create({
        baseURL,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        timeout: 5000
    });

    const requests = [];
    
    // Make 10 requests quickly to trigger rate limiting
    for (let i = 0; i < 10; i++) {
        requests.push(
            api.get('/auth/security-events')
                .then(response => {
                    console.log(`Request ${i + 1}: Success`);
                    return { success: true, index: i + 1 };
                })
                .catch(error => {
                    if (error.response?.status === 429) {
                        console.log(`Request ${i + 1}: Rate limited (429)`);
                        return { success: false, rateLimited: true, index: i + 1 };
                    } else {
                        console.log(`Request ${i + 1}: Error - ${error.message}`);
                        return { success: false, error: error.message, index: i + 1 };
                    }
                })
        );
    }

    try {
        const results = await Promise.all(requests);
        
        const successful = results.filter(r => r.success).length;
        const rateLimited = results.filter(r => r.rateLimited).length;
        const errors = results.filter(r => !r.success && !r.rateLimited).length;
        
        console.log('\n=== Rate Limit Test Results ===');
        console.log(`Successful requests: ${successful}`);
        console.log(`Rate limited requests: ${rateLimited}`);
        console.log(`Other errors: ${errors}`);
        
        if (rateLimited > 0) {
            console.log('✅ Rate limiting is working correctly');
        } else {
            console.log('⚠️ Rate limiting may not be working as expected');
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the test
testRateLimit(); 