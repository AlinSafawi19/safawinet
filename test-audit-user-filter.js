const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test the user filter functionality
async function testAuditUserFilter() {
  console.log('🧪 Testing Audit Logs User Filter\n');

  try {
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin@test.com',
      password: 'Admin123!'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login successful');

    // Test 1: Get users for filter dropdown
    console.log('\n📋 Test 1: Getting users for filter dropdown');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/auth/audit-logs/users`, { headers });
      
      if (usersResponse.data.success) {
        console.log(`✅ Users fetched successfully`);
        console.log(`👥 Total users: ${usersResponse.data.data.length}`);
        console.log('📝 User options:');
        usersResponse.data.data.slice(0, 3).forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.label} (${user.value})`);
        });
        if (usersResponse.data.data.length > 3) {
          console.log(`   ... and ${usersResponse.data.data.length - 3} more`);
        }
      } else {
        console.log('❌ Failed to fetch users:', usersResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error fetching users:', error.response?.data?.message || error.message);
    }

    // Test 2: Get audit logs without user filter
    console.log('\n📋 Test 2: Getting audit logs without user filter');
    try {
      const auditResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=5`, { headers });
      
      if (auditResponse.data.success) {
        const logs = auditResponse.data.data.logs;
        console.log(`✅ Audit logs fetched successfully`);
        console.log(`📊 Total logs: ${auditResponse.data.data.total}`);
        console.log(`📄 Returned logs: ${logs.length}`);
        
        if (logs.length > 0) {
          console.log('👥 Users in logs:');
          const uniqueUsers = new Set();
          logs.forEach(log => {
            if (log.user) {
              uniqueUsers.add(log.user.fullName);
            }
          });
          Array.from(uniqueUsers).slice(0, 3).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user}`);
          });
          if (uniqueUsers.size > 3) {
            console.log(`   ... and ${uniqueUsers.size - 3} more users`);
          }
        }
      } else {
        console.log('❌ Failed to fetch audit logs:', auditResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error fetching audit logs:', error.response?.data?.message || error.message);
    }

    // Test 3: Get audit logs with user filter
    console.log('\n📋 Test 3: Getting audit logs with user filter');
    try {
      // First get users to have a valid user ID
      const usersResponse = await axios.get(`${BASE_URL}/auth/audit-logs/users`, { headers });
      
      if (usersResponse.data.success && usersResponse.data.data.length > 0) {
        const testUserId = usersResponse.data.data[0].value;
        const testUserName = usersResponse.data.data[0].label;
        
        console.log(`🔍 Filtering by user: ${testUserName}`);
        
        const filteredResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=10&userId=${testUserId}`, { headers });
        
        if (filteredResponse.data.success) {
          const logs = filteredResponse.data.data.logs;
          console.log(`✅ Filtered audit logs fetched successfully`);
          console.log(`📊 Total logs: ${filteredResponse.data.data.total}`);
          console.log(`📄 Returned logs: ${logs.length}`);
          
          if (logs.length > 0) {
            console.log('👥 Users in filtered logs:');
            const uniqueUsers = new Set();
            logs.forEach(log => {
              if (log.user) {
                uniqueUsers.add(log.user.fullName);
              }
            });
            Array.from(uniqueUsers).forEach((user, index) => {
              console.log(`   ${index + 1}. ${user}`);
            });
            
            // Verify all logs belong to the filtered user
            const allBelongToUser = logs.every(log => log.user && log.user._id === testUserId);
            console.log(`✅ All logs belong to filtered user: ${allBelongToUser ? 'Yes' : 'No'}`);
          }
        } else {
          console.log('❌ Failed to fetch filtered audit logs:', filteredResponse.data.message);
        }
      } else {
        console.log('❌ No users available for filtering test');
      }
    } catch (error) {
      console.log('❌ Error fetching filtered audit logs:', error.response?.data?.message || error.message);
    }

    // Test 4: Test with non-admin user (should have restricted access)
    console.log('\n📋 Test 4: Testing with view_own permission user');
    try {
      const viewOwnLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        identifier: 'viewown@test.com',
        password: 'ViewOwn123!'
      });

      if (viewOwnLoginResponse.data.success) {
        const viewOwnToken = viewOwnLoginResponse.data.data.token;
        const viewOwnHeaders = { Authorization: `Bearer ${viewOwnToken}` };
        
        console.log('✅ View own user login successful');
        
        // Try to get users (should be denied)
        try {
          const usersResponse = await axios.get(`${BASE_URL}/auth/audit-logs/users`, { headers: viewOwnHeaders });
          console.log('❌ Should have been denied access to users endpoint');
        } catch (error) {
          if (error.response?.status === 403) {
            console.log('✅ Correctly denied access to users endpoint (403)');
          } else {
            console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
          }
        }
        
        // Get audit logs (should only see own logs)
        try {
          const auditResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=5`, { headers: viewOwnHeaders });
          
          if (auditResponse.data.success) {
            const logs = auditResponse.data.data.logs;
            console.log(`✅ Audit logs fetched successfully`);
            console.log(`📊 Total logs: ${auditResponse.data.data.total}`);
            console.log(`📄 Returned logs: ${logs.length}`);
            
            if (logs.length > 0) {
              const currentUserId = viewOwnLoginResponse.data.data.user._id;
              const allOwnLogs = logs.every(log => log.userId === currentUserId);
              console.log(`✅ All logs belong to current user: ${allOwnLogs ? 'Yes' : 'No'}`);
            }
          } else {
            console.log('❌ Failed to fetch audit logs:', auditResponse.data.message);
          }
        } catch (error) {
          console.log('❌ Error fetching audit logs:', error.response?.data?.message || error.message);
        }
      } else {
        console.log('❌ View own user login failed:', viewOwnLoginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error testing view own user:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🏁 User filter testing completed');
}

// Run the test
testAuditUserFilter().catch(console.error); 