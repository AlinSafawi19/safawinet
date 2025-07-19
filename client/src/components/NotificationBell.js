import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiCheck, FiArchive } from 'react-icons/fi';
import notificationService from '../services/notificationService';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';
import '../styles/NotificationBell.css';

const NotificationBell = ({ isMobile = false }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const dropdownRef = useRef(null);

    // Load notifications on mount
    useEffect(() => {
        loadNotifications();
        loadUnreadCount();
    }, []);

    // Setup real-time notifications
    useEffect(() => {
        const unsubscribe = notificationService.subscribeToNotifications((data) => {
            if (data.type === 'new') {
                // Add new notification to the list
                setNotifications(prev => [data.notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            } else if (data.type === 'update') {
                // Update existing notification
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === data.notification.id ? data.notification : notif
                    )
                );
            }
        });

        return unsubscribe;
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadNotifications = async (pageNum = 1) => {
        try {
            setIsLoading(true);
            const response = await notificationService.getUserNotifications(pageNum, 10);

            if (pageNum === 1) {
                setNotifications(response.data.notifications);
            } else {
                setNotifications(prev => [...prev, ...response.data.notifications]);
            }

            setHasMore(response.data.pagination.page < response.data.pagination.pages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error loading notifications:', error);
            showErrorToast('Error', 'Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId
                        ? { ...notif, isRead: true }
                        : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            showSuccessToast('Success', 'Notification marked as read');
        } catch (error) {
            console.error('Error marking notification as read:', error);
            showErrorToast('Error', 'Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );
            setUnreadCount(0);
            showSuccessToast('Success', 'All notifications marked as read');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            showErrorToast('Error', 'Failed to mark all notifications as read');
        }
    };

    const handleDismiss = async (notificationId) => {
        try {
            await notificationService.dismissNotification(notificationId);
            setNotifications(prev =>
                prev.filter(notif => notif.id !== notificationId)
            );
            if (!notifications.find(n => n.id === notificationId)?.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            showSuccessToast('Success', 'Notification dismissed');
        } catch (error) {
            console.error('Error dismissing notification:', error);
            showErrorToast('Error', 'Failed to dismiss notification');
        }
    };

    const handleArchive = async (notificationId) => {
        try {
            await notificationService.archiveNotification(notificationId);
            setNotifications(prev =>
                prev.filter(notif => notif.id !== notificationId)
            );
            if (!notifications.find(n => n.id === notificationId)?.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            showSuccessToast('Success', 'Notification archived');
        } catch (error) {
            console.error('Error archiving notification:', error);
            showErrorToast('Error', 'Failed to archive notification');
        }
    };

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            loadNotifications(page + 1);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getNotificationIcon = (type) => {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            security: '🔒',
            system: '⚙️',
            user: '👤',
            email: '📧',
            sms: '💬'
        };
        return icons[type] || '🔔';
    };

    const getNotificationColor = (type) => {
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
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className={isMobile ? "mobile-action-btn" : "header-tab"}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <div className={isMobile ? "mobile-action-icon" : "header-tab-icon"}>
                    <FiBell />
                    {unreadCount > 0 && (
                        <span className={isMobile ? "mobile-badge" : "header-tab-badge"}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
                {!isMobile && <span>Notifications</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3 className="notification-title">Notifications</h3>
                        <div className="notification-actions">
                            {unreadCount > 0 && (
                                <button
                                    className="notification-action-btn"
                                    onClick={handleMarkAllAsRead}
                                    title="Mark all as read"
                                >
                                    <FiCheck />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                <FiBell className="notification-empty-icon" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    style={{
                                        borderLeftColor: getNotificationColor(notification.type)
                                    }}
                                >
                                    <div className="notification-content">
                                        <div className="notification-icon">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="notification-details">
                                            <h4 className="notification-item-title">
                                                {notification.title}
                                            </h4>
                                            <p className="notification-message">
                                                {notification.message}
                                            </p>
                                            <div className="notification-meta">
                                                <span className="notification-time">
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                                {notification.priority === 'high' && (
                                                    <span className="notification-priority high">
                                                        High Priority
                                                    </span>
                                                )}
                                                {notification.priority === 'urgent' && (
                                                    <span className="notification-priority urgent">
                                                        Urgent
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="notification-actions">
                                        {!notification.isRead && (
                                            <button
                                                className="notification-action-btn"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                title="Mark as read"
                                            >
                                                <FiCheck />
                                            </button>
                                        )}
                                        <button
                                            className="notification-action-btn"
                                            onClick={() => handleDismiss(notification.id)}
                                            title="Dismiss"
                                        >
                                            <FiX />
                                        </button>
                                        <button
                                            className="notification-action-btn"
                                            onClick={() => handleArchive(notification.id)}
                                            title="Archive"
                                        >
                                            <FiArchive />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {hasMore && (
                        <div className="notification-load-more">
                            <button
                                className="load-more-btn"
                                onClick={handleLoadMore}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell; 