# Timezone-Aware Filtering and Sorting Solution

## Overview

This document explains how the system handles timezone-aware filtering and sorting to ensure that users see data in their local timezone while maintaining data integrity in the database.

## Problem Statement

The original implementation had a timezone mismatch issue:
- **Database**: All timestamps stored in UTC
- **Display**: Timestamps converted to user's timezone for display
- **Filtering/Sorting**: Used UTC timestamps, causing incorrect results when users filtered by date ranges

## Solution Architecture

### 1. Frontend Timezone Handling

#### User Timezone Detection
```javascript
// Extract user preferences with fallbacks
const userTimezone = user?.userPreferences?.timezone || 'Asia/Beirut';
const userDateFormat = user?.userPreferences?.dateFormat || 'MMM DD, YYYY h:mm a';
```

#### Date Range Calculation for Users
```javascript
// Convert date range to separate parameters for API
if (filters.createdDateRange) {
  const userTimezone = currentUser?.userPreferences?.timezone || 'Asia/Beirut';
  
  if (filters.createdDateRange.start) {
    // Convert user's local date to UTC for database query
    // Start of day in user's timezone converted to UTC
    const startDate = moment.tz(filters.createdDateRange.start, userTimezone).startOf('day').utc().toISOString();
    params.createdAfter = startDate;
  }
  if (filters.createdDateRange.end) {
    // Convert user's local date to UTC for database query
    // End of day in user's timezone converted to UTC
    const endDate = moment.tz(filters.createdDateRange.end, userTimezone).endOf('day').utc().toISOString();
    params.createdBefore = endDate;
  }
  delete params.createdDateRange; // Remove the object from params
}
```

#### Date Range Calculation for Audit Logs
```javascript
// Calculate date range in user's timezone, then convert to UTC for backend
let cutoff;
const now = moment.tz(userTimezone);
switch (filters.dateRange) {
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
  default:
    cutoff = now.clone().subtract(24, 'hours').utc();
}
```

#### Sort Controls
```javascript
// Sort options for users
const sortOptions = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'lastLogin', label: 'Last Login' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'username', label: 'Username' },
  { value: 'role', label: 'Role' },
  { value: 'isActive', label: 'Status' }
];

// Sort options for audit logs
const sortByOptions = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'action', label: 'Action' },
  { value: 'riskLevel', label: 'Risk Level' },
  { value: 'success', label: 'Status' },
  { value: 'ip', label: 'IP Address' }
];
```

### 2. Backend Timezone Processing

#### Users Route Handler (`server/routes/users.js`)
```javascript
// Get user's timezone preference
const userTimezone = req.user.userPreferences?.timezone || req.query.userTimezone || 'Asia/Beirut';

// Handle timezone-aware date filtering
if (createdAfter || createdBefore) {
  query.createdAt = {};
  
  if (createdAfter) {
    // createdAfter is already in UTC from client
    query.createdAt.$gte = new Date(createdAfter);
  }
  
  if (createdBefore) {
    // createdBefore is already in UTC from client
    query.createdAt.$lte = new Date(createdBefore);
  }
}

// Build sort object with timezone-aware sorting
const sortObject = {};

// Handle special cases for date fields with null values and timezone consistency
if (sortBy === 'lastLogin') {
  // For lastLogin, handle null values by sorting them last
  // Always sort by UTC timestamp for consistency with filtering
  if (sortOrder === 'desc') {
    sortObject.lastLogin = -1;
    // Add secondary sort to ensure consistent ordering
    sortObject.createdAt = -1;
  } else {
    sortObject.lastLogin = 1;
    // Add secondary sort to ensure consistent ordering
    sortObject.createdAt = 1;
  }
} else if (sortBy === 'createdAt') {
  // For createdAt, use normal sorting (already in UTC)
  // This ensures consistency with the timezone-aware filtering
  sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;
} else {
  // For other fields, use normal sorting
  sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;
}
```

