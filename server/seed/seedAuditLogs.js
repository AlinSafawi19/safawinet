const mongoose = require('mongoose');
const { config } = require('../config/config');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(config.database.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  await seedAuditLogs();
});

// Audit log data generation functions
const generateRandomIP = () => {
  const ips = [
    '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
    '10.0.0.50', '10.0.0.51', '10.0.0.52', '10.0.0.53',
    '172.16.0.10', '172.16.0.11', '172.16.0.12', '172.16.0.13',
    '203.0.113.1', '203.0.113.2', '203.0.113.3', '203.0.113.4',
    '198.51.100.1', '198.51.100.2', '198.51.100.3', '198.51.100.4'
  ];
  return ips[Math.floor(Math.random() * ips.length)];
};

const generateRandomDevice = () => {
  const devices = [
    'Chrome 120.0.0.0 on Windows 10',
    'Firefox 121.0 on macOS 14.2',
    'Safari 17.2 on macOS 14.2',
    'Edge 120.0.0.0 on Windows 11',
    'Chrome 120.0.0.0 on Android 14',
    'Safari on iPhone iOS 17.2',
    'Chrome 120.0.0.0 on Linux',
    'Firefox 121.0 on Ubuntu 22.04',
    'Edge 120.0.0.0 on Windows 10',
    'Chrome 120.0.0.0 on macOS 14.2'
  ];
  return devices[Math.floor(Math.random() * devices.length)];
};

const generateRandomLocation = () => {
  const locations = [
    { country: 'Lebanon', city: 'Beirut' },
    { country: 'Lebanon', city: 'Tripoli' },
    { country: 'Lebanon', city: 'Sidon' },
    { country: 'Lebanon', city: 'Tyre' },
    { country: 'Lebanon', city: 'Zahle' },
    { country: 'United States', city: 'New York' },
    { country: 'United States', city: 'Los Angeles' },
    { country: 'United States', city: 'Chicago' },
    { country: 'United Kingdom', city: 'London' },
    { country: 'United Kingdom', city: 'Manchester' },
    { country: 'Germany', city: 'Berlin' },
    { country: 'Germany', city: 'Munich' },
    { country: 'France', city: 'Paris' },
    { country: 'France', city: 'Lyon' },
    { country: 'Canada', city: 'Toronto' },
    { country: 'Canada', city: 'Vancouver' },
    { country: 'Australia', city: 'Sydney' },
    { country: 'Australia', city: 'Melbourne' },
    { country: 'Japan', city: 'Tokyo' },
    { country: 'Japan', city: 'Osaka' },
    { country: 'South Korea', city: 'Seoul' },
    { country: 'Singapore', city: 'Singapore' },
    { country: 'UAE', city: 'Dubai' },
    { country: 'UAE', city: 'Abu Dhabi' },
    { country: 'Saudi Arabia', city: 'Riyadh' },
    { country: 'Saudi Arabia', city: 'Jeddah' },
    { country: 'Qatar', city: 'Doha' },
    { country: 'Kuwait', city: 'Kuwait City' },
    { country: 'Bahrain', city: 'Manama' },
    { country: 'Oman', city: 'Muscat' },
    { country: 'Jordan', city: 'Amman' },
    { country: 'Egypt', city: 'Cairo' },
    { country: 'Egypt', city: 'Alexandria' },
    { country: 'Turkey', city: 'Istanbul' },
    { country: 'Turkey', city: 'Ankara' },
    { country: 'India', city: 'Mumbai' },
    { country: 'India', city: 'Delhi' },
    { country: 'China', city: 'Beijing' },
    { country: 'China', city: 'Shanghai' },
    { country: 'Brazil', city: 'São Paulo' },
    { country: 'Brazil', city: 'Rio de Janeiro' },
    { country: 'Mexico', city: 'Mexico City' },
    { country: 'Mexico', city: 'Guadalajara' },
    { country: 'Argentina', city: 'Buenos Aires' },
    { country: 'Chile', city: 'Santiago' },
    { country: 'Colombia', city: 'Bogotá' },
    { country: 'Peru', city: 'Lima' },
    { country: 'Venezuela', city: 'Caracas' },
    { country: 'Ecuador', city: 'Quito' },
    { country: 'Bolivia', city: 'La Paz' },
    { country: 'Paraguay', city: 'Asunción' },
    { country: 'Uruguay', city: 'Montevideo' },
    { country: 'South Africa', city: 'Johannesburg' },
    { country: 'South Africa', city: 'Cape Town' },
    { country: 'Nigeria', city: 'Lagos' },
          { country: 'Nigeria', city: 'Abuja' },
    { country: 'Kenya', city: 'Nairobi' },
    { country: 'Ghana', city: 'Accra' },
    { country: 'Ethiopia', city: 'Addis Ababa' },
    { country: 'Uganda', city: 'Kampala' },
    { country: 'Tanzania', city: 'Dar es Salaam' },
    { country: 'Morocco', city: 'Casablanca' },
    { country: 'Morocco', city: 'Rabat' },
    { country: 'Algeria', city: 'Algiers' },
    { country: 'Tunisia', city: 'Tunis' },
    { country: 'Libya', city: 'Tripoli' },
    { country: 'Sudan', city: 'Khartoum' },
    { country: 'South Sudan', city: 'Juba' },
    { country: 'Somalia', city: 'Mogadishu' },
    { country: 'Djibouti', city: 'Djibouti' },
    { country: 'Eritrea', city: 'Asmara' },
    { country: 'Comoros', city: 'Moroni' },
    { country: 'Seychelles', city: 'Victoria' },
    { country: 'Mauritius', city: 'Port Louis' },
    { country: 'Madagascar', city: 'Antananarivo' },
    { country: 'Mauritania', city: 'Nouakchott' },
    { country: 'Mali', city: 'Bamako' },
    { country: 'Burkina Faso', city: 'Ouagadougou' },
    { country: 'Niger', city: 'Niamey' },
    { country: 'Chad', city: 'N\'Djamena' },
    { country: 'Central African Republic', city: 'Bangui' },
    { country: 'Cameroon', city: 'Yaoundé' },
    { country: 'Gabon', city: 'Libreville' },
    { country: 'Republic of the Congo', city: 'Brazzaville' },
    { country: 'Democratic Republic of the Congo', city: 'Kinshasa' },
    { country: 'Angola', city: 'Luanda' },
    { country: 'Zambia', city: 'Lusaka' },
    { country: 'Zimbabwe', city: 'Harare' },
    { country: 'Botswana', city: 'Gaborone' },
    { country: 'Namibia', city: 'Windhoek' },
    { country: 'Lesotho', city: 'Maseru' },
    { country: 'Eswatini', city: 'Mbabane' },
    { country: 'Mozambique', city: 'Maputo' },
    { country: 'Malawi', city: 'Lilongwe' }
  ];
  return locations[Math.floor(Math.random() * locations.length)];
};

