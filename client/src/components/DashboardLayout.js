import React, { useEffect, useState, useRef } from 'react';
import authService from '../services/authService';
import Header from './Header';
import Sidebar from './Sidebar';
import ConfirmationModal from './ConfirmationModal';
import { initializeTheme } from '../utils/themeUtils';
import '../styles/DashboardLayout.css';

const DashboardLayout = ({ onLogout, children }) => {
    const user = authService.getCurrentUser();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const [isMobile, setIsMobile] = useState(false);
    const [deviceType, setDeviceType] = useState('desktop');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const logoutTimerRef = useRef(null);

    // Apply theme based on user preferences
    useEffect(() => {
        if (user) {
            initializeTheme(user);
        }
    }, [user]);

    // Enhanced responsive breakpoint handling
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Determine device type based on width
            let newDeviceType = 'desktop';
            let newIsMobile = false;
            
            if (width >= 1400) {
                newDeviceType = 'large-desktop';
                newIsMobile = false;
            } else if (width >= 1024) {
                newDeviceType = 'desktop';
                newIsMobile = false;
            } else if (width >= 768) {
                newDeviceType = 'tablet-landscape';
                newIsMobile = true;
            } else if (width >= 600) {
                newDeviceType = 'tablet-portrait';
                newIsMobile = true;
            } else if (width >= 480) {
                newDeviceType = 'mobile-large';
                newIsMobile = true;
            } else if (width >= 320) {
                newDeviceType = 'mobile-small';
                newIsMobile = true;
            } else {
                newDeviceType = 'mobile-extra-small';
                newIsMobile = true;
            }

            // Check if we need to update the state
            if (newIsMobile !== isMobile || newDeviceType !== deviceType) {
                setIsMobile(newIsMobile);
                setDeviceType(newDeviceType);

                // When transitioning to mobile, reset sidebar state and close mobile menu
                if (newIsMobile && !isMobile) {
                    setIsSidebarCollapsed(false);
                    setIsMobileMenuOpen(false);
                    localStorage.removeItem('sidebarCollapsed');
                }
                
                // When transitioning to desktop, restore sidebar state
                if (!newIsMobile && isMobile) {
                    const saved = localStorage.getItem('sidebarCollapsed');
                    if (saved) {
                        setIsSidebarCollapsed(JSON.parse(saved));
                    }
                }
            }
        };

        // Set initial state
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile, deviceType]);

    // Auto logout logic
    useEffect(() => {
        if (!user) return;
        // Get autoLogoutTime in minutes, default to 30
        const autoLogoutTime = (user.userPreferences && user.userPreferences.autoLogoutTime) || 30;
        const timeoutMs = autoLogoutTime * 60 * 1000;

        const resetTimer = () => {
            if (logoutTimerRef.current) {
                clearTimeout(logoutTimerRef.current);
            }
            logoutTimerRef.current = setTimeout(() => {
                if (onLogout) onLogout();
            }, timeoutMs);
        };

        // List of events that indicate user activity
        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Start the timer initially
        resetTimer();

        // Cleanup on unmount or user change
        return () => {
            if (logoutTimerRef.current) {
                clearTimeout(logoutTimerRef.current);
            }
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [user, onLogout]);

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleSidebarToggle = (collapsed) => {
        // Only allow sidebar toggle on desktop
        if (!isMobile) {
            setIsSidebarCollapsed(collapsed);
            // Save the collapsed state to localStorage
            localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
        }
    };

    const handleHeaderSidebarToggle = () => {
        if (isMobile) {
            // On mobile, toggle the mobile menu
            setIsMobileMenuOpen(!isMobileMenuOpen);
        } else {
            // On desktop, toggle the sidebar collapsed state
            handleSidebarToggle(!isSidebarCollapsed);
        }
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        try {
            await authService.logout();
            if (onLogout) onLogout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Ensure we have a valid user before rendering
    if (!user) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <h2>Initializing Dashboard</h2>
                <p>Please wait while we load your account information...</p>
            </div>
        );
    }

    return (
        <div className={`dashboard-layout device-${deviceType}`}>
            <Header
                onLogout={handleLogout}
                onSidebarToggle={handleHeaderSidebarToggle}
                isSidebarCollapsed={isSidebarCollapsed}
                isMobile={isMobile}
                isMobileMenuOpen={isMobileMenuOpen}
                deviceType={deviceType}
            />
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={closeMobileMenu}
                onSidebarToggle={handleSidebarToggle}
                onLogout={handleLogout}
                isMobile={isMobile}
                isCollapsed={isSidebarCollapsed}
                deviceType={deviceType}
            />
            <div className={`dashboard-content ${isSidebarCollapsed ? ' collapsed' : ''}`}>
                <main>
                    {children}
                </main>
            </div>

            {/* Confirmation Modal - Rendered at root level */}
            <ConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={confirmLogout}
                title="Logout Confirmation"
                message="Are you sure you want to logout?"
                confirmText="Sign out"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
};

export default DashboardLayout; 