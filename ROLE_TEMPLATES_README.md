# Role Templates System

## Overview

The Role Templates system allows administrators to create, manage, and use predefined role templates for easy user creation. This feature streamlines the user management process by providing reusable permission sets that can be applied when creating new users.

## Features

### 🎯 Core Functionality
- **Create Role Templates**: Define custom role templates with specific permissions
- **Edit Templates**: Modify existing templates (except default ones)
- **Delete Templates**: Remove unused templates (with safety checks)
- **View Template Details**: See comprehensive information about each template
- **Usage Tracking**: Monitor how many users have been created with each template
- **Search & Filter**: Find templates quickly with search and status filters

### 🔐 Permission System
- **Granular Permissions**: Define specific page and action permissions
- **Admin Roles**: Create templates with full administrative access
- **Custom Permissions**: Build templates with any combination of permissions
- **Default Templates**: Pre-configured templates that cannot be modified

### 📊 Template Management
- **Template Status**: Active/Inactive status control
- **Usage Statistics**: Track how many users were created with each template
- **Last Used Date**: Monitor template usage patterns
- **Creator Tracking**: Know who created each template

## Database Schema

### RoleTemplate Model
```javascript
{
  name: String,                    // Template name
  description: String,             // Template description
  icon: String,                   // Icon identifier
  color: String,                  // CSS color class
  isAdmin: Boolean,               // Admin role flag
  permissions: [{                 // Permission array
    page: String,                 // Page identifier
    actions: [String]             // Allowed actions
  }],
  isDefault: Boolean,             // Default template flag
  isActive: Boolean,              // Active status
  createdBy: ObjectId,            // Creator reference
  usageCount: Number,             // Usage counter
  lastUsed: Date                  // Last usage date
}
```

## API Endpoints

### GET `/api/role-templates`
Get all active role templates
- **Permissions**: `users:view`
- **Response**: Array of template objects

### GET `/api/role-templates/:id`
Get specific role template
- **Permissions**: `users:view`
- **Response**: Single template object

### POST `/api/role-templates`
Create new role template
- **Permissions**: `users:add`
- **Body**: Template data object
- **Response**: Created template object

### PUT `/api/role-templates/:id`
Update role template
- **Permissions**: `users:edit`
- **Body**: Updated template data
- **Response**: Updated template object

### DELETE `/api/role-templates/:id`
Delete role template
- **Permissions**: `users:delete`
- **Safety**: Cannot delete default templates or templates in use
- **Response**: Success message

### POST `/api/role-templates/:id/increment-usage`
Increment template usage count
- **Permissions**: `users:add`
- **Response**: Success message

### GET `/api/role-templates/permissions/available`
Get available permissions for templates
- **Permissions**: `users:view`
- **Response**: Array of permission groups

## Default Templates

The system comes with pre-configured default templates:

### 1. Administrator
- **Description**: Full access to user management
- **Icon**: FiAward
- **Color**: Purple gradient
- **Permissions**: Users (view, view_own, add, edit, delete, export), Audit Logs (view, view_own, export), Role Templates (view_own)
- **Admin Role**: Yes

### 2. Manager
- **Description**: User management and operational oversight
- **Icon**: FiBriefcase
- **Color**: Blue gradient
- **Permissions**: Users (view, view_own, add, edit, export), Audit Logs (view_own, export), Role Templates (view_own)
- **Admin Role**: No

### 3. Supervisor
- **Description**: Team oversight and user management
- **Icon**: FiUsers
- **Color**: Indigo gradient
- **Permissions**: Users (view, view_own, add, edit, export), Audit Logs (view, view_own, export), Role Templates (view_own)
- **Admin Role**: No

### 4. Viewer
- **Description**: Read-only access to user management
- **Icon**: FiEye
- **Color**: Green gradient
- **Permissions**: Users (view_own), Audit Logs (view_own), Role Templates (view_own)
- **Admin Role**: No

### 5. Support Agent
- **Description**: Customer support and user assistance
- **Icon**: FiUserCheck
- **Color**: Teal gradient
- **Permissions**: Users (view, view_own, edit, export), Audit Logs (view_own, export), Role Templates (view_own)
- **Admin Role**: No

## Available Permissions