const generateRandomDetails = (action, success) => {
  const details = {
    type: 'security_event',
    message: '',
    severity: 'medium',
    reason: ''
  };

  switch (action) {
    case 'login':
      if (success) {
        details.message = 'User successfully logged in';
        details.severity = 'low';
        details.reason = 'normal_login';
      } else {
        details.message = 'Login attempt failed';
        details.severity = 'medium';
        details.reason = 'invalid_credentials';
      }
      break;
    case 'login_failed':
      details.message = 'Failed login attempt';
      details.severity = 'medium';
      details.reason = 'invalid_credentials';
      break;
    case 'logout':
      details.message = 'User logged out';
      details.severity = 'low';
      details.reason = 'user_initiated';
      break;
    case 'password_change':
      details.message = 'Password changed successfully';
      details.severity = 'medium';
      details.reason = 'security_update';
      break;
    case 'two_factor_enable':
      details.message = 'Two-factor authentication enabled';
      details.severity = 'medium';
      details.reason = 'security_enhancement';
      break;
    case 'two_factor_disable':
      details.message = 'Two-factor authentication disabled';
      details.severity = 'high';
      details.reason = 'security_reduction';
      break;
    case 'account_lock':
      details.message = 'Account locked due to multiple failed attempts';
      details.severity = 'high';
      details.reason = 'security_measure';
      break;
    case 'suspicious_activity':
      details.message = 'Suspicious activity detected';
      details.severity = 'high';
      details.reason = 'unusual_pattern';
      break;
    case 'security_alert':
      details.message = 'Security alert triggered';
      details.severity = 'critical';
      details.reason = 'threat_detected';
      break;
    case 'rate_limit_exceeded':
      details.message = 'Rate limit exceeded';
      details.severity = 'medium';
      details.reason = 'too_many_requests';
      break;
    default:
      details.message = 'Security event recorded';
      details.severity = 'low';
      details.reason = 'general_event';
  }

  return details;
};

