import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import LoadingOverlay from './LoadingOverlay';
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
    console.log(user);

    // Apply theme based on user preferences
    useEffect(() => {
        if (user) {
            initializeTheme(user);
        }
    }, [user]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleSidebarToggle = (collapsed) => {
        setIsSidebarCollapsed(collapsed);
    };

    // Ensure we have a valid user before rendering
    if (!user) {
        return (
            <div className="App">
                <LoadingOverlay isLoading={true} />
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <div className={`layout-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Header onLogout={onLogout} onMobileMenuToggle={toggleMobileMenu} />
                
                <div className={`layout-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <Sidebar 
                        isMobileMenuOpen={isMobileMenuOpen} 
                        onCloseMobileMenu={closeMobileMenu}
                        onSidebarToggle={handleSidebarToggle}
                    />
                    <main className="main-content">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout; 