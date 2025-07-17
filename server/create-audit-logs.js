const mongoose = require('mongoose');
const AuditLog = require('./models/AuditLog');
const User = require('./models/User');
const { config } = require('./config/config');

async function createAuditLogs() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find().select('_id username email firstName lastName');
    console.log('Available users:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Username: ${user.username}, Name: ${user.firstName} ${user.lastName}`);
    });

    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    // Clear existing audit logs
    console.log('\nClearing existing audit logs...');
    await AuditLog.deleteMany({});
    console.log('Existing audit logs cleared.');

    // Generate new audit logs with correct user IDs
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

    const riskLevels = [
      { level: 'low', frequency: 0.60 },
      { level: 'medium', frequency: 0.25 },
      { level: 'high', frequency: 0.12 },
      { level: 'critical', frequency: 0.03 }
    ];

    const auditLogs = [];
    const totalLogs = 100; // Generate 100 logs for testing
    const batchSize = 20;

    console.log(`\nGenerating ${totalLogs} new audit logs...`);

    for (let i = 0; i < totalLogs; i++) {
      // Randomly select a user
      const user = users[Math.floor(Math.random() * users.length)];
      
      // Randomly select an action based on frequency
      const actionRand = Math.random();
      let cumulativeFreq = 0;
      let selectedAction = actions[0];
      for (const action of actions) {
        cumulativeFreq += action.frequency;
        if (actionRand <= cumulativeFreq) {
          selectedAction = action;
          break;
        }
      }

      // Determine success based on action's success rate
      const success = Math.random() < selectedAction.successRate;

      // Randomly select risk level
      const riskRand = Math.random();
      cumulativeFreq = 0;
      let selectedRisk = riskLevels[0];
      for (const risk of riskLevels) {
        cumulativeFreq += risk.frequency;
        if (riskRand <= cumulativeFreq) {
          selectedRisk = risk;
          break;
        }
      }

      // Generate timestamp within last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const timestamp = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));

      // Generate random IP
      const generateRandomIP = () => {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      };

      // Generate random device
      const generateRandomDevice = () => {
        const devices = [
          'Chrome/91.0.4472.124 Safari/537.36',
          'Firefox/89.0',
          'Safari/14.1.1',
          'Edge/91.0.864.59',
          'Mobile Safari/14.0'
        ];
        return devices[Math.floor(Math.random() * devices.length)];
      };

      // Generate random location
      const generateRandomLocation = () => {
        const countries = ['Lebanon', 'USA', 'UK', 'Germany', 'France', 'Canada'];
        const cities = ['Beirut', 'New York', 'London', 'Berlin', 'Paris', 'Toronto'];
        const country = countries[Math.floor(Math.random() * countries.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        return { country, city };
      };

      // Generate random details
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
        }

        return details;
      };

      // Create audit log entry
      const auditLog = {
        userId: user._id,
        username: user.username,
        userAgent: generateRandomDevice(),
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

    console.log('\n✅ Audit logs created successfully!');
    console.log(`Total audit logs: ${totalCreated}`);
    console.log(`High risk events: ${highRiskCount}`);
    console.log(`Critical events: ${criticalCount}`);
    console.log(`Failed logins: ${failedLoginsCount}`);
    console.log(`Successful logins: ${successfulLoginsCount}`);

    // Show logs by user
    console.log('\nAudit logs by user:');
    for (const user of users) {
      const userLogs = await AuditLog.countDocuments({ userId: user._id });
      console.log(`- ${user.username}: ${userLogs} logs`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

createAuditLogs(); 