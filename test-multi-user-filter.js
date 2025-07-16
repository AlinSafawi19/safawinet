const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials (replace with actual admin credentials)
const ADMIN_CREDENTIALS = {
  identifier: 'admin',
  password: 'admin123'
};

async function testMultiUserFilter() {
  console.log('🧪 Testing Multi-User Filter for Audit Logs');
  console.log('===========================================\n');

  let authToken;

  // Test 1: Login as admin
  console.log('🔐 Test 1: Logging in as admin');
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Admin login successful');
    } else {
      console.log('❌ Admin login failed:', loginResponse.data.message);
      return;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // Test 2: Get available users for filtering
  console.log('\n👥 Test 2: Getting available users for filtering');
  try {
    const usersResponse = await axios.get(`${BASE_URL}/auth/audit-logs/users`, { headers });
    
    if (usersResponse.data.success) {
      const users = usersResponse.data.data;
      console.log(`✅ Found ${users.length} users available for filtering`);
      
      if (users.length > 0) {
        console.log('📋 Available users:');
        users.slice(0, 5).forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.label} (ID: ${user.value})`);
        });
        if (users.length > 5) {
          console.log(`   ... and ${users.length - 5} more users`);
        }
      }
    } else {
      console.log('❌ Failed to fetch users:', usersResponse.data.message);
      return;
    }
  } catch (error) {
    console.log('❌ Error fetching users:', error.response?.data?.message || error.message);
    return;
  }

  // Test 3: Get audit logs with single user filter
  console.log('\n🔍 Test 3: Testing single user filter');
  try {
    const usersResponse = await axios.get(`${BASE_URL}/auth/audit-logs/users`, { headers });
    
    if (usersResponse.data.success && usersResponse.data.data.length > 0) {
      const testUserId = usersResponse.data.data[0].value;
      const testUserName = usersResponse.data.data[0].label;
      
      console.log(`🔍 Filtering by single user: ${testUserName}`);
      
      const singleUserResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10&userId=${testUserId}`, { headers });
      
      if (singleUserResponse.data.success) {
        const logs = singleUserResponse.data.data.logs;
        console.log(`✅ Single user filter successful`);
        console.log(`📊 Total logs: ${singleUserResponse.data.data.total}`);
        console.log(`📄 Returned logs: ${logs.length}`);
        
        if (logs.length > 0) {
          // Verify all logs belong to the filtered user
          const allBelongToUser = logs.every(log => log.user && log.user._id === testUserId);
          console.log(`✅ All logs belong to filtered user: ${allBelongToUser ? 'Yes' : 'No'}`);
        }
      } else {
        console.log('❌ Single user filter failed:', singleUserResponse.data.message);
      }
    } else {
      console.log('❌ No users available for single user filter test');
    }
  } catch (error) {
    console.log('❌ Error testing single user filter:', error.response?.data?.message || error.message);
  }

  // Test 4: Get audit logs with multiple user filter
  console.log('\n👥 Test 4: Testing multiple user filter');
  try {
    const usersResponse = await axios.get(`${BASE_URL}/auth/audit-logs/users`, { headers });
    
    if (usersResponse.data.success && usersResponse.data.data.length >= 2) {
      const user1 = usersResponse.data.data[0];
      const user2 = usersResponse.data.data[1];
      const userIds = [user1.value, user2.value];
      const userNames = [user1.label, user2.label];
      
      console.log(`🔍 Filtering by multiple users: ${userNames.join(', ')}`);
      
      const multiUserResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=20&userId=${userIds.join(',')}`, { headers });
      
      if (multiUserResponse.data.success) {
        const logs = multiUserResponse.data.data.logs;
        console.log(`✅ Multiple user filter successful`);
        console.log(`📊 Total logs: ${multiUserResponse.data.data.total}`);
        console.log(`📄 Returned logs: ${logs.length}`);
        
        if (logs.length > 0) {
          // Verify all logs belong to one of the filtered users
          const allBelongToFilteredUsers = logs.every(log => 
            log.user && userIds.includes(log.user._id)
          );
          console.log(`✅ All logs belong to filtered users: ${allBelongToFilteredUsers ? 'Yes' : 'No'}`);
          
          // Show unique users in results
          const uniqueUsers = new Set();
          logs.forEach(log => {
            if (log.user) {
              uniqueUsers.add(log.user.fullName);
            }
          });
          console.log(`👥 Unique users in results: ${Array.from(uniqueUsers).join(', ')}`);
        }
      } else {
        console.log('❌ Multiple user filter failed:', multiUserResponse.data.message);
      }
    } else {
      console.log('❌ Not enough users available for multiple user filter test (need at least 2)');
    }
  } catch (error) {
    console.log('❌ Error testing multiple user filter:', error.response?.data?.message || error.message);
  }

  // Test 5: Compare results with and without user filter
  console.log('\n📊 Test 5: Comparing filtered vs unfiltered results');
  try {
    // Get unfiltered results
    const unfilteredResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10`, { headers });
    
    if (unfilteredResponse.data.success) {
      const unfilteredLogs = unfilteredResponse.data.data.logs;
      console.log(`📊 Unfiltered total logs: ${unfilteredResponse.data.data.total}`);
      console.log(`📄 Unfiltered returned logs: ${unfilteredLogs.length}`);
      
      // Get filtered results with first user
      const usersResponse = await axios.get(`${BASE_URL}/auth/audit-logs/users`, { headers });
      
      if (usersResponse.data.success && usersResponse.data.data.length > 0) {
        const testUserId = usersResponse.data.data[0].value;
        const testUserName = usersResponse.data.data[0].label;
        
        const filteredResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10&userId=${testUserId}`, { headers });
        
        if (filteredResponse.data.success) {
          const filteredLogs = filteredResponse.data.data.logs;
          console.log(`📊 Filtered total logs: ${filteredResponse.data.data.total}`);
          console.log(`📄 Filtered returned logs: ${filteredLogs.length}`);
          
          console.log(`📈 Filter effectiveness: ${unfilteredLogs.length > 0 ? Math.round((filteredLogs.length / unfilteredLogs.length) * 100) : 0}% of unfiltered results`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Error comparing filtered vs unfiltered results:', error.response?.data?.message || error.message);
  }

  console.log('\n✅ Multi-user filter testing completed!');
}

// Run the test
testMultiUserFilter().catch(console.error); 