#### Audit Logs Route Handler (`server/routes/auth.js`)
```javascript
// Get user's timezone preference
const userTimezone = req.user.userPreferences?.timezone || req.query.timezone || 'Asia/Beirut';

// Handle timezone-aware date filtering
let cutoff;
if (req.query.cutoff) {
  // Frontend sends UTC timestamps, so we can use them directly
  cutoff = new Date(req.query.cutoff);
} else {
  // Calculate cutoff in user's timezone, then convert to UTC for database query
  const now = moment.tz(userTimezone);
  let cutoffInUserTz;
  
  // Determine the date range based on query parameters or default to 24h
  const dateRange = req.query.dateRange || '24h';
  switch (dateRange) {
    case '1h':
      cutoffInUserTz = now.clone().subtract(1, 'hour');
      break;
    case '24h':
      cutoffInUserTz = now.clone().subtract(24, 'hours');
      break;
    case '7d':
      cutoffInUserTz = now.clone().subtract(7, 'days');
      break;
    case '30d':
      cutoffInUserTz = now.clone().subtract(30, 'days');
      break;
    default:
      cutoffInUserTz = now.clone().subtract(24, 'hours');
  }
  
  // Convert to UTC for database query
  cutoff = cutoffInUserTz.utc().toDate();
}

// Handle custom date range filtering if provided
let customDateRange = {};
if (req.query.startDate && req.query.endDate) {
  // Convert user timezone dates to UTC for database query
  const startDate = moment.tz(req.query.startDate, userTimezone).utc().toDate();
  const endDate = moment.tz(req.query.endDate, userTimezone).utc().toDate();
  
  customDateRange = {
    $gte: startDate,
    $lte: endDate
  };
}
```

### 3. Database Query Consistency

#### MongoDB Query Structure
```javascript
// Date filtering with timezone awareness
if (startDate && endDate) {
  // Custom date range provided (already converted to UTC by the route)
  query.timestamp = {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };
} else {
  // Use cutoff date (already converted to UTC by the route)
  query.timestamp = { $gte: cutoff };
}

// Sort by UTC timestamp for consistency
const sortObject = {};
if (sortBy === 'timestamp') {
  sortObject.timestamp = sortOrder === 'desc' ? -1 : 1;
} else {
  // For other fields, use normal sorting
  sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;
}
```

### 4. Display Formatting

#### Frontend Date Display
```javascript
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  // Get user's timezone and date format preferences
  const userTimezone = currentUser?.userPreferences?.timezone || 'Asia/Beirut';
  const userDateFormat = currentUser?.userPreferences?.dateFormat || 'MMM DD, YYYY h:mm a';

  return moment(dateString).tz(userTimezone).format(userDateFormat);
};
```

#### CSV Export Date Formatting
```javascript
// Get user's timezone and date format preferences
const userTimezone = req.user.userPreferences?.timezone || userTimezoneParam;
const userDateFormat = req.user.userPreferences?.dateFormat || 'MMM DD, YYYY h:mm a';

const csvRows = users.map(user => [
  // ... other fields
  user.createdAt ? moment(user.createdAt).tz(userTimezone).format(userDateFormat) : '',
  user.lastLogin ? moment(user.lastLogin).tz(userTimezone).format(userDateFormat) : '',
  // ... other fields
]);
```

## Key Principles

### 1. **UTC Storage, Local Display**
- All timestamps stored in UTC in the database
- All timestamps converted to user's timezone for display
- This ensures data consistency across timezones

### 2. **Timezone-Aware Filtering**
- Frontend converts user's local date selections to UTC
- Backend receives UTC timestamps for database queries
- This ensures filtering works correctly regardless of user's timezone

### 3. **Consistent Sorting**
- Date sorting always uses UTC timestamps for consistency
- This ensures sorting results match filtering results
- Secondary sorts added for fields with null values

### 4. **User Preference Integration**
- System respects user's timezone and date format preferences
- Fallback to default timezone if preferences not set
- Consistent timezone handling across all features

## Implementation Benefits

1. **Data Integrity**: All data stored in UTC prevents timezone-related data corruption
2. **User Experience**: Users see dates in their local timezone
3. **Filtering Accuracy**: Date range filtering works correctly across timezones
4. **Sorting Consistency**: Sorting results match filtering expectations
5. **Scalability**: System works correctly for users in different timezones
6. **Maintainability**: Clear separation between storage and display logic

## Testing Considerations

1. **Cross-Timezone Testing**: Test with users in different timezones
2. **Date Boundary Testing**: Test date filtering at timezone boundaries
3. **DST Testing**: Test during daylight saving time transitions
4. **Sort Order Testing**: Verify sorting consistency with filtering
5. **Export Testing**: Ensure exported data uses correct timezone formatting

## Troubleshooting

### Common Issues

1. **Date Range Mismatch**: Ensure frontend converts to UTC before sending to backend
2. **Sorting Inconsistency**: Verify sorting uses UTC timestamps for date fields
3. **Display Formatting**: Check user timezone preferences are being applied
4. **Export Timezone**: Ensure CSV export uses user's timezone preferences

### Debug Steps

1. Log the UTC timestamps being sent to the backend
2. Verify the database queries are using UTC timestamps
3. Check that display formatting uses user's timezone
4. Confirm sorting and filtering use the same timezone logic 