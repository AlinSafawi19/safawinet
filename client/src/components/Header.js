import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiInbox, FiTool, FiChevronDown, FiUser, FiSettings, FiLogOut, FiCalendar, FiClock, FiFile } from 'react-icons/fi';
import ProfilePicture from './ProfilePicture';
import '../styles/Header.css';
import { showLogoutConfirmation } from '../utils/sweetAlertConfig';
import authService from '../services/authService';

const Header = ({ onSidebarToggle, isSidebarCollapsed, isMobile, isMobileMenuOpen, deviceType }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const [isScrolled, setIsScrolled] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    const profileRef = useRef(null);
    const toolsRef = useRef(null);

    // Mock data for notifications and inbox
    const notificationCount = 3;
    const inboxCount = 7;

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        const result = await showLogoutConfirmation();
        if (result.isConfirmed) {
            authService.logout();
        }
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
        setShowToolsDropdown(false);
        // Handle tool click
        console.log('Tool clicked:', tool);
    };

    // Close dropdowns when clicking outside
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Determine if we should use profile dropdown for navigation items
    const shouldUseProfileDropdown = deviceType === 'mobile-small' || deviceType === 'mobile-extra-small';



    // Tools data
    const tools = [
        { id: 1, label: 'Calendar', icon: <FiCalendar /> },
        { id: 2, label: 'Reminder', icon: <FiClock /> },
        { id: 3, label: 'Files', icon: <FiFile /> }
    ];

    return (
        <div className="header-wrapper">
            <header className={`header-container ${isScrolled ? 'scrolled' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="header-left">
                    <button
                        className="sidebar-toggle-btn"
                        onClick={onSidebarToggle}
                        aria-label="Toggle sidebar"
                    >
                        <div className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                        </div>
                    </button>
                    <div className="text-logo">
                        Permissions<span className="text-logo-colored">System</span>
                    </div>
                </div>

                <div className="dashboard-header">
                    <div className="dashboard-greeting">
                        <div className="dashboard-greeting-main">
                            Welcome back, {user?.firstName || 'User'}!
                        </div>
                        <div className="dashboard-greeting-subtext">
                            Here's what's happening today
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    {/* Desktop Header Tabs */}
                    {!isMobile && (
                        <>
                            <button className="header-tab" onClick={() => navigate('/notifications')}>
                                <div className="header-tab-icon">
                                    <FiBell />
                                    {notificationCount > 0 && (
                                        <span className="header-tab-badge">{notificationCount}</span>
                                    )}
                                </div>
                                <span>Notifications</span>
                            </button>

                            <button className="header-tab" onClick={() => navigate('/inbox')}>
                                <div className="header-tab-icon">
                                    <FiInbox />
                                    {inboxCount > 0 && (
                                        <span className="header-tab-badge">{inboxCount}</span>
                                    )}
                                </div>
                                <span>Inbox</span>
                            </button>

                            <div ref={toolsRef} className={`header-tools-dropdown ${showToolsDropdown ? 'open' : ''}`}>
                                <button className="header-tools-button" onClick={toggleToolsDropdown}>
                                    <FiTool />
                                    <span>Tools</span>
                                    <span className="chevron-icon">
                                        <FiChevronDown />
                                    </span>
                                </button>
                                {showToolsDropdown && (
                                    <div className="header-tools-menu">
                                        {tools.map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => handleToolClick(tool)}
                                            >
                                                <span>{tool.icon}</span>
                                                <span>{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Tablet Landscape - Show compact icons */}
                    {deviceType === 'tablet-landscape' && (
                        <div className="mobile-header-actions">
                            <button className="mobile-action-btn" onClick={() => navigate('/notifications')}>
                                <div className="mobile-action-icon">
                                    <FiBell />
                                    {notificationCount > 0 && (
                                        <span className="mobile-badge">{notificationCount}</span>
                                    )}
                                </div>
                            </button>

                            <button className="mobile-action-btn" onClick={() => navigate('/inbox')}>
                                <div className="mobile-action-icon">
                                    <FiInbox />
                                    {inboxCount > 0 && (
                                        <span className="mobile-badge">{inboxCount}</span>
                                    )}
                                </div>
                            </button>

                            <div ref={toolsRef} className={`mobile-tools-dropdown ${showToolsDropdown ? 'open' : ''}`}>
                                <button className="mobile-action-btn" onClick={toggleToolsDropdown}>
                                    <div className="mobile-action-icon">
                                        <FiTool />
                                        <span className="chevron-icon">
                                            <FiChevronDown />
                                        </span>
                                    </div>
                                </button>
                                {showToolsDropdown && (
                                    <div className="mobile-tools-menu">
                                        {tools.map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => handleToolClick(tool)}
                                            >
                                                <span>{tool.icon}</span>
                                                <span>{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile Header Actions - Tablet Portrait and Mobile Large */}
                    {(deviceType === 'tablet-portrait' || deviceType === 'mobile-large') && (
                        <div className="mobile-header-actions">
                            <button
                                className="mobile-action-btn"
                                onClick={() => navigate('/notifications')}
                                title="Notifications"
                            >
                                <div className="mobile-action-icon">
                                    <FiBell />
                                    {notificationCount > 0 && (
                                        <span className="mobile-badge">{notificationCount}</span>
                                    )}
                                </div>
                            </button>

                            <button
                                className="mobile-action-btn"
                                onClick={() => navigate('/inbox')}
                                title="Inbox"
                            >
                                <div className="mobile-action-icon">
                                    <FiInbox />
                                    {inboxCount > 0 && (
                                        <span className="mobile-badge">{inboxCount}</span>
                                    )}
                                </div>
                            </button>

                            <div ref={toolsRef} className={`mobile-tools-dropdown ${showToolsDropdown ? 'open' : ''}`}>
                                <button
                                    className="mobile-action-btn"
                                    onClick={toggleToolsDropdown}
                                    title="Tools"
                                >
                                    <div className="mobile-action-icon">
                                        <FiTool />
                                        <span className="chevron-icon">
                                            <FiChevronDown />
                                        </span>
                                    </div>
                                </button>
                                {showToolsDropdown && (
                                    <div className="mobile-tools-menu">
                                        {tools.map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => handleToolClick(tool)}
                                            >
                                                <span>{tool.icon}</span>
                                                <span>{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Profile Dropdown - Both Desktop and Mobile */}
                    <div ref={profileRef} className={`header-profile-dropdown ${showProfileDropdown ? 'open' : ''}`}>
                        <button
                            className={`header-profile-button ${isMobile ? 'mobile-profile-btn' : ''}`}
                            onClick={toggleProfileDropdown}
                        >
                            <div className="profile-button-content">
                                <ProfilePicture user={user} size="small" />
                                {/* Notification indicator - only show when nav items are in dropdown */}
                                {shouldUseProfileDropdown && (notificationCount > 0 || inboxCount > 0) && (
                                    <div className="profile-notification-indicator">
                                        <span className="profile-badge">
                                            {notificationCount + inboxCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span className="chevron-icon">
                                <FiChevronDown />
                            </span>
                        </button>

                        {showProfileDropdown && (
                            <div className={`header-profile-menu custom-profile-dropdown ${isMobile ? 'mobile-profile-menu' : ''}`}>
                                <div className="profile-info">
                                    <ProfilePicture user={user} size="large" />
                                    <div className="profile-details">
                                        <div className="profile-name">{user?.firstName} {user?.lastName}</div>
                                        <div className="profile-email">{user?.email}</div>
                                    </div>
                                </div>

                                {/* Mobile Small - Add navigation items to profile dropdown */}
                                {shouldUseProfileDropdown && (
                                    <>
                                        <div className="dropdown-section-divider"></div>
                                        <button className="dropdown-item" onClick={() => { setShowProfileDropdown(false); navigate('/notifications'); }}>
                                            <div className="dropdown-item-content">
                                                <FiBell className="dropdown-icon" />
                                                <span>Notifications</span>
                                                {notificationCount > 0 && (
                                                    <span className="dropdown-badge">{notificationCount}</span>
                                                )}
                                            </div>
                                        </button>
                                        <button className="dropdown-item" onClick={() => { setShowProfileDropdown(false); navigate('/inbox'); }}>
                                            <div className="dropdown-item-content">
                                                <FiInbox className="dropdown-icon" />
                                                <span>Inbox</span>
                                                {inboxCount > 0 && (
                                                    <span className="dropdown-badge">{inboxCount}</span>
                                                )}
                                            </div>
                                        </button>
                                        <div className="dropdown-section-divider"></div>
                                        {tools.map((tool) => (
                                            <button
                                                key={tool.id}
                                                className="dropdown-item"
                                                onClick={() => { setShowProfileDropdown(false); handleToolClick(tool); }}
                                            >
                                                <span className="dropdown-icon">{tool.icon}</span>
                                                <span>{tool.label}</span>
                                            </button>
                                        ))}
                                        <div className="dropdown-section-divider"></div>
                                    </>
                                )}

                                <button className="dropdown-item" onClick={() => { setShowProfileDropdown(false); navigate('/profile'); }}>
                                    <FiUser className="dropdown-icon" />
                                    <span>My Profile</span>
                                </button>
                                <button className="dropdown-item">
                                    <FiSettings className="dropdown-icon" />
                                    <span>Settings</span>
                                </button>
                                <button className="dropdown-item signout" onClick={handleLogout}>
                                    <FiLogOut className="dropdown-icon" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header >
        </div>
    );
};

export default Header; 