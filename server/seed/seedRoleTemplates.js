const mongoose = require('mongoose');
const RoleTemplate = require('../models/RoleTemplate');
const User = require('../models/User');
const { config } = require('../config/config');

// Available pages and actions for the system
const AVAILABLE_PAGES = ['users', 'audit-logs'];
const AVAILABLE_ACTIONS = ['view', 'view_own', 'add', 'edit', 'delete', 'export'];

// Sample data arrays for generating realistic role templates
const roleNames = [
    'Senior Administrator', 'Junior Administrator', 'System Manager', 'User Manager', 'Audit Manager',
    'Security Analyst', 'Compliance Officer', 'Data Analyst', 'Operations Manager', 'Support Specialist',
    'Team Lead', 'Project Manager', 'Quality Assurance', 'Business Analyst', 'Technical Lead',
    'Product Manager', 'Scrum Master', 'DevOps Engineer', 'Database Administrator', 'Network Engineer',
    'System Architect', 'Solution Architect', 'Enterprise Architect', 'Cloud Engineer', 'Security Engineer',
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer', 'UI/UX Designer',
    'Data Scientist', 'Machine Learning Engineer', 'AI Specialist', 'Blockchain Developer', 'Game Developer',
    'Web Developer', 'Software Engineer', 'Test Engineer', 'Automation Engineer', 'Performance Engineer',
    'Release Manager', 'Deployment Specialist', 'Configuration Manager', 'Change Manager', 'Incident Manager',
    'Problem Manager', 'Service Desk Manager', 'IT Support', 'Help Desk Specialist', 'Desktop Support',
    'Network Administrator', 'System Administrator', 'Server Administrator', 'Storage Administrator', 'Backup Administrator',
    'Disaster Recovery Specialist', 'Business Continuity Manager', 'Risk Manager', 'Compliance Manager', 'Privacy Officer',
    'Data Protection Officer', 'Information Security Officer', 'Cybersecurity Analyst', 'Penetration Tester', 'Security Auditor',
    'Vulnerability Analyst', 'Threat Intelligence Analyst', 'Security Operations Center Analyst', 'Digital Forensics Analyst', 'Malware Analyst',
    'Identity and Access Management Specialist', 'Privileged Access Management Specialist', 'Single Sign-On Specialist', 'Multi-Factor Authentication Specialist', 'Password Manager',
    'Firewall Administrator', 'Intrusion Detection Specialist', 'Intrusion Prevention Specialist', 'Security Information and Event Management Specialist', 'Security Orchestration Specialist',
    'Cloud Security Specialist', 'Application Security Specialist', 'Network Security Specialist', 'Endpoint Security Specialist', 'Mobile Security Specialist',
    'IoT Security Specialist', 'Industrial Control Systems Security Specialist', 'Critical Infrastructure Security Specialist', 'Government Security Specialist', 'Financial Security Specialist',
    'Healthcare Security Specialist', 'Educational Security Specialist', 'Retail Security Specialist', 'Manufacturing Security Specialist', 'Transportation Security Specialist',
    'Energy Security Specialist', 'Telecommunications Security Specialist', 'Media Security Specialist', 'Entertainment Security Specialist', 'Sports Security Specialist',
    'Non-Profit Security Specialist', 'Religious Organization Security Specialist', 'Political Organization Security Specialist', 'Military Security Specialist', 'Law Enforcement Security Specialist'
];

