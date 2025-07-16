const express = require('express');
const moment = require('moment-timezone');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requirePermission } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Get users with server-side pagination and permission-based filtering
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 25,
            search = '',
            role = '',
            isActive = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            createdAfter,
            createdBefore,
            createdBy = '',
            userTimezone = 'Asia/Beirut'
        } = req.query;

        // Check user permissions
        const hasViewPermission = req.user.hasPermission('users', 'view');
        const hasViewOwnPermission = req.user.hasPermission('users', 'view_own');

        if (!req.user.isAdmin && !hasViewPermission && !hasViewOwnPermission) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view users.'
            });
        }

        // Build query based on permissions
        let query = {};

        // Exclude the currently logged-in user from the results
        query._id = { $ne: req.user._id };

        // Handle created by filter with permission checking
        if (createdBy) {
            // Split comma-separated values
            const createdByValues = createdBy.split(',').map(val => val.trim()).filter(val => val);
            
            if (createdByValues.length === 0) {
                // No valid values, apply permission-based filtering
                if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
                    query.createdBy = req.user._id;
                }
            } else {
                // Handle multiple values
                const orConditions = [];
                const userIds = [];
                for (const value of createdByValues) {
                    if (value === 'system') {
                        orConditions.push({ createdBy: { $exists: false } });
                    } else if (value === 'me') {
                        orConditions.push({ createdBy: req.user._id });
                    } else {
                        // For specific user IDs, validate that the current user has permission
                        if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
                            if (value !== req.user._id.toString()) {
                                return res.status(403).json({
                                    success: false,
                                    message: 'Access denied. You can only filter by users you created.'
                                });
                            }
                        }
                        userIds.push(value);
                    }
                }
                if (userIds.length > 0) {
                    orConditions.push({ createdBy: { $in: userIds } });
                }
                if (orConditions.length > 0) {
                    query.$or = orConditions;
                }
            }
        } else {
            // If no createdBy filter is specified, apply permission-based filtering
            if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
                query.createdBy = req.user._id;
            }
        }

        // Add search filter
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Add role filter
        if (role) {
            query.role = role;
        }

        // Add active status filter
        if (isActive !== '') {
            query.isActive = isActive === 'true';
        }

        // Add date range filter with timezone handling
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

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query with pagination
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort(sortObject)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'username firstName lastName')
                .lean(),
            User.countDocuments(query)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(total / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                },
                filters: {
                    search,
                    role,
                    isActive,
                    sortBy,
                    sortOrder,
                    createdAfter,
                    createdBefore,
                    createdBy
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Get users for filter dropdown (admin and view permission only)
router.get('/filter-options', authenticateToken, async (req, res) => {
    try {
        const hasViewPermission = req.user.hasPermission('users', 'view');
        
        // Only allow access if user has view permission or is admin
        if (!req.user.isAdmin && !hasViewPermission) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view all users.'
            });
        }

        // Get all active users for the filter dropdown (excluding current user)
        const users = await User.find({ 
            isActive: true,
            _id: { $ne: req.user._id }
        })
            .select('_id firstName lastName username email')
            .sort({ firstName: 1, lastName: 1 })
            .lean();

        const userOptions = users.map(user => ({
            value: user._id.toString(),
            label: `${user.firstName} ${user.lastName} (${user.username})`
        }));

        res.json({
            success: true,
            data: {
                users: userOptions,
                roles: ['admin', 'manager', 'viewer', 'custom'],
                statuses: [
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' }
                ]
            }
        });
    } catch (error) {
        console.error('Get filter options error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch filter options'
        });
    }
});

