const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requirePermission } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requirePermission('users', 'view'), async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Get single user by ID
router.get('/:id', authenticateToken, requirePermission('users', 'view'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
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
        'users'
    ];

    const availableActions = ['view', 'add', 'edit', 'delete'];

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