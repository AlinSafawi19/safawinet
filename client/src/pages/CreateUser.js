import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import roleTemplateService from '../services/roleTemplateService';
import axios from 'axios';
import { applyUserTheme } from '../utils/themeUtils';
import { showSuccessToast, showErrorToast, showWarningToast } from '../utils/sweetAlertConfig';
import FloatingInput from '../components/FloatingInput';
import TemplateCard from '../components/TemplateCard';
import Checkbox from '../components/Checkbox';
import { availablePermissions } from '../utils/permissionUtils';
import {
    FiShield,
    FiSettings,
    FiSave,
    FiUserPlus,
    FiSearch
} from 'react-icons/fi';

const CreateUser = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    // Apply user theme preference
    useEffect(() => {
        if (user) {
            applyUserTheme(user);
        }
    }, [user]);

    // Fetch templates and permissions
    const fetchTemplates = async (page = 1, search = templateSearchTerm) => {
        try {
            setTemplatesLoading(true);
            // Fetch templates with pagination and search
            const templatesResponse = await roleTemplateService.getActiveTemplatesForUserCreation({
                page,
                limit: templatePagination?.limit || 9,
                search
            });

            if (templatesResponse.success) {
                const templates = templatesResponse.data.map(template => ({
                    id: template._id,
                    name: template.name,
                    icon: template.icon,
                    description: template.description,
                    color: template.color,
                    permissions: template.permissions,
                    isAdmin: template.isAdmin,
                    isDefault: template.isDefault,
                    isActive: template.isActive
                }));

                // Add custom template to all pages
                templates.unshift({
                    id: 'custom',
                    name: 'Custom Role',
                    icon: 'FiSettings',
                    description: 'Create your own custom permissions',
                    color: 'bg-gradient-to-r from-orange-500 to-red-500',
                    permissions: [],
                    isAdmin: false
                });

                setUserTemplates(templates);
                // Set pagination data with fallback values
                setTemplatePagination(templatesResponse.pagination || {
                    currentPage: page,
                    totalPages: 1,
                    totalCount: templates.length,
                    limit: templatePagination?.limit || 9,
                    hasNextPage: false,
                    hasPrevPage: page > 1
                });
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            showErrorToast('Error', 'Failed to load templates');
            // Set default pagination on error
            setTemplatePagination({
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,
                limit: templatePagination?.limit || 9,
                hasNextPage: false,
                hasPrevPage: false
            });
        } finally {
            setTemplatesLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates(1, templateSearchTerm);
    }, []);

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        firstName: '',
        lastName: '',
        isAdmin: false,
        permissions: []
    });

    // Add field-level validation states
    const [fieldErrors, setFieldErrors] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        password: ''
    });

    // User creation templates - will be loaded from API
    const [userTemplates, setUserTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(true);

    // Pagination state for templates
    const [templatePagination, setTemplatePagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 9,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Search state for templates
    const [templateSearchTerm, setTemplateSearchTerm] = useState('');

    // Permission display mode state
    const [permissionDisplayMode, setPermissionDisplayMode] = useState('badge'); // 'badge', 'dots', 'compact'

    // Selected template state (for step 1)
    const [selectedTemplateForStep1, setSelectedTemplateForStep1] = useState(null);

    // Available permissions are now imported from permissionUtils

    // Add state for save as template
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [templateNameError, setTemplateNameError] = useState('');
    const [templateDescriptionError, setTemplateDescriptionError] = useState('');

    // Create API instance
    const createApiInstance = useCallback(() => {
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
    }, []);

    // Field validation functions
    const validateField = (fieldName, value) => {
        const trimmedValue = value.trim();

        switch (fieldName) {
            case 'firstName':
                if (!trimmedValue) {
                    return 'First name is required';
                } else if (trimmedValue.length < 2) {
                    return 'First name must be at least 2 characters long';
                }
                return '';

            case 'lastName':
                if (!trimmedValue) {
                    return 'Last name is required';
                } else if (trimmedValue.length < 2) {
                    return 'Last name must be at least 2 characters long';
                }
                return '';

            case 'username':
                if (!trimmedValue) {
                    return 'Username is required';
                } else if (trimmedValue.length < 3) {
                    return 'Username must be at least 3 characters long';
                } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedValue)) {
                    return 'Username can only contain letters, numbers, and underscores';
                }
                return '';

            case 'email':
                if (!trimmedValue) {
                    return 'Email address is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
                    return 'Please enter a valid email address';
                }
                return '';

            case 'phone':
                if (!trimmedValue) {
                    return 'Phone number is required';
                } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(trimmedValue.replace(/[\s\-\(\)]/g, ''))) {
                    return 'Please enter a valid phone number';
                }
                return '';

            case 'password':
                if (!value) {
                    return 'Password is required';
                } else if (value.length < 8) {
                    return 'Password must be at least 8 characters long';
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

    // Validation functions for step navigation
    const validateStep1 = () => {
        if (!selectedTemplateForStep1) {
            showWarningToast('Template Required', 'Please select a user template to continue.');
            return false;
        }
        return true;
    };

    const validateStep2 = async () => {
        if (selectedTemplateForStep1?.id === 'custom' && formData.permissions.length === 0) {
            showWarningToast('Permissions Required', 'Please select at least one permission for the custom role.');
            return false;
        }

        // If saving as template, validate template fields
        if (selectedTemplateForStep1?.id === 'custom' && saveAsTemplate) {
            let hasErrors = false;

            // Clear previous errors
            setTemplateNameError('');
            setTemplateDescriptionError('');

            // Validate template name
            if (!templateName.trim()) {
                setTemplateNameError('Template name is required.');
                hasErrors = true;
            } else if (templateName.trim().length < 2) {
                setTemplateNameError('Template name must be at least 2 characters long.');
                hasErrors = true;
            }

            // Validate template description
            if (!templateDescription.trim()) {
                setTemplateDescriptionError('Template description is required.');
                hasErrors = true;
            } else if (templateDescription.trim().length < 10) {
                setTemplateDescriptionError('Template description must be at least 10 characters long.');
                hasErrors = true;
            }

            // Check for duplicate template name only if name is valid
            if (templateName.trim() && templateName.trim().length >= 2) {
                try {
                    const api = createApiInstance();
                    const response = await api.get('/role-templates');
                    if (response.data.success) {
                        const existingTemplate = response.data.data.find(template =>
                            template.name.toLowerCase() === templateName.trim().toLowerCase()
                        );
                        if (existingTemplate) {
                            setTemplateNameError('A template with this name already exists.');
                            hasErrors = true;
                        }
                    }
                } catch (error) {
                    console.error('Error checking for duplicate template:', error);
                    setTemplateNameError('Failed to verify template name. Please try again.');
                    hasErrors = true;
                }
            }

            if (hasErrors) {
                return false;
            }
        }

        return true;
    };

    const validateStep3 = () => {
        // Validate all fields
        const newErrors = {};
        let hasErrors = false;

        Object.keys(formData).forEach(field => {
            if (['firstName', 'lastName', 'username', 'email', 'phone', 'password'].includes(field)) {
                const error = validateField(field, formData[field]);
                newErrors[field] = error;
                if (error) hasErrors = true;
            }
        });

        setFieldErrors(newErrors);

        if (hasErrors) {
            showErrorToast('Validation Errors', 'Please fix the highlighted errors before continuing.');
            return false;
        }

        return true;
    };

    // Handle template selection (for step 1)
    const handleTemplateSelect = (template) => {
        setSelectedTemplateForStep1(template);
        setFormData(prev => ({
            ...prev,
            isAdmin: template.isAdmin,
            permissions: template.permissions
        }));
    };

    // Handle proceed to next step
    const handleProceedToNext = () => {
        if (!selectedTemplateForStep1) {
            showWarningToast('Template Required', 'Please select a user template to continue.');
            return;
        }

        setSelectedTemplate(selectedTemplateForStep1);

        // If it's a predefined template (not custom), skip step 2 and go directly to step 3
        if (selectedTemplateForStep1.id !== 'custom') {
            setCurrentStep(3);
        } else {
            // For custom template, go to step 2 to configure permissions
            setCurrentStep(2);
        }
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

                    // If user has view_own, they can't have view (mutually exclusive)
                    if (actions.includes('view_own') && actions.includes('view')) {
                        actions.splice(actions.indexOf('view'), 1);
                    }

                    // If user has view, they can't have view_own (mutually exclusive)
                    if (actions.includes('view') && actions.includes('view_own')) {
                        actions.splice(actions.indexOf('view_own'), 1);
                    }

                    // If user has no view or view_own, remove other permissions
                    if (!actions.includes('view') && !actions.includes('view_own')) {
                        return { ...permission, actions: actions.filter(a => ['view', 'view_own'].includes(a)) };
                    }

                    return { ...permission, actions };
                }

                if (permission.page === 'audit-logs') {
                    const actions = [...permission.actions];

                    // If user has view_own, they can't have view (mutually exclusive)
                    if (actions.includes('view_own') && actions.includes('view')) {
                        actions.splice(actions.indexOf('view'), 1);
                    }

                    // If user has view, they can't have view_own (mutually exclusive)
                    if (actions.includes('view') && actions.includes('view_own')) {
                        actions.splice(actions.indexOf('view_own'), 1);
                    }

                    // If user has no view or view_own, remove export
                    if (!actions.includes('view') && !actions.includes('view_own')) {
                        return { ...permission, actions: actions.filter(a => ['view', 'view_own'].includes(a)) };
                    }

                    return { ...permission, actions };
                }

                return permission;
            });

            return { ...prev, permissions: updatedPermissions };
        });
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



    // Handle template pagination
    const handleTemplatePageChange = (newPage) => {
        fetchTemplates(newPage, templateSearchTerm);
    };

    // Handle template search
    const handleTemplateSearch = (value) => {
        setTemplateSearchTerm(value);
        setTemplatePagination(prev => ({ ...prev, currentPage: 1 }));
        // Use setTimeout to debounce the search
        setTimeout(() => {
            fetchTemplates(1, value);
        }, 300);
    };

    // Handle step navigation
    const handleStepNavigation = async (direction) => {
        if (direction === 'next') {
            if (currentStep === 1 && !validateStep1()) return;
            if (currentStep === 2 && selectedTemplateForStep1?.id === 'custom') {
                setValidating(true);
                try {
                    const isValid = await validateStep2();
                    if (!isValid) return;
                } finally {
                    setValidating(false);
                }
            }
            if (currentStep === 3 && !validateStep3()) return;
            if (currentStep < 3) {
                setCurrentStep(currentStep + 1);
            }
        } else if (direction === 'back' && currentStep > 1) {
            // If going back from step 3 and we have a predefined template, go back to step 1
            if (currentStep === 3 && selectedTemplateForStep1?.id !== 'custom') {
                setCurrentStep(1);
            } else {
                setCurrentStep(currentStep - 1);
            }
        }
    };

    // Handle form submission
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep3()) return;

        setLoading(true);

        try {
            let templateId = selectedTemplate?.id;
            // If custom and saveAsTemplate, create template first
            if (selectedTemplate?.id === 'custom' && saveAsTemplate) {
                try {
                    const res = await roleTemplateService.createTemplate({
                        name: templateName.trim(),
                        description: templateDescription.trim(),
                        icon: 'FiSettings',
                        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
                        isAdmin: false,
                        permissions: formData.permissions
                    });
                    if (res.success && res.data) {
                        templateId = res.data._id;
                        showSuccessToast('Template Saved', 'Custom role template saved successfully.');
                    } else if (res.isDuplicate && res.existingTemplate) {
                        templateId = res.existingTemplate._id;
                        showWarningToast('Duplicate Template', res.message || 'A template with these permissions already exists.');
                    } else {
                        showErrorToast('Template Error', res.message || 'Failed to save template.');
                    }
                } catch (err) {
                    showErrorToast('Template Error', err.message || 'Failed to save template.');
                }
            }

            const api = createApiInstance();
            const userData = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                password: formData.password,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                isAdmin: formData.isAdmin,
                permissions: formData.permissions
            };

            const response = await api.post('/users', userData);

            if (response.data.success) {
                // Increment template usage count if not custom
                if (templateId && templateId !== 'custom') {
                    try {
                        await roleTemplateService.incrementUsage(templateId);
                    } catch (error) {
                        console.error('Error incrementing template usage:', error);
                    }
                }

                showSuccessToast(
                    'User Created Successfully!',
                    `User "${formData.firstName} ${formData.lastName}" has been created with ${selectedTemplate?.name} role.`
                );
                navigate('/users');
            } else {
                showErrorToast('Creation Failed', response.data.message || 'An error occurred while creating the user.');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while creating the user.';
            showErrorToast('Creation Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Check if user has permission to create users
    const canCreateUsers = user && authService.hasPermission('users', 'add');

    if (!canCreateUsers) {
        return (
            <div className="create-user-page">
                <div className="create-user-header">
                    <h1>Create User</h1>
                </div>
                <div className="access-denied">
                    <FiShield />
                    <h2>Access Denied</h2>
                    <p>You don't have permission to create users.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-content">
                <div className="page-header">
                    <h1 className="page-title">
                        <FiUserPlus /> Create New User
                    </h1>
                    <p className="page-description">
                        Add a new user to the system with appropriate permissions
                    </p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-label">Select Template</div>
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep >= 3 && selectedTemplate?.id !== 'custom' ? 'completed' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">Configure Permissions</div>
                </div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <div className="step-label">User Details</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="create-user-content">
                {currentStep === 1 && (
                    <div className="step-content">
                        <div className="step-header">
                            <h2>Select User Template</h2>
                            <p>Choose a user template to get started, or create a custom role with specific permissions.</p>
                        </div>

                        {/* Template Search */}
                        <div className="template-search-section">
                            <FloatingInput
                                type="text"
                                id="templateSearch"
                                value={templateSearchTerm}
                                onChange={(e) => handleTemplateSearch(e.target.value)}
                                label="Search Templates"
                                icon={<FiSearch />}
                                autoComplete="off"
                            />

                            {/* Permission Display Mode Toggle */}
                            <div className="permission-display-toggle" style={{
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '12px'
                            }}>
                                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                    Permission Display:
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
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
                            </div>
                        </div>

                        {templatesLoading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading templates...</p>
                            </div>
                        ) : (
                            <>
                                <div className="template-grid">
                                    {userTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            size="medium"
                                            variant="selectable"
                                            selected={selectedTemplateForStep1?.id === template.id}
                                            onClick={handleTemplateSelect}
                                            permissionDisplayMode={permissionDisplayMode}
                                            tooltipEnabled={true}
                                        />
                                    ))}
                                </div>

                                {/* Template Pagination Controls */}
                                {templatePagination?.totalPages > 1 && (
                                    <div className="pagination-controls">
                                        <div className="pagination-info">
                                            Showing {((templatePagination?.currentPage || 1) - 1) * (templatePagination?.limit || 6) + 1} to {Math.min((templatePagination?.currentPage || 1) * (templatePagination?.limit || 6), templatePagination?.totalCount || 0)} of {templatePagination?.totalCount || 0} templates
                                        </div>
                                        <div className="pagination-navigation">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleTemplatePageChange((templatePagination?.currentPage || 1) - 1)}
                                                disabled={!templatePagination?.hasPrevPage}
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
                                                    const totalPages = templatePagination?.totalPages || 1;
                                                    const currentPage = templatePagination?.currentPage || 1;

                                                    if (totalPages <= 7) {
                                                        // Show all pages if 7 or fewer
                                                        for (let i = 1; i <= totalPages; i++) {
                                                            indicators.push(
                                                                <button
                                                                    key={i}
                                                                    className={`btn ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                                                                    onClick={() => handleTemplatePageChange(i)}
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
                                                                onClick={() => handleTemplatePageChange(1)}
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
                                                                        onClick={() => handleTemplatePageChange(i)}
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
                                                                    onClick={() => handleTemplatePageChange(totalPages)}
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
                                                onClick={() => handleTemplatePageChange((templatePagination?.currentPage || 1) + 1)}
                                                disabled={!templatePagination?.hasNextPage}
                                                title="Next page"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9,18 15,12 9,6"></polyline>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Show empty state when no templates */}
                                {userTemplates.length === 0 && !templatesLoading && (
                                    <div className="empty-state">
                                        <FiSettings />
                                        <h3>No templates available</h3>
                                        <p>No role templates are currently available for user creation.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {currentStep === 2 && selectedTemplate?.id === 'custom' && (
                    <div className="step-content">
                        <div className="step-header">
                            <h2>Configure Permissions</h2>
                            <p>Select the permissions you want to grant to this user role.</p>
                        </div>

                        {/* Save as Template Toggle for Custom Role */}
                        {selectedTemplate?.id === 'custom' && formData.permissions.length > 0 && (
                            <div className="save-as-template-toggle" style={{ marginBottom: 24 }}>
                                <Checkbox
                                    id="save-as-template"
                                    name="saveAsTemplate"
                                    checked={saveAsTemplate}
                                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                                    label="Save this custom role as a template"
                                    size="medium"
                                    variant="primary"
                                />
                                {saveAsTemplate && (
                                    <div className="template-fields" style={{ marginTop: 12 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <FloatingInput
                                                type="text"
                                                id="templateName"
                                                value={templateName}
                                                onChange={e => {
                                                    setTemplateName(e.target.value);
                                                    if (templateNameError) setTemplateNameError('');
                                                }}
                                                label="Template Name"
                                                error={templateNameError}
                                                autoComplete="off"
                                                required
                                            />
                                            <FloatingInput
                                                type="text"
                                                id="templateDescription"
                                                value={templateDescription}
                                                onChange={e => {
                                                    setTemplateDescription(e.target.value);
                                                    if (templateDescriptionError) setTemplateDescriptionError('');
                                                }}
                                                label="Template Description"
                                                error={templateDescriptionError}
                                                autoComplete="off"
                                                required
                                            />
                                        </div>


                                    </div>
                                )}
                            </div>
                        )}

                        <div className="permissions-section">
                            {availablePermissions.map((permissionGroup) => (
                                <div key={permissionGroup.page} className="permission-group">
                                    <div className="permission-group-header">
                                        <h4>{permissionGroup.name}</h4>
                                        <p>{permissionGroup.description}</p>
                                    </div>
                                    <div className="permission-options">
                                        {permissionGroup.actions.map((action) => (
                                            <Checkbox
                                                key={action.id}
                                                id={`permission-${permissionGroup.page}-${action.id}`}
                                                name={`permission-${permissionGroup.page}-${action.id}`}
                                                checked={formData.permissions.some(p =>
                                                    p.page === permissionGroup.page && p.actions.includes(action.id)
                                                )}
                                                onChange={(e) => handlePermissionChange(permissionGroup.page, action.id, e.target.checked)}
                                                label={action.name}
                                                description={action.description}
                                                size="medium"
                                                variant="primary"
                                                className="permission-checkbox"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="step-content">
                        <div className="step-header">
                            <h2>User Details</h2>
                            <p>Enter the user's personal information and account details.</p>
                        </div>

                        <form className="user-form" onSubmit={handleFormSubmit}>
                            <div className="form-sections">
                                {/* Account Information */}
                                <div className="form-section">
                                    <div className="form-row">
                                        <FloatingInput
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            onBlur={() => handleFieldBlur('firstName')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    document.getElementById('lastName').focus();
                                                }
                                            }}
                                            label="First Name"
                                            error={loading && fieldErrors.firstName ? fieldErrors.firstName : ''}
                                            autoComplete="off"
                                            required
                                        />
                                        <FloatingInput
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            onBlur={() => handleFieldBlur('lastName')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    document.getElementById('username').focus();
                                                }
                                            }}
                                            label="Last Name"
                                            error={loading && fieldErrors.lastName ? fieldErrors.lastName : ''}
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <FloatingInput
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            onBlur={() => handleFieldBlur('username')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    document.getElementById('email').focus();
                                                }
                                            }}
                                            label="Username"
                                            error={loading && fieldErrors.username ? fieldErrors.username : ''}
                                            autoComplete="off"
                                            required
                                        />
                                        <FloatingInput
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onBlur={() => handleFieldBlur('email')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    document.getElementById('phone').focus();
                                                }
                                            }}
                                            label="Email Address"
                                            error={loading && fieldErrors.email ? fieldErrors.email : ''}
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <FloatingInput
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            onBlur={() => handleFieldBlur('phone')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    document.getElementById('password').focus();
                                                }
                                            }}
                                            label="Phone Number"
                                            error={loading && fieldErrors.phone ? fieldErrors.phone : ''}
                                            autoComplete="off"
                                            required
                                        />
                                        <FloatingInput
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            onBlur={() => handleFieldBlur('password')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleFormSubmit(e);
                                                }
                                            }}
                                            label="Password"
                                            error={loading && fieldErrors.password ? fieldErrors.password : ''}
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Step Navigation */}
                <div className="form-actions">
                    <div className="step-navigation-left">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleStepNavigation('back')}
                                disabled={loading}
                            >
                                Back
                            </button>
                        )}
                    </div>

                    <div className="step-navigation-right">
                        {currentStep === 1 && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleProceedToNext}
                            >
                                Next
                            </button>
                        )}

                        {currentStep === 2 && selectedTemplate?.id === 'custom' && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleStepNavigation('next')}
                                disabled={loading || validating}
                            >
                                {validating ? (
                                    <>
                                        Validating...
                                    </>
                                ) : (
                                    'Next'
                                )}
                            </button>
                        )}

                        {currentStep === 3 && (
                            <button
                                type="submit"
                                className="btn btn-primary"
                                onClick={handleFormSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner"></div>
                                        Creating User...
                                    </>
                                ) : (
                                    <>
                                        <FiSave />
                                        Create User
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUser; 