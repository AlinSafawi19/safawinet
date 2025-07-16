# Multi-User Filter for Audit Logs

## Overview

The audit logs system now supports filtering by multiple users simultaneously, allowing administrators and users with appropriate permissions to view audit logs from multiple selected users in a single query.

## Features

### ✅ Implemented Features

1. **Multi-Select User Filter**
   - Select multiple users from a dropdown
   - Visual indicators for selected users
   - Easy removal of individual users from selection
   - Clear all selections option

2. **Backend Support**
   - Comma-separated user ID support
   - MongoDB `$in` operator for efficient querying
   - Backward compatibility with single user filtering

3. **Frontend Enhancements**
   - React Select with multi-select capability
   - Custom styling for multi-value display
   - Real-time filter updates
   - Responsive design

4. **Permission-Based Access**
   - Only available to users with `view` permission or admin access
   - Maintains existing permission structure
   - Secure user data access

## Implementation Details

### Backend Changes

#### 1. Route Updates (`server/routes/auth.js`)

**Regular User Endpoint:**
```javascript
// Add user filter (only for admin and view permission users)
if (req.query.userId && req.query.userId.trim() && (req.user.isAdmin || hasViewPermission)) {
    // Support both single user ID and multiple user IDs (comma-separated)
    const userIds = req.query.userId.trim().split(',').map(id => id.trim()).filter(id => id);
    if (userIds.length === 1) {
        query.userId = userIds[0];
    } else if (userIds.length > 1) {
        query.userId = { $in: userIds };
    }
}
```

**Admin Endpoint:**
```javascript
// Add user filter for admin
if (req.query.userId && req.query.userId.trim()) {
    // Support both single user ID and multiple user IDs (comma-separated)
    const userIds = req.query.userId.trim().split(',').map(id => id.trim()).filter(id => id);
    if (userIds.length === 1) {
        query.userId = userIds[0];
    } else if (userIds.length > 1) {
        query.userId = { $in: userIds };
    }
}
```

#### 2. Model Updates (`server/models/AuditLog.js`)

**getPaginatedLogs Method:**
```javascript
// User filtering
if (userId) query.userId = userId;
if (filterUserId) {
    // Support both single user ID and multiple user IDs (comma-separated)
    const userIds = filterUserId.split(',').map(id => id.trim()).filter(id => id);
    if (userIds.length === 1) {
        query.userId = userIds[0];
    } else if (userIds.length > 1) {
        query.userId = { $in: userIds };
    }
}
```

### Frontend Changes

#### 1. State Management (`client/src/pages/AuditLogs.js`)

**Filter State:**
```javascript
const [filters, setFilters] = useState({
    action: '',
    riskLevel: '',
    success: '',
    dateRange: '24h',
    userId: [] // Changed to array for multi-select
});
```

#### 2. API Parameter Handling

**Query Parameter Building:**
```javascript
if (filters.userId && filters.userId.length > 0) {
    // Join multiple user IDs with commas for backend
    params.userId = filters.userId.join(',');
}
```

#### 3. Multi-Select Component

**React Select Configuration:**
```javascript
<Select
    value={filters.userId.map(userId => userOptions.find(option => option.value === userId)).filter(Boolean)}
    onChange={(selectedOptions) => {
        const selectedUserIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        handleFilterChange('userId', selectedUserIds);
    }}
    options={userOptions}
    styles={customStyles}
    placeholder="Select users..."
    isMulti
    isClearable
    isSearchable
    closeMenuOnSelect={false}
/>
```

#### 4. Custom Styling

**Multi-Value Styles:**
```javascript
multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#eaf0fb',
    borderRadius: '6px',
    border: '1px solid #1f3bb3'
}),
multiValueLabel: (provided) => ({
    ...provided,
    color: '#1f3bb3',
    fontWeight: 500,
    fontSize: '0.875rem'
}),
multiValueRemove: (provided) => ({
    ...provided,
    color: '#1f3bb3',
    '&:hover': {
        backgroundColor: '#1f3bb3',
        color: '#fff'
    }
})
```

## API Usage

### Single User Filter
```
GET /api/auth/audit-logs?userId=507f1f77bcf86cd799439011
```

### Multiple User Filter
```
GET /api/auth/audit-logs?userId=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012,507f1f77bcf86cd799439013
```

### Combined with Other Filters
```
GET /api/auth/audit-logs?userId=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012&action=login&riskLevel=high&page=1&limit=25
```

## User Interface

### Filter Dropdown
- **Label**: "Users" (changed from "User")
- **Placeholder**: "Select users..."
- **Multi-select**: Enabled
- **Search**: Enabled
- **Clear**: Individual and all options available

### Visual Indicators
- Selected users appear as blue badges
- Each badge shows user name
- Individual remove buttons on each badge
- Clear all button available

### Responsive Behavior
- Dropdown adapts to container width
- Badges wrap to multiple lines if needed
- Maintains usability on mobile devices

## Testing

### Test Script
Run the test script to verify functionality:
```bash
node test-multi-user-filter.js
```

### Test Coverage
1. **Single User Filter**: Verify single user selection works
2. **Multiple User Filter**: Verify multiple user selection works
3. **Filter Accuracy**: Verify all returned logs belong to selected users
4. **Performance**: Compare filtered vs unfiltered results
5. **Edge Cases**: Test with various user combinations

## Performance Considerations

### Database Optimization
- Uses MongoDB's `$in` operator for efficient multi-user queries
- Leverages existing indexes on `userId` field
- Maintains query performance with multiple users

### Frontend Performance
- Efficient state updates with React hooks
- Debounced API calls to prevent excessive requests
- Optimized re-rendering with proper dependency arrays

## Security

### Permission Checks
- Only users with `view` permission can access multi-user filtering
- Admin users have full access regardless of permissions
- User data is properly sanitized and validated

### Data Protection
- User IDs are validated before database queries
- SQL injection protection through MongoDB's query builder
- Input sanitization for all filter parameters

## Migration Notes

### Backward Compatibility
- Existing single user filters continue to work
- No database migrations required
- API remains backward compatible

### User Experience
- Existing users will see the new multi-select interface
- No training required for basic usage
- Enhanced functionality without breaking changes

## Future Enhancements

### Potential Improvements
1. **User Groups**: Filter by predefined user groups
2. **Role-Based Filtering**: Filter by user roles
3. **Department Filtering**: Filter by organizational units
4. **Advanced Search**: Text-based user search in dropdown
5. **Saved Filters**: Save frequently used user combinations

### Performance Optimizations
1. **Virtual Scrolling**: For large user lists
2. **Caching**: Cache user options for faster loading
3. **Lazy Loading**: Load users on demand
4. **Debouncing**: Optimize search input performance

## Troubleshooting

### Common Issues

1. **No Users Available**
   - Check user permissions
   - Verify user data exists
   - Check API endpoint accessibility

2. **Filter Not Working**
   - Verify user IDs are valid
   - Check network connectivity
   - Review browser console for errors

3. **Performance Issues**
   - Limit number of selected users
   - Use appropriate time ranges
   - Check database indexes

### Debug Information
- Enable debug logging in backend
- Check browser network tab
- Review server logs for query details 