const mongoose = require('mongoose');
const AuditLog = require('./models/AuditLog');
const { config } = require('./config/config');

async function checkTimestamps() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Connected to MongoDB');

    // Get all audit logs sorted by timestamp
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    console.log(`Total audit logs: ${logs.length}`);

    // Check the most recent and oldest timestamps
    if (logs.length > 0) {
      const newest = logs[0];
      const oldest = logs[logs.length - 1];
      
      console.log('\nTimestamp range:');
      console.log(`Newest: ${newest.timestamp}`);
      console.log(`Oldest: ${oldest.timestamp}`);
      
      // Check how many are within last 24 hours
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const within24h = logs.filter(log => log.timestamp >= last24Hours).length;
      const within7d = logs.filter(log => log.timestamp >= last7Days).length;
      const within30d = logs.filter(log => log.timestamp >= last30Days).length;
      
      console.log('\nLogs within time ranges:');
      console.log(`Last 24 hours: ${within24h}`);
      console.log(`Last 7 days: ${within7d}`);
      console.log(`Last 30 days: ${within30d}`);
      
      // Show a few sample logs with their timestamps
      console.log('\nSample logs (newest first):');
      logs.slice(0, 5).forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} - ${log.timestamp} - User: ${log.username}`);
      });
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTimestamps(); 