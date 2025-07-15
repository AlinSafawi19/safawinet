import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiX, HiBookOpen, HiChevronDown, HiOutlineViewGrid, HiOutlineUserGroup } from 'react-icons/hi';
import authService from '../services/authService';
import { HiClipboardList } from 'react-icons/hi';

const Sidebar = ({ isMobileMenuOpen, onCloseMobileMenu, isMobile, isCollapsed }) => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [expandedMenus, setExpandedMenus] = useState({});
    const [activeSubmenuItem, setActiveSubmenuItem] = useState('');
    const [hoveredItemId, setHoveredItemId] = useState(null);
    const [tooltipTimeout, setTooltipTimeout] = useState(null);
    const [isTooltipHovered, setIsTooltipHovered] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleMenuClick = (sectionId, path, hasSubmenu) => {
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

    const handleMouseEnter = (item) => {
        if (isCollapsed) {
            // Clear any existing timeout when entering
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
            }
            setHoveredItemId(item.id);
        }
    };

    const handleMouseLeave = () => {
        // Add a small delay to prevent tooltip from disappearing when moving to it
        const timeout = setTimeout(() => {
            if (!isTooltipHovered) {
                setHoveredItemId(null);
            }
        }, 100);
        setTooltipTimeout(timeout);
    };

    const handleTooltipClick = (path) => {
        if (path) {
            navigate(path);
            setHoveredItemId(null);
        }
    };

    const handleSubmenuTooltipClick = (submenuItem) => {
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
    const canViewUsers = currentUser && (currentUser.isAdmin || authService.hasPermission('users', 'view'));

    if (canViewUsers) {
        menuSections.push({
            name: 'Administration',
            items: [
                {
                    id: 'users',
                    label: 'Users',
                    icon: <HiOutlineUserGroup />,
                    submenu: [
                        { id: 'users', label: 'View All Users', path: '/users' },
                        { id: 'create-user', label: 'Create User', path: '/users/create' },
                        { id: 'role-templates', label: 'Role Templates', path: '/users/role-templates' },
                        { id: 'user-reports', label: 'User Reports', path: '/users/reports' },
                    ],
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

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
            }
        };
    }, [tooltipTimeout]);
    
    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`dashboard-sidebar${isCollapsed ? ' collapsed' : ''}`}>
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
                                    style={{ position: 'relative' }}
                                    onMouseEnter={() => handleMouseEnter(item)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div
                                        className={
                                            "dashboard-menu-item" +
                                            (activeSection === item.id ? " active" : "") +
                                            (item.submenu && expandedMenus[item.id] ? " expanded" : "")
                                        }
                                        onClick={() => handleMenuClick(item.id, item.path, !!item.submenu)}
                                        title=""
                                        style={{ cursor: 'pointer' }}
                                        data-has-submenu={!!item.submenu}
                                    >
                                        <span>{item.icon}</span>
                                        {!isCollapsed && <span>{item.label}</span>}
                                        {!isCollapsed && item.submenu && (
                                            <span
                                                style={{
                                                    transform: expandedMenus[item.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s ease-in-out'
                                                }}
                                            >
                                                <HiChevronDown />
                                            </span>
                                        )}
                                    </div>
                                    {/* Tooltip rendered absolutely within the wrapper */}
                                    {isCollapsed && hoveredItemId === item.id && (
                                        <div
                                            className="sidebar-tooltip"
                                            onMouseEnter={() => setIsTooltipHovered(true)}
                                            onMouseLeave={() => {
                                                setIsTooltipHovered(false);
                                                // Add a small delay before hiding the tooltip
                                                const timeout = setTimeout(() => {
                                                    setHoveredItemId(null);
                                                }, 50);
                                                setTooltipTimeout(timeout);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '100%',
                                                transform: 'translateY(-50%) translateX(5px)',
                                                backgroundColor: 'white',
                                                color: '#495057',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                zIndex: 1000,
                                                whiteSpace: 'nowrap',
                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                border: '1px solid #e9ecef',
                                                minWidth: '200px',
                                                pointerEvents: 'auto'
                                            }}
                                        >
                                            <div
                                                className="tooltip-main-item"
                                                onClick={() => handleTooltipClick(item.path)}
                                                style={{
                                                    cursor: 'pointer',
                                                    borderRadius: '6px',
                                                    fontWeight: '500',
                                                    color: '#1F3BB3',
                                                    transition: 'background-color 0.2s',
                                                    padding: '8px 12px'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = 'transparent'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                                {item.label}
                                            </div>
                                            {item.submenu && (
                                                <div className="tooltip-submenu">
                                                    {item.submenu.map((subItem) => (
                                                        <div
                                                            key={subItem.id}
                                                            className="tooltip-submenu-item"
                                                            onClick={() => handleSubmenuTooltipClick(subItem)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                padding: '6px 12px',
                                                                borderRadius: '4px',
                                                                fontSize: '13px',
                                                                color: '#6c757d',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.backgroundColor = 'transparent';
                                                                e.target.style.color = '#1F3BB3';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.backgroundColor = 'transparent';
                                                                e.target.style.color = '#6c757d';
                                                            }}
                                                        >
                                                            <span style={{ fontSize: '10px', color: '#bbb' }}>•</span>
                                                            {subItem.label}
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
                                            style={{
                                                maxHeight: expandedMenus[item.id] ? '500px' : '0px',
                                                overflow: 'hidden',
                                                transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                                                opacity: expandedMenus[item.id] ? 1 : 0
                                            }}
                                        >
                                            {item.submenu.length > 0 ? (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {item.submenu.map((sub, index) => (
                                                        <li key={sub.id}>
                                                            <div
                                                                className={`submenu-item ${activeSubmenuItem === sub.id ? 'active' : ''}`}
                                                                onClick={() => handleSubmenuTooltipClick(sub)}
                                                                style={{
                                                                    transform: expandedMenus[item.id] ? 'translateX(0)' : 'translateX(-10px)',
                                                                    transition: `transform 0.3s ease-in-out ${index * 0.05}s`
                                                                }}
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

            {/* Mobile Sidebar Overlay */}
            {isMobile && (
                <>
                    {/* Mobile Overlay */}
                    {isMobileMenuOpen && (
                        <div 
                            className="mobile-overlay"
                            onClick={onCloseMobileMenu}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 998,
                                transition: 'opacity 0.3s ease-in-out'
                            }}
                        />
                    )}
                    
                    {/* Mobile Sidebar */}
                    <aside 
                        className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: '280px',
                            backgroundColor: '#F4F5F7',
                            zIndex: 999,
                            transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                            transition: 'transform 0.3s ease-in-out',
                            boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        {/* Mobile Header */}
                        <div 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid #e9ecef',
                                backgroundColor: '#fff'
                            }}
                        >
                            <span 
                                style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: '#1F3BB3'
                                }}
                            >
                                SafawiNet
                            </span>
                            <button
                                onClick={onCloseMobileMenu}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '0.375rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background-color 0.2s',
                                    color: '#495057'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                <HiX size={24} />
                            </button>
                        </div>

                        {/* Mobile Menu */}
                        <nav 
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                padding: '1rem 0',
                                overflowY: 'auto'
                            }}
                        >
                            {menuSections.map((section, sectionIndex) => (
                                <div key={sectionIndex}>
                                    {section.name && (
                                        <div 
                                            style={{
                                                color: '#6c757d',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                padding: '1rem 1.5rem 0.5rem 1.5rem',
                                                marginBottom: '0.25rem',
                                                borderBottom: '1px solid #e9ecef',
                                                marginBottom: '0.5rem'
                                            }}
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
                                                    (item.submenu && expandedMenus[item.id] ? " expanded" : "")
                                                }
                                                onClick={() => handleMenuClick(item.id, item.path, !!item.submenu)}
                                                style={{ cursor: 'pointer' }}
                                                data-has-submenu={!!item.submenu}
                                            >
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                                {item.submenu && (
                                                    <span
                                                        style={{
                                                            transform: expandedMenus[item.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.3s ease-in-out',
                                                            marginLeft: 'auto'
                                                        }}
                                                    >
                                                        <HiChevronDown />
                                                    </span>
                                                )}
                                            </div>
                                            {/* Mobile Submenu */}
                                            {item.submenu && (
                                                <div
                                                    className={`dashboard-submenu ${expandedMenus[item.id] ? 'expanded' : 'collapsed'}`}
                                                    style={{
                                                        maxHeight: expandedMenus[item.id] ? '500px' : '0px',
                                                        overflow: 'hidden',
                                                        transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                                                        opacity: expandedMenus[item.id] ? 1 : 0
                                                    }}
                                                >
                                                    {item.submenu.length > 0 ? (
                                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                            {item.submenu.map((sub, index) => (
                                                                <li key={sub.id}>
                                                                    <div
                                                                        className={`submenu-item ${activeSubmenuItem === sub.id ? 'active' : ''}`}
                                                                        onClick={() => handleSubmenuTooltipClick(sub)}
                                                                        style={{
                                                                            transform: expandedMenus[item.id] ? 'translateX(0)' : 'translateX(-10px)',
                                                                            transition: `transform 0.3s ease-in-out ${index * 0.05}s`
                                                                        }}
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