const mongoose = require('mongoose');
const User = require('../models/User');
const { config } = require('../config/config');

// Available pages and actions for the system
const AVAILABLE_PAGES = [
    'users',
    'audit-logs'
];

const AVAILABLE_ACTIONS = ['view', 'view_own', 'add', 'edit', 'delete', 'export'];

// Role Templates with clear permissions
const ROLE_TEMPLATES = {
    admin: {
        name: 'Administrator',
        description: 'Full access to all features and system administration',
        permissions: AVAILABLE_PAGES.map(page => ({
            page,
            actions: AVAILABLE_ACTIONS
        }))
    },
    viewer: {
        name: 'Viewer',
        description: 'Read-only access to all web app features',
        permissions: AVAILABLE_PAGES.map(page => ({
            page,
            actions: ['view']
        }))
    },
    manager: {
        name: 'Manager',
        description: 'User management and operational oversight',
        permissions: [
            { page: 'users', actions: ['view', 'add', 'edit'] },
            { page: 'audit-logs', actions: ['view'] }
        ]
    },
    custom: {
        name: 'Custom',
        description: 'Custom role with specific permissions',
        permissions: [
            { page: 'users', actions: ['view', 'view_own'] },
            { page: 'audit-logs', actions: ['view_own'] }
        ]
    }
};

// Sample data arrays for generating realistic users
const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
    'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
    'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra',
    'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
    'Kenneth', 'Laura', 'Kevin', 'Emily', 'Brian', 'Kimberly', 'George', 'Deborah', 'Edward', 'Dorothy',
    'Ronald', 'Lisa', 'Timothy', 'Nancy', 'Jason', 'Karen', 'Jeffrey', 'Betty', 'Ryan', 'Helen',
    'Jacob', 'Sandra', 'Gary', 'Donna', 'Nicholas', 'Carol', 'Eric', 'Ruth', 'Jonathan', 'Sharon',
    'Stephen', 'Michelle', 'Larry', 'Laura', 'Justin', 'Emily', 'Scott', 'Kimberly', 'Brandon', 'Deborah',
    'Benjamin', 'Dorothy', 'Samuel', 'Lisa', 'Frank', 'Nancy', 'Gregory', 'Karen', 'Raymond', 'Betty',
    'Alexander', 'Helen', 'Patrick', 'Sandra', 'Jack', 'Donna', 'Dennis', 'Carol', 'Jerry', 'Ruth'
];

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
    'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
    'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
    'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
    'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

const domains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
    'safawinet.com', 'company.com', 'business.com', 'corp.com', 'enterprise.com'
];

