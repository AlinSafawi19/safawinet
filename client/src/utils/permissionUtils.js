/**
 * Permission Utilities
 * 
 * This file contains the available permissions structure and utility functions
 * for managing permissions across the application.
 */

/**
 * Available permissions structure for the system
 * This defines all possible permissions that can be assigned to users
 */
export const availablePermissions = [
    {
        page: 'users',
        name: 'Users Management',
        description: 'Manage system users and their permissions',
        actions: [
            { id: 'view', name: 'View Users', description: 'View user list and details' },
            { id: 'view_own', name: 'View Own Users', description: 'View only own user details' },
            { id: 'add', name: 'Create Users', description: 'Create new user accounts' },
            { id: 'edit', name: 'Edit Users', description: 'Modify existing user accounts' },
            { id: 'delete', name: 'Delete Users', description: 'Remove user accounts' },
            { id: 'export', name: 'Export Users', description: 'Export user data to CSV/Excel' }
        ]
    },
    {
        page: 'audit-logs',
        name: 'Audit Logs',
        description: 'View and manage system audit logs',
        actions: [
            { id: 'view', name: 'View Audit Logs', description: 'View all audit logs' },
            { id: 'view_own', name: 'View Own Logs', description: 'View only own audit logs' },
            { id: 'export', name: 'Export Logs', description: 'Export audit log data to CSV/Excel' }
        ]
    }
];

/**
 * Get all available pages
 * @returns {string[]} Array of page identifiers
 */
export const getAvailablePages = () => {
    return availablePermissions.map(permission => permission.page);
};

/**
 * Get all available actions
 * @returns {string[]} Array of action identifiers
 */
export const getAvailableActions = () => {
    const actions = new Set();
    availablePermissions.forEach(permission => {
        permission.actions.forEach(action => {
            actions.add(action.id);
        });
    });
    return Array.from(actions);
};

/**
 * Get permissions for a specific page
 * @param {string} page - The page identifier
 * @returns {Object|null} Permission object for the page or null if not found
 */
export const getPermissionsForPage = (page) => {
    return availablePermissions.find(permission => permission.page === page) || null;
};

/**
 * Get actions for a specific page
 * @param {string} page - The page identifier
 * @returns {Array} Array of action objects for the page
 */
export const getActionsForPage = (page) => {
    const permission = getPermissionsForPage(page);
    return permission ? permission.actions : [];
};

/**
 * Check if a permission combination is valid
 * @param {string} page - The page identifier
 * @param {Array} actions - Array of action identifiers
 * @returns {Object} Validation result with isValid boolean and message
 */
export const validatePermissionCombination = (page, actions) => {
    const availableActions = getActionsForPage(page);
    const invalidActions = actions.filter(action => !availableActions.find(a => a.id === action));
    
    if (invalidActions.length > 0) {
        return {
            isValid: false,
            message: `Invalid actions for page ${page}: ${invalidActions.join(', ')}`
        };
    }

    // Check for mutually exclusive actions
    if (page === 'users' || page === 'audit-logs') {
        if (actions.includes('view') && actions.includes('view_own')) {
            return {
                isValid: false,
                message: `Cannot select both 'view' and 'view_own' for ${page}`
            };
        }
    }

    return { isValid: true, message: '' };
};

/**
 * Get permission display name
 * @param {string} page - The page identifier
 * @param {string} action - The action identifier
 * @returns {string} Display name for the permission
 */
export const getPermissionDisplayName = (page, action) => {
    const permission = getPermissionsForPage(page);
    if (!permission) return `${page}:${action}`;
    
    const actionObj = permission.actions.find(a => a.id === action);
    return actionObj ? actionObj.name : `${page}:${action}`;
};

/**
 * Get permission description
 * @param {string} page - The page identifier
 * @param {string} action - The action identifier
 * @returns {string} Description for the permission
 */
export const getPermissionDescription = (page, action) => {
    const permission = getPermissionsForPage(page);
    if (!permission) return '';
    
    const actionObj = permission.actions.find(a => a.id === action);
    return actionObj ? actionObj.description : '';
};

/**
 * Check if user has specific permission
 * @param {Object} user - User object with permissions
 * @param {string} page - The page identifier
 * @param {string} action - The action identifier
 * @returns {boolean} True if user has the permission
 */
export const hasPermission = (user, page, action) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    
    const userPermission = user.permissions?.find(p => p.page === page);
    return userPermission?.actions?.includes(action) || false;
};

/**
 * Get all permissions for a user
 * @param {Object} user - User object with permissions
 * @returns {Array} Array of permission objects
 */
export const getUserPermissions = (user) => {
    if (!user) return [];
    if (user.isAdmin) {
        return availablePermissions.map(permission => ({
            page: permission.page,
            actions: permission.actions.map(action => action.id)
        }));
    }
    
    return user.permissions || [];
};

/**
 * Format permissions for display
 * @param {Array} permissions - Array of permission objects
 * @returns {Array} Formatted permissions for display
 */
export const formatPermissionsForDisplay = (permissions) => {
    return permissions.map(permission => ({
        page: permission.page,
        pageName: getPermissionsForPage(permission.page)?.name || permission.page,
        actions: permission.actions.map(action => ({
            id: action,
            name: getPermissionDisplayName(permission.page, action),
            description: getPermissionDescription(permission.page, action)
        }))
    }));
};

/**
 * Get permission summary text
 * @param {Array} permissions - Array of permission objects
 * @returns {string} Summary text of permissions
 */
export const getPermissionSummary = (permissions) => {
    if (!permissions || permissions.length === 0) {
        return 'No permissions assigned';
    }

    const summaries = permissions.map(permission => {
        const pageName = getPermissionsForPage(permission.page)?.name || permission.page;
        const actionNames = permission.actions.map(action => 
            getPermissionDisplayName(permission.page, action)
        );
        return `${pageName}: ${actionNames.join(', ')}`;
    });

    return summaries.join('; ');
};

/**
 * Check if permissions are empty
 * @param {Array} permissions - Array of permission objects
 * @returns {boolean} True if permissions array is empty or has no actions
 */
export const isEmptyPermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every(permission => !permission.actions || permission.actions.length === 0);
};

/**
 * Get default permissions for a new user
 * @returns {Array} Default permissions array
 */
export const getDefaultPermissions = () => {
    return [];
};

/**
 * Merge permissions from multiple sources
 * @param {...Array} permissionArrays - Multiple permission arrays to merge
 * @returns {Array} Merged permissions array
 */
export const mergePermissions = (...permissionArrays) => {
    const merged = {};
    
    permissionArrays.forEach(permissions => {
        if (!permissions) return;
        
        permissions.forEach(permission => {
            if (!merged[permission.page]) {
                merged[permission.page] = new Set();
            }
            permission.actions.forEach(action => {
                merged[permission.page].add(action);
            });
        });
    });
    
    return Object.entries(merged).map(([page, actions]) => ({
        page,
        actions: Array.from(actions)
    }));
};

export default {
    availablePermissions,
    getAvailablePages,
    getAvailableActions,
    getPermissionsForPage,
    getActionsForPage,
    validatePermissionCombination,
    getPermissionDisplayName,
    getPermissionDescription,
    hasPermission,
    getUserPermissions,
    formatPermissionsForDisplay,
    getPermissionSummary,
    isEmptyPermissions,
    getDefaultPermissions,
    mergePermissions
}; 