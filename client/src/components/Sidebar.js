import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiMenu, HiX, HiViewBoards, HiLogout, HiClipboardList, HiBookOpen, HiShieldCheck, HiUsers } from 'react-icons/hi';
import authService from '../services/authService';
import Swal from 'sweetalert2';

const Sidebar = ({ isMobileMenuOpen, onCloseMobileMenu, onSidebarToggle, onLogout, isMobile }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        // Get the collapsed state from localStorage, default to false
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const [activeSection, setActiveSection] = useState('dashboard');
    const location = useLocation();
    const navigate = useNavigate();

    // Update collapsed state when mobile state changes
    useEffect(() => {
        if (isMobile) {
            setIsCollapsed(false);
        }
    }, [isMobile]);

    // Notify parent when sidebar state changes
    useEffect(() => {
        if (onSidebarToggle && !isMobile) {
            onSidebarToggle(isCollapsed);
        }
    }, [isCollapsed, onSidebarToggle, isMobile]);

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <HiViewBoards />,
            path: '/dashboard'
        }
    ];

    // Add Users menu item if user has permission
    const currentUser = authService.getCurrentUser();
    const canViewUsers = currentUser && (currentUser.isAdmin || authService.hasPermission('users', 'view'));
    
    if (canViewUsers) {
        menuItems.push({
            id: 'users',
            label: 'Users',
            icon: <HiUsers />,
            path: '/users'
        });
    }

    // Update active section based on URL path
    useEffect(() => {
        const path = location.pathname;
        if (path === '/dashboard') {
            setActiveSection('dashboard');
        } else if (path === '/audit-logs') {
            setActiveSection('audit-logs');
        } else if (path === '/knowledge-guide') {
            setActiveSection('knowledge-guide');
        } else if (path === '/users') {
            setActiveSection('users');
        } else if (path === '/profile') {
            // Profile is accessed via header, so no sidebar item should be active
            setActiveSection('');
        }
    }, [location.pathname]);

    const footerItems = [
        {
            id: 'audit-logs',
            label: 'Audit Logs',
            icon: <HiClipboardList />,
            action: () => handleMenuClick('audit-logs')
        },
        {
            id: 'knowledge-guide',
            label: 'Knowledge & Guide',
            icon: <HiBookOpen />,
            action: () => handleMenuClick('knowledge-guide')
        },
        {
            id: 'logout',
            label: 'Logout',
            icon: <HiLogout />,
            action: async () => {
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
            }
        }
    ];

    const handleMenuClick = (sectionId) => {
        setActiveSection(sectionId);

        // Close mobile menu when item is clicked
        if (onCloseMobileMenu) {
            onCloseMobileMenu();
        }

        // Update URL based on section
        switch (sectionId) {
            case 'dashboard':
                navigate('/dashboard');
                break;
            case 'audit-logs':
                navigate('/audit-logs');
                break;
            case 'knowledge-guide':
                navigate('/knowledge-guide');
                break;
            case 'users':
                navigate('/users');
                break;
            default:
                navigate('/dashboard');
        }
    };

    const handleFooterClick = (item) => {
        if (item.action) {
            item.action();
        }
    };

    const handleSidebarToggle = () => {
        if (!isMobile) {
            const newCollapsedState = !isCollapsed;
            setIsCollapsed(newCollapsedState);
            // Save the collapsed state to localStorage only on desktop
            localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState));
        }
    };

    return (
        <>
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-overlay" onClick={onCloseMobileMenu}>
                    <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-header">
                            <div className="mobile-brand">
                                <div className="brand-icon">
                                    <HiShieldCheck />
                                </div>
                                <div className="brand-info">
                                    <span className="brand-name">SafawiNet</span>
                                    <span className="brand-tagline">Secure & Smart</span>
                                </div>
                            </div>
                            <button
                                onClick={onCloseMobileMenu}
                                aria-label="Close mobile menu"
                                className="mobile-close-btn"
                            >
                                <HiX />
                            </button>
                        </div>

                        <nav className="mobile-nav">
                            <ul className="mobile-menu-list">
                                {menuItems.map((item) => (
                                    <li key={item.id} className="mobile-menu-item">
                                        <button
                                            onClick={() => handleMenuClick(item.id)}
                                            className={`mobile-menu-btn ${activeSection === item.id ? 'active' : ''}`}
                                        >
                                            <span className="menu-icon">{item.icon}</span>
                                            <span className="menu-label">{item.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <div className="mobile-footer">
                            <ul className="mobile-footer-list">
                                {footerItems.map((item) => (
                                    <li key={item.id} className="mobile-footer-item">
                                        <button
                                            onClick={() => {
                                                handleFooterClick(item);
                                                if (onCloseMobileMenu) {
                                                    onCloseMobileMenu();
                                                }
                                            }}
                                            className={`mobile-footer-btn ${item.id === 'logout' ? 'logout-btn' : ''} ${activeSection === item.id ? 'active' : ''}`}
                                        >
                                            <span className="footer-icon">{item.icon}</span>
                                            <span className="footer-label">{item.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}`}>
                <div className="sidebar-header">
                    {!isCollapsed && (
                        <div className="sidebar-brand">
                            <div className="brand-icon">
                                <HiShieldCheck />
                            </div>
                            <div className="brand-info">
                                <span className="brand-name">SafawiNet</span>
                                <span className="brand-tagline">Secure & Smart</span>
                            </div>
                        </div>
                    )}
                    {!isMobile && (
                        <button
                            onClick={handleSidebarToggle}
                            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                            className="sidebar-toggle-btn"
                        >
                            {isCollapsed ? <HiMenu /> : <HiX />}
                        </button>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-menu">
                        {menuItems.map((item) => (
                            <li key={item.id} className="sidebar-menu-item">
                                <button
                                    onClick={() => handleMenuClick(item.id)}
                                    title={item.label}
                                    className={`sidebar-menu-btn ${activeSection === item.id ? 'active' : ''}`}
                                >
                                    <span className="menu-icon">{item.icon}</span>
                                    {!isCollapsed && <span className="menu-label">{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <ul className="sidebar-footer-list">
                        {footerItems.map((item) => {
                            const buttonClass = `sidebar-footer-btn ${item.id === 'logout' ? 'logout-btn' : ''} ${activeSection === item.id ? 'active' : ''}`;
                            console.log(`Sidebar: Footer button ${item.id} classes:`, buttonClass, 'activeSection:', activeSection);
                            return (
                                <li key={item.id} className="sidebar-footer-item">
                                    <button
                                        onClick={() => handleFooterClick(item)}
                                        title={item.label}
                                        className={buttonClass}
                                    >
                                        <span className="footer-icon">{item.icon}</span>
                                        {!isCollapsed && <span className="footer-label">{item.label}</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>
        </>
    );
};

export default Sidebar; 