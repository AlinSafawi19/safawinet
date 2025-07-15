import React, { useEffect, useState, useRef } from 'react';
import authService from '../services/authService';
import Header from './Header';
import Sidebar from './Sidebar';
import { initializeTheme } from '../utils/themeUtils';

const DashboardLayout = ({ onLogout, children }) => {
    const user = authService.getCurrentUser();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const [isMobile, setIsMobile] = useState(false);
    const logoutTimerRef = useRef(null);

    // Apply theme based on user preferences
    useEffect(() => {
        if (user) {
            initializeTheme(user);
        }
    }, [user]);

    // Responsive breakpoint handling
    useEffect(() => {
        const handleResize = () => {
            const mobileBreakpoint = 768;
            const newIsMobile = window.innerWidth <= mobileBreakpoint;

            if (newIsMobile !== isMobile) {
                setIsMobile(newIsMobile);

                // When transitioning to mobile, reset sidebar state and close mobile menu
                if (newIsMobile) {
                    setIsSidebarCollapsed(false);
                    setIsMobileMenuOpen(false);
                    localStorage.removeItem('sidebarCollapsed');
                }
            }
        };

        // Set initial mobile state
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

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

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

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

    // Ensure we have a valid user before rendering
    if (!user) {
        return (
            <div>

            </div>
        );
    }

    return (
        <div>
            <Header
                onLogout={onLogout}
                onSidebarToggle={handleHeaderSidebarToggle}
                isSidebarCollapsed={isSidebarCollapsed}
                isMobile={isMobile}
                isMobileMenuOpen={isMobileMenuOpen}
            />
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={closeMobileMenu}
                onSidebarToggle={handleSidebarToggle}
                onLogout={onLogout}
                isMobile={isMobile}
                isCollapsed={isSidebarCollapsed}
            />
            <div className={`dashboard-content${isSidebarCollapsed ? ' collapsed' : ''}`}>
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout; 