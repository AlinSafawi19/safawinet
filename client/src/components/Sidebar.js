import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiMenu, HiX, HiViewBoards, HiLogout, HiClipboardList, HiBookOpen, HiShieldCheck } from 'react-icons/hi';
import authService from '../services/authService';

const Sidebar = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        // Get the collapsed state from localStorage, default to false
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const [activeSection, setActiveSection] = useState('dashboard');
    const location = useLocation();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <HiViewBoards />,
            path: '/dashboard'
        }
    ];

    // Update active section based on URL path
    useEffect(() => {
        const path = location.pathname;
        if (path === '/dashboard') {
            setActiveSection('dashboard');
        } else if (path === '/audit-logs') {
            setActiveSection('audit-logs');
        } else if (path === '/knowledge-guide') {
            setActiveSection('knowledge-guide');
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
            action: () => {
                authService.logout();
                window.location.href = '/login';
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
            default:
                navigate('/dashboard');
        }
    };

    const handleFooterClick = (item) => {
        if (item.action) {
            item.action();
        }
    };

    return (
        <>
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={onCloseMobileMenu}>
                    <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-menu-header">
                            <div className="mobile-menu-brand">
                                <div className="brand-logo">
                                    <HiShieldCheck className="brand-icon" />
                                </div>
                                <div className="brand-text">
                                    <span className="brand-name">SafawiNet</span>
                                    <span className="brand-tagline">Secure & Smart</span>
                                </div>
                            </div>
                            <button
                                className="mobile-menu-close"
                                onClick={onCloseMobileMenu}
                                aria-label="Close mobile menu"
                            >
                                <HiX />
                            </button>
                        </div>
                        
                        <nav className="mobile-menu-nav">
                            <ul className="mobile-nav-menu">
                                {menuItems.map((item) => (
                                    <li key={item.id} className="mobile-nav-item">
                                        <button
                                            className={`mobile-nav-link ${activeSection === item.id ? 'active' : ''}`}
                                            onClick={() => handleMenuClick(item.id)}
                                        >
                                            <span className="mobile-nav-icon">{item.icon}</span>
                                            <span className="mobile-nav-label">{item.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <div className="mobile-menu-footer">
                            <ul className="mobile-footer-menu">
                                {footerItems.map((item) => (
                                    <li key={item.id} className="mobile-footer-item">
                                        <button
                                            className={`mobile-footer-link ${item.id === 'logout' ? 'logout-link' : ''} ${activeSection === item.id ? 'active' : ''}`}
                                            onClick={() => {
                                                handleFooterClick(item);
                                                if (onCloseMobileMenu) {
                                                    onCloseMobileMenu();
                                                }
                                            }}
                                        >
                                            <span className="mobile-footer-icon">{item.icon}</span>
                                            <span className="mobile-footer-label">{item.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    {!isCollapsed && (
                        <div className="sidebar-brand">
                            <div className="brand-logo">
                                <HiShieldCheck className="brand-icon" />
                            </div>
                            <div className="brand-text">
                                <span className="brand-name">SafawiNet</span>
                                <span className="brand-tagline">Secure & Smart</span>
                            </div>
                        </div>
                    )}
                    <button
                        className="sidebar-toggle"
                        onClick={() => {
                            const newCollapsedState = !isCollapsed;
                            setIsCollapsed(newCollapsedState);
                            // Save the collapsed state to localStorage
                            localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState));
                        }}
                        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {isCollapsed ? <HiMenu /> : <HiX />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-menu">
                        {menuItems.map((item) => (
                            <li key={item.id} className="nav-item">
                                <button
                                    className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                                    onClick={() => handleMenuClick(item.id)}
                                    title={item.label}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    {!isCollapsed && <span className="nav-label">{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <ul className="footer-menu">
                        {footerItems.map((item) => (
                            <li key={item.id} className="footer-item">
                                <button
                                    className={`footer-link ${item.id === 'logout' ? 'logout-link' : ''} ${activeSection === item.id ? 'active' : ''}`}
                                    onClick={() => handleFooterClick(item)}
                                    title={item.label}
                                >
                                    <span className="footer-icon">{item.icon}</span>
                                    {!isCollapsed && <span className="footer-label">{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
        </>
    );
};

export default Sidebar; 