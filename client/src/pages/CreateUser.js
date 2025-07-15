import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import roleTemplateService from '../services/roleTemplateService';
import axios from 'axios';
import Select from 'react-select';
import { applyUserTheme } from '../utils/themeUtils';
import { showSuccessToast, showErrorToast, showWarningToast } from '../utils/sweetAlertConfig';
import {
    FiEye,
    FiEyeOff,
    FiArrowRight,
    FiCheck,
    FiShield,
    FiAward,
    FiBriefcase,
    FiEye as FiEyeIcon,
    FiSettings,
    FiSave,
    FiUserPlus,
    FiAlertCircle,
    FiCheckCircle,
    FiUsers,
    FiShieldOff,
    FiUserCheck,
    FiLock,
    FiUnlock,
    FiUserX,
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
                    icon: getIconComponent(template.icon),
                    description: template.description,
                    color: template.color,
                    permissions: template.permissions,
                    isAdmin: template.isAdmin
                }));
                
                // Add custom template to all pages
                templates.unshift({
                    id: 'custom',
                    name: 'Custom Role',
                    icon: <FiSettings />,
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

    // Helper function to get icon component
    const getIconComponent = (iconName) => {
        const iconMap = {
            'FiSettings': <FiSettings />,
            'FiAward': <FiAward />,
            'FiBriefcase': <FiBriefcase />,
            'FiUsers': <FiUsers />,
            'FiShield': <FiShieldOff />,
            'FiUserCheck': <FiUserCheck />,
            'FiUserX': <FiUserX />,
            'FiLock': <FiLock />,
            'FiUnlock': <FiUnlock />,
            'FiEye': <FiEye />
        };
        return iconMap[iconName] || <FiSettings />;
    };

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        firstName: '',
        lastName: '',
        isAdmin: false,
        permissions: [],
        sendWelcomeEmail: true,
        requirePasswordChange: false
    });

    // Add focus state for each input
    const [inputFocus, setInputFocus] = useState({
        firstName: false,
        lastName: false,
        username: false,
        email: false,
        phone: false,
        password: false,
        templateName: false,
        templateDescription: false
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

    const [fieldTouched, setFieldTouched] = useState({
        firstName: false,
        lastName: false,
        username: false,
        email: false,
        phone: false,
        password: false
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
                } else if (!/(?=.*[a-z])/.test(value)) {
                    return 'Password must contain at least one lowercase letter';
                } else if (!/(?=.*[A-Z])/.test(value)) {
                    return 'Password must contain at least one uppercase letter';
                } else if (!/(?=.*\d)/.test(value)) {
                    return 'Password must contain at least one number';
                } else if (!/(?=.*[!@#$%^&*])/.test(value)) {
                    return 'Password must contain at least one special character (!@#$%^&*)';
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

    // Validation functions for step navigation
    const validateStep1 = () => {
        if (!selectedTemplate) {
            showWarningToast('Template Required', 'Please select a user template to continue.');
            return false;
        }
        return true;
    };

    const validateStep2 = async () => {
        if (selectedTemplate?.id === 'custom' && formData.permissions.length === 0) {
            showWarningToast('Permissions Required', 'Please select at least one permission for the custom role.');
            return false;
        }

        // If saving as template, validate template fields
        if (selectedTemplate?.id === 'custom' && saveAsTemplate) {
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
        setFieldTouched({
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            phone: true,
            password: true
        });

        if (hasErrors) {
            showErrorToast('Validation Errors', 'Please fix the highlighted errors before continuing.');
            return false;
        }

        return true;
    };

    // Handle template selection
    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setFormData(prev => ({
            ...prev,
            isAdmin: template.isAdmin,
            permissions: template.permissions
        }));
        
        // If it's a predefined template (not custom), skip step 2 and go directly to step 3
        if (template.id !== 'custom') {
            setCurrentStep(3);
        } else {
            // For custom template, go to step 2 to configure permissions
            setCurrentStep(2);
        }
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

        // Check if field has value
        let hasValue = false;
        if (field.startsWith('template')) {
            if (field === 'templateName') hasValue = !!templateName;
            else if (field === 'templateDescription') hasValue = !!templateDescription;
        } else {
            hasValue = !!formData[field];
        }

        if (hasValue) cls += ' filled';
        if (fieldTouched[field] && fieldErrors[field]) cls += ' error';
        if (fieldTouched[field] && !fieldErrors[field] && hasValue) cls += ' valid';
        return cls;
    };

    // Helper to get input class
    const getInputClass = (field) => {
        let cls = 'form-input';
        if (fieldTouched[field] && fieldErrors[field]) cls += ' error';

        // Check if field has value
        let hasValue = false;
        if (field.startsWith('template')) {
            if (field === 'templateName') hasValue = !!templateName;
            else if (field === 'templateDescription') hasValue = !!templateDescription;
        } else {
            hasValue = !!formData[field];
        }

        if (fieldTouched[field] && !fieldErrors[field] && hasValue) cls += ' valid';
        return cls;
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
            if (currentStep === 2 && selectedTemplate?.id === 'custom') {
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
            if (currentStep === 3 && selectedTemplate?.id !== 'custom') {
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

    // Custom styles for React Select
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
        })
    };

    // Handle select changes
    const handleSelectChange = (name, selectedOption) => {
        // This function is no longer needed since we removed icon and color selection
        // Keeping it for potential future use
    };

    return (
        <div className="create-user-page">
            {/* Header */}
            <div className="create-user-header">
                <div className="header-content">
                    <div className="header-info">
                        <h1 className="page-title">
                            <FiUserPlus /> Create New User
                        </h1>
                        <p className="page-description">
                            Add a new user to the system with appropriate permissions
                        </p>
                    </div>
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
                            <div className="search-input-container">
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={templateSearchTerm}
                                    onChange={(e) => handleTemplateSearch(e.target.value)}
                                    className="search-input"
                                />
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
                                        <div
                                            key={template.id}
                                            className={`template-card ${template.color} ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                                            onClick={() => handleTemplateSelect(template)}
                                        >
                                            <div className="template-icon">{template.icon}</div>
                                            <div className="template-info">
                                                <h3 className="template-name">{template.name}</h3>
                                                <p className="template-description">{template.description}</p>
                                                <div className="template-permissions">
                                                    {template.permissions.length > 0 ? (
                                                        <div className="permission-list">
                                                            {template.permissions.map((permission, index) => (
                                                                <span key={index} className="permission-item">
                                                                    {permission.page}: {permission.actions.join(', ')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="permission-count"></span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="template-arrow">
                                                {selectedTemplate?.id === template.id ? <FiCheck /> : <FiArrowRight />}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Template Pagination Controls */}
                                {templatePagination?.totalPages > 1 && (
                                    <div className="carousel-pagination-controls">
                                        <div className="pagination-info">
                                            Showing {((templatePagination?.currentPage || 1) - 1) * (templatePagination?.limit || 6) + 1} to {Math.min((templatePagination?.currentPage || 1) * (templatePagination?.limit || 6), templatePagination?.totalCount || 0)} of {templatePagination?.totalCount || 0} templates
                                        </div>
                                        <div className="carousel-navigation">
                                            <button
                                                className="carousel-btn carousel-prev"
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
                                                                    className={`page-indicator ${i === currentPage ? 'active' : ''}`}
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
                                                                className={`page-indicator ${1 === currentPage ? 'active' : ''}`}
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
                                                                        className={`page-indicator ${i === currentPage ? 'active' : ''}`}
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
                                                                    className={`page-indicator ${totalPages === currentPage ? 'active' : ''}`}
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
                                                className="carousel-btn carousel-next"
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
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 500 }}>
                                    <input
                                        type="checkbox"
                                        checked={saveAsTemplate}
                                        onChange={e => setSaveAsTemplate(e.target.checked)}
                                        style={{
                                            marginRight: 8,
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <span>Save this custom role as a template</span>
                                </label>
                                {saveAsTemplate && (
                                    <div className="template-fields" style={{ marginTop: 12 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div className={`form-group floating-label ${inputFocus.templateName ? 'focused' : ''} ${templateName ? 'filled' : ''} ${templateNameError ? 'error' : ''}`}>
                                                <input
                                                    type="text"
                                                    id="templateName"
                                                    value={templateName}
                                                    onChange={e => {
                                                        setTemplateName(e.target.value);
                                                        if (templateNameError) setTemplateNameError('');
                                                    }}
                                                    onFocus={() => setInputFocus(f => ({ ...f, templateName: true }))}
                                                    onBlur={() => setInputFocus(f => ({ ...f, templateName: false }))}
                                                    className={`form-input ${templateNameError ? 'error' : ''}`}
                                                    autoComplete="off"
                                                />
                                                <label htmlFor="templateName" className="form-label">Template Name</label>
                                                {templateNameError && (
                                                    <div className="field-error">
                                                        <FiAlertCircle />
                                                        <span>{templateNameError}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`form-group floating-label ${inputFocus.templateDescription ? 'focused' : ''} ${templateDescription ? 'filled' : ''} ${templateDescriptionError ? 'error' : ''}`}>
                                                <input
                                                    type="text"
                                                    id="templateDescription"
                                                    value={templateDescription}
                                                    onChange={e => {
                                                        setTemplateDescription(e.target.value);
                                                        if (templateDescriptionError) setTemplateDescriptionError('');
                                                    }}
                                                    onFocus={() => setInputFocus(f => ({ ...f, templateDescription: true }))}
                                                    onBlur={() => setInputFocus(f => ({ ...f, templateDescription: false }))}
                                                    className={`form-input ${templateDescriptionError ? 'error' : ''}`}
                                                    autoComplete="off"
                                                />
                                                <label htmlFor="templateDescription" className="form-label">Template Description</label>
                                                {templateDescriptionError && (
                                                    <div className="field-error">
                                                        <FiAlertCircle />
                                                        <span>{templateDescriptionError}</span>
                                                    </div>
                                                )}
                                            </div>
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
                                        <label className="select-all-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.some(p => p.page === permissionGroup.page) &&
                                                    formData.permissions.find(p => p.page === permissionGroup.page)?.actions.length === permissionGroup.actions.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        // Select all permissions for this group
                                                        permissionGroup.actions.forEach(action => {
                                                            handlePermissionChange(permissionGroup.page, action.id, true);
                                                        });
                                                    } else {
                                                        // Deselect all permissions for this group
                                                        permissionGroup.actions.forEach(action => {
                                                            handlePermissionChange(permissionGroup.page, action.id, false);
                                                        });
                                                    }
                                                }}
                                                className="form-checkbox"
                                            />
                                            <span className="select-all-text">Select All</span>
                                        </label>
                                    </div>
                                    <div className="permission-options">
                                        {permissionGroup.actions.map((action) => (
                                            <label key={action.id} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.some(p =>
                                                        p.page === permissionGroup.page && p.actions.includes(action.id)
                                                    )}
                                                    onChange={(e) => handlePermissionChange(permissionGroup.page, action.id, e.target.checked)}
                                                    className="form-checkbox"
                                                />
                                                <div className="checkbox-content">
                                                    <span className="checkbox-text">{action.name}</span>
                                                    <span className="checkbox-description">{action.description}</span>
                                                </div>
                                            </label>
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
                                        <div className={getFloatingLabelClass('firstName')}>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                onFocus={() => setInputFocus(f => ({ ...f, firstName: true }))}
                                                onBlur={() => {
                                                    setInputFocus(f => ({ ...f, firstName: false }));
                                                    handleFieldBlur('firstName');
                                                }}
                                                className={getInputClass('firstName')}
                                                autoComplete="off"
                                            />
                                            <label htmlFor="firstName" className="form-label">First Name</label>
                                            {fieldTouched.firstName && fieldErrors.firstName && (
                                                <div className="field-error">
                                                    <FiAlertCircle />
                                                    <span>{fieldErrors.firstName}</span>
                                                </div>
                                            )}
                                            {fieldTouched.firstName && !fieldErrors.firstName && formData.firstName && (
                                                <div className="field-success">
                                                    <FiCheckCircle />
                                                    <span>Valid</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={getFloatingLabelClass('lastName')}>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                onFocus={() => setInputFocus(f => ({ ...f, lastName: true }))}
                                                onBlur={() => {
                                                    setInputFocus(f => ({ ...f, lastName: false }));
                                                    handleFieldBlur('lastName');
                                                }}
                                                className={getInputClass('lastName')}
                                                autoComplete="off"
                                            />
                                            <label htmlFor="lastName" className="form-label">Last Name</label>
                                            {fieldTouched.lastName && fieldErrors.lastName && (
                                                <div className="field-error">
                                                    <FiAlertCircle />
                                                    <span>{fieldErrors.lastName}</span>
                                                </div>
                                            )}
                                            {fieldTouched.lastName && !fieldErrors.lastName && formData.lastName && (
                                                <div className="field-success">
                                                    <FiCheckCircle />
                                                    <span>Valid</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className={getFloatingLabelClass('username')}>
                                            <input
                                                type="text"
                                                id="username"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                onFocus={() => setInputFocus(f => ({ ...f, username: true }))}
                                                onBlur={() => {
                                                    setInputFocus(f => ({ ...f, username: false }));
                                                    handleFieldBlur('username');
                                                }}
                                                className={getInputClass('username')}
                                                autoComplete="off"
                                            />
                                            <label htmlFor="username" className="form-label">Username</label>
                                            {fieldTouched.username && fieldErrors.username && (
                                                <div className="field-error">
                                                    <FiAlertCircle />
                                                    <span>{fieldErrors.username}</span>
                                                </div>
                                            )}
                                            {fieldTouched.username && !fieldErrors.username && formData.username && (
                                                <div className="field-success">
                                                    <FiCheckCircle />
                                                    <span>Valid</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={getFloatingLabelClass('email')}>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onFocus={() => setInputFocus(f => ({ ...f, email: true }))}
                                                onBlur={() => {
                                                    setInputFocus(f => ({ ...f, email: false }));
                                                    handleFieldBlur('email');
                                                }}
                                                className={getInputClass('email')}
                                                autoComplete="off"
                                            />
                                            <label htmlFor="email" className="form-label">Email Address</label>
                                            {fieldTouched.email && fieldErrors.email && (
                                                <div className="field-error">
                                                    <FiAlertCircle />
                                                    <span>{fieldErrors.email}</span>
                                                </div>
                                            )}
                                            {fieldTouched.email && !fieldErrors.email && formData.email && (
                                                <div className="field-success">
                                                    <FiCheckCircle />
                                                    <span>Valid</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className={getFloatingLabelClass('phone')}>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                onFocus={() => setInputFocus(f => ({ ...f, phone: true }))}
                                                onBlur={() => {
                                                    setInputFocus(f => ({ ...f, phone: false }));
                                                    handleFieldBlur('phone');
                                                }}
                                                className={getInputClass('phone')}
                                                autoComplete="off"
                                            />
                                            <label htmlFor="phone" className="form-label">Phone Number</label>
                                            {fieldTouched.phone && fieldErrors.phone && (
                                                <div className="field-error">
                                                    <FiAlertCircle />
                                                    <span>{fieldErrors.phone}</span>
                                                </div>
                                            )}
                                            {fieldTouched.phone && !fieldErrors.phone && formData.phone && (
                                                <div className="field-success">
                                                    <FiCheckCircle />
                                                    <span>Valid</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={getFloatingLabelClass('password')}>
                                            <div className="password-input">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    onFocus={() => setInputFocus(f => ({ ...f, password: true }))}
                                                    onBlur={() => {
                                                        setInputFocus(f => ({ ...f, password: false }));
                                                        handleFieldBlur('password');
                                                    }}
                                                    className={getInputClass('password')}
                                                    autoComplete="new-password"
                                                />
                                                <label htmlFor="password" className="form-label">Password</label>
                                                <button
                                                    type="button"
                                                    className="password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                            {fieldTouched.password && fieldErrors.password && (
                                                <div className="field-error">
                                                    <FiAlertCircle />
                                                    <span>{fieldErrors.password}</span>
                                                </div>
                                            )}
                                            {fieldTouched.password && !fieldErrors.password && formData.password && (
                                                <div className="field-success">
                                                    <FiCheckCircle />
                                                    <span>Valid</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Step Navigation */}
                <div className="step-navigation">
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

                    {currentStep === 2 && selectedTemplate?.id === 'custom' && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleStepNavigation('next')}
                            disabled={loading || validating}
                        >
                            {validating ? (
                                <>
                                    <div className="spinner"></div>
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
    );
};

export default CreateUser; 