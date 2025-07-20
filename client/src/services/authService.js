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

class AuthService {
    constructor() {
        this.user = null;
        this.token = null;
        this.refreshToken = null;
        this.isAuthenticated = false;
        this.loadFromStorage();
        this.setupResponseInterceptor();
    }

    // Setup response interceptor after instance is created
    setupResponseInterceptor() {
        api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Skip token refresh for login requests and unauthenticated requests
                if (error.response?.status === 401 && 
                    !originalRequest._retry && 
                    !originalRequest.url.includes('/auth/login') &&
                    this.token) {
                    originalRequest._retry = true;

                    try {
                        // Try to refresh token using this instance
                        const refreshSuccess = await this.refreshToken();
                        
                        if (refreshSuccess) {
                            // Retry original request with new token
                            originalRequest.headers.Authorization = `Bearer ${this.token}`;
                            return api(originalRequest);
                        } else {
                            throw new Error('Token refresh failed');
                        }
                    } catch (refreshError) {
                        // Refresh failed, clear auth data
                        this.clearAuth();
                        // Let React Router handle the redirection
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Load user data from localStorage
    loadFromStorage() {
        try {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('authToken');
            const storedRefreshToken = localStorage.getItem('refreshToken');
            
            if (storedUser && storedToken) {
                this.user = JSON.parse(storedUser);
                this.token = storedToken;
                this.refreshToken = storedRefreshToken;
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
            if (this.refreshToken) {
                localStorage.setItem('refreshToken', this.refreshToken);
            }
        }
    }

    // Clear auth data
    clearAuth() {
        this.user = null;
        this.token = null;
        this.refreshToken = null;
        this.isAuthenticated = false;
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
    }

    // Login method
    async login(identifier, password, rememberMe = false, twoFactorCode = null, backupCode = null) {
        try {
            const loginData = {
                identifier,
                password,
                rememberMe
            };

            if (twoFactorCode) {
                loginData.twoFactorCode = twoFactorCode;
            }

            if (backupCode) {
                loginData.backupCode = backupCode;
            }

            const response = await api.post('/auth/login', loginData);

            if (response.data.success) {
                const { user, token, refreshToken, expiresIn } = response.data.data;
                
                this.user = user;
                this.token = token;
                this.refreshToken = refreshToken;
                this.isAuthenticated = true;
                
                this.saveToStorage();
                
                return {
                    success: true,
                    user,
                    token,
                    refreshToken,
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

            if (error.response?.status === 401 && error.response?.data?.requiresTwoFactor) {
                return {
                    success: false,
                    requiresTwoFactor: true,
                    message: error.response.data.message
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
        if (this.user.isAdmin) return ['view', 'view_own', 'add', 'edit', 'delete', 'export'];
        
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
            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await api.post('/auth/refresh', {
                refreshToken: this.refreshToken
            });
            
            if (response.data.success) {
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                this.token = accessToken;
                this.refreshToken = newRefreshToken;
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

    // Upload profile picture
    async uploadProfilePicture(file) {
        try {
            const formData = new FormData();
            formData.append('profilePicture', file);

            const response = await api.post('/auth/profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                this.user.profilePicture = response.data.data.profilePicture;
                this.saveToStorage();
                return {
                    success: true,
                    profilePicture: response.data.data.profilePicture
                };
            }
        } catch (error) {
            console.error('Profile picture upload error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to upload profile picture'
            };
        }
    }

    // Remove profile picture
    async removeProfilePicture() {
        try {
            const response = await api.delete('/auth/profile-picture');
            if (response.data.success) {
                this.user.profilePicture = null;
                this.saveToStorage();
                return {
                    success: true
                };
            }
        } catch (error) {
            console.error('Profile picture removal error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to remove profile picture'
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
        return isAuth;
    }
}

// Create singleton instance
const authService = new AuthService();

export default authService; 