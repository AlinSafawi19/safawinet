import React, { useEffect } from 'react';
import authService from '../services/authService';
import LoadingOverlay from './LoadingOverlay';
import Header from './Header';
import Sidebar from './Sidebar';
import { initializeTheme } from '../utils/themeUtils';
import '../styles/DashboardLayout.css';

const DashboardLayout = ({ onLogout, children }) => {
    const user = authService.getCurrentUser();
    console.log(user);

    // Apply theme based on user preferences
    useEffect(() => {
        if (user) {
            initializeTheme(user);
        }
    }, [user]);

    // Ensure we have a valid user before rendering
    if (!user) {
        return (
            <div className="App">
                <LoadingOverlay isLoading={true} />
            </div>
        );
    }

    return (
        <div className="App">
            <div className="dashboard-layout">
                <Header onLogout={onLogout} />
                <div className="dashboard-body">
                    <Sidebar />
                    <main className="dashboard-content">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout; 