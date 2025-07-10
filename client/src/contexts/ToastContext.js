import React, { createContext, useContext, useState } from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import '../styles/Toast.css';

// Create Toast Context
const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a default implementation if context is not available
        return {
            setToast: (toast) => {
                // Fallback: use browser alert if toast context is not available
                if (toast.show) {
                    alert(`${toast.type.toUpperCase()}: ${toast.message}`);
                }
            }
        };
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (toastData) => {
        setToast(toastData);
        
        // Auto-hide toast after 5 seconds
        if (toastData.show) {
            setTimeout(() => {
                setToast({ show: false, message: '', type: 'success' });
            }, 5000);
        }
    };

    return (
        <ToastContext.Provider value={{ setToast: showToast }}>
            {children}
            
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
        </ToastContext.Provider>
    );
}; 