const roleDescriptions = [
    'Manages system administration and user access control',
    'Handles user management and operational oversight',
    'Oversees security compliance and audit procedures',
    'Manages data analysis and reporting functions',
    'Coordinates operational activities and team management',
    'Provides technical support and system maintenance',
    'Leads development teams and project coordination',
    'Ensures quality standards and process compliance',
    'Analyzes business requirements and system integration',
    'Manages technical architecture and system design',
    'Oversees cloud infrastructure and deployment',
    'Handles security monitoring and threat detection',
    'Manages database operations and data integrity',
    'Coordinates network infrastructure and connectivity',
    'Oversees application development and maintenance',
    'Manages user experience and interface design',
    'Handles data processing and analytics',
    'Oversees machine learning and AI implementation',
    'Manages blockchain development and integration',
    'Coordinates game development and testing',
    'Handles web development and frontend optimization',
    'Manages software engineering and code quality',
    'Oversees testing procedures and quality assurance',
    'Coordinates automation and CI/CD pipelines',
    'Manages performance optimization and monitoring',
    'Handles release management and deployment',
    'Oversees configuration and change management',
    'Coordinates incident response and problem resolution',
    'Manages service desk operations and support',
    'Handles IT support and technical assistance',
    'Oversees desktop support and user assistance',
    'Manages network administration and connectivity',
    'Coordinates system administration and maintenance',
    'Handles server administration and infrastructure',
    'Oversees storage management and backup procedures',
    'Manages disaster recovery and business continuity',
    'Coordinates risk management and compliance',
    'Handles data protection and privacy compliance',
    'Oversees information security and cybersecurity',
    'Manages security auditing and vulnerability assessment',
    'Coordinates threat intelligence and security monitoring',
    'Handles digital forensics and incident investigation',
    'Oversees identity management and access control',
    'Manages firewall administration and network security',
    'Coordinates security information and event management',
    'Handles cloud security and application security',
    'Oversees endpoint security and mobile security',
    'Manages IoT security and industrial control systems',
    'Coordinates government and financial security',
    'Handles healthcare and educational security',
    'Oversees retail and manufacturing security',
    'Manages transportation and energy security',
    'Coordinates telecommunications and media security',
    'Handles entertainment and sports security',
    'Oversees non-profit and religious organization security',
    'Manages political and military security',
    'Coordinates law enforcement and emergency response',
    'Handles critical infrastructure and national security',
    'Oversees international security and diplomacy',
    'Manages cyber warfare and defense operations',
    'Coordinates intelligence gathering and analysis',
    'Handles counter-terrorism and threat prevention',
    'Oversees border security and immigration control',
    'Manages customs and trade security',
    'Coordinates maritime and aviation security',
    'Handles nuclear and biological security',
    'Oversees chemical and environmental security',
    'Manages food and agricultural security',
    'Coordinates water and sanitation security',
    'Handles waste management and recycling security',
    'Oversees renewable energy and sustainability security',
    'Manages climate change and disaster preparedness',
    'Coordinates humanitarian aid and relief operations',
    'Handles refugee and migration security',
    'Oversees human rights and civil liberties protection',
    'Manages democratic processes and electoral security',
    'Coordinates media freedom and information security',
    'Handles academic freedom and research security',
    'Oversees artistic expression and cultural security',
    'Manages religious freedom and worship security',
    'Coordinates family and community security',
    'Handles child protection and education security',
    'Oversees elderly care and healthcare security',
    'Manages disability rights and accessibility security',
    'Coordinates gender equality and women security',
    'Handles minority rights and diversity security',
    'Oversees indigenous rights and cultural preservation',
    'Manages environmental justice and sustainability',
    'Coordinates animal welfare and wildlife security',
    'Handles marine life and ocean security',
    'Oversees forest conservation and land security',
    'Manages air quality and atmospheric security',
    'Coordinates soil health and agricultural security',
    'Handles water quality and aquatic security',
    'Oversees noise pollution and acoustic security',
    'Manages light pollution and visual security',
    'Coordinates electromagnetic and radiation security',
    'Handles thermal and temperature security',
    'Oversees vibration and seismic security',
    'Manages gravitational and orbital security',
    'Coordinates magnetic and electrical security',
    'Handles nuclear and particle security',
    'Oversees quantum and subatomic security',
    'Manages cosmic and astronomical security',
    'Coordinates planetary and solar security',
    'Handles galactic and universal security'
];

