import React, { useEffect, useState, createContext, useContext } from 'react';
import authService from '../services/authService';
import LoadingOverlay from './LoadingOverlay';
import Header from './Header';
import Sidebar from './Sidebar';
import { initializeTheme } from '../utils/themeUtils';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import '../styles/DashboardLayout.css';

// Create Toast Context
const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a DashboardLayout');
    }
    return context;
};

const DashboardLayout = ({ onLogout, children }) => {
    const user = authService.getCurrentUser();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
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

    // Ensure we have a valid user before rendering
    if (!user) {
        return (
            <div className="App">
                <LoadingOverlay isLoading={true} />
            </div>
        );
    }

    return (
        <ToastContext.Provider value={{ setToast }}>
            <div className="App">
                <div className="dashboard-layout">
                    <Header onLogout={onLogout} onMobileMenuToggle={toggleMobileMenu} />
                    
                    {/* Toast Notification */}
                    {toast.show && (
                        <div className={`toast-notification ${toast.type}`}>
                            <div className="toast-content">
                                <span className={`toast-icon ${toast.type}`}>
                                    {toast.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                                </span>
                                <span className="toast-message">{toast.message}</span>
                                <button 
                                    className="toast-close" 
                                    onClick={() => setToast({ show: false, message: '', type: 'success' })}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className="dashboard-body">
                        <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
                        <main className="dashboard-content">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </ToastContext.Provider>
    );
};

export default DashboardLayout; 