### Pages
- `users` - User management
- `audit_logs` - Audit logs management
- `role_templates` - Role templates management

### Actions
- `view` - View all data
- `view_own` - View own data only
- `add` - Create new records
- `edit` - Modify existing records
- `delete` - Remove records
- `export` - Export data

## Frontend Integration

### Role Templates Page
- **Route**: `/users/role-templates`
- **Component**: `RoleTemplates.js`
- **Features**:
  - Template grid view
  - Search and filter functionality
  - Create/Edit/Delete modals
  - Template details view
  - Usage statistics

### Create User Integration
- **Component**: `CreateUser.js`
- **Features**:
  - Template selection from database
  - Dynamic permission loading
  - Usage tracking
  - Custom role option

## Setup Instructions

### 1. Database Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Seed the database with default templates
npm run seed-templates
```

### 2. Server Setup
```bash
# Start the server
npm run dev
```

### 3. Client Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the client
npm start
```

## Usage Examples

### Creating a Template via API
```javascript
const templateData = {
  name: 'Content Manager',
  description: 'Manage content and moderate user-generated content',
  icon: 'FiEdit',
  color: 'bg-gradient-to-r from-orange-500 to-red-500',
  isAdmin: false,
  permissions: [
    { page: 'users', actions: ['view', 'edit'] },
    { page: 'content', actions: ['view', 'add', 'edit', 'delete'] },
    { page: 'moderation', actions: ['view', 'edit'] }
  ]
};

const response = await fetch('/api/role-templates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(templateData)
});
```

### Using a Template for User Creation
```javascript
// In CreateUser component
const handleTemplateSelect = (template) => {
  setSelectedTemplate(template);
  setFormData(prev => ({
    ...prev,
    isAdmin: template.isAdmin,
    permissions: template.permissions
  }));
};

// After successful user creation
if (selectedTemplate && selectedTemplate.id !== 'custom') {
  await roleTemplateService.incrementUsage(selectedTemplate.id);
}
```

## Security Features

### Permission-Based Access
- All template operations require appropriate permissions
- Admin users have full access
- Regular users can only access templates based on their permissions

### Template Protection
- Default templates cannot be modified or deleted
- Templates in use cannot be deleted
- Usage tracking prevents accidental deletion

### Input Validation
- Template names must be unique
- Required fields validation
- Permission structure validation

## Testing

### Run API Tests
```bash
# From project root
node test-role-templates.js
```

### Manual Testing
1. Login as admin user
2. Navigate to `/users/role-templates`
3. Create a new template
4. Edit the template
5. View template details
6. Delete the template (if not in use)

## Troubleshooting

### Common Issues

1. **Templates not loading**
   - Check if the server is running
   - Verify database connection
   - Check user permissions

2. **Cannot create template**
   - Ensure user has `users:add` permission
   - Check if template name is unique
   - Verify all required fields are provided

3. **Cannot delete template**
   - Check if template is default
   - Verify template is not in use
   - Ensure user has `users:delete` permission

4. **Usage count not updating**
   - Check if template ID is correct
   - Verify API endpoint is accessible
   - Check server logs for errors

### Debug Commands
```bash
# Check database connection
npm run check-db

# View server logs
npm run dev

# Test API endpoints
node test-role-templates.js
```

## Future Enhancements

### Planned Features
- **Template Categories**: Organize templates by department/function
- **Template Versioning**: Track changes to templates over time
- **Bulk Operations**: Create/update multiple templates at once
- **Template Import/Export**: Share templates between systems
- **Advanced Analytics**: Detailed usage analytics and reporting
- **Template Approval Workflow**: Multi-step approval for template changes

### API Extensions
- **Template Categories**: `/api/role-templates/categories`
- **Template Analytics**: `/api/role-templates/:id/analytics`
- **Bulk Operations**: `/api/role-templates/bulk`
- **Template Export**: `/api/role-templates/:id/export`

## Contributing

When contributing to the Role Templates system:

1. **Follow the existing code structure**
2. **Add appropriate tests** for new features
3. **Update documentation** for API changes
4. **Maintain backward compatibility**
5. **Follow security best practices**

## License

This Role Templates system is part of the SafawiNet project and follows the same licensing terms. 