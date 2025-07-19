const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Notification = require('../models/Notification');
const UserNotification = require('../models/UserNotification');
const User = require('../models/User');
// const validation = require('../middleware/validation');

// Simple inline validation for notifications
const validateNotification = (req, res, next) => {
    const errors = [];
    const { title, message, type, category, priority, channels, targetUsers } = req.body;

    // Required fields
    if (!title || title.trim().length === 0) {
        errors.push('Title is required');
    } else if (title.length > 200) {
        errors.push('Title must be no more than 200 characters');
    }

    if (!message || message.trim().length === 0) {
        errors.push('Message is required');
    } else if (message.length > 1000) {
        errors.push('Message must be no more than 1000 characters');
    }

    // Type validation
    const validTypes = ['info', 'success', 'warning', 'error', 'security', 'system', 'user', 'email', 'sms'];
    if (type && !validTypes.includes(type)) {
        errors.push(`Type must be one of: ${validTypes.join(', ')}`);
    }

    // Category validation
    const validCategories = ['security', 'system', 'user', 'email', 'sms', 'audit', 'login', 'password', 'profile', 'admin', 'general'];
    if (category && !validCategories.includes(category)) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Priority validation
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
        errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Channels validation
    const validChannels = ['in_app', 'email', 'sms', 'push'];
    if (channels && Array.isArray(channels)) {
        channels.forEach(channel => {
            if (!validChannels.includes(channel)) {
                errors.push(`Channel must be one of: ${validChannels.join(', ')}`);
            }
        });
    }

    // Target users validation (if provided)
    if (targetUsers && Array.isArray(targetUsers)) {
        targetUsers.forEach(userId => {
            if (typeof userId !== 'string' || userId.trim().length === 0) {
                errors.push('Invalid target user ID');
            }
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Notification validation failed',
            errors: errors
        });
    }

    next();
};

// Get all notifications (admin only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type, category, priority } = req.query;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;

        const notifications = await Notification.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(filter);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// Get notification by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email')
            .populate('targetUsers', 'firstName lastName email');

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error fetching notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification'
        });
    }
});

// Create new notification
router.post('/', authenticateToken, validateNotification, async (req, res) => {
    try {
        const notificationData = {
            ...req.body,
            createdBy: req.user.id
        };

        const notification = await Notification.create(notificationData);

        // If notification is active and has target users, create user notifications
        if (notification.status === 'active' && notification.targetUsers.length > 0) {
            const userNotifications = notification.targetUsers.map(userId => ({
                user: userId,
                notification: notification._id
            }));

            await UserNotification.insertMany(userNotifications);
        }

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
});

// Update notification
router.put('/:id', authenticateToken, validateNotification, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Only allow updates if notification hasn't been sent
        if (notification.status === 'sent') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update sent notification'
            });
        }

        const updatedNotification = await Notification.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('createdBy', 'firstName lastName email');

        res.json({
            success: true,
            data: updatedNotification
        });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification'
        });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Delete associated user notifications
        await UserNotification.deleteMany({ notification: req.params.id });

        // Delete the notification
        await Notification.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
});

// Get user's notifications
router.get('/user/me', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const skip = (page - 1) * limit;

        let filter = { user: req.user.id, isArchived: false };
        
        if (unreadOnly === 'true') {
            filter['deliveryStatus.inApp.read'] = false;
            filter.isDismissed = false;
        }

        const userNotifications = await UserNotification.find(filter)
            .populate({
                path: 'notification',
                populate: {
                    path: 'createdBy',
                    select: 'firstName lastName email'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await UserNotification.countDocuments(filter);

        // Get unread count
        const unreadCount = await UserNotification.countDocuments({
            user: req.user.id,
            'deliveryStatus.inApp.read': false,
            isDismissed: false,
            isArchived: false
        });

        res.json({
            success: true,
            data: {
                notifications: userNotifications,
                unreadCount,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user notifications'
        });
    }
});

// Mark notification as read
router.patch('/user/me/:id/read', authenticateToken, async (req, res) => {
    try {
        const userNotification = await UserNotification.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!userNotification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await userNotification.markAsRead();

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
});

// Mark all notifications as read
router.patch('/user/me/read-all', authenticateToken, async (req, res) => {
    try {
        await UserNotification.markAllAsRead(req.user.id);

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
});

// Dismiss notification
router.patch('/user/me/:id/dismiss', authenticateToken, async (req, res) => {
    try {
        const userNotification = await UserNotification.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!userNotification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await userNotification.dismiss();

        res.json({
            success: true,
            message: 'Notification dismissed'
        });
    } catch (error) {
        console.error('Error dismissing notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to dismiss notification'
        });
    }
});

// Archive notification
router.patch('/user/me/:id/archive', authenticateToken, async (req, res) => {
    try {
        const userNotification = await UserNotification.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!userNotification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await userNotification.archive();

        res.json({
            success: true,
            message: 'Notification archived'
        });
    } catch (error) {
        console.error('Error archiving notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to archive notification'
        });
    }
});

// Get notification statistics (admin only)
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        const stats = await Notification.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
                    active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                    scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
                    draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } }
                }
            }
        ]);

        const typeStats = await Notification.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const categoryStats = await Notification.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || {
                    total: 0,
                    sent: 0,
                    active: 0,
                    scheduled: 0,
                    draft: 0
                },
                byType: typeStats,
                byCategory: categoryStats
            }
        });
    } catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification statistics'
        });
    }
});

// Send notification immediately (admin only)
router.post('/:id/send', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.status === 'sent') {
            return res.status(400).json({
                success: false,
                message: 'Notification already sent'
            });
        }

        // Update notification status
        notification.status = 'sent';
        notification.sentAt = new Date();
        await notification.save();

        // Create user notifications for target users
        if (notification.targetUsers.length > 0) {
            const userNotifications = notification.targetUsers.map(userId => ({
                user: userId,
                notification: notification._id,
                'deliveryStatus.inApp.delivered': true,
                'deliveryStatus.inApp.deliveredAt': new Date()
            }));

            await UserNotification.insertMany(userNotifications, { ordered: false });
        }

        res.json({
            success: true,
            message: 'Notification sent successfully'
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification'
        });
    }
});

module.exports = router; 