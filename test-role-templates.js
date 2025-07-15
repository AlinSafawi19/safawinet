const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
    username: 'alin',
    password: 'alin123M@'
};

// Test data
const testTemplate = {
    name: 'Test Template',
    description: 'A test template for testing purposes',
    icon: 'FiSettings',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    isAdmin: false,
    permissions: [
        { page: 'users', actions: ['view', 'add'] },
        { page: 'audit-logs', actions: ['view'] }
    ]
};

let authToken = null;

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
    const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        ...(data && { data })
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }
};

// Test functions
const testLogin = async () => {
    console.log('🔐 Testing login...');
    const response = await makeRequest('POST', '/auth/login', TEST_USER);
    if (response.success) {
        authToken = response.token;
        console.log('✅ Login successful');
        return true;
    } else {
        console.log('❌ Login failed');
        return false;
    }
};

const testGetTemplates = async () => {
    console.log('📋 Testing get templates...');
    const response = await makeRequest('GET', '/role-templates');
    if (response.success) {
        console.log(`✅ Retrieved ${response.data.length} templates`);
        return response.data;
    } else {
        console.log('❌ Failed to get templates');
        return null;
    }
};

const testCreateTemplate = async () => {
    console.log('➕ Testing create template...');
    const response = await makeRequest('POST', '/role-templates', testTemplate);
    if (response.success) {
        console.log('✅ Template created successfully');
        return response.data;
    } else {
        console.log('❌ Failed to create template');
        return null;
    }
};

const testUpdateTemplate = async (templateId) => {
    console.log('✏️  Testing update template...');
    const updateData = {
        ...testTemplate,
        name: 'Updated Test Template',
        description: 'An updated test template'
    };
    const response = await makeRequest('PUT', `/role-templates/${templateId}`, updateData);
    if (response.success) {
        console.log('✅ Template updated successfully');
        return response.data;
    } else {
        console.log('❌ Failed to update template');
        return null;
    }
};

const testGetTemplate = async (templateId) => {
    console.log('👁️  Testing get specific template...');
    const response = await makeRequest('GET', `/role-templates/${templateId}`);
    if (response.success) {
        console.log('✅ Retrieved specific template');
        return response.data;
    } else {
        console.log('❌ Failed to get specific template');
        return null;
    }
};

const testIncrementUsage = async (templateId) => {
    console.log('📈 Testing increment usage...');
    const response = await makeRequest('POST', `/role-templates/${templateId}/increment-usage`);
    if (response.success) {
        console.log('✅ Usage incremented successfully');
        return true;
    } else {
        console.log('❌ Failed to increment usage');
        return false;
    }
};

const testGetPermissions = async () => {
    console.log('🔐 Testing get available permissions...');
    const response = await makeRequest('GET', '/role-templates/permissions/available');
    if (response.success) {
        console.log(`✅ Retrieved ${response.data.length} permission groups`);
        return response.data;
    } else {
        console.log('❌ Failed to get permissions');
        return null;
    }
};

const testDeleteTemplate = async (templateId) => {
    console.log('🗑️  Testing delete template...');
    const response = await makeRequest('DELETE', `/role-templates/${templateId}`);
    if (response.success) {
        console.log('✅ Template deleted successfully');
        return true;
    } else {
        console.log('❌ Failed to delete template');
        return false;
    }
};

// Main test function
const runTests = async () => {
    console.log('🚀 Starting Role Templates API Tests\n');

    try {
        // Test login
        const loginSuccess = await testLogin();
        if (!loginSuccess) {
            console.log('❌ Cannot proceed without authentication');
            return;
        }

        // Test get available permissions
        await testGetPermissions();

        // Test get templates (should be empty initially)
        const initialTemplates = await testGetTemplates();

        // Test create template
        const createdTemplate = await testCreateTemplate();
        if (!createdTemplate) {
            console.log('❌ Cannot proceed without creating a template');
            return;
        }

        // Test get specific template
        await testGetTemplate(createdTemplate._id);

        // Test increment usage
        await testIncrementUsage(createdTemplate._id);

        // Test update template
        await testUpdateTemplate(createdTemplate._id);

        // Test get templates again (should have one template)
        const updatedTemplates = await testGetTemplates();

        // Test delete template
        await testDeleteTemplate(createdTemplate._id);

        // Test get templates again (should be empty)
        const finalTemplates = await testGetTemplates();

        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📊 Test Summary:');
        console.log(`- Initial templates: ${initialTemplates?.length || 0}`);
        console.log(`- After creation: ${updatedTemplates?.length || 0}`);
        console.log(`- After deletion: ${finalTemplates?.length || 0}`);

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testLogin,
    testGetTemplates,
    testCreateTemplate,
    testUpdateTemplate,
    testGetTemplate,
    testIncrementUsage,
    testGetPermissions,
    testDeleteTemplate,
    runTests
}; 