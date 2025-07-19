import axios from 'axios';
import authService from './authService';
import config from '../config/config';

class NotificationService {
    constructor() {
        this.api = axios.create({
            baseURL: '/api/notifications',
            withCredentials: true,
            timeout: 10000
        });

        // Add auth token to requests
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle auth errors
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    authService.logout();
                }
                return Promise.reject(error);
            }
        );
    }

    // Get user's notifications
    async getUserNotifications(page = 1, limit = 20, unreadOnly = false) {
        try {
            const response = await this.api.get('/user/me', {
                params: { page, limit, unreadOnly }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user notifications:', error);
            throw error;
        }
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const response = await this.api.patch(`/user/me/${notificationId}/read`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read
    async markAllAsRead() {
        try {
            const response = await this.api.patch('/user/me/read-all');
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    // Dismiss notification
    async dismissNotification(notificationId) {
        try {
            const response = await this.api.patch(`/user/me/${notificationId}/dismiss`);
            return response.data;
        } catch (error) {
            console.error('Error dismissing notification:', error);
            throw error;
        }
    }

    // Archive notification
    async archiveNotification(notificationId) {
        try {
            const response = await this.api.patch(`/user/me/${notificationId}/archive`);
            return response.data;
        } catch (error) {
            console.error('Error archiving notification:', error);
            throw error;
        }
    }

    // Admin: Get all notifications
    async getAllNotifications(page = 1, limit = 20, filters = {}) {
        try {
            const response = await this.api.get('/', {
                params: { page, limit, ...filters }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching all notifications:', error);
            throw error;
        }
    }

    // Admin: Get notification by ID
    async getNotificationById(notificationId) {
        try {
            const response = await this.api.get(`/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching notification:', error);
            throw error;
        }
    }

    // Admin: Create notification
    async createNotification(notificationData) {
        try {
            const response = await this.api.post('/', notificationData);
            return response.data;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Admin: Update notification
    async updateNotification(notificationId, notificationData) {
        try {
            const response = await this.api.put(`/${notificationId}`, notificationData);
            return response.data;
        } catch (error) {
            console.error('Error updating notification:', error);
            throw error;
        }
    }

    // Admin: Delete notification
    async deleteNotification(notificationId) {
        try {
            const response = await this.api.delete(`/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    // Admin: Send notification immediately
    async sendNotification(notificationId) {
        try {
            const response = await this.api.post(`/${notificationId}/send`);
            return response.data;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }

    // Admin: Get notification statistics
    async getNotificationStats() {
        try {
            const response = await this.api.get('/stats/overview');
            return response.data;
        } catch (error) {
            console.error('Error fetching notification stats:', error);
            throw error;
        }
    }

    // Create system notification helper
    async createSystemNotification(title, message, options = {}) {
        const notificationData = {
            title,
            message,
            type: 'system',
            category: 'system',
            priority: options.priority || 'normal',
            channels: options.channels || ['in_app'],
            isGlobal: options.isGlobal || true,
            targetUsers: options.targetUsers || [],
            targetRoles: options.targetRoles || [],
            actionUrl: options.actionUrl,
            actionText: options.actionText,
            icon: options.icon || 'info',
            color: options.color || '#3b82f6',
            scheduledFor: options.scheduledFor,
            expiresAt: options.expiresAt,
            status: options.status || 'active'
        };

        return this.createNotification(notificationData);
    }

    // Create security notification helper
    async createSecurityNotification(title, message, options = {}) {
        const notificationData = {
            title,
            message,
            type: 'security',
            category: 'security',
            priority: options.priority || 'high',
            channels: options.channels || ['in_app', 'email'],
            isGlobal: options.isGlobal || false,
            targetUsers: options.targetUsers || [],
            targetRoles: options.targetRoles || [],
            actionUrl: options.actionUrl,
            actionText: options.actionText,
            icon: options.icon || 'shield',
            color: options.color || '#ef4444',
            scheduledFor: options.scheduledFor,
            expiresAt: options.expiresAt,
            status: options.status || 'active'
        };

        return this.createNotification(notificationData);
    }

    // Create user notification helper
    async createUserNotification(title, message, userIds, options = {}) {
        const notificationData = {
            title,
            message,
            type: options.type || 'info',
            category: options.category || 'user',
            priority: options.priority || 'normal',
            channels: options.channels || ['in_app'],
            isGlobal: false,
            targetUsers: userIds,
            targetRoles: options.targetRoles || [],
            actionUrl: options.actionUrl,
            actionText: options.actionText,
            icon: options.icon || 'user',
            color: options.color || '#3b82f6',
            scheduledFor: options.scheduledFor,
            expiresAt: options.expiresAt,
            status: options.status || 'active'
        };

        return this.createNotification(notificationData);
    }

    // Get unread count
    async getUnreadCount() {
        try {
            const response = await this.getUserNotifications(1, 1, true);
            return response.data.unreadCount || 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    }

    // Real-time notification handling
    setupRealtimeNotifications(socket) {
        if (!socket) return;

        socket.on('notification', (data) => {
            // Handle real-time notification
            this.handleRealtimeNotification(data);
        });

        socket.on('notification-update', (data) => {
            // Handle notification updates
            this.handleNotificationUpdate(data);
        });
    }

    // Handle real-time notification
    handleRealtimeNotification(data) {
        // Emit custom event for components to listen to
        const event = new CustomEvent('notification-received', {
            detail: data
        });
        window.dispatchEvent(event);
    }

    // Handle notification update
    handleNotificationUpdate(data) {
        // Emit custom event for components to listen to
        const event = new CustomEvent('notification-updated', {
            detail: data
        });
        window.dispatchEvent(event);
    }

    // Subscribe to notification events
    subscribeToNotifications(callback) {
        const handleNotification = (event) => {
            callback(event.detail);
        };

        window.addEventListener('notification-received', handleNotification);
        window.addEventListener('notification-updated', handleNotification);

        // Return unsubscribe function
        return () => {
            window.removeEventListener('notification-received', handleNotification);
            window.removeEventListener('notification-updated', handleNotification);
        };
    }

    // Format notification for display
    formatNotification(notification) {
        return {
            id: notification.id,
            title: notification.notification?.title || notification.title,
            message: notification.notification?.message || notification.message,
            type: notification.notification?.type || notification.type,
            category: notification.notification?.category || notification.category,
            priority: notification.notification?.priority || notification.priority,
            icon: notification.notification?.icon || notification.icon,
            color: notification.notification?.color || notification.color,
            actionUrl: notification.notification?.actionUrl || notification.actionUrl,
            actionText: notification.notification?.actionText || notification.actionText,
            isRead: notification.deliveryStatus?.inApp?.read || false,
            isDelivered: notification.deliveryStatus?.inApp?.delivered || false,
            isDismissed: notification.isDismissed || false,
            isArchived: notification.isArchived || false,
            createdAt: notification.createdAt,
            readAt: notification.deliveryStatus?.inApp?.readAt,
            deliveredAt: notification.deliveryStatus?.inApp?.deliveredAt,
            dismissedAt: notification.dismissedAt,
            archivedAt: notification.archivedAt,
            createdBy: notification.notification?.createdBy || notification.createdBy
        };
    }

    // Get notification type icon
    getNotificationIcon(type) {
        const icons = {
            info: 'info',
            success: 'check-circle',
            warning: 'alert-triangle',
            error: 'x-circle',
            security: 'shield',
            system: 'settings',
            user: 'user',
            email: 'mail',
            sms: 'message-circle'
        };
        return icons[type] || 'bell';
    }

    // Get notification type color
    getNotificationColor(type) {
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            security: '#dc2626',
            system: '#6b7280',
            user: '#8b5cf6',
            email: '#06b6d4',
            sms: '#84cc16'
        };
        return colors[type] || '#3b82f6';
    }
}

export default new NotificationService(); 