const roles = ['admin', 'manager', 'viewer', 'custom'];
const timezones = ['Asia/Beirut', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
const themes = ['light', 'dark'];
const languages = ['english', 'arabic', 'french'];

// Function to generate random user data
const generateUserData = (index, adminId) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const timezone = timezones[Math.floor(Math.random() * timezones.length)];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const language = languages[Math.floor(Math.random() * languages.length)];
    
    // Generate username (firstname.lastname + random number)
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`;
    
    // Generate email
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
    
    // Generate phone number
    const phone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    // Generate password (firstName + random number + special char)
    const password = `${firstName}${Math.floor(Math.random() * 999)}!`;
    
    // Randomly decide if user is active (90% active, 10% inactive)
    const isActive = Math.random() > 0.1;
    
    // Randomly decide if user is admin (5% chance)
    const isAdmin = role === 'admin' || Math.random() < 0.05;

    // Generate creation date spanning from 2023 to 2025
    const startDate = new Date('2023-01-01').getTime();
    const endDate = new Date().getTime(); // Today
    const randomTime = startDate + Math.random() * (endDate - startDate);
    const createdAt = new Date(randomTime);

    // Generate last login date (some users have never logged in)
    let lastLogin = null;
    if (Math.random() > 0.3) { // 70% of users have logged in
        const loginStartDate = createdAt.getTime();
        const loginEndDate = new Date().getTime();
        const randomLoginTime = loginStartDate + Math.random() * (loginEndDate - loginStartDate);
        lastLogin = new Date(randomLoginTime);
    }
    
    return {
        username,
        email,
        phone,
        password,
        firstName,
        lastName,
        isAdmin,
        isActive,
        role,
        createdBy: adminId,
        permissions: ROLE_TEMPLATES[role] ? ROLE_TEMPLATES[role].permissions : ROLE_TEMPLATES.viewer.permissions,
        userPreferences: {
            timezone,
            language,
            theme,
            dateFormat: 'MMM DD, YYYY h:mm a',
            autoLogoutTime: Math.floor(Math.random() * 60) + 15 // 15-75 minutes
        },
        welcomeEmailSent: false,
        createdAt,
        lastLogin
    };
};

// Function to create 100 test users
const createTestUsers = async (adminId) => {
    console.log('🚀 Creating 100 test users...');
    
    const usersToCreate = [];
    const batchSize = 10; // Process in batches to avoid memory issues
    
    try {
        for (let i = 1; i <= 100; i++) {
            let userData = generateUserData(i, adminId);
            
            // Ensure some users are created today (first 10 users)
            if (i <= 10) {
                const today = new Date();
                const randomHour = Math.floor(Math.random() * 24);
                const randomMinute = Math.floor(Math.random() * 60);
                const randomSecond = Math.floor(Math.random() * 60);
                today.setHours(randomHour, randomMinute, randomSecond, 0);
                userData.createdAt = today;
                
                // Some of today's users should have logged in today
                if (i <= 5 && Math.random() > 0.3) {
                    const loginTime = new Date(today);
                    loginTime.setHours(today.getHours() + Math.floor(Math.random() * 8) + 1); // 1-8 hours after creation
                    userData.lastLogin = loginTime;
                }
            }
            
            // Ensure some users are created in recent months (users 11-30)
            if (i > 10 && i <= 30) {
                const recentDate = new Date();
                recentDate.setMonth(recentDate.getMonth() - Math.floor(Math.random() * 6)); // Last 6 months
                recentDate.setDate(Math.floor(Math.random() * 28) + 1);
                userData.createdAt = recentDate;
            }
            
            // Ensure some users are created in 2024 (users 31-60)
            if (i > 30 && i <= 60) {
                const date2024 = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                userData.createdAt = date2024;
            }
            
            // Ensure some users are created in 2023 (users 61-100)
            if (i > 60) {
                const date2023 = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                userData.createdAt = date2023;
            }
            
            usersToCreate.push(userData);
            
            // Process in batches
            if (usersToCreate.length === batchSize || i === 100) {
                const batch = usersToCreate.splice(0, batchSize);
                
                for (const userData of batch) {
                    // Check if user already exists
                    const existingUser = await User.findOne({ 
                        $or: [
                            { username: userData.username },
                            { email: userData.email }
                        ]
                    });
                    
                    if (!existingUser) {
                        const user = new User(userData);
                        await user.save();
                        console.log(`✅ Created user ${i}/100: ${userData.username} (${userData.role}) - Created: ${userData.createdAt.toLocaleDateString()}`);
                    } else {
                        console.log(`⏭️  User ${userData.username} already exists. Skipping.`);
                    }
                }
            }
        }
        
        console.log('✅ Successfully created test users!');
        
        // Print summary statistics
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });
        const adminUsers = await User.countDocuments({ isAdmin: true });
        const managerUsers = await User.countDocuments({ role: 'manager' });
        const viewerUsers = await User.countDocuments({ role: 'viewer' });
        const customUsers = await User.countDocuments({ role: 'custom' });
        
        // Date-based statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const usersCreatedToday = await User.countDocuments({ 
            createdAt: { $gte: today } 
        });
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        const usersCreatedThisMonth = await User.countDocuments({ 
            createdAt: { $gte: thisMonth } 
        });
        
        const usersCreated2024 = await User.countDocuments({ 
            createdAt: { 
                $gte: new Date('2024-01-01'), 
                $lt: new Date('2025-01-01') 
            } 
        });
        
        const usersCreated2023 = await User.countDocuments({ 
            createdAt: { 
                $gte: new Date('2023-01-01'), 
                $lt: new Date('2024-01-01') 
            } 
        });
        
        console.log('\n📊 User Statistics:');
        console.log(`Total Users: ${totalUsers}`);
        console.log(`Active Users: ${activeUsers}`);
        console.log(`Inactive Users: ${inactiveUsers}`);
        console.log(`Admin Users: ${adminUsers}`);
        console.log(`Manager Users: ${managerUsers}`);
        console.log(`Viewer Users: ${viewerUsers}`);
        console.log(`Custom Users: ${customUsers}`);
        
        console.log('\n📅 Date-based Statistics:');
        console.log(`Users Created Today: ${usersCreatedToday}`);
        console.log(`Users Created This Month: ${usersCreatedThisMonth}`);
        console.log(`Users Created in 2024: ${usersCreated2024}`);
        console.log(`Users Created in 2023: ${usersCreated2023}`);
        
    } catch (error) {
        console.error('❌ Error creating test users:', error.message);
        throw error;
    }
};

// Main seed function
const seedTestUsers = async () => {
    try {
        console.log('🌱 Starting test user seeding...');

        // Connect to MongoDB
        await mongoose.connect(config.database.uri);
        console.log('📦 Connected to MongoDB');

        // Find or create admin user
        let admin = await User.findOne({ username: 'alin' });
        if (!admin) {
            console.log('⚠️  Admin user not found. Creating admin user first...');
            const adminData = {
                username: 'alin',
                email: 'alinsafawi19@gmail.com',
                phone: '+96171882088',
                password: 'alin123M@',
                firstName: 'Alin',
                lastName: 'Safawi',
                isAdmin: true,
                isActive: true,
                role: 'admin',
                permissions: ROLE_TEMPLATES.admin.permissions,
                userPreferences: {
                    timezone: 'Asia/Beirut',
                    language: 'english',
                    theme: 'light',
                    dateFormat: 'MMM DD, YYYY h:mm a',
                    autoLogoutTime: 30
                },
                welcomeEmailSent: false
            };
            admin = new User(adminData);
            await admin.save();
            console.log('✅ Admin user created for seeding');
        } else {
            console.log('✅ Admin user found');
        }

        // Create 100 test users
        await createTestUsers(admin._id);

        console.log('✅ Test user seeding completed successfully!');
        console.log('\n🔑 Admin Login Credentials:');
        console.log('Username: alin');
        console.log('Password: alin123M@');
        console.log('\n📝 Test users have passwords in format: FirstName123!');
        console.log('Example: John123!, Mary456!, etc.');

    } catch (error) {
        console.error('❌ Test user seeding failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
};

// Run seed if this file is executed directly
if (require.main === module) {
    seedTestUsers();
}

module.exports = { seedTestUsers }; 