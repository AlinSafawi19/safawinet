import React, { useState, useEffect, useRef } from 'react';
import {
    FiInbox,
    FiBell,
    FiSettings,
    FiUser,
    FiLogOut,
    FiChevronDown,
    //FiMail,
    FiTool
} from 'react-icons/fi';
import authService from '../services/authService';
import logo from '../assets/images/logo.png';

const Header = ({ onLogout }) => {
    const user = authService.getCurrentUser();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [notificationCount, setNotificationCount] = useState(3);
    const [inboxCount, setInboxCount] = useState(7);
    const profileRef = useRef(null);

    const handleLogout = async () => {
        try {
            await authService.logout();
            if (onLogout) {
                onLogout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        // Here you can add navigation logic for each tab
        console.log(`Switched to ${tab} tab`);
    };

    const toggleProfileDropdown = () => {
        setShowProfileDropdown(!showProfileDropdown);
    };

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="dashboard-header">
            <div className="header-content">
                <div className="header-left">
                    <img src={logo} alt="SafawiNet Logo" className="logo-image" />
                </div>
                <div className="header-right">
                    <div className="header-right-content">
                        <button
                            className={`nav-tab ${activeTab === 'inbox' ? 'active' : ''}`}
                            onClick={() => handleTabClick('inbox')}
                        >
                            <FiInbox className="nav-icon" />
                            <span>Inbox</span>
                            {inboxCount > 0 && (
                                <span className="badge">{inboxCount}</span>
                            )}
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                            onClick={() => handleTabClick('notifications')}
                        >
                            <FiBell className="nav-icon" />
                            <span>Notifications</span>
                            {notificationCount > 0 && (
                                <span className="badge">{notificationCount}</span>
                            )}
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'tools' ? 'active' : ''}`}
                            onClick={() => handleTabClick('tools')}
                        >
                            <FiTool className="nav-icon" />
                            <span>Tools</span>
                        </button>
                    </div>
                    <div className="user-profile-container" ref={profileRef}>
                        <button
                            className="profile-button"
                            onClick={toggleProfileDropdown}
                        >
                            <div className="user-avatar">
                                <FiUser className="avatar-icon" />
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.fullName || `${user?.firstName} ${user?.lastName}` || user?.username}</span>
                                <span className="user-role">{user?.isAdmin ? 'Administrator' : 'User'}</span>
                            </div>
                            <FiChevronDown className={`dropdown-icon ${showProfileDropdown ? 'rotated' : ''}`} />
                        </button>

                        {showProfileDropdown && (
                            <div className="profile-dropdown">
                                <button className="dropdown-item">
                                    <FiUser className="dropdown-icon" />
                                    <span>Profile</span>
                                </button>
                                <button className="dropdown-item">
                                    <FiSettings className="dropdown-icon" />
                                    <span>Settings</span>
                                </button>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item logout" onClick={handleLogout}>
                                    <FiLogOut className="dropdown-icon" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header; 