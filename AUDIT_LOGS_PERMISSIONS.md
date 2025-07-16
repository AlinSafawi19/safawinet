# Audit Logs Permission Implementation

## Overview

This implementation adds permission-based filtering to the audit logs feature, allowing different levels of access based on user permissions.

## Permission Levels

### 1. `view` Permission
- **Access**: Can view all audit logs from all users
- **Use Case**: Administrators, security managers, auditors
- **Backend Logic**: No user filtering applied, returns all logs

### 2. `view_own` Permission  
- **Access**: Can only view their own audit logs
- **Use Case**: Regular users who need to monitor their own activity
- **Backend Logic**: Filters logs by `userId = currentUser._id`

### 3. No Permissions
- **Access**: Cannot access audit logs at all
- **Use Case**: Users with no audit log permissions
- **Backend Logic**: Returns 403 Forbidden error

## Implementation Details

### Backend Changes (`server/routes/auth.js`)

#### New Endpoint: Get Users for Filter
```javascript
// Get users for audit logs filter (admin and view permission only)
router.get('/audit-logs/users', authenticateToken, async (req, res) => {
    try {
        const hasViewPermission = req.user.hasPermission('audit-logs', 'view');
        
        // Only allow access if user has view permission or is admin
        if (!req.user.isAdmin && !hasViewPermission) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view all users.'
            });
        }

        // Get all active users for the filter dropdown
        const users = await User.find({ isActive: true })
            .select('_id firstName lastName username email')
            .sort({ firstName: 1, lastName: 1 })
            .lean();

        const userOptions = users.map(user => ({
            value: user._id.toString(),
            label: `${user.firstName} ${user.lastName} (${user.username})`
        }));

        res.json({
            success: true,
            data: userOptions
        });
    } catch (error) {
        console.error('Error fetching users for audit logs filter:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});
```

#### Updated Audit Logs Endpoint

```javascript
// Check user permissions for audit logs
const hasViewPermission = req.user.hasPermission('audit-logs', 'view');
const hasViewOwnPermission = req.user.hasPermission('audit-logs', 'view_own');

// If user has no permissions for audit logs, deny access
if (!hasViewPermission && !hasViewOwnPermission) {
  return res.status(403).json({
    success: false,
    message: 'Access denied. You do not have permission to view audit logs.'
  });
}

// Apply permission-based filtering
let filterUserId = null;

if (req.user.isAdmin) {
  // Admin can see all logs regardless of permissions
  filterUserId = null;
} else if (hasViewPermission) {
  // User has 'view' permission - can see all logs
  filterUserId = null;
} else if (hasViewOwnPermission) {
  // User has only 'view_own' permission - can only see their own logs
  filterUserId = userId;
}
```

### Frontend Changes (`client/src/pages/AuditLogs.js`)

1. **Permission Checking**:
```javascript
const hasViewPermission = user ? authService.hasPermission('audit-logs', 'view') : false;
const hasViewOwnPermission = user ? authService.hasPermission('audit-logs', 'view_own') : false;
const hasAnyPermission = hasViewPermission || hasViewOwnPermission;
```

2. **Access Denied UI**:
```javascript
if (!hasAnyPermission) {
  return (
    <div className="audit-logs-error">
      <FiAlertTriangle />
      <h3>Access Denied</h3>
      <p>You do not have permission to view audit logs. Please contact your administrator for access.</p>
    </div>
  );
}
```

3. **Permission Notice**:
```javascript
{hasViewOwnPermission && !hasViewPermission && (
  <span className="permission-notice">
    {' '}(Viewing your own logs only)
  </span>
)}
```

4. **Error Handling**:
```javascript
if (error.response?.status === 403) {
  setError('Access denied. You do not have permission to view audit logs.');
} else {
  setError('Failed to fetch audit logs. Please try again.');
}
```

## Database Schema

The permission system uses the existing User model structure:

