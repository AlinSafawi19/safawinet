import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import axios from 'axios';
import Select from 'react-select';
import { applyUserTheme } from '../utils/themeUtils';
import { showSuccessToast, showErrorToast, showConfirmationDialog } from '../utils/sweetAlertConfig';
import {
    FiPlus,
    FiEdit,
    FiTrash2,
    FiEye,
    FiSettings,
    FiAward,
    FiBriefcase,
    FiUsers,
    FiShield,
    FiX,
    FiRefreshCw,
    FiSave,
    FiUserCheck,
    FiUserX,
    FiLock,
    FiUnlock,
    FiAlertCircle,
    FiCheckCircle,
    FiToggleLeft,
    FiToggleRight,
    FiMoreVertical,
    FiSearch
} from 'react-icons/fi';
import roleTemplateService from '../services/roleTemplateService';

const RoleTemplates = () => {
    const user = authService.getCurrentUser();

    // Apply user theme preference
    useEffect(() => {
        if (user) {
            applyUserTheme(user);
        }
    }, [user]);

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 12,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Search and sort state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: 'FiSettings',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        permissions: [],
        isActive: true
    });

    // Add focus state for floating labels
    const [inputFocus, setInputFocus] = useState({
        name: false,
        description: false
    });

    // Add field-level validation states
    const [fieldErrors, setFieldErrors] = useState({
        name: '',
        description: '',
        icon: '',
        color: '',
        permissions: ''
    });

    const [fieldTouched, setFieldTouched] = useState({
        name: false,
        description: false,
        icon: false,
        color: false,
        permissions: false
    });

    // Add state for open menu
    const [openMenuId, setOpenMenuId] = useState(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.template-actions-menu') && !event.target.closest('.template-actions-kebab')) {
                setOpenMenuId(null);
            }
        };
        if (openMenuId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    // Available icons for templates
    const availableIcons = [
        { value: 'FiSettings', label: 'Settings', icon: <FiSettings /> },
        { value: 'FiAward', label: 'Award', icon: <FiAward /> },
        { value: 'FiBriefcase', label: 'Briefcase', icon: <FiBriefcase /> },
        { value: 'FiUsers', label: 'Users', icon: <FiUsers /> },
        { value: 'FiShield', label: 'Shield', icon: <FiShield /> },
        { value: 'FiUserCheck', label: 'User Check', icon: <FiUserCheck /> },
        { value: 'FiUserX', label: 'User X', icon: <FiUserX /> },
        { value: 'FiLock', label: 'Lock', icon: <FiLock /> },
        { value: 'FiUnlock', label: 'Unlock', icon: <FiUnlock /> },
        { value: 'FiEye', label: 'Eye', icon: <FiEye /> }
    ];

    // Available colors for templates
    const availableColors = [
        { value: 'bg-gradient-to-r from-blue-500 to-cyan-500', label: 'Blue', preview: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
        { value: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'Purple', preview: 'bg-gradient-to-r from-purple-500 to-pink-500' },
        { value: 'bg-gradient-to-r from-green-500 to-emerald-500', label: 'Green', preview: 'bg-gradient-to-r from-green-500 to-emerald-500' },
        { value: 'bg-gradient-to-r from-orange-500 to-red-500', label: 'Orange', preview: 'bg-gradient-to-r from-orange-500 to-red-500' },
        { value: 'bg-gradient-to-r from-indigo-500 to-purple-500', label: 'Indigo', preview: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
        { value: 'bg-gradient-to-r from-teal-500 to-cyan-500', label: 'Teal', preview: 'bg-gradient-to-r from-teal-500 to-cyan-500' }
    ];

    // Available permissions - only users page
    const availablePermissions = [
        {
            page: 'users',
            name: 'Users Management',
            description: 'Manage system users and their permissions',
            actions: [
                { id: 'view', name: 'View Users', description: 'View user list and details' },
                { id: 'add', name: 'Create Users', description: 'Create new user accounts' },
                { id: 'edit', name: 'Edit Users', description: 'Modify existing user accounts' },
                { id: 'delete', name: 'Delete Users', description: 'Remove user accounts' }
            ]
        }
    ];

    // Custom styles for React Select (same as AuditLogs)
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: '#f4f5f7',
            border: `1.5px solid ${state.isFocused ? '#1f3bb3' : '#e3e6ea'}`,
            borderRadius: '8px',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(31, 59, 179, 0.08)' : 'none',
            minHeight: '44px',
            fontSize: '1rem',
            color: '#222',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            '&:hover': {
                borderColor: '#1f3bb3'
            }
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: '#fff',
            border: '1px solid #e3e6ea',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(60,60,60,0.10)',
            zIndex: 9999
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? '#1f3bb3'
                : state.isFocused
                    ? '#eaf0fb'
                    : 'transparent',
            color: state.isSelected ? '#fff' : '#222',
            fontWeight: state.isSelected ? 600 : 400,
            fontSize: '1rem',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: state.isSelected ? '#1f3bb3' : '#eaf0fb'
            }
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#222',
            fontWeight: 500
        }),
        input: (provided) => ({
            ...provided,
            color: '#222'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#bfc5ce',
            fontWeight: 400
        }),
        dropdownIndicator: (provided, state) => ({
            ...provided,
            color: state.isFocused ? '#1f3bb3' : '#bfc5ce',
            '&:hover': {
                color: '#1f3bb3'
            }
        }),
        indicatorSeparator: (provided) => ({
            ...provided,
            backgroundColor: '#e3e6ea'
        }),
        clearIndicator: (provided) => ({
            ...provided,
            color: '#bfc5ce',
            '&:hover': {
                color: '#1f3bb3'
            }
        })
    };

    // Create API instance
    const createApiInstance = () => {
        const api = axios.create({
            baseURL: '/api',
            withCredentials: true,
            timeout: 10000
        });

        const token = localStorage.getItem('authToken');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        return api;
    };

    // Field validation functions
    const validateField = (fieldName, value) => {
        switch (fieldName) {
            case 'name':
                const trimmedName = typeof value === 'string' ? value.trim() : '';
                if (!trimmedName) {
                    return 'Template name is required';
                } else if (trimmedName.length < 2) {
                    return 'Template name must be at least 2 characters long';
                } else if (trimmedName.length > 50) {
                    return 'Template name must be less than 50 characters';
                }
                return '';

            case 'description':
                const trimmedDescription = typeof value === 'string' ? value.trim() : '';
                if (!trimmedDescription) {
                    return 'Template description is required';
                } else if (trimmedDescription.length < 10) {
                    return 'Template description must be at least 10 characters long';
                } else if (trimmedDescription.length > 200) {
                    return 'Template description must be less than 200 characters';
                }
                return '';

            case 'icon':
                if (!value) {
                    return 'Please select an icon for the template';
                }
                return '';

            case 'color':
                if (!value) {
                    return 'Please select a color theme for the template';
                }
                return '';

            case 'permissions':
                if (!value || (Array.isArray(value) && value.length === 0)) {
                    return 'Please select at least one permission for the template';
                }
                return '';

            default:
                return '';
        }
    };

    // Real-time field validation
    const handleFieldBlur = (fieldName) => {
        setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
        const error = validateField(fieldName, formData[fieldName]);
        setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    // Validate entire form
    const validateForm = () => {
        const newErrors = {};
        let hasErrors = false;

        Object.keys(formData).forEach(field => {
            const error = validateField(field, formData[field]);
            newErrors[field] = error;
            if (error) hasErrors = true;
        });

        setFieldErrors(newErrors);
        setFieldTouched({
            name: true,
            description: true,
            icon: true,
            color: true,
            permissions: true
        });

        return !hasErrors;
    };

    // Fetch templates
    const fetchTemplates = async (page = 1, status = filterStatus, search = searchTerm, sortField = sortBy, sortDirection = sortOrder) => {
        try {
            setLoading(true);

            const params = {
                page,
                limit: pagination.limit,
                status,
                search,
                sortBy: sortField,
                sortOrder: sortDirection
            };

            console.log('fetchTemplates called with params:', params); // Debug log

            const response = await roleTemplateService.getTemplates(params);

            if (response.success) {
                setTemplates(response.data);
                setPagination(response.pagination);
            } else {
                showErrorToast('Error', 'Failed to fetch role templates');
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            showErrorToast('Error', 'Failed to fetch role templates');
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchTemplates(1, filterStatus, searchTerm, sortBy, sortOrder);
    }, []);

    // Handle pagination
    const handlePageChange = (newPage) => {
        fetchTemplates(newPage, filterStatus, searchTerm, sortBy, sortOrder);
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        // Use setTimeout to debounce the search
        setTimeout(() => {
            fetchTemplates(1, filterStatus, value, sortBy, sortOrder);
        }, 300);
    };

    // Handle sort
    const handleSort = (field, order) => {
        console.log('handleSort called with:', { field, order }); // Debug log
        setSortBy(field);
        setSortOrder(order);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchTemplates(1, filterStatus, searchTerm, field, order);
    };

    // Update sort order when sort field changes
    useEffect(() => {
        if (sortBy === 'name' && sortOrder === 'desc') {
            setSortOrder('asc');
            fetchTemplates(1, filterStatus, searchTerm, sortBy, 'asc');
        }
    }, [sortBy]);

    // Handle filter change
    const handleFilterChange = (newStatus) => {
        setFilterStatus(newStatus);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchTemplates(1, newStatus, searchTerm, sortBy, sortOrder);
    };

    // Ensure only one modal is open at a time
    useEffect(() => {
        if (showCreateModal) {
            setShowEditModal(false);
            setShowViewModal(false);
        }
    }, [showCreateModal]);

    useEffect(() => {
        if (showEditModal) {
            setShowCreateModal(false);
            setShowViewModal(false);
        }
    }, [showEditModal]);

    useEffect(() => {
        if (showViewModal) {
            setShowCreateModal(false);
            setShowEditModal(false);
        }
    }, [showViewModal]);

    // Separate active and inactive templates for display
    const activeTemplates = templates.filter(template => template.isActive);
    const inactiveTemplates = templates.filter(template => !template.isActive);

    // Apply filter to sections
    const getFilteredActiveTemplates = () => {
        if (filterStatus === 'all' || filterStatus === 'active') {
            return activeTemplates;
        } else if (filterStatus === 'default') {
            return activeTemplates.filter(template => template.isDefault);
        }
        return [];
    };

    const getFilteredInactiveTemplates = () => {
        if (filterStatus === 'all' || filterStatus === 'inactive') {
            return inactiveTemplates;
        }
        return [];
    };

    // Handle permission changes
    const handlePermissionChange = (page, action, checked) => {
        setFormData(prev => {
            const newPermissions = [...prev.permissions];
            const existingPermission = newPermissions.find(p => p.page === page);

            if (checked) {
                if (existingPermission) {
                    if (!existingPermission.actions.includes(action)) {
                        existingPermission.actions.push(action);
                    }
                } else {
                    newPermissions.push({ page, actions: [action] });
                }
            } else {
                if (existingPermission) {
                    existingPermission.actions = existingPermission.actions.filter(a => a !== action);
                    if (existingPermission.actions.length === 0) {
                        newPermissions.splice(newPermissions.indexOf(existingPermission), 1);
                    }
                }
            }

            return { ...prev, permissions: newPermissions };
        });

        // Clear permission error when user makes changes
        if (fieldErrors.permissions) {
            setFieldErrors(prev => ({ ...prev, permissions: '' }));
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Helper to get floating label class
    const getFloatingLabelClass = (field) => {
        let cls = 'form-group floating-label';
        if (inputFocus[field]) cls += ' focused';
        if (formData[field]) cls += ' filled';
        if (fieldTouched[field] && fieldErrors[field]) cls += ' error';
        if (fieldTouched[field] && !fieldErrors[field] && formData[field]) cls += ' valid';
        return cls;
    };

    // Helper to get input class
    const getInputClass = (field) => {
        let cls = 'form-input';
        if (fieldTouched[field] && fieldErrors[field]) cls += ' error';
        if (fieldTouched[field] && !fieldErrors[field] && formData[field]) cls += ' valid';
        return cls;
    };

    // Handle select changes
    const handleSelectChange = (name, selectedOption) => {
        setFormData(prev => ({
            ...prev,
            [name]: selectedOption ? selectedOption.value : ''
        }));

        // Clear error when user makes a selection
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Reset form data
    const resetFormData = () => {
        setFormData({
            name: '',
            description: '',
            icon: 'FiSettings',
            color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
            permissions: [],
            isActive: true
        });
        setFieldErrors({
            name: '',
            description: '',
            icon: '',
            color: '',
            permissions: ''
        });
        setFieldTouched({
            name: false,
            description: false,
            icon: false,
            color: false,
            permissions: false
        });
        setInputFocus({
            name: false,
            description: false
        });
    };

    // Handle create template
    const handleCreateTemplate = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showErrorToast('Validation Errors', 'Please fix the highlighted errors before creating the template.');
            return;
        }

        try {
            const api = createApiInstance();
            const response = await api.post('/role-templates', formData);

            if (response.data.success) {
                showSuccessToast('Success', 'Role template created successfully');
                setShowCreateModal(false);
                resetFormData();
                fetchTemplates(pagination.currentPage, filterStatus, searchTerm, sortBy, sortOrder);
            } else {
                showErrorToast('Error', response.data.message || 'Failed to create template');
            }
        } catch (error) {
            console.error('Error creating template:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create template';
            showErrorToast('Error', errorMessage);
        }
    };

    // Handle update template
    const handleUpdateTemplate = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showErrorToast('Validation Errors', 'Please fix the highlighted errors before updating the template.');
            return;
        }

        try {
            const api = createApiInstance();
            const response = await api.put(`/role-templates/${selectedTemplate._id}`, formData);

            if (response.data.success) {
                showSuccessToast('Success', 'Role template updated successfully');
                setShowEditModal(false);
                setSelectedTemplate(null);
                resetFormData();
                fetchTemplates(pagination.currentPage, filterStatus, searchTerm, sortBy, sortOrder);
            } else {
                showErrorToast('Error', response.data.message || 'Failed to update template');
            }
        } catch (error) {
            console.error('Error updating template:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update template';
            showErrorToast('Error', errorMessage);
        }
    };

    // Handle delete template
    const handleDeleteTemplate = async (template) => {
        const result = await showConfirmationDialog(
            'Delete Template',
            `Are you sure you want to delete the "${template.name}" template? This action cannot be undone.`
        );

        if (result.isConfirmed) {
            try {
                const api = createApiInstance();
                const response = await api.delete(`/role-templates/${template._id}`);

                if (response.data.success) {
                    showSuccessToast('Success', 'Role template deleted successfully');
                    fetchTemplates(pagination.currentPage, filterStatus, searchTerm, sortBy, sortOrder);
                } else {
                    showErrorToast('Error', response.data.message || 'Failed to delete template');
                }
            } catch (error) {
                console.error('Error deleting template:', error);
                const errorMessage = error.response?.data?.message || 'Failed to delete template';
                showErrorToast('Error', errorMessage);
            }
        }
    };

    // Handle toggle template status (activate/deactivate)
    const handleToggleTemplateStatus = async (template) => {
        const action = template.isActive ? 'deactivate' : 'activate';
        const result = await showConfirmationDialog(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Template`,
            `Are you sure you want to ${action} the "${template.name}" template?`
        );

        if (result.isConfirmed) {
            try {
                const api = createApiInstance();
                const response = await api.put(`/role-templates/${template._id}`, {
                    isActive: !template.isActive
                });

                if (response.data.success) {
                    showSuccessToast('Success', `Template ${action}d successfully`);
                    fetchTemplates(pagination.currentPage, filterStatus, searchTerm, sortBy, sortOrder);
                } else {
                    showErrorToast('Error', response.data.message || `Failed to ${action} template`);
                }
            } catch (error) {
                console.error(`Error ${action}ing template:`, error);
                const errorMessage = error.response?.data?.message || `Failed to ${action} template`;
                showErrorToast('Error', errorMessage);
            }
        }
    };

    // Handle edit template
    const handleEditTemplate = (template) => {
        setSelectedTemplate(template);
        setFormData({
            name: template.name,
            description: template.description,
            icon: template.icon,
            color: template.color,
            permissions: template.permissions,
            isActive: template.isActive
        });
        // Reset validation states for edit
        setFieldErrors({
            name: '',
            description: '',
            icon: '',
            color: '',
            permissions: ''
        });
        setFieldTouched({
            name: false,
            description: false,
            icon: false,
            color: false,
            permissions: false
        });
        setInputFocus({
            name: false,
            description: false
        });
        setShowEditModal(true);
    };

    // Handle view template
    const handleViewTemplate = (template) => {
        setSelectedTemplate(template);
        setShowViewModal(true);
    };

    // Handle create new template
    const handleCreateNew = () => {
        resetFormData();
        setShowCreateModal(true);
    };

    // Get icon component by name
    const getIconComponent = (iconName) => {
        const iconMap = {
            FiSettings: <FiSettings />,
            FiAward: <FiAward />,
            FiBriefcase: <FiBriefcase />,
            FiUsers: <FiUsers />,
            FiShield: <FiShield />,
            FiUserCheck: <FiUserCheck />,
            FiUserX: <FiUserX />,
            FiLock: <FiLock />,
            FiUnlock: <FiUnlock />,
            FiEye: <FiEye />
        };
        return iconMap[iconName] || <FiSettings />;
    };

    // Check if user has permission
    const hasPermission = (page, action) => {
        if (!user) return false;
        return authService.hasPermission(page, action);
    };

    const canViewTemplates = hasPermission('users', 'view');
    const canCreateTemplates = hasPermission('users', 'add');
    const canEditTemplates = hasPermission('users', 'edit');
    const canDeleteTemplates = hasPermission('users', 'delete');

    if (!canViewTemplates) {
        return (
            <div className="role-templates-page">
                <div className="role-templates-header">
                    <h1>Role Templates</h1>
                </div>
                <div className="access-denied">
                    <FiShield />
                    <h2>Access Denied</h2>
                    <p>You don't have permission to view role templates.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="role-templates-page">
            {/* Header */}
            <div className="role-templates-header">
                <div className="header-content">
                    <div className="header-info">
                        <h1 className="page-title">
                            <FiSettings /> Role Templates
                        </h1>
                        <p className="page-description">
                            Manage role templates for easy user creation
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    {canCreateTemplates && (
                        <button
                            className="btn btn-primary"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCreateNew();
                            }}
                        >
                            <FiPlus />
                            Create Template
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-controls">
                    <div className="search-input-container">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-controls-right">
                        <Select
                            value={{
                                value: filterStatus, label: filterStatus === 'all' ? 'Show All' :
                                    filterStatus === 'active' ? 'Active Only' :
                                        filterStatus === 'inactive' ? 'Inactive Only' : 'Default Only'
                            }}
                            onChange={(selectedOption) => handleFilterChange(selectedOption ? selectedOption.value : 'all')}
                            options={[
                                { value: 'all', label: 'Show All' },
                                { value: 'active', label: 'Active Only' },
                                { value: 'inactive', label: 'Inactive Only' },
                                { value: 'default', label: 'Default Only' }
                            ]}
                            styles={customStyles}
                            placeholder="Filter by status..."
                            isClearable={false}
                            isSearchable={false}
                        />
                        <Select
                            value={{
                                value: sortBy, label: sortBy === 'createdAt' ? 'Sort by Date' : 'Sort by Name'
                            }}
                            onChange={(selectedOption) => {
                                const newSortField = selectedOption ? selectedOption.value : 'createdAt';
                                console.log('Sort field changed to:', newSortField); // Debug log
                                // When changing to name sort, default to ascending order
                                const newSortOrder = newSortField === 'name' ? 'asc' : sortOrder;
                                handleSort(newSortField, newSortOrder);
                            }}
                            options={[
                                { value: 'createdAt', label: 'Sort by Date' },
                                { value: 'name', label: 'Sort by Name' }
                            ]}
                            styles={customStyles}
                            placeholder="Sort by..."
                            isClearable={false}
                            isSearchable={false}
                        />
                        <Select
                            value={{
                                value: sortOrder, label: sortOrder === 'desc' ? 'Descending' : 'Ascending'
                            }}
                            onChange={(selectedOption) => handleSort(sortBy, selectedOption ? selectedOption.value : 'desc')}
                            options={[
                                { value: 'desc', label: 'Descending' },
                                { value: 'asc', label: 'Ascending' }
                            ]}
                            styles={customStyles}
                            placeholder="Sort order..."
                            isClearable={false}
                            isSearchable={false}
                        />
                        <button
                            className="refresh-btn"
                            onClick={() => fetchTemplates(pagination.currentPage, filterStatus, searchTerm, sortBy, sortOrder)}
                            disabled={loading}
                        >
                            <FiRefreshCw className={loading ? 'spinning' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="templates-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading templates...</p>
                    </div>
                ) : (
                    <>
                        {/* Templates Grid */}
                        {templates.length > 0 && (
                            <div className="templates-grid">
                                {templates.map((template) => (
                                    <div key={template._id} className={`template-card ${template.color}`}>
                                        <div className="template-header">
                                            <div className="template-icon">
                                                {getIconComponent(template.icon)}
                                            </div>
                                            <div className="template-actions">
                                                <div className="template-status">
                                                    {template.isDefault && (
                                                        <span className="status-badge default">Default</span>
                                                    )}
                                                    {!template.isActive && (
                                                        <span className="status-badge inactive">Inactive</span>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn-icon template-actions-kebab"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(template._id === openMenuId ? null : template._id);
                                                    }}
                                                    title="More actions"
                                                    aria-haspopup="true"
                                                    aria-expanded={openMenuId === template._id}
                                                >
                                                    <FiMoreVertical />
                                                </button>
                                                {openMenuId === template._id && (
                                                    <div className="template-actions-menu">
                                                        <button
                                                            className="menu-item"
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                handleViewTemplate(template);
                                                            }}
                                                        >
                                                            <FiEye /> View Details
                                                        </button>
                                                        {canEditTemplates && !template.isDefault && (
                                                            <button
                                                                className="menu-item"
                                                                onClick={() => {
                                                                    setOpenMenuId(null);
                                                                    handleEditTemplate(template);
                                                                }}
                                                            >
                                                                <FiEdit /> Edit Template
                                                            </button>
                                                        )}
                                                        {canEditTemplates && !template.isDefault && (
                                                            <button
                                                                className="menu-item"
                                                                onClick={() => {
                                                                    setOpenMenuId(null);
                                                                    handleToggleTemplateStatus(template);
                                                                }}
                                                            >
                                                                {template.isActive ? <FiToggleRight /> : <FiToggleLeft />} {template.isActive ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                        )}
                                                        {canDeleteTemplates && template.canBeDeleted && (
                                                            <button
                                                                className="menu-item danger"
                                                                onClick={() => {
                                                                    setOpenMenuId(null);
                                                                    handleDeleteTemplate(template);
                                                                }}
                                                            >
                                                                <FiTrash2 /> Delete Template
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="template-content">
                                            <h3 className="template-name">{template.name}</h3>
                                            <p className="template-description">{template.description}</p>
                                            <div className="template-stats">
                                                <span className="stat">
                                                    <FiUsers />
                                                    {template.usageCount} users
                                                </span>
                                                {template.lastUsed && (
                                                    <span className="stat">
                                                        Last used: {new Date(template.lastUsed).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="template-permissions">
                                                <h4>Permissions:</h4>
                                                <div className="permission-tags">
                                                    {template.permissions.map((permission, index) => (
                                                        <span key={index} className="permission-tag">
                                                            {permission.page}: {permission.actions.join(', ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Carousel Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div className="carousel-pagination-controls">
                                <div className="pagination-info">
                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} templates
                                </div>
                                <div className="carousel-navigation">
                                    <button
                                        className="carousel-btn carousel-prev"
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={!pagination.hasPrevPage}
                                        title="Previous page"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="15,18 9,12 15,6"></polyline>
                                        </svg>
                                    </button>

                                    {/* Page indicators */}
                                    <div className="page-indicators">
                                        {(() => {
                                            const indicators = [];
                                            const totalPages = pagination.totalPages;
                                            const currentPage = pagination.currentPage;
                                            
                                            if (totalPages <= 7) {
                                                // Show all pages if 7 or fewer
                                                for (let i = 1; i <= totalPages; i++) {
                                                    indicators.push(
                                                        <button
                                                            key={i}
                                                            className={`page-indicator ${i === currentPage ? 'active' : ''}`}
                                                            onClick={() => handlePageChange(i)}
                                                            title={`Page ${i}`}
                                                        >
                                                            <span className="indicator-number">{i}</span>
                                                        </button>
                                                    );
                                                }
                                            } else {
                                                // Show first page
                                                indicators.push(
                                                    <button
                                                        key={1}
                                                        className={`page-indicator ${1 === currentPage ? 'active' : ''}`}
                                                        onClick={() => handlePageChange(1)}
                                                        title="Page 1"
                                                    >
                                                        <span className="indicator-number">1</span>
                                                    </button>
                                                );
                                                
                                                // Add ellipsis if needed after first page
                                                if (currentPage > 4) {
                                                    indicators.push(
                                                        <span key="ellipsis1" className="page-ellipsis">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                
                                                // Show pages around current page
                                                const start = Math.max(2, currentPage - 1);
                                                const end = Math.min(totalPages - 1, currentPage + 1);
                                                
                                                for (let i = start; i <= end; i++) {
                                                    if (i !== 1 && i !== totalPages) {
                                                        indicators.push(
                                                <button
                                                                key={i}
                                                                className={`page-indicator ${i === currentPage ? 'active' : ''}`}
                                                                onClick={() => handlePageChange(i)}
                                                                title={`Page ${i}`}
                                                            >
                                                                <span className="indicator-number">{i}</span>
                                                </button>
                                            );
                                                    }
                                                }
                                                
                                                // Add ellipsis if needed before last page
                                                if (currentPage < totalPages - 3) {
                                                    indicators.push(
                                                        <span key="ellipsis2" className="page-ellipsis">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                
                                                // Show last page
                                                if (totalPages > 1) {
                                                    indicators.push(
                                                        <button
                                                            key={totalPages}
                                                            className={`page-indicator ${totalPages === currentPage ? 'active' : ''}`}
                                                            onClick={() => handlePageChange(totalPages)}
                                                            title={`Page ${totalPages}`}
                                                        >
                                                            <span className="indicator-number">{totalPages}</span>
                                                        </button>
                                                    );
                                                }
                                            }
                                            
                                            return indicators;
                                        })()}
                                    </div>

                                    <button
                                        className="carousel-btn carousel-next"
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={!pagination.hasNextPage}
                                        title="Next page"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9,18 15,12 9,6"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Show empty state when no templates match filter */}
                        {templates.length === 0 && !loading && (
                            <div className="empty-state">
                                <FiSettings />
                                <h3>No templates found</h3>
                                <p>No templates match the current filter. Try changing the filter or create a new template.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Template Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCreateModal(false);
                }}>
                    <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <FiPlus /> Create Role Template
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="modal-close-btn"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-content scrollable">
                            <form id="createTemplateForm" onSubmit={handleCreateTemplate} className="modal-form">
                                <div className={getFloatingLabelClass('name')}>
                                    <input
                                        type="text"
                                        id="templateName"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        onFocus={() => setInputFocus(f => ({ ...f, name: true }))}
                                        onBlur={() => {
                                            setInputFocus(f => ({ ...f, name: false }));
                                            handleFieldBlur('name');
                                        }}
                                        className={getInputClass('name')}
                                        placeholder=""
                                    />
                                    <label htmlFor="templateName" className="form-label">Template Name</label>
                                    {fieldTouched.name && fieldErrors.name && (
                                        <div className="field-error">
                                            <FiAlertCircle />
                                            <span>{fieldErrors.name}</span>
                                        </div>
                                    )}
                                    {fieldTouched.name && !fieldErrors.name && formData.name && (
                                        <div className="field-success">
                                            <FiCheckCircle />
                                            <span>Valid</span>
                                        </div>
                                    )}
                                </div>

                                <div className={getFloatingLabelClass('description')}>
                                    <textarea
                                        id="templateDescription"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        onFocus={() => setInputFocus(f => ({ ...f, description: true }))}
                                        onBlur={() => {
                                            setInputFocus(f => ({ ...f, description: false }));
                                            handleFieldBlur('description');
                                        }}
                                        className={getInputClass('description')}
                                        placeholder=""
                                        rows="3"
                                    />
                                    <label htmlFor="templateDescription" className="form-label">Description</label>
                                    {fieldTouched.description && fieldErrors.description && (
                                        <div className="field-error">
                                            <FiAlertCircle />
                                            <span>{fieldErrors.description}</span>
                                        </div>
                                    )}
                                    {fieldTouched.description && !fieldErrors.description && formData.description && (
                                        <div className="field-success">
                                            <FiCheckCircle />
                                            <span>Valid</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <p className="form-description">Choose an icon that represents this role template. The icon will be displayed in the template card and user interface.</p>
                                    <div className="icon-grid">
                                        {availableIcons.map((icon) => (
                                            <div
                                                key={icon.value}
                                                className={`icon-option ${formData.icon === icon.value ? 'selected' : ''} ${fieldTouched.icon && fieldErrors.icon ? 'error' : ''}`}
                                                onClick={() => handleSelectChange('icon', icon)}
                                            >
                                                <div className="icon-display">
                                                    {icon.icon}
                                                </div>
                                                <span className="icon-label">{icon.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {fieldTouched.icon && fieldErrors.icon && (
                                        <div className="icon-error-message">
                                            <FiAlertCircle />
                                            <span>{fieldErrors.icon}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <p className="form-description">Select a color theme for this template. The color will be used for the template card background and visual styling.</p>
                                    <div className="color-grid">
                                        {availableColors.map((color) => (
                                            <div
                                                key={color.value}
                                                className={`color-option ${formData.color === color.value ? 'selected' : ''} ${fieldTouched.color && fieldErrors.color ? 'error' : ''}`}
                                                onClick={() => handleSelectChange('color', color)}
                                            >
                                                <div className={`color-preview ${color.value}`}></div>
                                                <span className="color-label">{color.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {fieldTouched.color && fieldErrors.color && (
                                        <div className="color-error-message">
                                            <FiAlertCircle />
                                            <span>{fieldErrors.color}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <div className="permissions-section">
                                        {availablePermissions.map((permission) => (
                                            <div key={permission.page} className="permission-group">
                                                <h4 className="permission-title">{permission.name}</h4>
                                                <p className="permission-description">{permission.description}</p>
                                                <div className="permission-actions">
                                                    {permission.actions.map((action) => (
                                                        <label key={action.id} className="permission-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions.some(p =>
                                                                    p.page === permission.page && p.actions.includes(action.id)
                                                                )}
                                                                onChange={(e) => handlePermissionChange(permission.page, action.id, e.target.checked)}
                                                            />
                                                            <span className="checkmark"></span>
                                                            <span className="permission-label">{action.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {fieldTouched.permissions && fieldErrors.permissions && (
                                        <div className="icon-error-message">
                                            <FiAlertCircle />
                                            <span>{fieldErrors.permissions}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <div className="template-status-toggle">
                                    <p className="form-description">
                                            Active templates can be used when creating new users. Inactive templates are hidden from the user creation process.
                                        </p>
                                        <label className="toggle-label">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                            />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-text">
                                                {formData.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="createTemplateForm"
                                className="btn btn-primary"
                            >
                                <FiSave /> Create Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Template Modal */}
            {showEditModal && selectedTemplate && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <FiEdit /> Edit Role Template
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="modal-close-btn"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-content">
                            <form id="editTemplateForm" onSubmit={handleUpdateTemplate} className="modal-form">
                                <div className={getFloatingLabelClass('name')}>
                                    <input
                                        type="text"
                                        id="editTemplateName"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        onFocus={() => setInputFocus(f => ({ ...f, name: true }))}
                                        onBlur={() => {
                                            setInputFocus(f => ({ ...f, name: false }));
                                            handleFieldBlur('name');
                                        }}
                                        className={getInputClass('name')}
                                        placeholder="Enter template name"
                                        required
                                    />
                                    <label htmlFor="editTemplateName" className="form-label">Template Name</label>
                                    {fieldTouched.name && fieldErrors.name && (
                                        <div className="field-error">
                                            <FiAlertCircle />
                                            <span>{fieldErrors.name}</span>
                                        </div>
                                    )}
                                    {fieldTouched.name && !fieldErrors.name && formData.name && (
                                        <div className="field-success">
                                            <FiCheckCircle />
                                            <span>Valid</span>
                                        </div>
                                    )}
                                </div>

                                <div className={getFloatingLabelClass('description')}>
                                    <textarea
                                        id="editTemplateDescription"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        onFocus={() => setInputFocus(f => ({ ...f, description: true }))}
                                        onBlur={() => {
                                            setInputFocus(f => ({ ...f, description: false }));
                                            handleFieldBlur('description');
                                        }}
                                        className={getInputClass('description')}
                                        placeholder="Enter template description"
                                        rows="3"
                                        required
                                    />
                                    <label htmlFor="editTemplateDescription" className="form-label">Description</label>
                                    {fieldTouched.description && fieldErrors.description && (
                                        <div className="field-error">
                                            <FiAlertCircle />
                                            <span>{fieldErrors.description}</span>
                                        </div>
                                    )}
                                    {fieldTouched.description && !fieldErrors.description && formData.description && (
                                        <div className="field-success">
                                            <FiCheckCircle />
                                            <span>Valid</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <p className="form-description">Choose an icon that represents this role template. The icon will be displayed in the template card and user interface.</p>
                                    <div className="icon-grid">
                                        {availableIcons.map((icon) => (
                                            <div
                                                key={icon.value}
                                                className={`icon-option ${formData.icon === icon.value ? 'selected' : ''}`}
                                                onClick={() => handleSelectChange('icon', icon)}
                                            >
                                                <div className="icon-display">
                                                    {icon.icon}
                                                </div>
                                                <span className="icon-label">{icon.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {fieldTouched.icon && fieldErrors.icon && (
                                        <div className="icon-error-message">
                                            <FiAlertCircle />
                                            <span>{fieldErrors.icon}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <p className="form-description">Select a color theme for this template. The color will be used for the template card background and visual styling.</p>
                                    <div className="color-grid">
                                        {availableColors.map((color) => (
                                            <div
                                                key={color.value}
                                                className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                                                onClick={() => handleSelectChange('color', color)}
                                            >
                                                <div className={`color-preview ${color.value}`}></div>
                                                <span className="color-label">{color.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {fieldTouched.color && fieldErrors.color && (
                                        <div className="color-error-message">
                                            <FiAlertCircle />
                                            <span>{fieldErrors.color}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <div className="permissions-section">
                                        {availablePermissions.map((permission) => (
                                            <div key={permission.page} className="permission-group">
                                                <h4 className="permission-title">{permission.name}</h4>
                                                <p className="permission-description">{permission.description}</p>
                                                <div className="permission-actions">
                                                    {permission.actions.map((action) => (
                                                        <label key={action.id} className="permission-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions.some(p =>
                                                                    p.page === permission.page && p.actions.includes(action.id)
                                                                )}
                                                                onChange={(e) => handlePermissionChange(permission.page, action.id, e.target.checked)}
                                                            />
                                                            <span className="checkmark"></span>
                                                            <span className="permission-label">{action.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {fieldTouched.permissions && fieldErrors.permissions && (
                                        <div className="error-message">{fieldErrors.permissions}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <div className="template-status-toggle">
                                        <label className="toggle-label">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                            />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-text">
                                                {formData.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </label>
                                        <p className="form-description">
                                            Active templates can be used when creating new users. Inactive templates are hidden from the user creation process.
                                        </p>
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="editTemplateForm"
                                className="btn btn-primary"
                            >
                                <FiSave /> Update Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Template Modal */}
            {showViewModal && selectedTemplate && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <FiEye /> Template Details
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowViewModal(false)}
                                className="modal-close-btn"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-content scrollable template-details-modal">
                            <div className="template-details">
                                <div className="template-header-info">
                                    <div className={`template-icon ${selectedTemplate.color}`}>
                                        {getIconComponent(selectedTemplate.icon)}
                                    </div>
                                    <div className="template-info">
                                        <h3 className="template-name">{selectedTemplate.name}</h3>
                                        <p className="template-description">{selectedTemplate.description}</p>
                                        <div className="template-status-badges">
                                            {selectedTemplate.isDefault && (

                                                <div className="template-notice">
                                                    <div className="notice-content">
                                                        <h4>Default Template</h4>
                                                        <p>This is a default template and cannot be deleted, edited or deactivated. It's used for new users who don't have a specific role assigned.</p>
                                                    </div>
                                                </div>
                                            )}
                                            {!selectedTemplate.isActive && (
                                                <span className="status-badge inactive">Inactive</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="template-stats-details">
                                    <div className="stat-item">
                                        <FiUsers />
                                        <div className="stat-info">
                                            <span className="stat-label">Users with this template</span>
                                            <span className="stat-value">{selectedTemplate.usageCount || 0}</span>
                                        </div>
                                    </div>
                                    {selectedTemplate.lastUsed && (
                                        <div className="stat-item">
                                            <FiSettings />
                                            <div className="stat-info">
                                                <span className="stat-label">Last used</span>
                                                <span className="stat-value">{new Date(selectedTemplate.lastUsed).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="stat-item">
                                        <FiShield />
                                        <div className="stat-info">
                                            <span className="stat-label">Created</span>
                                            <span className="stat-value">{new Date(selectedTemplate.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="template-permissions-details">
                                    <h4 className="section-title">Permissions</h4>
                                    {selectedTemplate.permissions.length > 0 ? (
                                        <div className="permissions-list">
                                            {selectedTemplate.permissions.map((permission, index) => (
                                                <div key={index} className="permission-item">
                                                    <div className="permission-page">
                                                        <strong>{permission.page}</strong>
                                                    </div>
                                                    <div className="permission-actions-list">
                                                        {permission.actions.map((action, actionIndex) => (
                                                            <span key={actionIndex} className="permission-action">
                                                                {action}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-permissions">No permissions assigned</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={() => setShowViewModal(false)}
                                className="btn btn-secondary"
                            >
                                Close
                            </button>
                            {canEditTemplates && !selectedTemplate.isDefault && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handleEditTemplate(selectedTemplate);
                                    }}
                                    className="btn btn-primary"
                                >
                                    <FiEdit /> Edit Template
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleTemplates; 