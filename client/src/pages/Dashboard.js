import React from 'react';
import authService from '../services/authService';
import { HiUser, HiCalendar, HiChartBar, HiBell } from 'react-icons/hi';

const Dashboard = () => {
    const user = authService.getCurrentUser();

    return (
        <div className="dashboard-page">
            <div className="dashboard-grid">
                {/* User Info Card */}
                <div className="dashboard-card user-info-card">
                    <div className="card-header">
                        <HiUser className="card-icon" />
                        <h3>Account Information</h3>
                    </div>
                    <div className="card-content">
                        <div className="user-details">
                            <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
                            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                            <p><strong>Role:</strong> {user?.role || 'User'}</p>
                            <p><strong>Last Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Card */}
                <div className="dashboard-card stats-card">
                    <div className="card-header">
                        <HiChartBar className="card-icon" />
                        <h3>Quick Stats</h3>
                    </div>
                    <div className="card-content">
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-number">0</span>
                                <span className="stat-label">Active Sessions</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">0</span>
                                <span className="stat-label">Failed Logins</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">0</span>
                                <span className="stat-label">Security Events</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Card */}
                <div className="dashboard-card activity-card">
                    <div className="card-header">
                        <HiCalendar className="card-icon" />
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="card-content">
                        <div className="activity-list">
                            <div className="activity-item">
                                <div className="activity-icon">
                                    <HiBell />
                                </div>
                                <div className="activity-content">
                                    <p className="activity-text">Successfully logged in</p>
                                    <p className="activity-time">{new Date().toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="activity-item">
                                <div className="activity-icon">
                                    <HiUser />
                                </div>
                                <div className="activity-content">
                                    <p className="activity-text">Account accessed</p>
                                    <p className="activity-time">{new Date().toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Status Card */}
                <div className="dashboard-card security-card">
                    <div className="card-header">
                        <HiBell className="card-icon" />
                        <h3>Security Status</h3>
                    </div>
                    <div className="card-content">
                        <div className="security-status">
                            <div className="status-item status-good">
                                <span className="status-indicator"></span>
                                <span className="status-text">Account Security: Good</span>
                            </div>
                            <div className="status-item status-good">
                                <span className="status-indicator"></span>
                                <span className="status-text">Password Strength: Strong</span>
                            </div>
                            <div className="status-item status-good">
                                <span className="status-indicator"></span>
                                <span className="status-text">Two-Factor Auth: Enabled</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 