import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiX, HiBookOpen, HiChevronDown, HiOutlineViewGrid, HiOutlineUserGroup } from 'react-icons/hi';
import authService from '../services/authService';
import { HiClipboardList } from 'react-icons/hi';
import '../styles/Sidebar.css';

const Sidebar = ({ isMobileMenuOpen, onCloseMobileMenu, isMobile, isCollapsed, deviceType }) => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [expandedMenus, setExpandedMenus] = useState({});
    const [activeSubmenuItem, setActiveSubmenuItem] = useState('');
    const [hoveredItemId, setHoveredItemId] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Handle click outside to close mini menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (hoveredItemId && isCollapsed) {
                const sidebar = document.querySelector('.dashboard-sidebar');
                const miniMenu = document.querySelector('.sidebar-mini-menu');
                
                if (sidebar && !sidebar.contains(event.target) && 
                    miniMenu && !miniMenu.contains(event.target)) {
                    setHoveredItemId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [hoveredItemId, isCollapsed]);

    const handleMenuClick = (sectionId, path, hasSubmenu) => {
        if (isCollapsed) {
            // Toggle mini menu for collapsed sidebar
            setHoveredItemId(hoveredItemId === sectionId ? null : sectionId);
            return;
        }
        
        setActiveSection(sectionId);
        if (hasSubmenu) {
            // Close all other expanded menus first
            const newExpandedMenus = {};
            // Only expand the clicked menu if it wasn't already expanded
            if (!expandedMenus[sectionId]) {
                newExpandedMenus[sectionId] = true;
            }
            setExpandedMenus(newExpandedMenus);
            return;
        }
        // Close all expanded menus when clicking on a non-submenu item
        setExpandedMenus({});
        // Clear active submenu item when clicking on main menu items
        setActiveSubmenuItem('');
        if (path) navigate(path);
        if (onCloseMobileMenu) onCloseMobileMenu();
    };



    const handleMiniMenuClick = (path) => {
        if (path) {
            navigate(path);
            setHoveredItemId(null);
        }
    };

    const handleSubmenuMiniClick = (submenuItem) => {
        setActiveSubmenuItem(submenuItem.id);
        navigate(submenuItem.path);
        setHoveredItemId(null);
    };

    const menuSections = [
        {
            items: [
                {
                    id: 'dashboard',
                    label: 'Dashboard',
                    icon: <HiOutlineViewGrid />,
                    path: '/dashboard',
                },
            ]
        }
    ];

    // Add Users menu item if user has permission
    const currentUser = authService.getCurrentUser();
    const canViewUsers = currentUser && (currentUser.isAdmin || authService.hasPermission('users', 'view') || authService.hasPermission('users', 'view_own'));
    const canAddUsers = currentUser && (currentUser.isAdmin || authService.hasPermission('users', 'add'));

    if (canViewUsers) {
        // Build submenu items based on permissions
        const submenuItems = [
            { id: 'users', label: 'View All Users', path: '/users' }
        ];

        // Only show Create User if user has add permission
        if (canAddUsers) {
            submenuItems.push({ id: 'create-user', label: 'Create User', path: '/users/create' });
        }

        // Add Edit User submenu item (conditionally shown)
        submenuItems.push({ id: 'edit-user', label: 'Edit User', path: '/users/edit', hidden: true });

        // Only show Role Templates if user has add permission (for creating templates)
        if (canAddUsers) {
            submenuItems.push({ id: 'role-templates', label: 'Role Templates', path: '/users/role-templates' });
        }

        menuSections.push({
            name: 'Administration',
            items: [
                {
                    id: 'users',
                    label: 'Users',
                    icon: <HiOutlineUserGroup />,
                    submenu: submenuItems,
                }
            ]
        });
    }

    // Add Other section
    menuSections.push({
        name: 'Other',
        items: [
            {
                id: 'audit-logs',
                label: 'Audit Logs',
                icon: <HiClipboardList />,
                path: '/audit-logs'
            },
            {
                id: 'knowledge-guide',
                label: 'Guides',
                icon: <HiBookOpen />,
                path: '/knowledge-guide'
            }
        ]
    });

    // Update active section based on URL path
    useEffect(() => {
        const path = location.pathname;
        const editUserMatch = path.match(/^\/users\/(.+)\/edit$/);
        if (path === '/dashboard') {
            setActiveSection('dashboard');
            setActiveSubmenuItem('');
            setExpandedMenus({});
        } else if (path === '/audit-logs') {
            setActiveSection('audit-logs');
            setActiveSubmenuItem('');
            setExpandedMenus({});
        } else if (path === '/knowledge-guide') {
            setActiveSection('knowledge-guide');
            setActiveSubmenuItem('');
            setExpandedMenus({});
        } else if (path === '/users') {
            setActiveSection('users');
            setActiveSubmenuItem('users');
            setExpandedMenus({ users: true });
        } else if (path === '/users/create') {
            setActiveSection('users');
            setActiveSubmenuItem('create-user');
            setExpandedMenus({ users: true });
        } else if (editUserMatch) {
            setActiveSection('users');
            setActiveSubmenuItem('edit-user');
            setExpandedMenus({ users: true });
        } else if (path === '/users/role-templates') {
            setActiveSection('users');
            setActiveSubmenuItem('role-templates');
            setExpandedMenus({ users: true });
        } else if (path === '/users/reports') {
            setActiveSection('users');
            setActiveSubmenuItem('user-reports');
            setExpandedMenus({ users: true });
        } else if (path === '/profile') {
            // Profile is accessed via header, so no sidebar item should be active
            setActiveSection('');
            setActiveSubmenuItem('');
            setExpandedMenus({});
        }
    }, [location.pathname]);

    // Determine if we should show desktop or mobile sidebar based on device type
    const shouldShowDesktopSidebar = !isMobile && (deviceType === 'desktop' || deviceType === 'large-desktop');
    const shouldShowMobileSidebar = isMobile && (deviceType === 'tablet-landscape' || deviceType === 'tablet-portrait' || deviceType === 'mobile-large' || deviceType === 'mobile-small' || deviceType === 'mobile-extra-small');

    return (
        <>
            {/* Desktop Sidebar */}
            {shouldShowDesktopSidebar && (
                <aside className={`dashboard-sidebar${isCollapsed ? ' collapsed' : ''} device-${deviceType}`}>
                    <nav className="dashboard-menu">
                        {menuSections.map((section, sectionIndex) => (
                            <div key={sectionIndex}>
                                {!isCollapsed && section.name && (
                                    <div className="menu-section-title">
                                        {section.name}
                                    </div>
                                )}
                                {section.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="dashboard-menu-item-container"
                                    >
                                        <div
                                            className={
                                                "dashboard-menu-item" +
                                                (activeSection === item.id ? " active" : "") +
                                                (item.submenu && activeSubmenuItem && activeSubmenuItem !== '' ? " active-submenu" : "") +
                                                (item.submenu && expandedMenus[item.id] ? " expanded" : "")
                                            }
                                            onClick={() => handleMenuClick(item.id, item.path, !!item.submenu)}
                                            title=""
                                            data-has-submenu={!!item.submenu}
                                        >
                                            <span>{item.icon}</span>
                                            {!isCollapsed && <span>{item.label}</span>}
                                            {!isCollapsed && item.submenu && (
                                                <span className="dashboard-menu-item-icon">
                                                    <HiChevronDown />
                                                </span>
                                            )}
                                        </div>
                                        {/* Mini Menu for collapsed sidebar */}
                                        {isCollapsed && hoveredItemId === item.id && (
                                            <div
                                                className="sidebar-mini-menu"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div 
                                                    className={`mini-menu-header ${location.pathname === item.path ? 'active' : ''}`}
                                                    onClick={() => handleMiniMenuClick(item.path)}
                                                >
                                                    <span className="mini-menu-icon">{item.icon}</span>
                                                    <span className="mini-menu-title">{item.label}</span>
                                                </div>
                                                {item.submenu && (
                                                    <div className="mini-menu-submenu">
                                                        {item.submenu.map((subItem) => (
                                                            <div
                                                                key={subItem.id}
                                                                className={`mini-menu-item ${location.pathname === subItem.path ? 'active' : ''}`}
                                                                onClick={() => handleSubmenuMiniClick(subItem)}
                                                            >
                                                                <span className="mini-menu-item-icon">•</span>
                                                                <span>{subItem.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* Submenu (for expanded sidebar) */}
                                        {!isCollapsed && item.submenu && (
                                            <div
                                                className={`dashboard-submenu ${expandedMenus[item.id] ? 'expanded' : 'collapsed'}`}
                                            >
                                                {item.submenu.length > 0 ? (
                                                    <ul className="dashboard-submenu-list">
                                                        {item.submenu.filter(sub => !sub.hidden || activeSubmenuItem === sub.id).map((sub, index) => (
                                                            <li key={sub.id}>
                                                                <div
                                                                    className={`submenu-item ${activeSubmenuItem === sub.id ? 'active' : ''}`}
                                                                    onClick={() => handleSubmenuMiniClick(sub)}
                                                                >
                                                                    <span className="submenu-bullet">•</span>
                                                                    <span>{sub.label}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </nav>
                </aside>
            )}

            {/* Mobile Sidebar Overlay */}
            {shouldShowMobileSidebar && (
                <>
                    {/* Mobile Overlay */}
                    {isMobileMenuOpen && (
                        <div
                            className="mobile-overlay"
                            onClick={onCloseMobileMenu}
                        />
                    )}

                    {/* Mobile Sidebar */}
                    <aside
                        className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''} device-${deviceType}`}
                    >
                        {/* Mobile Header */}
                        <div className="mobile-header">
                            <span className="text-logo">
                                Permissions<span className="text-logo-colored">System</span>
                            </span>
                            <button
                                onClick={onCloseMobileMenu}
                                className="mobile-close-btn"
                            >
                                <HiX size={24} />
                            </button>
                        </div>

                        {/* Mobile Menu */}
                        <nav className="mobile-menu">
                            {menuSections.map((section, sectionIndex) => (
                                <div key={sectionIndex}>
                                    {section.name && (
                                        <div
                                            className="mobile-menu-section-title"
                                        >
                                            {section.name}
                                        </div>
                                    )}
                                    {section.items.map((item) => (
                                        <div key={item.id}>
                                            <div
                                                className={
                                                    "dashboard-menu-item" +
                                                    (activeSection === item.id ? " active" : "") +
                                                    (item.submenu && activeSubmenuItem && activeSubmenuItem !== '' ? " active-submenu" : "") +
                                                    (item.submenu && expandedMenus[item.id] ? " expanded" : "")
                                                }
                                                onClick={() => handleMenuClick(item.id, item.path, !!item.submenu)}
                                                data-has-submenu={!!item.submenu}
                                            >
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                                {item.submenu && (
                                                    <span
                                                        className="mobile-submenu-icon"
                                                    >
                                                        <HiChevronDown />
                                                    </span>
                                                )}
                                            </div>
                                            {/* Mobile Submenu */}
                                            {item.submenu && (
                                                <div
                                                    className={`dashboard-submenu ${expandedMenus[item.id] ? 'expanded' : 'collapsed'}`}
                                                >
                                                    {item.submenu.length > 0 ? (
                                                        <ul className="mobile-submenu-list">
                                                            {item.submenu.filter(sub => !sub.hidden || activeSubmenuItem === sub.id).map((sub, index) => (
                                                                <li key={sub.id}>
                                                                    <div
                                                                        className={`submenu-item ${activeSubmenuItem === sub.id ? 'active' : ''}`}
                                                                        onClick={() => handleSubmenuMiniClick(sub)}
                                                                    >
                                                                        <span className="submenu-bullet">•</span>
                                                                        <span>{sub.label}</span>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </nav>
                    </aside>
                </>
            )}
        </>
    );
};

export default Sidebar; 