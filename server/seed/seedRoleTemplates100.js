const mongoose = require('mongoose');
const RoleTemplate = require('../models/RoleTemplate');
const User = require('../models/User');
const { config } = require('../config/config');

// Icon options for variety
const icons = [
    'FiShield', 'FiUsers', 'FiEye', 'FiSettings', 'FiUserCheck', 'FiUserX', 'FiUserPlus',
    'FiUserMinus', 'FiUser', 'FiKey', 'FiLock', 'FiUnlock', 'FiDatabase', 'FiServer',
    'FiMonitor', 'FiActivity', 'FiBarChart', 'FiPieChart', 'FiTrendingUp', 'FiTrendingDown',
    'FiAlertCircle', 'FiAlertTriangle', 'FiCheckCircle', 'FiXCircle', 'FiInfo', 'FiHelpCircle',
    'FiBook', 'FiBookOpen', 'FiFileText', 'FiFile', 'FiFolder', 'FiHardDrive', 'FiCloud',
    'FiWifi', 'FiGlobe', 'FiMapPin', 'FiNavigation', 'FiCompass', 'FiTarget', 'FiAward',
    'FiStar', 'FiHeart', 'FiThumbsUp', 'FiThumbsDown', 'FiMessageCircle', 'FiMessageSquare',
    'FiMail', 'FiPhone', 'FiVideo', 'FiCamera', 'FiImage', 'FiMusic', 'FiVideo',
    'FiHeadphones', 'FiSpeaker', 'FiMic', 'FiMicOff', 'FiVolume', 'FiVolume1', 'FiVolume2',
    'FiVolumeX', 'FiPlay', 'FiPause', 'FiSkipBack', 'FiSkipForward', 'FiRewind', 'FiFastForward',
    'FiRotateCcw', 'FiRotateCw', 'FiRefreshCw', 'FiRefreshCcw', 'FiZap', 'FiZapOff', 'FiSun',
    'FiMoon', 'FiCloudRain', 'FiCloudSnow', 'FiCloudLightning', 'FiWind', 'FiThermometer',
    'FiDroplet', 'FiUmbrella', 'FiGift', 'FiShoppingCart', 'FiShoppingBag', 'FiCreditCard',
    'FiDollarSign', 'FiPercent', 'FiCalculator', 'FiPieChart', 'FiBarChart2', 'FiBarChart3',
    'FiTrendingUp', 'FiTrendingDown', 'FiMinus', 'FiPlus', 'FiDivide', 'FiX', 'FiCheck',
    'FiArrowUp', 'FiArrowDown', 'FiArrowLeft', 'FiArrowRight', 'FiChevronUp', 'FiChevronDown',
    'FiChevronLeft', 'FiChevronRight', 'FiCornerUpLeft', 'FiCornerUpRight', 'FiCornerDownLeft',
    'FiCornerDownRight', 'FiMove', 'FiMinimize2', 'FiMaximize2', 'FiMinusCircle', 'FiPlusCircle',
    'FiXCircle', 'FiCheckCircle', 'FiAlertCircle', 'FiHelpCircle', 'FiInfo'
];

// Color gradient options
const colors = [
    'bg-gradient-to-r from-orange-500 to-red-500',
    'bg-gradient-to-r from-teal-500 to-cyan-500',
    'bg-gradient-to-r from-blue-500 to-cyan-500',
    'bg-gradient-to-r from-purple-500 to-pink-500',
    'bg-gradient-to-r from-green-500 to-emerald-500',
    'bg-gradient-to-r from-yellow-500 to-orange-500',
    'bg-gradient-to-r from-indigo-500 to-purple-500',
    'bg-gradient-to-r from-pink-500 to-rose-500',
    'bg-gradient-to-r from-cyan-500 to-blue-500',
    'bg-gradient-to-r from-emerald-500 to-teal-500',
    'bg-gradient-to-r from-violet-500 to-purple-500',
    'bg-gradient-to-r from-amber-500 to-orange-500',
    'bg-gradient-to-r from-sky-500 to-blue-500',
    'bg-gradient-to-r from-lime-500 to-green-500',
    'bg-gradient-to-r from-fuchsia-500 to-pink-500',
    'bg-gradient-to-r from-rose-500 to-red-500',
    'bg-gradient-to-r from-slate-500 to-gray-500',
    'bg-gradient-to-r from-zinc-500 to-neutral-500',
    'bg-gradient-to-r from-stone-500 to-orange-500',
    'bg-gradient-to-r from-red-500 to-pink-500'
];

