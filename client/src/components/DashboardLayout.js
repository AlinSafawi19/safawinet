import React from 'react';
import authService from '../services/authService';
import LoadingOverlay from './LoadingOverlay';
import Header from './Header';
import Sidebar from './Sidebar';
import '../styles/Dashboard.css';

const DashboardLayout = ({ onLogout, children }) => {
    const user = authService.getCurrentUser();

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