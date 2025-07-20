import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import axios from 'axios';
import Select from 'react-select';
import { applyUserTheme } from '../utils/themeUtils';
import { showSuccessToast, showErrorToast, showConfirmationDialog, showWarningToast } from '../utils/sweetAlertConfig';
import { availablePermissions } from '../utils/permissionUtils';
import TemplateCard from '../components/TemplateCard';
import Checkbox from '../components/Checkbox';
import FloatingInput from '../components/FloatingInput';
import '../styles/RoleTemplates.css';
import {
    FiPlus,
    FiEdit,
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
    FiSearch
} from 'react-icons/fi';
import roleTemplateService from '../services/roleTemplateService';
import { useNavigate } from 'react-router-dom';
import { availableColors } from '../utils/gradientUtils';
import { renderIcon } from '../utils/iconUtils';

const RoleTemplates = () => {
    const user = authService.getCurrentUser();
    const navigate = useNavigate();

    // Check permissions
    const hasPermission = (page, action) => {
        if (!user) return false;
        if (user.isAdmin) return true;

        const permission = user.permissions?.find(p => p.page === page);
        return permission?.actions?.includes(action) || false;
    };

    const canAddUsers = user && (user.isAdmin || hasPermission('users', 'add'));

    // Redirect if user doesn't have permission to add users
    useEffect(() => {
        if (!canAddUsers) {
            showErrorToast('Access Denied', 'You do not have permission to access role templates.');
            navigate('/dashboard');
            return;
        }
    }, [canAddUsers, navigate]);

    // Apply user theme preference
    useEffect(() => {
        if (user) {
            applyUserTheme(user);
        }
    }, [user]);

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formSubmitting, setFormSubmitting] = useState(false);
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



    // Add field-level validation states
    const [fieldErrors, setFieldErrors] = useState({
        name: '',
        description: '',
        icon: '',
        color: '',
        permissions: ''
    });

    // Permission display mode state
    const [permissionDisplayMode, setPermissionDisplayMode] = useState('badge'); // 'badge', 'dots', 'compact'

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

    // Handle permission changes with logical validation and warnings
    const handlePermissionChange = (page, action, checked) => {
        setFormData(prev => {
            const newPermissions = [...prev.permissions];
            const existingPermission = newPermissions.find(p => p.page === page);

            // Find current actions for this page
            let currentActions = existingPermission ? [...existingPermission.actions] : [];
            let willHave = checked ? [...currentActions, action] : currentActions.filter(a => a !== action);

            // Users page logic
            if (page === 'users') {
                if (checked && action === 'view' && willHave.includes('view_own')) {
                    showWarningToast('Invalid Permission', 'Cannot select both "View Users" and "View Own Users".');
                    return prev;
                }
                if (checked && action === 'view_own' && willHave.includes('view')) {
                    showWarningToast('Invalid Permission', 'Cannot select both "View Users" and "View Own Users".');
                    return prev;
                }
                if (checked && ['edit', 'delete', 'export'].includes(action) && !willHave.includes('view') && !willHave.includes('view_own')) {
                    showWarningToast('Invalid Permission', 'You must select either "View Users" or "View Own Users" before assigning other permissions.');
                    return prev;
                }
            }
            // Audit logs logic
            if (page === 'audit-logs') {
                if (checked && action === 'view' && willHave.includes('view_own')) {
                    showWarningToast('Invalid Permission', 'Cannot select both "View Audit Logs" and "View Own Logs".');
                    return prev;
                }
                if (checked && action === 'view_own' && willHave.includes('view')) {
                    showWarningToast('Invalid Permission', 'Cannot select both "View Audit Logs" and "View Own Logs".');
                    return prev;
                }
                if (checked && action === 'export' && !willHave.includes('view') && !willHave.includes('view_own')) {
                    showWarningToast('Invalid Permission', 'You must select either "View Audit Logs" or "View Own Logs" before assigning export.');
                    return prev;
                }
            }

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

            // Apply logical constraints
            const updatedPermissions = newPermissions.map(permission => {
                if (permission.page === 'users') {
                    const actions = [...permission.actions];

                    // Mutually exclusive view/view_own
                    if (actions.includes('view_own') && actions.includes('view')) {
                        actions.splice(actions.indexOf('view'), 1);
                    }
                    if (actions.includes('view') && actions.includes('view_own')) {
                        actions.splice(actions.indexOf('view_own'), 1);
                    }

                    // Remove edit/delete/export if neither view nor view_own
                    if (!actions.includes('view') && !actions.includes('view_own')) {
                        return { ...permission, actions: actions.filter(a => ['view', 'view_own'].includes(a)) };
                    }

                    return { ...permission, actions };
                }

                if (permission.page === 'audit-logs') {
                    const actions = [...permission.actions];

                    // Mutually exclusive view/view_own
                    if (actions.includes('view_own') && actions.includes('view')) {
                        actions.splice(actions.indexOf('view'), 1);
                    }
                    if (actions.includes('view') && actions.includes('view_own')) {
                        actions.splice(actions.indexOf('view_own'), 1);
                    }

                    // Remove export if neither view nor view_own
                    if (!actions.includes('view') && !actions.includes('view_own')) {
                        return { ...permission, actions: actions.filter(a => ['view', 'view_own'].includes(a)) };
                    }

                    return { ...permission, actions };
                }

                return permission;
            });

            return { ...prev, permissions: updatedPermissions };
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
        setFormSubmitting(false);
    };

    // Handle create template
    const handleCreateTemplate = async (e) => {
        e.preventDefault();

        setFormSubmitting(true);

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
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle update template
    const handleUpdateTemplate = async (e) => {
        e.preventDefault();

        setFormSubmitting(true);

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
        } finally {
            setFormSubmitting(false);
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

    return (
        <div className="page-container">
            <div className="page-content">
                <div className="page-header">
                    <h1 className="page-title">
                        <FiSettings /> Role Templates
                    </h1>
                    <p className="page-description">
                        Manage role templates for easy user creation
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-controls">
                    <div className="search-input-container">
                        <FloatingInput
                            type="text"
                            id="searchTemplates"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            label="Search templates"
                            icon={<FiSearch />}
                            className="search-floating-input"
                        />

                        <div className="page-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => fetchTemplates(pagination.currentPage, filterStatus, searchTerm, sortBy, sortOrder)}
                                disabled={loading}
                            >
                                <FiRefreshCw className={loading ? 'spinning' : ''} />
                                Refresh
                            </button>
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
                        </div>
                    </div>

                    {/* Permission Display Mode Toggle */}
                    <div className="permission-display-toggle" style={{
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                Permission Display:
                            </span>
                            {[
                                { mode: 'badge', label: 'Badge', icon: '🔑' },
                                { mode: 'dots', label: 'Dots', icon: '●' },
                                { mode: 'compact', label: 'Text', icon: '📝' }
                            ].map(({ mode, label, icon }) => (
                                <button
                                    key={mode}
                                    onClick={() => setPermissionDisplayMode(mode)}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        borderRadius: '6px',
                                        border: `1px solid ${permissionDisplayMode === mode ? '#1f3bb3' : '#e5e7eb'}`,
                                        backgroundColor: permissionDisplayMode === mode ? '#eaf0fb' : '#fff',
                                        color: permissionDisplayMode === mode ? '#1f3bb3' : '#6b7280',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title={label}
                                >
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                </button>
                            ))}
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
                                    // When changing to name sort, default to ascending order
                                    const newSortOrder = newSortField === 'name' ? 'asc' : sortOrder;
                                    handleSort(newSortField, newSortOrder);
                                }}
                                options={[
                                    { value: 'createdAt', label: 'Sort by Date' },
                                    { value: 'name', label: 'Sort by Name' }
                                ]}
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
                                placeholder="Sort order..."
                                isClearable={false}
                                isSearchable={false}
                            />
                        </div>
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
                                    <TemplateCard
                                        key={template._id}
                                        template={template}
                                        size="medium"
                                        variant="default"
                                        showActions={true}
                                        showStats={true}
                                        permissionDisplayMode={permissionDisplayMode}
                                        onView={handleViewTemplate}
                                        onEdit={!template.isDefault ? handleEditTemplate : null}
                                        onDelete={template.canBeDeleted ? handleDeleteTemplate : null}
                                        onToggleStatus={!template.isDefault ? handleToggleTemplateStatus : null}
                                        onClick={() => {
                                            // Handle template selection or navigation if needed
                                            // For now, just view the template
                                            handleViewTemplate(template);
                                        }}
                                        className={`
                                            ${template.isDefault ? 'template-default' : ''}
                                            ${!template.isActive ? 'template-inactive' : ''}
                                        `}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Carousel Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div className="pagination-controls">
                                <div className="pagination-info">
                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} templates
                                </div>
                                <div className="pagination-navigation">
                                    <button
                                        className="btn btn-secondary btn-sm"
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
                                                            className={`btn ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
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
                                                        className={`btn ${1 === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
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
                                                                className={`btn ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
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
                                                            className={`btn ${totalPages === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
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
                                        className="btn btn-secondary btn-sm"
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
                                <FloatingInput
                                    type="text"
                                    id="templateName"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    onBlur={() => handleFieldBlur('name')}
                                    label="Template Name"
                                    error={formSubmitting && fieldErrors.name ? fieldErrors.name : ''}
                                    required
                                />

                                <FloatingInput
                                    type="textarea"
                                    id="templateDescription"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    onBlur={() => handleFieldBlur('description')}
                                    label="Description"
                                    error={formSubmitting && fieldErrors.description ? fieldErrors.description : ''}
                                    required
                                    rows="3"
                                />

                                <div className="form-group">
                                    <p className="form-description">Choose an icon that represents this role template. The icon will be displayed in the template card and user interface.</p>
                                    <div className="icon-grid">
                                        {availableIcons.map((icon) => (
                                            <div
                                                key={icon.value}
                                                className={`icon-option ${formData.icon === icon.value ? 'selected' : ''} ${formSubmitting && fieldErrors.icon ? 'error' : ''}`}
                                                onClick={() => handleSelectChange('icon', icon)}
                                            >
                                                <div className="icon-display">
                                                    {icon.icon}
                                                </div>
                                                <span className="icon-label">{icon.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {formSubmitting && fieldErrors.icon && (
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
                                                className={`color-option ${formData.color === color.value ? 'selected' : ''} ${formSubmitting && fieldErrors.color ? 'error' : ''}`}
                                                onClick={() => handleSelectChange('color', color)}
                                            >
                                                <div className={`color-preview ${color.value}`}></div>
                                                <span className="color-label">{color.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {formSubmitting && fieldErrors.color && (
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
                                                        <Checkbox
                                                            key={action.id}
                                                            id={`permission-${permission.page}-${action.id}`}
                                                            name={`permission-${permission.page}-${action.id}`}
                                                            checked={formData.permissions.some(p =>
                                                                p.page === permission.page && p.actions.includes(action.id)
                                                            )}
                                                            onChange={(e) => handlePermissionChange(permission.page, action.id, e.target.checked)}
                                                            label={action.name}
                                                            size="medium"
                                                            variant="primary"
                                                            className="permission-checkbox"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {formSubmitting && fieldErrors.permissions && (
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
                                <FloatingInput
                                    type="text"
                                    id="editTemplateName"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    onBlur={() => handleFieldBlur('name')}
                                    label="Template Name"
                                    error={formSubmitting && fieldErrors.name ? fieldErrors.name : ''}
                                    required
                                />

                                <FloatingInput
                                    type="textarea"
                                    id="editTemplateDescription"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    onBlur={() => handleFieldBlur('description')}
                                    label="Description"
                                    error={formSubmitting && fieldErrors.description ? fieldErrors.description : ''}
                                    required
                                    rows="3"
                                />

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
                                    {formSubmitting && fieldErrors.icon && (
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
                                    {formSubmitting && fieldErrors.color && (
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
                                                        <Checkbox
                                                            key={action.id}
                                                            id={`permission-${permission.page}-${action.id}`}
                                                            name={`permission-${permission.page}-${action.id}`}
                                                            checked={formData.permissions.some(p =>
                                                                p.page === permission.page && p.actions.includes(action.id)
                                                            )}
                                                            onChange={(e) => handlePermissionChange(permission.page, action.id, e.target.checked)}
                                                            label={action.name}
                                                            size="medium"
                                                            variant="primary"
                                                            className="permission-checkbox"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {formSubmitting && fieldErrors.permissions && (
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
                                        {renderIcon(selectedTemplate.icon)}
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
                                className="btn btn-secondary "
                            >
                                Close
                            </button>
                            {!selectedTemplate.isDefault && (
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