const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test users with different permissions
const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Admin123!',
    expectedPermission: 'all logs'
  },
  {
    name: 'View User',
    email: 'view@test.com', 
    password: 'View123!',
    expectedPermission: 'all logs'
  },
  {
    name: 'View Own User',
    email: 'viewown@test.com',
    password: 'ViewOwn123!',
    expectedPermission: 'own logs only'
  },
  {
    name: 'No Permission User',
    email: 'noperm@test.com',
    password: 'NoPerm123!',
    expectedPermission: 'no access'
  }
];

async function testAuditLogPermissions() {
  console.log('🧪 Testing Audit Log Permissions\n');

  for (const user of testUsers) {
    console.log(`\n📋 Testing: ${user.name} (${user.expectedPermission})`);
    console.log('─'.repeat(50));

    try {
      // Login
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        identifier: user.email,
        password: user.password
      });

      if (!loginResponse.data.success) {
        console.log(`❌ Login failed: ${loginResponse.data.message}`);
        continue;
      }

      const token = loginResponse.data.data.token;
      const userData = loginResponse.data.data.user;

      console.log(`✅ Login successful`);
      console.log(`👤 User: ${userData.firstName} ${userData.lastName}`);
      console.log(`🔑 Role: ${userData.role}`);
      console.log(`👑 Admin: ${userData.isAdmin}`);

      // Check permissions
      const auditPermissions = userData.permissions?.find(p => p.page === 'audit-logs');
      console.log(`📋 Audit Log Permissions: ${auditPermissions ? auditPermissions.actions.join(', ') : 'None'}`);

      // Test audit logs access
      try {
        const auditResponse = await axios.get(`${BASE_URL}/auth/audit-logs?page=1&limit=5`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (auditResponse.data.success) {
          const logs = auditResponse.data.data.logs;
          const total = auditResponse.data.data.total;
          
          console.log(`✅ Access granted`);
          console.log(`📊 Total logs: ${total}`);
          console.log(`📄 Returned logs: ${logs.length}`);
          
          // Check if logs are filtered by user
          if (logs.length > 0) {
            const ownLogs = logs.filter(log => log.userId === userData._id);
            const otherLogs = logs.filter(log => log.userId !== userData._id);
            
            console.log(`👤 Own logs: ${ownLogs.length}`);
            console.log(`👥 Other users' logs: ${otherLogs.length}`);
            
            if (otherLogs.length > 0) {
              console.log(`✅ Can see other users' logs (full access)`);
            } else {
              console.log(`✅ Can only see own logs (restricted access)`);
            }
          }
        } else {
          console.log(`❌ Access denied: ${auditResponse.data.message}`);
        }
      } catch (auditError) {
        if (auditError.response?.status === 403) {
          console.log(`❌ Access denied: ${auditError.response.data.message}`);
        } else {
          console.log(`❌ Error: ${auditError.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n🏁 Permission testing completed');
}

// Run the test
testAuditLogPermissions().catch(console.error); 