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

        // Create new user
        const newUser = new User({
            username,
            email: email.toLowerCase(),
            phone,
            password,
            firstName,
            lastName,
            isAdmin,
            permissions,
            createdBy: req.user._id
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
            permissions
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
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                username: username || user.username,
                email: email ? email.toLowerCase() : user.email,
                phone: phone || user.phone,
                firstName: firstName || user.firstName,
                lastName: lastName || user.lastName,
                isAdmin: isAdmin !== undefined ? isAdmin : user.isAdmin,
                isActive: isActive !== undefined ? isActive : user.isActive,
                permissions: permissions || user.permissions
            },
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
        'dashboard', 'users', 'reports', 'settings',
        'analytics', 'inventory', 'sales', 'customers'
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

module.exports = router; 