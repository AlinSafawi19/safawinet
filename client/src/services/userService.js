import authService from './authService';

class UserService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    }

    // Get auth headers
    getAuthHeaders() {
        const token = authService.token;
        if (!token) {
            throw new Error('No authentication token available. Please log in.');
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // Get users with pagination and filtering
    async getUsers(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            // Add pagination parameters
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            
            // Add filter parameters
            if (params.search) queryParams.append('search', params.search);
            if (params.role) queryParams.append('role', params.role);
            if (params.isActive !== undefined && params.isActive !== '') {
                queryParams.append('isActive', params.isActive);
            }
            if (params.createdBy) queryParams.append('createdBy', params.createdBy);
            
            // Add sorting parameters
            if (params.sortBy) queryParams.append('sortBy', params.sortBy);
            if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

            const response = await fetch(`${this.baseURL}/users?${queryParams}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access denied. You do not have permission to view users.');
                }
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }

    // Get filter options for users
    async getFilterOptions(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            // Add pagination and search parameters
            if (params.search) queryParams.append('search', params.search);
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);

            const response = await fetch(`${this.baseURL}/users/filter-options?${queryParams}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access denied. You do not have permission to view filter options.');
                }
                throw new Error('Failed to fetch filter options');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get filter options error:', error);
            throw error;
        }
    }

    // Get single user by ID
    async getUserById(userId) {
        try {
            const response = await fetch(`${this.baseURL}/users/${userId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access denied. You do not have permission to view this user.');
                }
                if (response.status === 404) {
                    throw new Error('User not found');
                }
                throw new Error('Failed to fetch user');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    }

    // Create new user
    async createUser(userData) {
        try {
            const response = await fetch(`${this.baseURL}/users`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create user');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Create user error:', error);
            throw error;
        }
    }

    // Update user
    async updateUser(userId, userData) {
        try {
            const response = await fetch(`${this.baseURL}/users/${userId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    }

    // Delete user
    async deleteUser(userId) {
        try {
            const response = await fetch(`${this.baseURL}/users/${userId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    }

    // Bulk delete users
    async bulkDeleteUsers(userIds) {
        try {
            const response = await fetch(`${this.baseURL}/users/bulk`, {
                method: 'DELETE',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ userIds })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete users');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Bulk delete users error:', error);
            throw error;
        }
    }

    // Update user permissions
    async updateUserPermissions(userId, permissions) {
        try {
            const response = await fetch(`${this.baseURL}/users/${userId}/permissions`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ permissions })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user permissions');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Update user permissions error:', error);
            throw error;
        }
    }

    // Get available permissions
    async getAvailablePermissions() {
        try {
            const response = await fetch(`${this.baseURL}/users/permissions/available`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch available permissions');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get available permissions error:', error);
            throw error;
        }
    }

    // Check if current user has permission to view users
    hasViewPermission() {
        return authService.hasPermission('users', 'view');
    }

    // Check if current user has permission to view own users
    hasViewOwnPermission() {
        return authService.hasPermission('users', 'view_own');
    }

    // Check if current user has permission to create users
    hasCreatePermission() {
        return authService.hasPermission('users', 'add');
    }

    // Check if current user has permission to edit users
    hasEditPermission() {
        return authService.hasPermission('users', 'edit');
    }

    // Check if current user has permission to delete users
    hasDeletePermission() {
        return authService.hasPermission('users', 'delete');
    }

    // Get user's permissions for users page
    getUserPermissions() {
        return authService.getPagePermissions('users');
    }

    // Export users to CSV
    async exportUsers(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            // Add filter parameters
            if (params.search) queryParams.append('search', params.search);
            if (params.role) queryParams.append('role', params.role);
            if (params.isActive !== undefined && params.isActive !== '') {
                queryParams.append('isActive', params.isActive);
            }
            
            // Add sorting parameters
            if (params.sortBy) queryParams.append('sortBy', params.sortBy);
            if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

            const response = await fetch(`${this.baseURL}/users/export?${queryParams}`, {
                method: 'GET',
                headers: {
                    ...this.getAuthHeaders(),
                    'Accept': 'text/csv'
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access denied. You do not have permission to export users.');
                }
                throw new Error('Failed to export users');
            }

            const blob = await response.blob();
            return blob;
        } catch (error) {
            console.error('Export users error:', error);
            throw error;
        }
    }
}

export default new UserService(); 