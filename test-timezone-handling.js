const moment = require('moment-timezone');

// Test timezone handling for users management
console.log('=== Testing Users Timezone Handling ===\n');

// Simulate user in different timezone
const userTimezone = 'America/New_York';
const userDateFormat = 'MMM DD, YYYY h:mm a';

// Test date range conversion
const testDateRange = {
  start: '2024-01-15', // User selects Jan 15, 2024
  end: '2024-01-20'    // User selects Jan 20, 2024
};

console.log('User timezone:', userTimezone);
console.log('User date format:', userDateFormat);
console.log('User selected date range:', testDateRange);

// Convert to UTC for database query
const startDateUTC = moment.tz(testDateRange.start, userTimezone).startOf('day').utc().toISOString();
const endDateUTC = moment.tz(testDateRange.end, userTimezone).endOf('day').utc().toISOString();

console.log('\nConverted to UTC for database query:');
console.log('Start date (UTC):', startDateUTC);
console.log('End date (UTC):', endDateUTC);

// Test display formatting
const sampleCreatedAt = '2024-01-15T10:30:00.000Z'; // UTC timestamp from database
const formattedDate = moment(sampleCreatedAt).tz(userTimezone).format(userDateFormat);

console.log('\nDisplay formatting:');
console.log('UTC timestamp from DB:', sampleCreatedAt);
console.log('Formatted for user display:', formattedDate);

// Test different timezones
console.log('\n=== Testing Different Timezones ===\n');

const timezones = ['Asia/Beirut', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

timezones.forEach(tz => {
  const localStart = moment.tz(testDateRange.start, tz).startOf('day').utc().toISOString();
  const localEnd = moment.tz(testDateRange.end, tz).endOf('day').utc().toISOString();
  
  console.log(`${tz}:`);
  console.log(`  Start: ${localStart}`);
  console.log(`  End: ${localEnd}`);
  console.log(`  Sample display: ${moment(sampleCreatedAt).tz(tz).format('MMM DD, YYYY h:mm a')}`);
  console.log('');
});

// Test audit logs timezone handling
console.log('=== Testing Audit Logs Timezone Handling ===\n');

const auditUserTimezone = 'Europe/London';
const now = moment.tz(auditUserTimezone);

console.log('Audit user timezone:', auditUserTimezone);
console.log('Current time in user timezone:', now.format('YYYY-MM-DD HH:mm:ss'));

// Test different date ranges
const dateRanges = ['1h', '24h', '7d', '30d'];

dateRanges.forEach(range => {
  let cutoff;
  switch (range) {
    case '1h':
      cutoff = now.clone().subtract(1, 'hour').utc();
      break;
    case '24h':
      cutoff = now.clone().subtract(24, 'hours').utc();
      break;
    case '7d':
      cutoff = now.clone().subtract(7, 'days').utc();
      break;
    case '30d':
      cutoff = now.clone().subtract(30, 'days').utc();
      break;
  }
  
  console.log(`${range} ago:`);
  console.log(`  User timezone: ${now.clone().subtract(range === '1h' ? 1 : range === '24h' ? 24 : range === '7d' ? 7 : 30, range === '1h' ? 'hour' : range === '24h' ? 'hours' : 'days').format('YYYY-MM-DD HH:mm:ss')}`);
  console.log(`  UTC for DB query: ${cutoff.toISOString()}`);
  console.log('');
});

// Test sorting consistency
console.log('=== Testing Sorting Consistency ===\n');

const sampleDates = [
  '2024-01-15T10:30:00.000Z',
  '2024-01-15T15:45:00.000Z',
  '2024-01-16T08:20:00.000Z',
  '2024-01-16T22:10:00.000Z'
];

console.log('Sample UTC dates from database:');
sampleDates.forEach(date => console.log(`  ${date}`));

console.log('\nSorted in UTC (desc):');
sampleDates.sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
  console.log(`  ${date} -> ${moment(date).tz(auditUserTimezone).format('MMM DD, YYYY h:mm a')}`);
});

console.log('\nSorted in UTC (asc):');
sampleDates.sort((a, b) => new Date(a) - new Date(b)).forEach(date => {
  console.log(`  ${date} -> ${moment(date).tz(auditUserTimezone).format('MMM DD, YYYY h:mm a')}`);
});

console.log('\n=== Timezone Handling Test Complete ===');
console.log('\nKey Points:');
console.log('1. All dates stored in UTC in database');
console.log('2. Frontend converts user timezone dates to UTC for filtering');
console.log('3. Backend uses UTC timestamps for database queries');
console.log('4. Frontend converts UTC results to user timezone for display');
console.log('5. Sorting uses UTC timestamps for consistency'); 