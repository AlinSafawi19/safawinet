const mongoose = require('mongoose');
const AuditLog = require('./models/AuditLog');
const { config } = require('./config/config');

async function checkAuditLogs() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Connected to MongoDB');

    const count = await AuditLog.countDocuments();
    console.log('Total audit logs:', count);

    if (count > 0) {
      const logs = await AuditLog.find().limit(5).sort({timestamp: -1});
      console.log('Recent logs:');
      logs.forEach(log => {
        console.log(`- Action: ${log.action}, User: ${log.userId}, Time: ${log.timestamp}`);
      });
    } else {
      console.log('No audit logs found in database');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAuditLogs(); 