// Permission combinations for different role types
const permissionSets = [
    // Admin roles
    {
        name: 'Super Admin',
        description: 'Complete system access with all administrative privileges',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit', 'delete', 'export'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: true
    },
    {
        name: 'System Administrator',
        description: 'Full administrative control over system operations',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit', 'delete', 'export'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: true
    },
    {
        name: 'IT Administrator',
        description: 'Technical administration and system management',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit', 'delete', 'export'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: true
    },
    // Management roles
    {
        name: 'Operations Manager',
        description: 'Oversee daily operations and team management',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: false
    },
    {
        name: 'Department Manager',
        description: 'Manage department-specific users and activities',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: false
    },
    {
        name: 'Team Lead',
        description: 'Lead team activities and coordinate team members',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit'] },
            { page: 'audit-logs', actions: ['view'] }
        ],
        isAdmin: false
    },
    {
        name: 'Project Manager',
        description: 'Manage project teams and track project progress',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit'] },
            { page: 'audit-logs', actions: ['view'] }
        ],
        isAdmin: false
    },
    // HR roles
    {
        name: 'HR Manager',
        description: 'Human resources management and employee oversight',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: false
    },
    {
        name: 'HR Specialist',
        description: 'Specialized human resources functions',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit'] },
            { page: 'audit-logs', actions: ['view'] }
        ],
        isAdmin: false
    },
    {
        name: 'Recruiter',
        description: 'Talent acquisition and recruitment activities',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add'] },
            { page: 'audit-logs', actions: ['view'] }
        ],
        isAdmin: false
    },
    // Security roles
    {
        name: 'Security Manager',
        description: 'Oversee security policies and access control',
        permissions: [
            { page: 'users', actions: ['view', 'view_own', 'add', 'edit', 'delete'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: false
    },
    {
        name: 'Security Analyst',
        description: 'Analyze security events and audit logs',
        permissions: [
            { page: 'users', actions: ['view', 'view_own'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: false
    },
    {
        name: 'Compliance Officer',
        description: 'Ensure regulatory compliance and audit requirements',
        permissions: [
            { page: 'users', actions: ['view', 'view_own'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: false
    },
    // Viewer roles
    {
        name: 'Auditor',
        description: 'Review and analyze system activities and logs',
        permissions: [
            { page: 'users', actions: ['view', 'view_own'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: false
    },
    {
        name: 'Analyst',
        description: 'Data analysis and reporting capabilities',
        permissions: [
            { page: 'users', actions: ['view', 'view_own'] },
            { page: 'audit-logs', actions: ['view', 'export'] }
        ],
        isAdmin: false
    },
    {
        name: 'Viewer',
        description: 'Read-only access to view system information',
        permissions: [
            { page: 'users', actions: ['view', 'view_own'] },
            { page: 'audit-logs', actions: ['view'] }
        ],
        isAdmin: false
    },
    {
        name: 'Observer',
        description: 'Passive monitoring and observation role',
        permissions: [
            { page: 'users', actions: ['view', 'view_own'] },
            { page: 'audit-logs', actions: ['view'] }
        ],
        isAdmin: false
    },
    // Limited roles
    {
        name: 'Guest',
        description: 'Limited access for temporary users',
        permissions: [
            { page: 'users', actions: ['view_own'] },
            { page: 'audit-logs', actions: ['view'] }
        ],
        isAdmin: false
    },
    {
        name: 'Trainee',
        description: 'Learning role with minimal permissions',
        permissions: [
            { page: 'users', actions: ['view_own'] },
            { page: 'audit-logs', actions: ['view'] }
        ],
        isAdmin: false
    },
    {
        name: 'Intern',
        description: 'Internship role with supervised access',
        permissions: [
            { page: 'users', actions: ['view_own'] },
            { page: 'audit-logs', actions: ['view'] }
        ],
        isAdmin: false
    }
];

// Generate 100 role templates
const generateRoleTemplates = () => {
    const templates = [];
    
    // Add the base permission sets
    templates.push(...permissionSets);
    
    // Generate additional templates with variations
    const roleTypes = [
        'Manager', 'Lead', 'Specialist', 'Coordinator', 'Supervisor', 'Director', 'Officer',
        'Analyst', 'Consultant', 'Advisor', 'Expert', 'Professional', 'Technician', 'Engineer',
        'Developer', 'Designer', 'Architect', 'Strategist', 'Planner', 'Controller', 'Inspector',
        'Investigator', 'Researcher', 'Trainer', 'Mentor', 'Coach', 'Facilitator', 'Moderator',
        'Curator', 'Administrator', 'Coordinator', 'Liaison', 'Representative', 'Agent', 'Assistant',
        'Associate', 'Partner', 'Collaborator', 'Contributor', 'Participant', 'Member', 'User',
        'Stakeholder', 'Client', 'Customer', 'Vendor', 'Contractor', 'Consultant', 'Advisor',
        'Expert', 'Specialist', 'Professional', 'Technician', 'Operator', 'Handler', 'Processor',
        'Executor', 'Implementer', 'Maintainer', 'Supporter', 'Helper', 'Aide', 'Assistant',
        'Deputy', 'Vice', 'Acting', 'Interim', 'Temporary', 'Provisional', 'Acting', 'Deputy',
        'Associate', 'Junior', 'Senior', 'Principal', 'Chief', 'Head', 'Executive', 'Senior',
        'Lead', 'Primary', 'Main', 'Core', 'Central', 'Key', 'Essential', 'Critical', 'Important',
        'Major', 'Minor', 'Support', 'Backup', 'Secondary', 'Auxiliary', 'Supplementary', 'Additional',
        'Extra', 'Bonus', 'Premium', 'Advanced', 'Basic', 'Standard', 'Custom', 'Specialized'
    ];

    const departments = [
        'IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Customer Service', 'Legal',
        'Compliance', 'Security', 'Quality Assurance', 'Research & Development', 'Product',
        'Engineering', 'Design', 'Content', 'Media', 'Communications', 'Public Relations',
        'Business Development', 'Strategy', 'Planning', 'Analytics', 'Data', 'Information',
        'Technology', 'Systems', 'Infrastructure', 'Network', 'Software', 'Hardware', 'Cloud',
        'Digital', 'Online', 'Web', 'Mobile', 'Desktop', 'Server', 'Database', 'Application',
        'Platform', 'Service', 'Support', 'Help', 'Training', 'Education', 'Learning', 'Development',
        'Growth', 'Innovation', 'Creative', 'Design', 'Brand', 'Product', 'Service', 'Solution',
        'Consulting', 'Advisory', 'Professional', 'Technical', 'Functional', 'Operational',
        'Strategic', 'Tactical', 'Administrative', 'Executive', 'Management', 'Leadership',
        'Supervision', 'Coordination', 'Facilitation', 'Moderation', 'Mediation', 'Negotiation',
        'Communication', 'Collaboration', 'Partnership', 'Alliance', 'Cooperation', 'Integration',
        'Synchronization', 'Harmonization', 'Alignment', 'Coordination', 'Orchestration',
        'Management', 'Governance', 'Oversight', 'Monitoring', 'Tracking', 'Reporting',
        'Analysis', 'Assessment', 'Evaluation', 'Review', 'Audit', 'Inspection', 'Verification',
        'Validation', 'Certification', 'Accreditation', 'Compliance', 'Regulatory', 'Legal',
        'Risk', 'Security', 'Safety', 'Quality', 'Performance', 'Efficiency', 'Effectiveness',
        'Productivity', 'Optimization', 'Improvement', 'Enhancement', 'Upgrade', 'Modernization',
        'Transformation', 'Innovation', 'Evolution', 'Development', 'Growth', 'Expansion',
        'Scaling', 'Optimization', 'Streamlining', 'Automation', 'Digitalization', 'Modernization'
    ];

    const functions = [
        'Management', 'Administration', 'Coordination', 'Supervision', 'Leadership', 'Direction',
        'Guidance', 'Mentoring', 'Coaching', 'Training', 'Development', 'Support', 'Assistance',
        'Help', 'Aid', 'Service', 'Maintenance', 'Operations', 'Execution', 'Implementation',
        'Deployment', 'Installation', 'Configuration', 'Setup', 'Initialization', 'Preparation',
        'Planning', 'Strategy', 'Analysis', 'Research', 'Investigation', 'Examination', 'Review',
        'Assessment', 'Evaluation', 'Audit', 'Inspection', 'Verification', 'Validation', 'Testing',
        'Quality Assurance', 'Control', 'Monitoring', 'Tracking', 'Surveillance', 'Oversight',
        'Governance', 'Compliance', 'Regulation', 'Policy', 'Procedure', 'Process', 'Workflow',
        'Automation', 'Integration', 'Synchronization', 'Coordination', 'Collaboration', 'Communication',
        'Liaison', 'Interface', 'Connection', 'Linkage', 'Integration', 'Unification', 'Consolidation',
        'Centralization', 'Standardization', 'Normalization', 'Harmonization', 'Alignment',
        'Synchronization', 'Coordination', 'Orchestration', 'Management', 'Administration',
        'Supervision', 'Oversight', 'Control', 'Monitoring', 'Tracking', 'Reporting', 'Documentation',
        'Recording', 'Logging', 'Archiving', 'Storage', 'Retention', 'Preservation', 'Protection',
        'Security', 'Safety', 'Risk Management', 'Compliance', 'Regulatory', 'Legal', 'Policy',
        'Procedure', 'Process', 'Workflow', 'Automation', 'Integration', 'Synchronization',
        'Coordination', 'Collaboration', 'Communication', 'Liaison', 'Interface', 'Connection',
        'Linkage', 'Integration', 'Unification', 'Consolidation', 'Centralization', 'Standardization'
    ];

    // Generate templates with combinations
    let templateCount = permissionSets.length;
    
    while (templateCount < 100) {
        const baseTemplate = permissionSets[Math.floor(Math.random() * permissionSets.length)];
        const roleType = roleTypes[Math.floor(Math.random() * roleTypes.length)];
        const department = departments[Math.floor(Math.random() * departments.length)];
        const function_ = functions[Math.floor(Math.random() * functions.length)];
        
        // Create variations
        const variations = [
            `${department} ${roleType}`,
            `${roleType} ${department}`,
            `${department} ${function_} ${roleType}`,
            `${function_} ${department} ${roleType}`,
            `${roleType} ${function_} ${department}`,
            `${department} ${roleType} ${function_}`,
            `${function_} ${roleType}`,
            `${roleType} ${function_}`,
            `${department} ${function_}`,
            `${function_} ${department}`
        ];

        const name = variations[Math.floor(Math.random() * variations.length)];
        
        // Check if this template already exists
        const exists = templates.some(t => t.name === name);
        if (!exists) {
            const icon = icons[Math.floor(Math.random() * icons.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Create permission variations
            let permissions = [...baseTemplate.permissions];
            
            // Randomly modify permissions (30% chance)
            if (Math.random() < 0.3) {
                permissions = permissions.map(perm => {
                    const newPerm = { ...perm };
                    // Randomly remove some actions (but keep at least view_own for users)
                    if (perm.page === 'users' && perm.actions.length > 1) {
                        const actionsToKeep = Math.max(1, Math.floor(Math.random() * perm.actions.length));
                        newPerm.actions = perm.actions.slice(0, actionsToKeep);
                        if (!newPerm.actions.includes('view_own')) {
                            newPerm.actions.push('view_own');
                        }
                    } else if (perm.page === 'audit-logs' && perm.actions.length > 1) {
                        const actionsToKeep = Math.max(1, Math.floor(Math.random() * perm.actions.length));
                        newPerm.actions = perm.actions.slice(0, actionsToKeep);
                    }
                    return newPerm;
                });
            }

            templates.push({
                name,
                description: `${name} role with ${baseTemplate.description.toLowerCase()}`,
                icon,
                color,
                permissions,
                isAdmin: baseTemplate.isAdmin,
                isActive: true,
                isDefault: false,
                usageCount: 0
            });
            
            templateCount++;
        }
    }

    return templates;
};

// Main seed function
const seedRoleTemplates100 = async () => {
    try {
        console.log('🌱 Starting 100 role template seeding...');

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
                permissions: [
                    {
                        page: 'users',
                        actions: ['view', 'view_own', 'add', 'edit', 'delete', 'export']
                    },
                    {
                        page: 'audit-logs',
                        actions: ['view', 'export']
                    }
                ],
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

        // Clear existing role templates
        console.log('🗑️  Clearing existing role templates...');
        await RoleTemplate.deleteMany({});
        console.log('✅ Cleared all existing role templates');

        // Generate 100 role templates
        console.log('🚀 Generating 100 role templates...');
        const roleTemplates = generateRoleTemplates();

        // Create role templates
        console.log('📝 Creating role templates...');
        let createdCount = 0;
        
        for (const templateData of roleTemplates) {
            const template = new RoleTemplate({
                ...templateData,
                createdBy: admin._id,
                createdAt: new Date(),
                lastUsed: null
            });

            await template.save();
            createdCount++;
            
            if (createdCount % 10 === 0) {
                console.log(`✅ Created ${createdCount} templates...`);
            }
        }

        console.log('✅ Role template seeding completed successfully!');
        console.log(`📊 Created ${createdCount} role templates`);
        console.log('\n🔑 Admin Login Credentials:');
        console.log('Username: alin');
        console.log('Password: alin123M@');
        console.log('\n📝 Role templates include various combinations of:');
        console.log('- Management roles (Manager, Lead, Director, etc.)');
        console.log('- Technical roles (Engineer, Developer, Analyst, etc.)');
        console.log('- Department-specific roles (IT, HR, Finance, etc.)');
        console.log('- Function-specific roles (Security, Compliance, Quality, etc.)');
        console.log('- Permission levels (Admin, Manager, Viewer, Limited)');

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
    seedRoleTemplates100();
}

module.exports = { seedRoleTemplates100 }; 