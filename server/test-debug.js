const axios = require('axios');

async function testDebugEndpoint() {
  try {
    // First, let's login to get a token
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'alin',
      password: 'alin123M@'
    });

    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('Login successful, got token');

    // Now test the debug endpoint
    console.log('\nTesting debug endpoint...');
    const debugResponse = await axios.get('http://localhost:5000/api/auth/audit-logs/debug', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Debug endpoint response:');
    console.log(JSON.stringify(debugResponse.data, null, 2));

    // Also test the regular audit logs endpoint with no filters
    console.log('\nTesting regular audit logs endpoint...');
    const auditResponse = await axios.get('http://localhost:5000/api/auth/audit-logs?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Regular audit logs response:');
    console.log(`Total logs returned: ${auditResponse.data.data.logs.length}`);
    console.log(`Total count: ${auditResponse.data.data.total}`);
    console.log(`Page: ${auditResponse.data.data.page}`);
    console.log(`Limit: ${auditResponse.data.data.limit}`);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDebugEndpoint(); 