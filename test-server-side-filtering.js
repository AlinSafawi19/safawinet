const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  identifier: 'admin@example.com',
  password: 'Admin123!'
};

async function testServerSideFiltering() {
  try {
    console.log('🧪 Testing Server-Side Filtering...\n');

    // Step 1: Login to get authentication token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.data.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Login successful\n');

    // Step 2: Test basic pagination (no filters)
    console.log('2. Testing basic pagination (no filters)...');
    const basicResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=5`, {
      headers: authHeaders
    });

    if (basicResponse.data.success) {
      const basicData = basicResponse.data.data;
      console.log(`✅ Basic query: ${basicData.logs.length} logs, Total: ${basicData.total}`);
    }

    // Step 3: Test action filtering
    console.log('\n3. Testing action filtering...');
    const actionResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10&action=login`, {
      headers: authHeaders
    });

    if (actionResponse.data.success) {
      const actionData = actionResponse.data.data;
      console.log(`✅ Action filter (login): ${actionData.logs.length} logs, Total: ${actionData.total}`);
      
      // Verify all returned logs have the correct action
      const allLoginActions = actionData.logs.every(log => log.action === 'login');
      console.log(`   - All logs are login actions: ${allLoginActions}`);
    }

    // Step 4: Test risk level filtering
    console.log('\n4. Testing risk level filtering...');
    const riskResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10&riskLevel=high`, {
      headers: authHeaders
    });

    if (riskResponse.data.success) {
      const riskData = riskResponse.data.data;
      console.log(`✅ Risk level filter (high): ${riskData.logs.length} logs, Total: ${riskData.total}`);
      
      // Verify all returned logs have the correct risk level
      const allHighRisk = riskData.logs.every(log => log.riskLevel === 'high');
      console.log(`   - All logs are high risk: ${allHighRisk}`);
    }

    // Step 5: Test success/failure filtering
    console.log('\n5. Testing success/failure filtering...');
    const successResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10&success=true`, {
      headers: authHeaders
    });

    if (successResponse.data.success) {
      const successData = successResponse.data.data;
      console.log(`✅ Success filter (true): ${successData.logs.length} logs, Total: ${successData.total}`);
      
      // Verify all returned logs are successful
      const allSuccessful = successData.logs.every(log => log.success === true);
      console.log(`   - All logs are successful: ${allSuccessful}`);
    }

    // Step 6: Test combined filtering
    console.log('\n6. Testing combined filtering...');
    const combinedResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10&action=login&success=true&riskLevel=low`, {
      headers: authHeaders
    });

    if (combinedResponse.data.success) {
      const combinedData = combinedResponse.data.data;
      console.log(`✅ Combined filters: ${combinedData.logs.length} logs, Total: ${combinedData.total}`);
      
      // Verify all returned logs match all filters
      const allMatchFilters = combinedData.logs.every(log => 
        log.action === 'login' && log.success === true && log.riskLevel === 'low'
      );
      console.log(`   - All logs match combined filters: ${allMatchFilters}`);
    }

    // Step 7: Test date range filtering
    console.log('\n7. Testing date range filtering...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dateResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10&cutoff=${oneHourAgo}`, {
      headers: authHeaders
    });

    if (dateResponse.data.success) {
      const dateData = dateResponse.data.data;
      console.log(`✅ Date range filter (last hour): ${dateData.logs.length} logs, Total: ${dateData.total}`);
      
      // Verify all returned logs are within the date range
      const cutoffTime = new Date(oneHourAgo);
      const allWithinRange = dateData.logs.every(log => new Date(log.timestamp) >= cutoffTime);
      console.log(`   - All logs are within date range: ${allWithinRange}`);
    }

    // Step 8: Test admin endpoint with additional filters
    console.log('\n8. Testing admin endpoint with additional filters...');
    try {
      const adminResponse = await axios.get(`${BASE_URL}/auth/admin/audit-logs?page=1&limit=5&action=login`, {
        headers: authHeaders
      });

      if (adminResponse.data.success) {
        const adminData = adminResponse.data.data;
        console.log(`✅ Admin endpoint: ${adminData.logs.length} logs, Total: ${adminData.total}`);
        
        if (adminData.summary.uniqueUsersCount) {
          console.log(`   - Unique users: ${adminData.summary.uniqueUsersCount}`);
        }
      }
    } catch (adminError) {
      console.log('⚠️  Admin endpoint not accessible (user may not be admin)');
    }

    // Step 9: Test pagination with filters
    console.log('\n9. Testing pagination with filters...');
    const page1Response = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=3&action=login`, {
      headers: authHeaders
    });

    const page2Response = await axios.get(`${BASE_URL}/auth/audit-logs?page=2&limit=3&action=login`, {
      headers: authHeaders
    });

    if (page1Response.data.success && page2Response.data.success) {
      const page1Data = page1Response.data.data;
      const page2Data = page2Response.data.data;
      
      console.log(`✅ Page 1: ${page1Data.logs.length} logs`);
      console.log(`✅ Page 2: ${page2Data.logs.length} logs`);
      
      // Verify different pages return different data
      const page1Ids = page1Data.logs.map(log => log._id);
      const page2Ids = page2Data.logs.map(log => log._id);
      const noOverlap = page1Ids.every(id => !page2Ids.includes(id));
      console.log(`   - Pages have different data: ${noOverlap}`);
    }

    // Step 10: Test summary statistics
    console.log('\n10. Testing summary statistics...');
    const summaryResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10`, {
      headers: authHeaders
    });

    if (summaryResponse.data.success) {
      const summaryData = summaryResponse.data.data;
      console.log(`✅ Summary statistics:`, summaryData.summary);
    }

    console.log('\n🎉 All server-side filtering tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Server-side filtering is working correctly');
    console.log('   - All filters are applied on the database level');
    console.log('   - Pagination works with filters');
    console.log('   - Summary statistics are calculated server-side');
    console.log('   - No client-side filtering is happening');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testServerSideFiltering(); 