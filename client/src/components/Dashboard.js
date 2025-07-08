import React from 'react';
import authService from '../services/authService';

const Dashboard = ({ onLogout }) => {
    const user = authService.getCurrentUser();

    // Ensure we have a valid user before rendering
    if (!user) {
        return (
            <div className="App">
                <div className="loading-container">
                    <div className="loading-spinner">⏳</div>
                    <p>Loading user data...</p>
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        try {
            await authService.logout();
            if (onLogout) {
                onLogout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="App">
            <div className="dashboard">
                <header className="dashboard-header">
                    <div className="header-content">
                        <div className="logo">
                            <img src="/logo.png" alt="SafawiNet Logo" className="logo-image" />
                            <h1>SafawiNet Dashboard</h1>
                        </div>
                        <div className="user-info">
                            <span>Welcome, {user?.firstName || user?.username}!</span>
                            <button onClick={handleLogout} className="logout-button">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main className="dashboard-main">
                    <div className="welcome-section">
                        <h2>Welcome to SafawiNet</h2>
                        <p>You are successfully logged in as {user?.username}</p>
                        <div className="user-details">
                            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                            <p><strong>Email:</strong> {user?.email}</p>
                            <p><strong>Role:</strong> {user?.isAdmin ? 'Administrator' : 'User'}</p>
                            <p><strong>Status:</strong> {user?.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard; 