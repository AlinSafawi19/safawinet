import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiInbox,
    FiBell,
    FiSettings,
    FiUser,
    FiLogOut,
    FiChevronDown,
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
import ProfilePicture from './ProfilePicture';
import Swal from 'sweetalert2';

const Header = ({ onLogout, onSidebarToggle, isSidebarCollapsed, isMobile, isMobileMenuOpen }) => {
    const user = authService.getCurrentUser();
    const navigate = useNavigate();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    const [notificationCount, setNotificationCount] = useState(3);
    const [inboxCount, setInboxCount] = useState(7);
    const profileRef = useRef(null);
    const toolsRef = useRef(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const tools = [
        { id: 'kanban', label: 'Kanban Board', icon: <FiGrid />, action: () => console.log('Kanban clicked') },
        { id: 'calendar', label: 'Calendar', icon: <FiCalendar />, action: () => console.log('Calendar clicked') },
        { id: 'reminder', label: 'Reminder', icon: <FiClock />, action: () => console.log('Reminder clicked') },
        { id: 'files', label: 'Files', icon: <FiFileText />, action: () => console.log('Files clicked') }
    ];

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Logout Confirmation',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sign out',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                await authService.logout();
                if (onLogout) {
                    onLogout();
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
    };

    const handleTabClick = (tab) => {
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
        <div className={`header-container${isScrolled ? ' scrolled' : ''}${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
            <div className="header-left">
                <button
                    onClick={onSidebarToggle}
                    className="sidebar-toggle-btn"
                    title={isMobile ? (isMobileMenuOpen ? 'Close menu' : 'Open menu') : (isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
                    aria-label={isMobile ? (isMobileMenuOpen ? 'Close menu' : 'Open menu') : (isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
                >
                    {isMobile ? (
                        // Mobile: Show X when menu is open, hamburger when closed
                        <div className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                        </div>
                    ) : (
                        // Desktop: Show hamburger when sidebar is expanded, X when collapsed
                        <div className={`hamburger-menu ${isSidebarCollapsed ? '' : 'active'}`}>
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                        </div>
                    )}
                </button>
                {!isSidebarCollapsed && (
                    <span className="text-logo">
                        Safawi<span className="text-logo-blue">Net</span>
                    </span>
                )}
            </div >
            <header
                className={`dashboard-header${isSidebarCollapsed ? '' : ''}`}
                style={{}}
            >
                {/* Greeting Section */}
                <div className="dashboard-greeting">
                    <span className="dashboard-greeting-main">
                        Good Morning{user?.firstName || user?.lastName ? ',' : ''} <b>{user?.firstName} {user?.lastName}</b>
                    </span>
                    <span className="dashboard-greeting-subtext">
                        Hope you have a productive day!
                    </span>
                </div>
                <div className="header-right">
                    {/* Desktop View */}
                    {!isMobile && (
                        <>
                            <button
                                className="header-tab"
                                onClick={() => handleTabClick('inbox')}
                            >
                                <div className="header-tab-icon">
                                    <FiInbox />
                                    {inboxCount > 0 && (
                                        <span className="header-tab-badge">{inboxCount}</span>
                                    )}
                                </div>
                                <span>Inbox</span>
                            </button>
                            <button
                                className="header-tab"
                                onClick={() => handleTabClick('notifications')}
                            >
                                <div className="header-tab-icon">
                                    <FiBell />
                                    {notificationCount > 0 && (
                                        <span className="header-tab-badge">{notificationCount}</span>
                                    )}
                                </div>
                                <span>Notifications</span>
                            </button>
                            <div ref={toolsRef} className={`header-tools-dropdown ${showToolsDropdown ? 'open' : ''}`}>
                                <button
                                    className="header-tools-button"
                                    onClick={toggleToolsDropdown}
                                >
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

                    {/* Mobile View - Compact Icons */}
                    {isMobile && (
                        <div className="mobile-header-actions">
                            {/* Mobile Notifications */}
                            <button
                                className="mobile-action-btn"
                                onClick={() => handleTabClick('notifications')}
                                title="Notifications"
                            >
                                <div className="mobile-action-icon">
                                    <FiBell />
                                    {notificationCount > 0 && (
                                        <span className="mobile-badge">{notificationCount}</span>
                                    )}
                                </div>
                            </button>

                            {/* Mobile Inbox */}
                            <button
                                className="mobile-action-btn"
                                onClick={() => handleTabClick('inbox')}
                                title="Inbox"
                            >
                                <div className="mobile-action-icon">
                                    <FiInbox />
                                    {inboxCount > 0 && (
                                        <span className="mobile-badge">{inboxCount}</span>
                                    )}
                                </div>
                            </button>

                            {/* Mobile Tools Dropdown */}
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
                            <ProfilePicture user={user} size="small" />
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