# Users Pagination and Permission-Based Filtering Implementation

## Overview

This implementation adds server-side pagination and permission-based filtering to the users management system. Users with different permission levels can access different sets of user data based on their roles.

## Permission Levels

### 1. `view` Permission
- **Access**: Can view all users in the system
- **Use Case**: Administrators, managers, supervisors
- **Backend Logic**: No user filtering applied, returns all users

### 2. `view_own` Permission  
- **Access**: Can only view users they created
- **Use Case**: Regular users who need to manage their own created users
- **Backend Logic**: Filters users by `createdBy = currentUser._id`

### 3. No Permissions
- **Access**: Cannot access users at all
- **Use Case**: Users with no user management permissions
- **Backend Logic**: Returns 403 Forbidden error

## Backend Implementation

### Updated Routes (`server/routes/users.js`)

#### Main Users Endpoint
```javascript
// Get users with server-side pagination and permission-based filtering
router.get('/', authenticateToken, async (req, res) => {
    // Check user permissions
    const hasViewPermission = req.user.hasPermission('users', 'view');
    const hasViewOwnPermission = req.user.hasPermission('users', 'view_own');

    // Build query based on permissions
    let query = {};
    if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
        query.createdBy = req.user._id;
    }

    // Add search, filtering, and pagination
    // Return paginated results with metadata
});
```

#### Filter Options Endpoint
```javascript
// Get users for filter dropdown (admin and view permission only)
router.get('/filter-options', authenticateToken, async (req, res) => {
    // Only allow access if user has view permission or is admin
    // Return user options, roles, and statuses for filters
});
```

#### Single User Endpoint
```javascript
// Get single user by ID with permission checking
router.get('/:id', authenticateToken, async (req, res) => {
    // Check if user has view_own permission but not view permission
    // Verify they created the user they're trying to view
});
```

### Query Parameters Supported

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25)
- `search` - Search across username, email, firstName, lastName, phone
- `role` - Filter by user role
- `isActive` - Filter by active status
- `sortBy` - Sort field (firstName, username, email, createdAt)
- `sortOrder` - Sort direction (asc, desc)

### Response Format

```javascript
{
  success: true,
  data: {
    users: [...], // Array of user objects
    pagination: {
      page: 1,
      limit: 25,
      total: 100,
      totalPages: 4,
      hasNextPage: true,
      hasPrevPage: false
    },
    filters: {
      search: '',
      role: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  }
}
```

## Frontend Implementation

### User Service (`client/src/services/userService.js`)

The service handles all user-related API calls with proper error handling and permission checking:

```javascript
class UserService {
    // Get users with pagination and filtering
    async getUsers(params = {}) {
        // Build query parameters
        // Handle permission errors
        // Return formatted response
    }

    // Get filter options
    async getFilterOptions() {
        // Fetch available roles, statuses, users for filters
    }

    // Permission checking methods
    hasViewPermission() { return authService.hasPermission('users', 'view'); }
    hasViewOwnPermission() { return authService.hasPermission('users', 'view_own'); }
    hasCreatePermission() { return authService.hasPermission('users', 'add'); }
    hasEditPermission() { return authService.hasPermission('users', 'edit'); }
    hasDeletePermission() { return authService.hasPermission('users', 'delete'); }
}
```

### Users Component (`client/src/pages/Users.js`)

The component implements:

1. **Permission-based Access Control**
   - Checks user permissions on component load
   - Shows appropriate access denied message
   - Displays permission notice for view_own users

2. **Server-side Pagination**
   - Handles page navigation
   - Shows pagination info (page X of Y, total users)
   - Disables navigation buttons when appropriate

3. **Advanced Filtering**
   - Search across multiple user fields
   - Role-based filtering
   - Status-based filtering
   - Sortable columns

4. **Responsive Design**
   - Mobile-friendly table layout
   - Collapsible filters on smaller screens
   - Touch-friendly action buttons

5. **Loading and Error States**
   - Loading spinner during data fetch
   - Error messages with retry functionality
   - Empty state when no users found

### Key Features

#### Search and Filtering
```javascript
const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: ''
});

const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc'
});
```

#### Pagination State
```javascript
const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
});
```

#### Permission Checking
```javascript
const canViewUsers = hasPermission('users', 'view');
const canViewOwnUsers = hasPermission('users', 'view_own');
const canCreateUsers = hasPermission('users', 'add');
const canEditUsers = hasPermission('users', 'edit');
const canDeleteUsers = hasPermission('users', 'delete');
```

## CSS Styling

### New CSS Classes Added

- `.users-page` - Main container styling
- `.filters-section` - Filter controls container
- `.search-box` - Search input with icon
- `.filter-controls` - Filter dropdowns and buttons
- `.users-table` - Responsive table styling
- `.user-info` - User avatar and details layout
- `.action-buttons` - View/Edit/Delete action buttons
- `.pagination` - Pagination controls
- `.loading-state`, `.error-state`, `.empty-state` - State indicators

### Responsive Design

- **Desktop**: Full table with all columns visible
- **Tablet**: Condensed table with essential columns
- **Mobile**: Stacked layout with user cards instead of table

## Security Considerations

1. **Server-side Validation**: All permission checks performed on backend
2. **No Client-side Bypass**: Frontend permission checks are for UX only
3. **Proper Error Handling**: 403 errors returned for unauthorized access
4. **Audit Trail**: All access attempts logged for security monitoring
5. **Input Sanitization**: All search and filter inputs properly sanitized

## Testing

Use the test script `test-users-pagination.js` to verify the implementation:

```bash
node test-users-pagination.js
```

This script tests:
- Admin user access (full permissions)
- Manager user access (view/add/edit permissions)
- Viewer user access (view_own permissions)
- Pagination functionality
- Filtering and sorting
- Error handling

## Usage Examples

### Setting Permissions via Role Templates

```javascript
// Full access role
{
  page: 'users',
  actions: ['view', 'add', 'edit', 'delete', 'export']
}

// Restricted access role  
{
  page: 'users',
  actions: ['view_own', 'add', 'edit']
}

// No access role
{
  page: 'users',
  actions: []
}
```

### API Usage

```javascript
// Get all users (admin/view permission)
const response = await userService.getUsers({
    page: 1,
    limit: 25,
    search: 'john',
    role: 'manager',
    isActive: 'true',
    sortBy: 'firstName',
    sortOrder: 'asc'
});

// Get filter options
const filterOptions = await userService.getFilterOptions();

// Check permissions
if (userService.hasViewPermission()) {
    // Can view all users
} else if (userService.hasViewOwnPermission()) {
    // Can only view own users
} else {
    // No access
}
```

## Performance Optimizations

1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Pagination**: Server-side pagination to limit data transfer
3. **Caching**: Filter options cached to reduce API calls
4. **Lazy Loading**: User avatars loaded on demand
5. **Debounced Search**: Search input debounced to reduce API calls

## Future Enhancements

1. **Export Functionality**: CSV/Excel export for user data
2. **Bulk Operations**: Select multiple users for bulk actions
3. **Advanced Filters**: Date range, last login, etc.
4. **Real-time Updates**: WebSocket integration for live updates
5. **User Activity**: Track user viewing patterns and preferences 