const icons = [
    'FiSettings', 'FiUsers', 'FiShield', 'FiEye', 'FiDatabase', 'FiServer', 'FiCloud', 'FiLock', 'FiUnlock',
    'FiKey', 'FiFingerprint', 'FiMonitor', 'FiSmartphone', 'FiTablet', 'FiLaptop', 'FiDesktop', 'FiWifi',
    'FiBluetooth', 'FiRadio', 'FiSatellite', 'FiGlobe', 'FiMap', 'FiNavigation', 'FiCompass', 'FiTarget',
    'FiCrosshair', 'FiAim', 'FiScope', 'FiBinoculars', 'FiCamera', 'FiVideo', 'FiMic', 'FiHeadphones',
    'FiSpeaker', 'FiVolume', 'FiVolume1', 'FiVolume2', 'FiVolumeX', 'FiPlay', 'FiPause', 'FiStop',
    'FiSkipBack', 'FiSkipForward', 'FiRewind', 'FiFastForward', 'FiRotateCcw', 'FiRotateCw', 'FiRefreshCw',
    'FiRefreshCw', 'FiRefreshCcw', 'FiActivity', 'FiTrendingUp', 'FiTrendingDown', 'FiBarChart', 'FiBarChart2',
    'FiBarChart3', 'FiPieChart', 'FiLineChart', 'FiAreaChart', 'FiScatterChart', 'FiBubbleChart', 'FiDoughnutChart',
    'FiRadarChart', 'FiGauge', 'FiSpeed', 'FiZap', 'FiZapOff', 'FiBattery', 'FiBatteryCharging', 'FiBatteryFull',
    'FiBatteryLow', 'FiBatteryMedium', 'FiBatteryEmpty', 'FiPower', 'FiPowerOff', 'FiSun', 'FiMoon', 'FiStar',
    'FiHeart', 'FiThumbsUp', 'FiThumbsDown', 'FiSmile', 'FiFrown', 'FiMeh', 'FiGift', 'FiAward', 'FiTrophy',
    'FiMedal', 'FiCrown', 'FiDiamond', 'FiGem', 'FiCoins', 'FiDollarSign', 'FiEuro', 'FiPound', 'FiYen',
    'FiBitcoin', 'FiEthereum', 'FiCreditCard', 'FiWallet', 'FiPiggyBank', 'FiBank', 'FiBuilding', 'FiHome',
    'FiOffice', 'FiStore', 'FiShoppingCart', 'FiShoppingBag', 'FiPackage', 'FiTruck', 'FiCar', 'FiBike',
    'FiPlane', 'FiShip', 'FiTrain', 'FiBus', 'FiTaxi', 'FiAmbulance', 'FiFire', 'FiPolice', 'FiMilitary'
];

const colors = [
    'bg-gradient-to-r from-blue-500 to-cyan-500',
    'bg-gradient-to-r from-purple-500 to-pink-500',
    'bg-gradient-to-r from-green-500 to-emerald-500',
    'bg-gradient-to-r from-red-500 to-pink-500',
    'bg-gradient-to-r from-yellow-500 to-orange-500',
    'bg-gradient-to-r from-indigo-500 to-purple-500',
    'bg-gradient-to-r from-teal-500 to-cyan-500',
    'bg-gradient-to-r from-rose-500 to-red-500',
    'bg-gradient-to-r from-amber-500 to-yellow-500',
    'bg-gradient-to-r from-violet-500 to-purple-500',
    'bg-gradient-to-r from-sky-500 to-blue-500',
    'bg-gradient-to-r from-emerald-500 to-green-500',
    'bg-gradient-to-r from-fuchsia-500 to-pink-500',
    'bg-gradient-to-r from-orange-500 to-red-500',
    'bg-gradient-to-r from-lime-500 to-green-500',
    'bg-gradient-to-r from-blue-600 to-indigo-600',
    'bg-gradient-to-r from-purple-600 to-violet-600',
    'bg-gradient-to-r from-green-600 to-emerald-600',
    'bg-gradient-to-r from-red-600 to-rose-600',
    'bg-gradient-to-r from-yellow-600 to-amber-600',
    'bg-gradient-to-r from-indigo-600 to-blue-600',
    'bg-gradient-to-r from-teal-600 to-cyan-600',
    'bg-gradient-to-r from-rose-600 to-red-600',
    'bg-gradient-to-r from-amber-600 to-orange-600',
    'bg-gradient-to-r from-violet-600 to-purple-600',
    'bg-gradient-to-r from-sky-600 to-blue-600',
    'bg-gradient-to-r from-emerald-600 to-green-600',
    'bg-gradient-to-r from-fuchsia-600 to-pink-600',
    'bg-gradient-to-r from-orange-600 to-red-600',
    'bg-gradient-to-r from-lime-600 to-green-600'
];

