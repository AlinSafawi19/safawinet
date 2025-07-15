import axios from 'axios';

class RoleTemplateService {
    constructor() {
        this.api = axios.create({
            baseURL: '/api',
            withCredentials: true,
            timeout: 10000
        });

        // Add auth token to requests
        const token = localStorage.getItem('authToken');
        if (token) {
            this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }

    // Get all role templates
    async getTemplates(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                status = 'all',
                search = '',
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options;

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                status,
                search,
                sortBy,
                sortOrder
            });

            const response = await this.api.get(`/role-templates?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching templates:', error);
            throw error;
        }
    }

    // Get active templates for user creation with pagination and search
    async getActiveTemplatesForUserCreation(options = {}) {
        try {
                          const {
                  page = 1,
                  limit = 9,
                  search = ''
              } = options;

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            // Add search parameter if provided
            if (search && search.trim()) {
                params.append('search', search.trim());
            }

            const response = await this.api.get(`/role-templates/active/for-user-creation?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching active templates:', error);
            throw error;
        }
    }

    // Get specific template
    async getTemplate(id) {
        try {
            const response = await this.api.get(`/role-templates/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching template:', error);
            throw error;
        }
    }

    // Create new template
    async createTemplate(templateData) {
        try {
            const response = await this.api.post('/role-templates', templateData);
            return response.data;
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    // Update template
    async updateTemplate(id, templateData) {
        try {
            const response = await this.api.put(`/role-templates/${id}`, templateData);
            return response.data;
        } catch (error) {
            console.error('Error updating template:', error);
            throw error;
        }
    }

    // Delete template
    async deleteTemplate(id) {
        try {
            const response = await this.api.delete(`/role-templates/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    }

    // Increment usage count
    async incrementUsage(id) {
        try {
            const response = await this.api.post(`/role-templates/${id}/increment-usage`);
            return response.data;
        } catch (error) {
            console.error('Error incrementing usage:', error);
            throw error;
        }
    }

    // Get available permissions
    async getAvailablePermissions() {
        try {
            const response = await this.api.get('/role-templates/permissions/available');
            return response.data;
        } catch (error) {
            console.error('Error fetching permissions:', error);
            throw error;
        }
    }

    // Convert template to user creation format
    convertTemplateForUserCreation(template) {
        return {
            id: template._id,
            name: template.name,
            icon: this.getIconComponent(template.icon),
            description: template.description,
            color: template.color,
            permissions: template.permissions,
            isAdmin: template.isAdmin
        };
    }

    // Get icon component by name
    getIconComponent(iconName) {
        // Import icons dynamically
        const iconMap = {
            'FiSettings': () => import('react-icons/fi').then(m => m.FiSettings),
            'FiAward': () => import('react-icons/fi').then(m => m.FiAward),
            'FiBriefcase': () => import('react-icons/fi').then(m => m.FiBriefcase),
            'FiUsers': () => import('react-icons/fi').then(m => m.FiUsers),
            'FiShield': () => import('react-icons/fi').then(m => m.FiShield),
            'FiUserCheck': () => import('react-icons/fi').then(m => m.FiUserCheck),
            'FiUserX': () => import('react-icons/fi').then(m => m.FiUserX),
            'FiLock': () => import('react-icons/fi').then(m => m.FiLock),
            'FiUnlock': () => import('react-icons/fi').then(m => m.FiUnlock),
            'FiEye': () => import('react-icons/fi').then(m => m.FiEye)
        };

        return iconMap[iconName] || iconMap['FiSettings'];
    }
}

export default new RoleTemplateService(); 