const generateRandomTimestamp = (startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return new Date(start + Math.random() * (end - start));
};

const seedAuditLogs = async () => {
  try {
    console.log('Starting audit logs seed...');

    // Get all users for reference
    const users = await User.find({}, '_id username email firstName lastName');
    console.log(`Found ${users.length} users for audit log generation`);

    if (users.length === 0) {
      console.log('No users found. Please run user seed first.');
      process.exit(1);
    }

    // Clear existing audit logs
    const deleteResult = await AuditLog.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing audit logs`);

    // Define date ranges for different periods with weights
    const dateRanges = [
      { start: '2023-01-01', end: '2023-03-31', weight: 0.15 }, // Early 2023
      { start: '2023-04-01', end: '2023-06-30', weight: 0.12 }, // Mid 2023
      { start: '2023-07-01', end: '2023-09-30', weight: 0.13 }, // Late 2023
      { start: '2023-10-01', end: '2023-12-31', weight: 0.14 }, // End 2023
      { start: '2024-01-01', end: '2024-03-31', weight: 0.12 }, // Early 2024
      { start: '2024-04-01', end: '2024-06-30', weight: 0.10 }, // Mid 2024
      { start: '2024-07-01', end: '2024-09-30', weight: 0.10 }, // Late 2024
      { start: '2024-10-01', end: '2024-12-31', weight: 0.10 }, // End 2024
      { start: '2025-01-01', end: new Date().toISOString().split('T')[0], weight: 0.04 } // 2025 to today
    ];

    // Actions with their frequencies
    const actions = [
      { action: 'login', frequency: 0.35, successRate: 0.95 },
      { action: 'login_failed', frequency: 0.15, successRate: 0.0 },
      { action: 'logout', frequency: 0.25, successRate: 1.0 },
      { action: 'password_change', frequency: 0.08, successRate: 0.98 },
      { action: 'two_factor_enable', frequency: 0.05, successRate: 0.99 },
      { action: 'two_factor_disable', frequency: 0.03, successRate: 0.95 },
      { action: 'account_lock', frequency: 0.02, successRate: 1.0 },
      { action: 'suspicious_activity', frequency: 0.03, successRate: 0.8 },
      { action: 'security_alert', frequency: 0.02, successRate: 1.0 },
      { action: 'rate_limit_exceeded', frequency: 0.02, successRate: 1.0 }
    ];

    // Risk levels with their frequencies
    const riskLevels = [
      { level: 'low', frequency: 0.60 },
      { level: 'medium', frequency: 0.25 },
      { level: 'high', frequency: 0.12 },
      { level: 'critical', frequency: 0.03 }
    ];

    const auditLogs = [];
    const totalLogs = 3000;
    const batchSize = 100;

    console.log(`Generating ${totalLogs} audit logs...`);

    for (let i = 0; i < totalLogs; i++) {
      // Select date range based on weights
      const randomWeight = Math.random();
      let cumulativeWeight = 0;
      let selectedRange = dateRanges[0];
      
      for (const range of dateRanges) {
        cumulativeWeight += range.weight;
        if (randomWeight <= cumulativeWeight) {
          selectedRange = range;
          break;
        }
      }

      // Generate timestamp within the selected range
      const timestamp = generateRandomTimestamp(selectedRange.start, selectedRange.end);

      // Select action based on frequency
      const actionRandom = Math.random();
      let cumulativeActionWeight = 0;
      let selectedAction = actions[0];
      
      for (const action of actions) {
        cumulativeActionWeight += action.frequency;
        if (actionRandom <= cumulativeActionWeight) {
          selectedAction = action;
          break;
        }
      }

      // Determine success based on action's success rate
      const success = Math.random() < selectedAction.successRate;

      // Select risk level based on frequency
      const riskRandom = Math.random();
      let cumulativeRiskWeight = 0;
      let selectedRisk = riskLevels[0];
      
      for (const risk of riskLevels) {
        cumulativeRiskWeight += risk.frequency;
        if (riskRandom <= cumulativeRiskWeight) {
          selectedRisk = risk;
          break;
        }
      }

      // Select random user
      const user = users[Math.floor(Math.random() * users.length)];

      // Generate audit log entry
      const auditLog = {
        userId: user._id,
        username: user.username, // Required field
        userAgent: generateRandomDevice(), // Required field - using device as userAgent
        action: selectedAction.action,
        success: success,
        riskLevel: selectedRisk.level,
        ip: generateRandomIP(),
        device: generateRandomDevice(),
        location: generateRandomLocation(),
        timestamp: timestamp,
        details: generateRandomDetails(selectedAction.action, success)
      };

      auditLogs.push(auditLog);

      // Process in batches
      if (auditLogs.length >= batchSize) {
        await AuditLog.insertMany(auditLogs);
        console.log(`Processed ${i + 1}/${totalLogs} audit logs`);
        auditLogs.length = 0; // Clear array
      }
    }

    // Insert remaining logs
    if (auditLogs.length > 0) {
      await AuditLog.insertMany(auditLogs);
    }

    // Get final statistics
    const totalCreated = await AuditLog.countDocuments();
    const highRiskCount = await AuditLog.countDocuments({ riskLevel: 'high' });
    const criticalCount = await AuditLog.countDocuments({ riskLevel: 'critical' });
    const failedLoginsCount = await AuditLog.countDocuments({ action: 'login_failed' });
    const successfulLoginsCount = await AuditLog.countDocuments({ action: 'login', success: true });
    const twoFactorCount = await AuditLog.countDocuments({ 
      action: { $in: ['two_factor_enable', 'two_factor_disable'] } 
    });

    // Date-based statistics
    const today = new Date();
    const last24h = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last24hCount = await AuditLog.countDocuments({ timestamp: { $gte: last24h } });
    const last7dCount = await AuditLog.countDocuments({ timestamp: { $gte: last7d } });
    const last30dCount = await AuditLog.countDocuments({ timestamp: { $gte: last30d } });

    // Year-based statistics
    const year2023Count = await AuditLog.countDocuments({
      timestamp: {
        $gte: new Date('2023-01-01'),
        $lt: new Date('2024-01-01')
      }
    });
    const year2024Count = await AuditLog.countDocuments({
      timestamp: {
        $gte: new Date('2024-01-01'),
        $lt: new Date('2025-01-01')
      }
    });
    const year2025Count = await AuditLog.countDocuments({
      timestamp: {
        $gte: new Date('2025-01-01')
      }
    });

    console.log('\n=== AUDIT LOGS SEED COMPLETED ===');
    console.log(`Total audit logs created: ${totalCreated}`);
    console.log(`High risk events: ${highRiskCount}`);
    console.log(`Critical events: ${criticalCount}`);
    console.log(`Failed logins: ${failedLoginsCount}`);
    console.log(`Successful logins: ${successfulLoginsCount}`);
    console.log(`Two-factor events: ${twoFactorCount}`);
    console.log('\n=== TIME-BASED STATISTICS ===');
    console.log(`Last 24 hours: ${last24hCount}`);
    console.log(`Last 7 days: ${last7dCount}`);
    console.log(`Last 30 days: ${last30dCount}`);
    console.log('\n=== YEAR-BASED STATISTICS ===');
    console.log(`2023: ${year2023Count} logs`);
    console.log(`2024: ${year2024Count} logs`);
    console.log(`2025: ${year2025Count} logs`);
    console.log('\n=== ACTION BREAKDOWN ===');
    
    for (const action of actions) {
      const count = await AuditLog.countDocuments({ action: action.action });
      console.log(`${action.action}: ${count} logs`);
    }

    console.log('\n=== RISK LEVEL BREAKDOWN ===');
    for (const risk of riskLevels) {
      const count = await AuditLog.countDocuments({ riskLevel: risk.level });
      console.log(`${risk.level}: ${count} logs`);
    }

    console.log('\nAudit logs seed completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding audit logs:', error);
    process.exit(1);
  }
}; 