// Function to generate random permissions
const generatePermissions = () => {
    const permissions = [];
    
    // Always include users page
    const userActions = ['view'];
    if (Math.random() > 0.3) userActions.push('add');
    if (Math.random() > 0.4) userActions.push('edit');
    if (Math.random() > 0.7) userActions.push('delete');
    if (Math.random() > 0.8) userActions.push('export');
    
    permissions.push({
        page: 'users',
        actions: userActions
    });
    
    // Include audit-logs page
    const auditActions = ['view'];
    if (Math.random() > 0.6) auditActions.push('export');
    
    permissions.push({
        page: 'audit-logs',
        actions: auditActions
    });
    
    return permissions;
};

// Function to generate random role template data
const generateRoleTemplateData = (index, adminId) => {
    const name = roleNames[Math.floor(Math.random() * roleNames.length)];
    const description = roleDescriptions[Math.floor(Math.random() * roleDescriptions.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Randomly decide if template is admin (5% chance)
    const isAdmin = Math.random() < 0.05;
    
    // Randomly decide if template is active (90% active, 10% inactive)
    const isActive = Math.random() > 0.1;
    
    // Randomly decide if template is default (only for first few)
    const isDefault = index <= 5;
    
    // Generate usage count (0-50 for most, some with higher usage)
    const usageCount = Math.random() > 0.8 ? Math.floor(Math.random() * 100) + 50 : Math.floor(Math.random() * 50);
    
    // Generate creation date spanning from 2023 to 2025
    const startDate = new Date('2023-01-01').getTime();
    const endDate = new Date().getTime(); // Today
    const randomTime = startDate + Math.random() * (endDate - startDate);
    const createdAt = new Date(randomTime);
    
    // Generate last used date (some templates have never been used)
    let lastUsed = null;
    if (usageCount > 0 && Math.random() > 0.3) { // 70% of templates with usage have been used recently
        const lastUsedStartDate = createdAt.getTime();
        const lastUsedEndDate = new Date().getTime();
        const randomLastUsedTime = lastUsedStartDate + Math.random() * (lastUsedEndDate - lastUsedStartDate);
        lastUsed = new Date(randomLastUsedTime);
    }
    
    return {
        name: `${name} ${Math.floor(Math.random() * 999)}`,
        description,
        icon,
        color,
        isAdmin,
        isActive,
        isDefault,
        permissions: generatePermissions(),
        createdBy: adminId,
        usageCount,
        lastUsed,
        createdAt
    };
};

// Function to create 100 role templates
const createRoleTemplates = async (adminId) => {
    console.log('🚀 Creating 100 role templates...');
    
    const templatesToCreate = [];
    const batchSize = 10; // Process in batches to avoid memory issues
    
    try {
        for (let i = 1; i <= 100; i++) {
            let templateData = generateRoleTemplateData(i, adminId);
            
            // Distribute templates across 2023-2025 with realistic distribution
            if (i <= 15) {
                // Today (15 templates)
                const today = new Date();
                const randomHour = Math.floor(Math.random() * 24);
                const randomMinute = Math.floor(Math.random() * 60);
                const randomSecond = Math.floor(Math.random() * 60);
                today.setHours(randomHour, randomMinute, randomSecond, 0);
                templateData.createdAt = today;
                
                // Some of today's templates should have been used today
                if (i <= 8 && templateData.usageCount > 0 && Math.random() > 0.3) {
                    const usedTime = new Date(today);
                    usedTime.setHours(today.getHours() + Math.floor(Math.random() * 8) + 1); // 1-8 hours after creation
                    templateData.lastUsed = usedTime;
                }
            } else if (i <= 35) {
                // Recent months (20 templates)
                const recentDate = new Date();
                recentDate.setMonth(recentDate.getMonth() - Math.floor(Math.random() * 6)); // Last 6 months
                recentDate.setDate(Math.floor(Math.random() * 28) + 1);
                templateData.createdAt = recentDate;
            } else if (i <= 60) {
                // 2025 (25 templates)
                const date2025 = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                templateData.createdAt = date2025;
            } else if (i <= 80) {
                // 2024 (20 templates)
                const date2024 = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                templateData.createdAt = date2024;
            } else {
                // 2023 (20 templates)
                const date2023 = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                templateData.createdAt = date2023;
            }
            
            templatesToCreate.push(templateData);
            
            // Process in batches
            if (templatesToCreate.length === batchSize || i === 100) {
                const batch = templatesToCreate.splice(0, batchSize);
                
                for (const templateData of batch) {
                    // Check if template already exists
                    const existingTemplate = await RoleTemplate.findOne({ 
                        name: templateData.name 
                    });
                    
                    if (!existingTemplate) {
                        const template = new RoleTemplate(templateData);
                        await template.save();
                        console.log(`✅ Created template ${i}/100: ${templateData.name} - Created: ${templateData.createdAt.toLocaleDateString()}`);
                    } else {
                        console.log(`⏭️  Template ${templateData.name} already exists. Skipping.`);
                    }
                }
            }
        }
        
        console.log('✅ Successfully created role templates!');
        
        // Print summary statistics
        const totalTemplates = await RoleTemplate.countDocuments();
        const activeTemplates = await RoleTemplate.countDocuments({ isActive: true });
        const inactiveTemplates = await RoleTemplate.countDocuments({ isActive: false });
        const defaultTemplates = await RoleTemplate.countDocuments({ isDefault: true });
        const adminTemplates = await RoleTemplate.countDocuments({ isAdmin: true });
        const highUsageTemplates = await RoleTemplate.countDocuments({ usageCount: { $gt: 10 } });
        
        // Date-based statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const templatesCreatedToday = await RoleTemplate.countDocuments({ 
            createdAt: { $gte: today } 
        });
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        const templatesCreatedThisMonth = await RoleTemplate.countDocuments({ 
            createdAt: { $gte: thisMonth } 
        });
        
        const templatesCreated2025 = await RoleTemplate.countDocuments({ 
            createdAt: { 
                $gte: new Date('2025-01-01')
            } 
        });
        
        const templatesCreated2024 = await RoleTemplate.countDocuments({ 
            createdAt: { 
                $gte: new Date('2024-01-01'), 
                $lt: new Date('2025-01-01') 
            } 
        });
        
        const templatesCreated2023 = await RoleTemplate.countDocuments({ 
            createdAt: { 
                $gte: new Date('2023-01-01'), 
                $lt: new Date('2024-01-01') 
            } 
        });
        
        console.log('\n📊 Role Template Statistics:');
        console.log(`Total Templates: ${totalTemplates}`);
        console.log(`Active Templates: ${activeTemplates}`);
        console.log(`Inactive Templates: ${inactiveTemplates}`);
        console.log(`Default Templates: ${defaultTemplates}`);
        console.log(`Admin Templates: ${adminTemplates}`);
        console.log(`High Usage Templates (>10): ${highUsageTemplates}`);
        
        console.log('\n📅 Date-based Statistics:');
        console.log(`Templates Created Today: ${templatesCreatedToday}`);
        console.log(`Templates Created This Month: ${templatesCreatedThisMonth}`);
        console.log(`Templates Created in 2025: ${templatesCreated2025}`);
        console.log(`Templates Created in 2024: ${templatesCreated2024}`);
        console.log(`Templates Created in 2023: ${templatesCreated2023}`);
        
    } catch (error) {
        console.error('❌ Error creating role templates:', error.message);
        throw error;
    }
};

// Main seed function
const seedRoleTemplates = async () => {
    try {
        console.log('🌱 Starting role template seeding...');

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
                permissions: AVAILABLE_PAGES.map(page => ({
                    page,
                    actions: AVAILABLE_ACTIONS
                })),
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

        // Create 100 role templates
        await createRoleTemplates(admin._id);

        console.log('✅ Role template seeding completed successfully!');
        console.log('\n🔑 Admin Login Credentials:');
        console.log('Username: alin');
        console.log('Password: alin123M@');
        console.log('\n📝 You can now test role template filtering and pagination with 100+ templates!');

    } catch (error) {
        console.error('❌ Role template seeding failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
};

// Run seed if this file is executed directly
if (require.main === module) {
    seedRoleTemplates();
}

module.exports = { seedRoleTemplates }; 