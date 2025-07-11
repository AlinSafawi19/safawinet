import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    FiGrid,
    FiChevronUp
} from 'react-icons/fi';
import authService from '../services/authService';
import ProfilePicture from './ProfilePicture';
import logo from '../assets/images/logo.png';
import Swal from 'sweetalert2';
import { useCalculator } from '../contexts/CalculatorContext';

const Header = ({ onLogout, onMobileMenuToggle }) => {
    const user = authService.getCurrentUser();
    const navigate = useNavigate();
    const { openCalculator } = useCalculator();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    const [notificationCount, setNotificationCount] = useState(3);
    const [inboxCount, setInboxCount] = useState(7);
    const profileRef = useRef(null);
    const toolsRef = useRef(null);

    const tools = [
        { id: 'calculator', label: 'Calculator', icon: <FiPlus />, action: () => openCalculator() },
        { id: 'kanban', label: 'Kanban Board', icon: <FiGrid />, action: () => console.log('Kanban clicked') },
        { id: 'calendar', label: 'Calendar', icon: <FiCalendar />, action: () => console.log('Calendar clicked') },
        { id: 'reminder', label: 'Reminder', icon: <FiClock />, action: () => console.log('Reminder clicked') },
        { id: 'files', label: 'Files', icon: <FiFileText />, action: () => console.log('Files clicked') },
        { id: 'lira-converter', label: 'Lira Rate Converter', icon: <FiDollarSign />, action: () => console.log('Lira Converter clicked') },
        { id: 'lira-saver', label: 'Lira Rate Saver', icon: <FiTrendingUp />, action: () => console.log('Lira Saver clicked') }
    ];

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Logout Confirmation',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout',
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
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    <button
                        onClick={onMobileMenuToggle}
                        aria-label="Toggle mobile menu"
                        className="mobile-menu-btn"
                    >
                        <FiMenu />
                    </button>
                    <img src={logo} alt="SafawiNet Logo" className="header-logo" />
                </div>
                <div className="header-right">
                    <div className="header-actions">
                        <button
                            onClick={() => handleTabClick('inbox')}
                            className="action-btn"
                        >
                            <div className="action-icon">
                                <FiInbox />
                                {inboxCount > 0 && (
                                    <span className="notification-badge">{inboxCount}</span>
                                )}
                            </div>
                            <span className="action-label">Inbox</span>
                        </button>
                        <button
                            onClick={() => handleTabClick('notifications')}
                            className="action-btn"
                        >
                            <div className="action-icon">
                                <FiBell />
                                {notificationCount > 0 && (
                                    <span className="notification-badge">{notificationCount}</span>
                                )}
                            </div>
                            <span className="action-label">Notifications</span>
                        </button>
                        <div ref={toolsRef} className="dropdown-container">
                            <button
                                onClick={toggleToolsDropdown}
                                className="dropdown-btn"
                            >
                                <FiTool />
                                <span className="dropdown-label">Tools</span>
                                {showToolsDropdown ? <FiChevronUp /> : <FiChevronDown />}                            </button>
                            {showToolsDropdown && (
                                <div className="dropdown-menu">
                                    {tools.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => handleToolClick(tool)}
                                            className="dropdown-item"
                                        >
                                            <span className="item-icon">{tool.icon}</span>
                                            <span className="item-label">{tool.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div ref={profileRef} className="dropdown-container">
                        <button
                            onClick={toggleProfileDropdown}
                            className="dropdown-btn"
                        >
                            <ProfilePicture user={user} size="small" />
                            <div className="profile-info">
                                <span className="profile-name">{user?.fullName || `${user?.firstName} ${user?.lastName}` || user?.username}</span>
                                <span className="profile-role">{user?.isAdmin ? 'Administrator' : 'User'}</span>
                            </div>
                            {showProfileDropdown ? <FiChevronUp /> : <FiChevronDown />}
                        </button>

                        {showProfileDropdown && (
                            <div className="dropdown-menu">
                                <button
                                    onClick={() => {
                                        setShowProfileDropdown(false);
                                        navigate('/profile');
                                    }}
                                    className="dropdown-item"
                                >
                                    <FiUser />
                                    <span>Profile</span>
                                </button>
                                <button className="dropdown-item">
                                    <FiSettings />
                                    <span>Settings</span>
                                </button>
                                <div className="menu-divider"></div>
                                <button onClick={handleLogout} className="dropdown-item menu-item-danger">
                                    <FiLogOut />
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