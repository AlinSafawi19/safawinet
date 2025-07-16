const moment = require('moment-timezone');

// Test timezone conversion for date range filtering
function testTimezoneConversion() {
  console.log('=== Timezone Conversion Test ===\n');

  // Simulate user in different timezones
  const testCases = [
    { timezone: 'Asia/Beirut', date: '2024-01-15' },
    { timezone: 'America/New_York', date: '2024-01-15' },
    { timezone: 'Europe/London', date: '2024-01-15' },
    { timezone: 'Asia/Tokyo', date: '2024-01-15' }
  ];

  testCases.forEach(({ timezone, date }) => {
    console.log(`User timezone: ${timezone}`);
    console.log(`User selected date: ${date}`);
    
    // Convert to UTC for database query (start of day)
    const startDateUTC = moment.tz(date, timezone).startOf('day').utc().toISOString();
    console.log(`Start of day in UTC: ${startDateUTC}`);
    
    // Convert to UTC for database query (end of day)
    const endDateUTC = moment.tz(date, timezone).endOf('day').utc().toISOString();
    console.log(`End of day in UTC: ${endDateUTC}`);
    
    // Show the time range in user's timezone
    const startInUserTz = moment.tz(startDateUTC).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
    const endInUserTz = moment.tz(endDateUTC).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
    console.log(`Time range in ${timezone}: ${startInUserTz} to ${endInUserTz}`);
    
    console.log('---\n');
  });
}

// Test audit logs date range filtering
function testAuditLogsDateRanges() {
  console.log('=== Audit Logs Date Range Test ===\n');
  
  const userTimezone = 'Asia/Beirut';
  const now = moment.tz(userTimezone);
  
  console.log(`User timezone: ${userTimezone}`);
  console.log(`Current time in user timezone: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
  console.log(`Current time in UTC: ${now.utc().format('YYYY-MM-DD HH:mm:ss')}`);
  
  // Test different date ranges
  const dateRanges = [
    { name: 'Last Hour', hours: 1 },
    { name: 'Last 24 Hours', hours: 24 },
    { name: 'Last Week', days: 7 },
    { name: 'Last Month', days: 30 }
  ];
  
  dateRanges.forEach(range => {
    let cutoff;
    if (range.hours) {
      cutoff = now.clone().subtract(range.hours, 'hours').utc();
    } else if (range.days) {
      cutoff = now.clone().subtract(range.days, 'days').utc();
    }
    
    console.log(`\n${range.name}:`);
    console.log(`  Cutoff in user timezone: ${cutoff.tz(userTimezone).format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`  Cutoff in UTC: ${cutoff.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`  ISO string for API: ${cutoff.toISOString()}`);
  });
}

// Test database query simulation
function testDatabaseQuery() {
  console.log('=== Database Query Test ===\n');
  
  const userTimezone = 'Asia/Beirut';
  const startDate = '2024-01-15';
  const endDate = '2024-01-20';
  
  console.log(`User timezone: ${userTimezone}`);
  console.log(`Date range: ${startDate} to ${endDate}`);
  
  // Convert to UTC for database query
  const startDateUTC = moment.tz(startDate, userTimezone).startOf('day').utc().toISOString();
  const endDateUTC = moment.tz(endDate, userTimezone).endOf('day').utc().toISOString();
  
  console.log(`Database query parameters:`);
  console.log(`  createdAfter: ${startDateUTC}`);
  console.log(`  createdBefore: ${endDateUTC}`);
  
  // Simulate what the MongoDB query would look like
  const query = {
    createdAt: {
      $gte: new Date(startDateUTC),
      $lte: new Date(endDateUTC)
    }
  };
  
  console.log(`MongoDB query:`, JSON.stringify(query, null, 2));
  
  // Show what this means in user's timezone
  console.log(`\nThis query will find users created between:`);
  console.log(`  Start: ${moment.tz(startDateUTC).tz(userTimezone).format('YYYY-MM-DD HH:mm:ss')} (${userTimezone})`);
  console.log(`  End: ${moment.tz(endDateUTC).tz(userTimezone).format('YYYY-MM-DD HH:mm:ss')} (${userTimezone})`);
}

// Test the new audit logs approach
function testAuditLogsApproach() {
  console.log('=== Audit Logs Timezone Handling Test ===\n');
  
  const userTimezone = 'Asia/Beirut';
  const now = moment.tz(userTimezone);
  
  console.log(`User timezone: ${userTimezone}`);
  console.log(`Current time: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
  
  // Test the new approach: calculate in user timezone, convert to UTC
  const testRanges = [
    { name: '1h', method: () => now.clone().subtract(1, 'hour').utc() },
    { name: '24h', method: () => now.clone().subtract(24, 'hours').utc() },
    { name: '7d', method: () => now.clone().subtract(7, 'days').utc() },
    { name: '30d', method: () => now.clone().subtract(30, 'days').utc() }
  ];
  
  testRanges.forEach(range => {
    const cutoff = range.method();
    
    console.log(`\n${range.name} range:`);
    console.log(`  Cutoff in user timezone: ${cutoff.tz(userTimezone).format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`  Cutoff in UTC: ${cutoff.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`  ISO string sent to backend: ${cutoff.toISOString()}`);
    
    // Simulate backend receiving this UTC timestamp
    const backendReceived = new Date(cutoff.toISOString());
    console.log(`  Backend receives: ${backendReceived.toISOString()}`);
    console.log(`  Backend converts to user timezone: ${moment(backendReceived).tz(userTimezone).format('YYYY-MM-DD HH:mm:ss')}`);
  });
}

// Run all tests
console.log('Running timezone conversion tests...\n');
testTimezoneConversion();
testAuditLogsDateRanges();
testDatabaseQuery();
testAuditLogsApproach(); 