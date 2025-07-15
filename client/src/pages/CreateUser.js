import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import axios from 'axios';
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
    FiCheckCircle
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

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
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
        password: false
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

    // User creation templates
    const userTemplates = [
        {
            id: 'admin',
            name: 'Administrator',
            icon: <FiAward />,
            description: 'Full access to all features and system administration',
            color: 'bg-gradient-to-r from-purple-500 to-pink-500',
            permissions: [
                { page: 'users', actions: ['view', 'add', 'edit', 'delete'] }
            ],
            isAdmin: true
        },
        {
            id: 'manager',
            name: 'Manager',
            icon: <FiBriefcase />,
            description: 'User management and operational oversight',
            color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
            permissions: [
                { page: 'users', actions: ['view', 'add', 'edit'] }
            ],
            isAdmin: false
        },
        {
            id: 'viewer',
            name: 'Viewer',
            icon: <FiEyeIcon />,
            description: 'Read-only access to all web app features',
            color: 'bg-gradient-to-r from-green-500 to-emerald-500',
            permissions: [
                { page: 'users', actions: ['view'] }
            ],
            isAdmin: false
        },
        {
            id: 'custom',
            name: 'Custom Role',
            icon: <FiSettings />,
            description: 'Create your own custom permissions',
            color: 'bg-gradient-to-r from-orange-500 to-red-500',
            permissions: [],
            isAdmin: false
        }
    ];

    // Available permissions
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

    const validateStep2 = () => {
        if (selectedTemplate?.id === 'custom' && formData.permissions.length === 0) {
            showWarningToast('Permissions Required', 'Please select at least one permission for the custom role.');
            return false;
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
        // Automatically move to next step when template is selected
        setCurrentStep(2);
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

    // Handle step navigation
    const handleStepNavigation = (direction) => {
        if (direction === 'next') {
            if (currentStep === 1 && !validateStep1()) return;
            if (currentStep === 2 && !validateStep2()) return;
            if (currentStep === 3 && !validateStep3()) return;

            if (currentStep < 3) {
                setCurrentStep(currentStep + 1);
            }
        } else if (direction === 'back' && currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Handle form submission
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep3()) return;

        setLoading(true);

        try {
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
                showSuccessToast(
                    'User Created Successfully!',
                    `User "${formData.firstName} ${formData.lastName}" has been created with ${selectedTemplate?.name} role.`
                );

                // Navigate back to users page
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
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
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
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="step-content">
                        <div className="step-header">
                            <h2>Configure Permissions</h2>
                            <p>Select the permissions you want to grant to this user role.</p>
                        </div>

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

                    {currentStep === 2 && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleStepNavigation('next')}
                            disabled={loading}
                        >
                            Next
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