```javascript
permissions: [{
  page: {
    type: String,
    required: true,
    enum: ['dashboard', 'users', 'audit-logs', ...]
  },
  actions: [{
    type: String,
    enum: ['view', 'view_own', 'add', 'edit', 'delete', 'export']
  }]
}]
```

## Testing

Use the test script `test-audit-permissions.js` to verify the implementation:

```bash
node test-audit-permissions.js
```

This script tests different user types:
- Admin users (full access)
- Users with `view` permission (full access)
- Users with `view_own` permission (restricted access)
- Users with no permissions (no access)

## Security Considerations

1. **Server-side Validation**: All permission checks are performed on the server side
2. **No Client-side Bypass**: Frontend permission checks are for UX only
3. **Proper Error Handling**: 403 errors are returned for unauthorized access
4. **Audit Trail**: All access attempts are logged for security monitoring

## Usage Examples

### Setting Permissions via Role Templates

```javascript
// Full access role
{
  page: 'audit-logs',
  actions: ['view']
}

// Restricted access role  
{
  page: 'audit-logs',
  actions: ['view_own']
}

// No access role
{
  page: 'audit-logs',
  actions: []
}
```

### Checking Permissions in Code

```javascript
// Check if user can view all logs
const canViewAll = authService.hasPermission('audit-logs', 'view');

// Check if user can view own logs
const canViewOwn = authService.hasPermission('audit-logs', 'view_own');

// Get all permissions for audit logs
const permissions = authService.getPagePermissions('audit-logs');
```

## Migration Notes

- Existing admin users will continue to have full access
- Users without audit log permissions will see an access denied message
- The implementation is backward compatible with existing permission structures
- No database migrations required

## User Filter Feature

### Overview
For users with `view` permission or admin access, a user filter dropdown is available to filter audit logs by specific users.

### Backend Implementation

#### User Filter Endpoint
```javascript
// Add user filter (only for admin and view permission users)
if (req.query.userId && req.query.userId.trim() && (req.user.isAdmin || hasViewPermission)) {
    query.userId = req.query.userId.trim();
}
```

#### User Population
```javascript
// Populate user information for logs
const logsWithUsers = await Promise.all(paginationResult.logs.map(async (log) => {
    try {
        const user = await User.findById(log.userId).select('firstName lastName username email').lean();
        return {
            ...log,
            user: user ? {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                fullName: `${user.firstName} ${user.lastName}`
            } : null
        };
    } catch (error) {
        console.error('Error populating user for log:', error);
        return {
            ...log,
            user: null
        };
    }
}));
```

### Frontend Implementation

#### User Filter Dropdown
```javascript
{(hasViewPermission || authService.isAdmin()) && (
  <div className="filter-group">
    <h4>User</h4>
    <Select
      value={userOptions.find(option => option.value === filters.userId)}
      onChange={(selectedOption) => handleFilterChange('userId', selectedOption ? selectedOption.value : '')}
      options={userOptions}
      styles={customStyles}
      placeholder="Select user..."
      isClearable
      isSearchable
    />
  </div>
)}
```

#### User Column in Table
```javascript
{(hasViewPermission || authService.isAdmin()) && (
  <td className="user-cell">
    {log.user ? (
      <div className="user-info">
        <div className="user-avatar">
          <span className="user-initials">
            {log.user.firstName ? log.user.firstName.charAt(0) : 'U'}
            {log.user.lastName ? log.user.lastName.charAt(0) : ''}
          </span>
        </div>
        <div className="user-details">
          <div className="user-name">{log.user.fullName}</div>
          <div className="user-email">{log.user.username}</div>
        </div>
      </div>
    ) : (
      <span>Unknown User</span>
    )}
  </td>
)}
```

### Testing User Filter

Use the test script `test-audit-user-filter.js` to verify the user filter functionality:

```bash
node test-audit-user-filter.js
```

This script tests:
- Fetching users for the filter dropdown
- Filtering audit logs by specific users
- Permission-based access to user filter
- User column display in audit logs table 