// Export users to CSV
router.get('/export', authenticateToken, async (req, res) => {
    try {
        // Check user permissions
        const hasViewPermission = req.user.hasPermission('users', 'view');
        const hasViewOwnPermission = req.user.hasPermission('users', 'view_own');
        const hasExportPermission = req.user.hasPermission('users', 'export');

        if (!req.user.isAdmin && !hasViewPermission && !hasViewOwnPermission) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view users.'
            });
        }

        if (!req.user.isAdmin && !hasExportPermission) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to export users.'
            });
        }

        const {
            search = '',
            role = '',
            isActive = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            createdAfter,
            createdBefore,
            createdBy = '',
            userTimezoneParam = 'Asia/Beirut'
        } = req.query;

        // Build query based on permissions
        let query = {};

        // Exclude the currently logged-in user from the results
        query._id = { $ne: req.user._id };

        // Handle created by filter with permission checking
        if (createdBy) {
            // Split comma-separated values
            const createdByValues = createdBy.split(',').map(val => val.trim()).filter(val => val);
            
            if (createdByValues.length === 0) {
                // No valid values, apply permission-based filtering
                if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
                    query.createdBy = req.user._id;
                }
            } else {
                // Handle multiple values
                const orConditions = [];
                const userIds = [];
                for (const value of createdByValues) {
                    if (value === 'system') {
                        orConditions.push({ createdBy: { $exists: false } });
                    } else if (value === 'me') {
                        orConditions.push({ createdBy: req.user._id });
                    } else {
                        // For specific user IDs, validate that the current user has permission
                        if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
                            if (value !== req.user._id.toString()) {
                                return res.status(403).json({
                                    success: false,
                                    message: 'Access denied. You can only filter by users you created.'
                                });
                            }
                        }
                        userIds.push(value);
                    }
                }
                if (userIds.length > 0) {
                    orConditions.push({ createdBy: { $in: userIds } });
                }
                if (orConditions.length > 0) {
                    query.$or = orConditions;
                }
            }
        } else {
            // If no createdBy filter is specified, apply permission-based filtering
            if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
                query.createdBy = req.user._id;
            }
        }

        // Add search filter
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Add role filter
        if (role) {
            query.role = role;
        }

        // Add active status filter
        if (isActive !== '') {
            query.isActive = isActive === 'true';
        }

        // Add date range filter with timezone handling
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

        // Get all users matching the query (no pagination for export)
        const users = await User.find(query)
            .select('-password')
            .sort(sortObject)
            .populate('createdBy', 'username firstName lastName')
            .lean();

        // Convert to CSV format
        const csvHeaders = [
            'ID',
            'Username',
            'Email',
            'First Name',
            'Last Name',
            'Phone',
            'Role',
            'Status',
            'Created At',
            'Created By',
            'Last Login',
            'Two Factor Enabled'
        ];

        // Get user's timezone and date format preferences
        const userTimezone = req.user.userPreferences?.timezone || userTimezoneParam;
        const userDateFormat = req.user.userPreferences?.dateFormat || 'MMM dd, yyyy h:mm a';

        const csvRows = users.map(user => [
            user._id,
            user.username || '',
            user.email || '',
            user.firstName || '',
            user.lastName || '',
            user.phone || '',
            user.role || '',
            user.isActive ? 'Active' : 'Inactive',
            user.createdAt ? moment(user.createdAt).tz(userTimezone).format(userDateFormat) : '',
            user.createdBy ? `${user.createdBy.firstName} ${user.createdBy.lastName}` : 'System',
            user.lastLogin ? moment(user.lastLogin).tz(userTimezone).format(userDateFormat) : '',
            user.twoFactorEnabled ? 'Yes' : 'No'
        ]);

        // Combine headers and rows
        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`);
        
        res.send(csvContent);

    } catch (error) {
        console.error('Export users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export users'
        });
    }
});

// Get single user by ID with permission checking
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        // Check user permissions
        const hasViewPermission = req.user.hasPermission('users', 'view');
        const hasViewOwnPermission = req.user.hasPermission('users', 'view_own');

        if (!req.user.isAdmin && !hasViewPermission && !hasViewOwnPermission) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view users.'
            });
        }

        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If user has view_own permission but not view permission, check if they created this user
        if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
            if (user.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view users you created.'
                });
            }
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
});

// Create new user (admin only)
router.post('/', authenticateToken, requirePermission('users', 'add'), async (req, res) => {
    try {
        const {
            username,
            email,
            phone,
            password,
            firstName,
            lastName,
            isAdmin = false,
            permissions = []
        } = req.body;

        // Validate required fields
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, password, first name, and last name are required'
            });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Check if phone already exists (if provided)
        if (phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already exists'
                });
            }
        }

        // Create new user with default preferences
        const newUser = new User({
            username,
            email: email.toLowerCase(),
            phone,
            password,
            firstName,
            lastName,
            isAdmin,
            permissions,
            createdBy: req.user._id,
            userPreferences: {
                timezone: 'Asia/Beirut',
                language: 'english',
                theme: 'light',
                dateFormat: 'MMM dd, yyyy h:mm a',
                autoLogoutTime: 30
            }
        });

        await newUser.save();

        // Send welcome email
        try {
            const emailResult = await emailService.sendWelcomeEmail(newUser);
            if (emailResult.success) {
                newUser.welcomeEmailSent = true;
                await newUser.save();
                console.log('✅ Welcome email sent successfully to:', newUser.email);
            } else {
                console.error('❌ Welcome email failed:', emailResult.error);
                // Don't set welcomeEmailSent to true if email failed
            }
        } catch (emailError) {
            console.error('❌ Welcome email error:', emailError);
            // Don't fail the user creation if email fails, and don't set welcomeEmailSent to true
        }

        // Return user without password
        const userResponse = newUser.toJSON();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
});

// Update user
router.put('/:id', authenticateToken, requirePermission('users', 'edit'), async (req, res) => {
    try {
        const {
            username,
            email,
            phone,
            firstName,
            lastName,
            isAdmin,
            isActive,
            permissions,
            userPreferences
        } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if username is being changed and if it's already taken
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
        }

        // Check if email is being changed and if it's already taken
        if (email && email.toLowerCase() !== user.email) {
            const existingEmail = await User.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Check if phone is being changed and if it's already taken
        if (phone && phone !== user.phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already exists'
                });
            }
        }

        // Update user
        const updateData = {
            username: username || user.username,
            email: email ? email.toLowerCase() : user.email,
            phone: phone || user.phone,
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            isAdmin: isAdmin !== undefined ? isAdmin : user.isAdmin,
            isActive: isActive !== undefined ? isActive : user.isActive,
            permissions: permissions || user.permissions
        };

        // Handle user preferences update
        if (userPreferences) {
            if (userPreferences.timezone !== undefined) {
                updateData['userPreferences.timezone'] = userPreferences.timezone;
            }
            if (userPreferences.language !== undefined) {
                updateData['userPreferences.language'] = userPreferences.language;
            }
            if (userPreferences.theme !== undefined) {
                if (!['light', 'dark'].includes(userPreferences.theme)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Theme must be either "light" or "dark"'
                    });
                }
                updateData['userPreferences.theme'] = userPreferences.theme;
            }
            if (userPreferences.dateFormat !== undefined) {
                updateData['userPreferences.dateFormat'] = userPreferences.dateFormat;
            }
            if (userPreferences.autoLogoutTime !== undefined) {
                if (userPreferences.autoLogoutTime < 5 || userPreferences.autoLogoutTime > 480) {
                    return res.status(400).json({
                        success: false,
                        message: 'Auto logout time must be between 5 and 480 minutes'
                    });
                }
                updateData['userPreferences.autoLogoutTime'] = userPreferences.autoLogoutTime;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
});

// Bulk delete users
router.delete('/bulk', authenticateToken, requirePermission('users', 'delete'), async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required and must not be empty'
            });
        }

        // Validate that all IDs are valid ObjectIds
        const validIds = userIds.filter(id => {
            try {
                return require('mongoose').Types.ObjectId.isValid(id);
            } catch (error) {
                return false;
            }
        });

        if (validIds.length !== userIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more user IDs are invalid'
            });
        }

        // Get all users to be deleted
        const usersToDelete = await User.find({ _id: { $in: validIds } });

        if (usersToDelete.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid users found to delete'
            });
        }

        // Check permissions and validation rules
        const hasViewOwnPermission = req.user.hasPermission('users', 'view_own');
        const hasViewPermission = req.user.hasPermission('users', 'view');
        
        const errors = [];
        const usersToDeleteIds = [];

        for (const user of usersToDelete) {
            // Prevent deleting the admin user
            if (user.isAdmin && user.username === 'admin') {
                errors.push(`Cannot delete the main admin user (${user.username})`);
                continue;
            }

            // Prevent deleting yourself
            if (user._id.toString() === req.user._id.toString()) {
                errors.push('Cannot delete your own account');
                continue;
            }

            // Check if user has view_own permission and is trying to delete a user they didn't create
            if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
                if (user.createdBy.toString() !== req.user._id.toString()) {
                    errors.push(`Access denied. You can only delete users you created (${user.username})`);
                    continue;
                }
            }

            usersToDeleteIds.push(user._id);
        }

        // If there are any errors, return them
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some users could not be deleted',
                errors: errors
            });
        }

        // If no users can be deleted, return error
        if (usersToDeleteIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No users can be deleted based on your permissions'
            });
        }

        // Delete the users
        const deleteResult = await User.deleteMany({ _id: { $in: usersToDeleteIds } });

        res.json({
            success: true,
            message: `${deleteResult.deletedCount} user(s) deleted successfully`,
            deletedCount: deleteResult.deletedCount
        });

    } catch (error) {
        console.error('Bulk delete users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete users'
        });
    }
});

// Delete user
router.delete('/:id', authenticateToken, requirePermission('users', 'delete'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting the admin user
        if (user.isAdmin && user.username === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the main admin user'
            });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Check if user has view_own permission and is trying to delete a user they didn't create
        const hasViewOwnPermission = req.user.hasPermission('users', 'view_own');
        const hasViewPermission = req.user.hasPermission('users', 'view');
        
        if (hasViewOwnPermission && !hasViewPermission && !req.user.isAdmin) {
            if (user.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete users you created.'
                });
            }
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

// Update user permissions
router.put('/:id/permissions', authenticateToken, requirePermission('users', 'edit'), async (req, res) => {
    try {
        const { permissions } = req.body;

        if (!permissions || !Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'Permissions array is required'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update permissions
        user.permissions = permissions;
        await user.save();

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'User permissions updated successfully',
            data: userResponse
        });

    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user permissions'
        });
    }
});

// Get available pages and actions for permissions
router.get('/permissions/available', authenticateToken, requirePermission('users', 'view'), (req, res) => {
    const availablePages = [
        'users',
        'audit-logs'
    ];

    const availableActions = ['view', 'view_own', 'add', 'edit', 'delete', 'export'];

    res.json({
        success: true,
        data: {
            pages: availablePages,
            actions: availableActions
        }
    });
});

// Update user preferences
router.put('/:id/preferences', authenticateToken, async (req, res) => {
    try {
        const { timezone, language, theme, dateFormat, autoLogoutTime } = req.body;

        // Validate theme if provided
        if (theme && !['light', 'dark'].includes(theme)) {
            return res.status(400).json({
                success: false,
                message: 'Theme must be either "light" or "dark"'
            });
        }

        // Validate autoLogoutTime if provided
        if (autoLogoutTime !== undefined) {
            if (autoLogoutTime < 5 || autoLogoutTime > 480) {
                return res.status(400).json({
                    success: false,
                    message: 'Auto logout time must be between 5 and 480 minutes'
                });
            }
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Users can only update their own preferences, or admins can update any user's preferences
        if (user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own preferences'
            });
        }

        // Update preferences (only update provided fields)
        if (timezone !== undefined) user.userPreferences.timezone = timezone;
        if (language !== undefined) user.userPreferences.language = language;
        if (theme !== undefined) user.userPreferences.theme = theme;
        if (dateFormat !== undefined) user.userPreferences.dateFormat = dateFormat;
        if (autoLogoutTime !== undefined) user.userPreferences.autoLogoutTime = autoLogoutTime;

        await user.save();

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'User preferences updated successfully',
            data: userResponse
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user preferences'
        });
    }
});

// Get user preferences
router.get('/:id/preferences', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('userPreferences');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Users can only view their own preferences, or admins can view any user's preferences
        if (user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own preferences'
            });
        }

        res.json({
            success: true,
            data: user.userPreferences
        });

    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user preferences'
        });
    }
});

module.exports = router; 
module.exports = router; 