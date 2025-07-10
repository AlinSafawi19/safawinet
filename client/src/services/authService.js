import axios from 'axios';
import config from '../config/config';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: config.apiUrl,
    withCredentials: true, // Important for cookies
    timeout: 10000
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const response = await api.post('/auth/refresh');
                const { token } = response.data.data;
                
                // Store new token
                localStorage.setItem('authToken', token);
                
                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                // Let React Router handle the redirection
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

class AuthService {
    constructor() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        this.loadFromStorage();
    }

    // Load user data from localStorage
    loadFromStorage() {
        try {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('authToken');
            
            if (storedUser && storedToken) {
                this.user = JSON.parse(storedUser);
                this.token = storedToken;
                this.isAuthenticated = true;
            }
        } catch (error) {
            console.error('Error loading auth data from storage:', error);
            this.clearAuth();
        }
    }

    // Save auth data to localStorage
    saveToStorage() {
        if (this.user && this.token) {
            localStorage.setItem('user', JSON.stringify(this.user));
            localStorage.setItem('authToken', this.token);
        }
    }

    // Clear auth data
    clearAuth() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
    }

    // Login method
    async login(identifier, password, rememberMe = false) {
        try {
            const response = await api.post('/auth/login', {
                identifier,
                password,
                rememberMe
            });

            if (response.data.success) {
                const { user, token, expiresIn } = response.data.data;
                
                this.user = user;
                this.token = token;
                this.isAuthenticated = true;
                
                this.saveToStorage();
                
                return {
                    success: true,
                    user,
                    token,
                    expiresIn
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.response?.status === 429) {
                return {
                    success: false,
                    message: error.response.data.message,
                    retryAfter: error.response.data.retryAfter
                };
            }
            
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    }

    // Logout method
    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
        }
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated && this.user && this.token;
    }

    // Check if user is admin
    isAdmin() {
        return this.user?.isAdmin || false;
    }

    // Check user permissions
    hasPermission(page, action) {
        if (!this.user) return false;
        if (this.user.isAdmin) return true;
        
        const permission = this.user.permissions?.find(p => p.page === page);
        return permission?.actions?.includes(action) || false;
    }

    // Get user permissions for a page
    getPagePermissions(page) {
        if (!this.user) return [];
        if (this.user.isAdmin) return ['view', 'add', 'edit', 'delete'];
        
        const permission = this.user.permissions?.find(p => p.page === page);
        return permission?.actions || [];
    }

    // Validate token
    async validateToken() {
        try {
            const response = await api.get('/auth/validate');
            if (response.data.success) {
                this.user = response.data.data.user;
                this.saveToStorage();
                return true;
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.clearAuth();
            return false;
        }
    }

    // Refresh token
    async refreshToken() {
        try {
            const response = await api.post('/auth/refresh');
            if (response.data.success) {
                const { token } = response.data.data;
                this.token = token;
                this.saveToStorage();
                return true;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.clearAuth();
            return false;
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await api.put('/auth/profile', profileData);
            if (response.data.success) {
                this.user = response.data.data;
                this.saveToStorage();
                return {
                    success: true,
                    user: this.user
                };
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Profile update failed'
            };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await api.put('/auth/change-password', {
                currentPassword,
                newPassword
            });
            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            console.error('Password change error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Password change failed'
            };
        }
    }

    // Forgot password
    async forgotPassword(email) {
        try {
            const response = await api.post('/auth/forgot-password', {
                email
            });
            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            console.error('Forgot password error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send reset email'
            };
        }
    }

    // Reset password
    async resetPassword(token, newPassword) {
        try {
            const response = await api.post('/auth/reset-password', {
                token,
                newPassword
            });
            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to reset password'
            };
        }
    }

    // Get user profile
    async getProfile() {
        try {
            const response = await api.get('/auth/profile');
            if (response.data.success) {
                this.user = response.data.data;
                this.saveToStorage();
                return {
                    success: true,
                    user: this.user
                };
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch profile'
            };
        }
    }

    // Initialize auth state
    async init() {
        // Only validate token if we have stored auth data
        if (this.isUserAuthenticated()) {
            try {
                const isValid = await this.validateToken();
                if (!isValid) {
                    this.clearAuth();
                }
            } catch (error) {
                console.error('Token validation failed during init:', error);
                // Don't clear auth on network errors, only on validation failures
            }
        }
    }

    // Check authentication without validation (for routing)
    isAuthenticatedForRouting() {
        const isAuth = this.isAuthenticated && this.user && this.token;
        console.log('AuthService isAuthenticatedForRouting:', {
            isAuthenticated: this.isAuthenticated,
            hasUser: !!this.user,
            hasToken: !!this.token,
            result: isAuth
        });
        return isAuth;
    }
}

// Create singleton instance
const authService = new AuthService();

export default authService; 