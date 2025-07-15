# Server-Side Pagination Implementation

## Overview

This document describes the server-side pagination implementation for the audit logs system, which ensures optimal performance and scalability by limiting the amount of data transferred and processed at once.

## Features

### ✅ Implemented Features

1. **Efficient Database Queries**
   - Uses MongoDB's `skip()` and `limit()` for pagination
   - Optimized with compound database indexes
   - Lean queries for better performance

2. **Enhanced Filtering**
   - Action type filtering
   - Risk level filtering
   - Success/failure status filtering
   - Date range filtering
   - IP address filtering (admin only)

3. **Comprehensive Pagination Metadata**
   - Total count of records
   - Current page number
   - Total pages
   - Next/previous page indicators
   - Page size limits (1-1000 records)

4. **Summary Statistics**
   - High-risk event counts
   - Failed login counts
   - Unique user counts (admin view)

5. **Admin vs User Views**
   - Regular users see only their own audit logs
   - Admins can view all users' audit logs
   - Separate endpoints for different access levels

## API Endpoints

### Regular User Endpoint
```
GET /api/auth/audit-logs
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Records per page (default: 25, max: 1000)
- `cutoff` (ISO date): Start date for filtering
- `action` (string): Filter by action type
- `riskLevel` (string): Filter by risk level
- `success` (boolean): Filter by success status

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "total": 150,
    "page": 1,
    "limit": 25,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null,
    "summary": {
      "highRiskCount": 5,
      "failedLoginsCount": 3
    }
  }
}
```

### Admin Endpoint
```
GET /api/auth/admin/audit-logs
```

**Additional Query Parameters:**
- `userId` (string): Filter by specific user ID
- `ip` (string): Filter by IP address

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "total": 150,
    "page": 1,
    "limit": 25,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null,
    "summary": {
      "highRiskCount": 5,
      "failedLoginsCount": 3,
      "uniqueUsersCount": 12
    }
  }
}
```

## Database Optimizations

### Indexes
The following indexes are created for optimal query performance:

```javascript
// Basic indexes
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });
auditLogSchema.index({ success: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, timestamp: -1 });

// Compound indexes for pagination queries
auditLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, riskLevel: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, success: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, riskLevel: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, success: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, success: 1, timestamp: -1 });
```

### Optimized Query Method
A dedicated static method `getPaginatedLogs()` handles all pagination logic:

```javascript
AuditLog.getPaginatedLogs({
  userId: null, // null for admin, userId for regular users
  page: 1,
  limit: 25,
  cutoff: new Date(),
  action: 'login',
  riskLevel: 'high',
  success: true,
  ip: '192.168.1.1'
})
```

## Frontend Integration

### State Management
The frontend maintains pagination state:

```javascript
const [pagination, setPagination] = useState({
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false
});

const [summaryStats, setSummaryStats] = useState({
  highRiskCount: 0,
  failedLoginsCount: 0
});
```

### API Integration
The frontend makes requests with pagination parameters:

```javascript
const response = await api.get('/auth/audit-logs', {
  params: {
    page: pagination.page,
    limit: pagination.limit,
    cutoff: cutoff.toISOString(),
    action: filters.action,
    riskLevel: filters.riskLevel,
    success: filters.success
  }
});
```

## Performance Benefits

### Before (Client-Side Pagination)
- ❌ All audit logs loaded at once
- ❌ High memory usage
- ❌ Slow initial page load
- ❌ Poor user experience with large datasets

### After (Server-Side Pagination)
- ✅ Only requested page loaded
- ✅ Minimal memory usage
- ✅ Fast page loads regardless of dataset size
- ✅ Smooth user experience
- ✅ Scalable to millions of records

## Testing

Run the test script to verify pagination functionality:

```bash
node test-audit-pagination.js
```

The test script validates:
- Basic pagination functionality
- Filter application
- Pagination metadata accuracy
- Summary statistics calculation
- Admin endpoint access

## Security Considerations

1. **Access Control**: Regular users can only see their own logs
2. **Input Validation**: All query parameters are validated and sanitized
3. **Rate Limiting**: Pagination requests are subject to rate limiting
4. **SQL Injection Prevention**: Uses parameterized queries via Mongoose

## Future Enhancements

1. **Caching**: Implement Redis caching for frequently accessed pages
2. **Real-time Updates**: WebSocket integration for live audit log updates
3. **Export Functionality**: Bulk export with pagination support
4. **Advanced Filtering**: Date range picker, multi-select filters
5. **Search**: Full-text search across audit log fields

## Monitoring

Monitor pagination performance with:
- Database query execution times
- API response times
- Memory usage patterns
- User interaction metrics

## Troubleshooting

### Common Issues

1. **Slow Queries**: Check if indexes are being used with `explain()`
2. **Memory Issues**: Ensure `lean()` is used for read-only queries
3. **Incorrect Counts**: Verify filter logic matches between count and find queries
4. **Pagination Errors**: Validate page and limit parameters

### Debug Commands

```javascript
// Check query performance
db.auditlogs.find(query).explain("executionStats")

// Verify indexes
db.auditlogs.getIndexes()

// Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 })
``` 