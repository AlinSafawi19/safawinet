# 100 Role Templates Seed File

This seed file creates 100 different role templates with various permission combinations for testing and demonstration purposes.

## Overview

The seed file generates role templates with:
- **100 unique role templates** with different names and descriptions
- **Varied permission combinations** from admin to limited access
- **Different icons and colors** for visual variety
- **Realistic role names** based on common organizational structures

## Role Categories

### Admin Roles
- Super Admin
- System Administrator  
- IT Administrator

### Management Roles
- Operations Manager
- Department Manager
- Team Lead
- Project Manager

### HR Roles
- HR Manager
- HR Specialist
- Recruiter

### Security Roles
- Security Manager
- Security Analyst
- Compliance Officer

### Viewer Roles
- Auditor
- Analyst
- Viewer
- Observer

### Limited Roles
- Guest
- Trainee
- Intern

### Generated Combinations
The seed file also generates many combinations like:
- IT Manager, Finance Lead, Marketing Specialist
- Security Coordinator, Compliance Analyst, Quality Manager
- Operations Director, Strategy Consultant, Development Engineer
- And many more department + function + role type combinations

## Permission Levels

### Admin Level
- Full access to all users and audit logs
- Can view, add, edit, delete, and export

### Manager Level
- Can view, add, and edit users
- Can view and export audit logs

### Specialist Level
- Can view and edit users
- Can view audit logs

### Viewer Level
- Can view users and audit logs
- Read-only access

### Limited Level
- Can only view own user data
- Limited audit log access

## Usage

### Run the Seed File

```bash
# Navigate to the server directory
cd server

# Run the seed file
node seed-100-role-templates.js
```

### Expected Output

```
🚀 Starting 100 Role Templates Seeding...
🌱 Starting 100 role template seeding...
📦 Connected to MongoDB
✅ Admin user found
🗑️  Clearing existing role templates...
✅ Cleared all existing role templates
🚀 Generating 100 role templates...
📝 Creating role templates...
✅ Created 10 templates...
✅ Created 20 templates...
...
✅ Created 100 templates...
✅ Role template seeding completed successfully!
📊 Created 100 role templates
```

### Login Credentials

After seeding, you can log in with:
- **Username:** alin
- **Password:** alin123M@

## File Structure

```
server/
├── seed/
│   └── seedRoleTemplates100.js    # Main seed file with 100 templates
├── seed-100-role-templates.js     # Runner script
└── SEED_100_ROLE_TEMPLATES.md    # This documentation
```

## Features

### Icon Variety
The seed file uses 100+ different Feather icons including:
- User-related: FiUser, FiUsers, FiUserPlus, FiUserCheck, etc.
- Security: FiShield, FiLock, FiKey, FiUnlock, etc.
- Business: FiBarChart, FiTrendingUp, FiActivity, etc.
- Technical: FiDatabase, FiServer, FiMonitor, etc.

### Color Variety
20 different gradient color combinations:
- Orange to Red
- Teal to Cyan
- Blue to Cyan
- Purple to Pink
- Green to Emerald
- And many more...

### Permission Variations
- Each template has carefully crafted permission combinations
- Logical permission constraints (e.g., can't export without view)
- Realistic role-based access patterns

## Customization

You can modify the seed file to:
- Add more role types in the `roleTypes` array
- Add more departments in the `departments` array
- Add more functions in the `functions` array
- Modify permission combinations in `permissionSets`
- Add more icons or colors

## Notes

- The seed file will clear existing role templates before creating new ones
- It creates an admin user if one doesn't exist
- All templates are set as active and non-default (except the base permission sets)
- Usage counts start at 0 for all templates
- Templates are created with timestamps and linked to the admin user 