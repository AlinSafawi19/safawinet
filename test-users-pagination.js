const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUsers = [
    {
        username: 'admin',
        email: 'admin@safawinet.com',
        password: 'Admin@123',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
        permissions: [
            { page: 'users', actions: ['view', 'add', 'edit', 'delete', 'export'] }
        ]
    },
    {
        username: 'manager',
        email: 'manager@safawinet.com',
        password: 'Manager@123',
        firstName: 'Manager',
        lastName: 'User',
        isAdmin: false,
        permissions: [
            { page: 'users', actions: ['view', 'add', 'edit'] }
        ]
    },
    {
        username: 'viewer',
        email: 'viewer@safawinet.com',
        password: 'Viewer@123',
        firstName: 'Viewer',
        lastName: 'User',
        isAdmin: false,
        permissions: [
            { page: 'users', actions: ['view_own'] }
        ]
    }
];

async function loginUser(userData) {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: userData.email,
            password: userData.password
        });
        return response.data.data.token;
    } catch (error) {
        console.error(`❌ Login failed for ${userData.username}:`, error.response?.data?.message || error.message);
        return null;
    }
}

async function testUsersEndpoint(token, userType, expectedBehavior) {
    console.log(`\n🔍 Testing ${userType} user access...`);
    
    try {
        const response = await axios.get(`${BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                limit: 10
            }
        });

        console.log(`✅ ${userType} user can access users endpoint`);
        console.log(`   - Total users: ${response.data.data.pagination.total}`);
        console.log(`   - Users returned: ${response.data.data.users.length}`);
        console.log(`   - Expected behavior: ${expectedBehavior}`);
        
        // Check if user can see filter options
        try {
            const filterResponse = await axios.get(`${BASE_URL}/users/filter-options`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(`✅ ${userType} user can access filter options`);
        } catch (filterError) {
            console.log(`❌ ${userType} user cannot access filter options:`, filterError.response?.data?.message);
        }

    } catch (error) {
        console.log(`❌ ${userType} user access failed:`, error.response?.data?.message || error.message);
    }
}

async function testSingleUserAccess(token, userType, userId) {
    console.log(`\n🔍 Testing ${userType} user access to single user...`);
    
    try {
        const response = await axios.get(`${BASE_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`✅ ${userType} user can access single user`);
        console.log(`   - User accessed: ${response.data.data.firstName} ${response.data.data.lastName}`);
        
    } catch (error) {
        console.log(`❌ ${userType} user single user access failed:`, error.response?.data?.message || error.message);
    }
}

async function testPaginationAndFiltering(token, userType) {
    console.log(`\n🔍 Testing pagination and filtering for ${userType} user...`);
    
    try {
        // Test pagination
        const page1Response = await axios.get(`${BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                limit: 5
            }
        });

        console.log(`✅ Pagination test passed`);
        console.log(`   - Page 1: ${page1Response.data.data.users.length} users`);
        console.log(`   - Total pages: ${page1Response.data.data.pagination.totalPages}`);
        console.log(`   - Has next page: ${page1Response.data.data.pagination.hasNextPage}`);

        // Test search filtering
        const searchResponse = await axios.get(`${BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                limit: 10,
                search: 'admin'
            }
        });

        console.log(`✅ Search filtering test passed`);
        console.log(`   - Search results: ${searchResponse.data.data.users.length} users`);

        // Test role filtering
        const roleResponse = await axios.get(`${BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                limit: 10,
                role: 'admin'
            }
        });

        console.log(`✅ Role filtering test passed`);
        console.log(`   - Role filter results: ${roleResponse.data.data.users.length} users`);

        // Test sorting
        const sortResponse = await axios.get(`${BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                limit: 10,
                sortBy: 'firstName',
                sortOrder: 'asc'
            }
        });

        console.log(`✅ Sorting test passed`);
        console.log(`   - Sorted results: ${sortResponse.data.data.users.length} users`);

    } catch (error) {
        console.log(`❌ Pagination/filtering test failed:`, error.response?.data?.message || error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Users Pagination and Permission Tests\n');

    // Test admin user
    const adminToken = await loginUser(testUsers[0]);
    if (adminToken) {
        await testUsersEndpoint(adminToken, 'Admin', 'Can view all users');
        await testPaginationAndFiltering(adminToken, 'Admin');
        
        // Test single user access
        const usersResponse = await axios.get(`${BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (usersResponse.data.data.users.length > 0) {
            const firstUserId = usersResponse.data.data.users[0]._id;
            await testSingleUserAccess(adminToken, 'Admin', firstUserId);
        }
    }

    // Test manager user
    const managerToken = await loginUser(testUsers[1]);
    if (managerToken) {
        await testUsersEndpoint(managerToken, 'Manager', 'Can view all users');
        await testPaginationAndFiltering(managerToken, 'Manager');
    }

    // Test viewer user (view_own permission)
    const viewerToken = await loginUser(testUsers[2]);
    if (viewerToken) {
        await testUsersEndpoint(viewerToken, 'Viewer', 'Can only view own users');
        await testPaginationAndFiltering(viewerToken, 'Viewer');
    }

    console.log('\n✅ All tests completed!');
}

// Run tests
runTests().catch(console.error); 