import React, { useState, useEffect, useRef } from 'react';
import {
    FiInbox,
    FiBell,
    FiSettings,
    FiUser,
    FiLogOut,
    FiChevronDown,
    FiMenu,
    FiTool,
    FiPlus,
    FiCalendar,
    FiClock,
    FiFileText,
    FiDollarSign,
    FiTrendingUp,
    FiGrid
} from 'react-icons/fi';
import authService from '../services/authService';
import logo from '../assets/images/logo.png';

const Header = ({ onLogout, onMobileMenuToggle }) => {
    const user = authService.getCurrentUser();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    const [notificationCount, setNotificationCount] = useState(3);
    const [inboxCount, setInboxCount] = useState(7);
    const profileRef = useRef(null);
    const toolsRef = useRef(null);

    const tools = [
        { id: 'calculator', label: 'Calculator', icon: <FiPlus />, action: () => console.log('Calculator clicked') },
        { id: 'kanban', label: 'Kanban Board', icon: <FiGrid />, action: () => console.log('Kanban clicked') },
        { id: 'calendar', label: 'Calendar', icon: <FiCalendar />, action: () => console.log('Calendar clicked') },
        { id: 'reminder', label: 'Reminder', icon: <FiClock />, action: () => console.log('Reminder clicked') },
        { id: 'files', label: 'Files', icon: <FiFileText />, action: () => console.log('Files clicked') },
        { id: 'lira-converter', label: 'Lira Rate Converter', icon: <FiDollarSign />, action: () => console.log('Lira Converter clicked') },
        { id: 'lira-saver', label: 'Lira Rate Saver', icon: <FiTrendingUp />, action: () => console.log('Lira Saver clicked') }
    ];

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
        setShowToolsDropdown(false);
    };

    const toggleToolsDropdown = () => {
        setShowToolsDropdown(!showToolsDropdown);
        setShowProfileDropdown(false);
    };

    const handleToolClick = (tool) => {
        tool.action();
        setShowToolsDropdown(false);
    };

    // Handle clicking outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            if (toolsRef.current && !toolsRef.current.contains(event.target)) {
                setShowToolsDropdown(false);
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
                    <button 
                        className="mobile-menu-button"
                        onClick={onMobileMenuToggle}
                        aria-label="Toggle mobile menu"
                    >
                        <FiMenu />
                    </button>
                    <img src={logo} alt="SafawiNet Logo" className="logo-image" />
                </div>
                <div className="header-right">
                    <div className="header-right-content">
                        <button
                            className={`nav-tab ${activeTab === 'inbox' ? 'active' : ''}`}
                            onClick={() => handleTabClick('inbox')}
                        >
                            <div className="nav-icon-container">
                                <FiInbox className="nav-icon" />
                                {inboxCount > 0 && (
                                    <span className="badge">{inboxCount}</span>
                                )}
                            </div>
                            <span className="nav-tab-text">Inbox</span>
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                            onClick={() => handleTabClick('notifications')}
                        >
                            <div className="nav-icon-container">
                                <FiBell className="nav-icon" />
                                {notificationCount > 0 && (
                                    <span className="badge">{notificationCount}</span>
                                )}
                            </div>
                            <span className="nav-tab-text">Notifications</span>
                        </button>
                        <div className="tools-dropdown-container" ref={toolsRef}>
                            <button
                                className={`nav-tab tools-dropdown-btn ${showToolsDropdown ? 'active' : ''}`}
                                onClick={toggleToolsDropdown}
                            >
                                <FiTool className="nav-icon" />
                                <span className="nav-tab-text">Tools</span>
                                <FiChevronDown className={`dropdown-icon ${showToolsDropdown ? 'rotated' : ''}`} />
                            </button>
                            {showToolsDropdown && (
                                <div className="tools-dropdown">
                                    {tools.map((tool) => (
                                        <button
                                            key={tool.id}
                                            className="tools-dropdown-item"
                                            onClick={() => handleToolClick(tool)}
                                        >
                                            <span className="tools-dropdown-icon">{tool.icon}</span>
                                            <span>{tool.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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