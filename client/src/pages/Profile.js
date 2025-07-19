import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import authService from '../services/authService';
import roleTemplateService from '../services/roleTemplateService';
import axios from 'axios';
import moment from 'moment';
import 'moment-timezone';
import ProfilePicture from '../components/ProfilePicture';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import ChangePasswordModal from '../components/ChangePasswordModal';
import TwoFactorModal from '../components/TwoFactorModal';
import FloatingInput from '../components/FloatingInput';
import Tooltip from '../components/Tooltip';
import RoleBadge from '../components/RoleBadge';
import { applyUserTheme } from '../utils/themeUtils';
import { showSuccessToast, showErrorToast, showWarningToast } from '../utils/sweetAlertConfig';
import Swal from 'sweetalert2';
import '../styles/Profile.css';
import {
    FiUser,
    FiCalendar,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiKey,
    FiSettings,
    FiLock,
    FiUnlock,
    FiZap,
    FiMail,
    FiRefreshCw,
    FiPhone
} from 'react-icons/fi';

const Profile = () => {
    const user = authService.getCurrentUser();
    const location = useLocation();

    // Apply user theme preference
    useEffect(() => {
        if (user) {
            applyUserTheme(user);
        }
    }, [user]);

    // Extract user preferences with fallbacks
    const userTimezone = user?.userPreferences?.timezone || 'Asia/Beirut';
    const userDateFormat = user?.userPreferences?.dateFormat || 'MMM DD, YYYY h:mm a';

    // Remove isEditing and related logic
    // const [isEditing, setIsEditing] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showProfilePictureUpload, setShowProfilePictureUpload] = useState(false);
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
    const [twoFactorMode, setTwoFactorMode] = useState('enable');
    const [isLoading, setIsLoading] = useState(false);
    const [emailChanged, setEmailChanged] = useState(false);



    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        username: user?.username || '',
        isAdmin: user?.isAdmin || false,
        isActive: user?.isActive || true,
        createdAt: user?.createdAt || '',
        lastLogin: user?.lastLogin || '',
        twoFactorEnabled: user?.twoFactorEnabled || false,
        emailVerified: user?.emailVerified || false,
        phoneVerified: user?.phoneVerified || false
    });

    const [securityStatus, setSecurityStatus] = useState({
        passwordStrength: { level: 'unknown', score: 0 }
    });

    const [editForm, setEditForm] = useState({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        username: profileData.username
    });

    // Add error state for form validation
    const [formErrors, setFormErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        username: ''
    });

    // Create axios instance for API calls
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

    // Refresh profile data from server
    const refreshProfileData = async () => {
        try {
            const [profileResult, securityResult] = await Promise.all([
                authService.getProfile(),
                createApiInstance().get('/auth/security-status')
            ]);

            if (profileResult.success) {
                const updatedData = {
                    firstName: profileResult.user.firstName || '',
                    lastName: profileResult.user.lastName || '',
                    email: profileResult.user.email || '',
                    phone: profileResult.user.phone || '',
                    username: profileResult.user.username || '',
                    isAdmin: profileResult.user.isAdmin || false,
                    isActive: profileResult.user.isActive || true,
                    createdAt: profileResult.user.createdAt || '',
                    lastLogin: profileResult.user.lastLogin || '',
                    twoFactorEnabled: profileResult.user.twoFactorEnabled || false,
                    emailVerified: profileResult.user.emailVerified || false,
                    phoneVerified: profileResult.user.phoneVerified || false,
                    profilePicture: profileResult.user.profilePicture || null, // <-- add this line
                };
                setProfileData(updatedData);
                setEditForm({
                    firstName: updatedData.firstName,
                    lastName: updatedData.lastName,
                    email: updatedData.email,
                    phone: updatedData.phone,
                    username: updatedData.username
                });
            }

            if (securityResult.data.success) {
                setSecurityStatus(securityResult.data.data);
            }
        } catch (error) {
            console.error('Error refreshing profile data:', error);
        }
    };

    // Load profile data on mount
    useEffect(() => {
        refreshProfileData();
    }, []);

    // Check if we should automatically open edit mode (coming from dashboard)
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const shouldEdit = urlParams.get('edit');

        if (shouldEdit === 'true') {
            // Automatically open edit mode
            // setIsEditing(true); // Removed

            // Clean up the URL parameter to prevent it from persisting
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, [location.search]);

    // Format date for display with user's timezone and date format
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return moment(dateString).tz(userTimezone).format(userDateFormat);
    };



    // Get password strength text
    const getPasswordStrengthText = (level) => {
        switch (level) {
            case 'very_strong':
                return 'Very Strong';
            case 'strong':
                return 'Strong';
            case 'medium':
                return 'Medium';
            case 'weak':
                return 'Weak';
            case 'very_weak':
                return 'Very Weak';
            default:
                return 'Unknown';
        }
    };

    // Validation functions
    const validateField = (field, value) => {
        switch (field) {
            case 'firstName':
                if (!value.trim()) return 'First name is required';
                if (value.trim().length < 2) return 'First name must be at least 2 characters';
                if (value.trim().length > 50) return 'First name must be less than 50 characters';
                return '';
            case 'lastName':
                if (!value.trim()) return 'Last name is required';
                if (value.trim().length < 2) return 'Last name must be at least 2 characters';
                if (value.trim().length > 50) return 'Last name must be less than 50 characters';
                return '';
            case 'username':
                if (!value.trim()) return 'Username is required';
                if (value.trim().length < 3) return 'Username must be at least 3 characters';
                if (value.trim().length > 30) return 'Username must be less than 30 characters';
                if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) return 'Username can only contain letters, numbers, hyphens, and underscores';
                return '';
            case 'email':
                if (!value.trim()) return 'Email is required';
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
                return '';
            case 'phone':
                if (value.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
                    return 'Please enter a valid phone number';
                }
                return '';
            default:
                return '';
        }
    };

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }

        // Track if email has changed
        if (field === 'email' && value !== profileData.email) {
            setEmailChanged(true);
        } else if (field === 'email' && value === profileData.email) {
            setEmailChanged(false);
        }
    };

    // Handle input blur for validation
    const handleInputBlur = (field, value) => {
        const error = validateField(field, value);
        setFormErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };

    // Handle key press events for form navigation
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Navigate from firstName to lastName
            if (e.target.id === 'firstName') {
                document.getElementById('lastName').focus();
            }
            // Navigate from lastName to username
            else if (e.target.id === 'lastName') {
                document.getElementById('username').focus();
            }
            // Navigate from username to email
            else if (e.target.id === 'username') {
                document.getElementById('email').focus();
            }
            // Navigate from email to phone
            else if (e.target.id === 'email') {
                document.getElementById('phone').focus();
            }
            // Navigate from phone to save button
            else if (e.target.id === 'phone') {
                document.getElementById('saveButton').click();
            }
        }
    };

    // Remove handleEditToggle
    // Remove all references to setIsEditing

    // Check if form has any changes
    const hasFormChanges = () => {
        return (
            editForm.firstName !== profileData.firstName ||
            editForm.lastName !== profileData.lastName ||
            editForm.email !== profileData.email ||
            editForm.phone !== profileData.phone ||
            editForm.username !== profileData.username
        );
    };

    // Handle profile update
    const handleProfileUpdate = async () => {
        // Check if there are any changes
        if (!hasFormChanges()) {
            showWarningToast('No Changes Detected', 'You haven\'t made any changes to your profile. Please make changes before saving.');
            return;
        }

        // Validate all fields before submitting
        const newErrors = {};
        let hasErrors = false;

        Object.keys(editForm).forEach(field => {
            const error = validateField(field, editForm[field]);
            newErrors[field] = error;
            if (error) hasErrors = true;
        });

        setFormErrors(newErrors);

        if (hasErrors) {
            showErrorToast('Validation Error', 'Please fix the errors in the form before saving.');
            return;
        }

        setIsLoading(true);
        try {
            const api = createApiInstance();
            const response = await api.put('/auth/profile', editForm);

            if (response.data.success) {
                const emailWasChanged = emailChanged;
                showSuccessToast('Profile Updated!', 'Your profile has been updated successfully.');
                await refreshProfileData();
                setEmailChanged(false); // Reset email changed status

                // Show additional message if email was changed
                if (emailWasChanged) {
                    showSuccessToast('Email Changed!', 'Your email has been updated. Please verify your new email address.');
                }
            } else {
                showErrorToast('Update Failed', response.data.message || 'Failed to update profile.');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showErrorToast('Update Failed', error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle email verification
    const handleEmailVerification = async () => {
        try {
            const api = createApiInstance();
            const response = await api.post('/auth/send-email-verification');

            if (response.data.success) {
                showSuccessToast('Verification Email Sent!', 'Check your email inbox (and spam/junk folder if not found).');
            } else {
                showErrorToast('Failed to Send Email', 'Failed to send verification email. Please try again.');
            }
        } catch (error) {
            console.error('Email verification error:', error);
            showErrorToast('Failed to Send Email', 'Failed to send verification email. Please try again.');
        }
    };

    // Handle profile picture upload
    const handleProfilePictureUpload = () => {
        setShowProfilePictureUpload(true);
    };

    // Handle profile picture upload success
    const handleProfilePictureSuccess = async () => {
        setShowProfilePictureUpload(false);
        await refreshProfileData();
        showSuccessToast('Profile Picture Updated!', 'Your profile picture has been updated successfully.');
    };

    // Handle profile picture upload error
    const handleProfilePictureError = (error) => {
        setShowProfilePictureUpload(false);
        showErrorToast('Upload Failed', error || 'Failed to upload profile picture.');
    };

    // Handle 2FA toggle
    const handleTwoFactorToggle = () => {
        setTwoFactorMode(profileData.twoFactorEnabled ? 'disable' : 'enable');
        setShowTwoFactorModal(true);
    };

    // Handle 2FA success
    const handleTwoFactorSuccess = async () => {
        await refreshProfileData();
    };

    const handleRemoveProfilePicture = async () => {
        const result = await Swal.fire({
            title: 'Remove Profile Picture?',
            text: 'Are you sure you want to remove your profile picture? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Yes, remove it',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });
        if (!result.isConfirmed) return;
        try {
            setIsLoading(true);
            const api = createApiInstance();
            const response = await api.delete('/auth/profile-picture');
            if (response.data.success) {
                showSuccessToast('Profile Picture Removed!', 'Your profile picture has been removed.');
                await refreshProfileData();
            } else {
                showErrorToast('Remove Failed', response.data.message || 'Failed to remove profile picture.');
            }
        } catch (error) {
            showErrorToast('Remove Failed', error.response?.data?.message || 'Failed to remove profile picture.');
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="page-container">
            <div className="page-content">
                <div className="page-header">
                    <h1 className="page-title">
                        <FiUser /> Profile & Account Settings
                    </h1>
                    <p className="page-description">
                        Manage your account information and preferences
                    </p>
                </div>
                {/* Account Information Section */}
                <section className="profile-section">
                    <div className="section-header">
                        <h2 className="section-title">Account Information</h2>
                    </div>

                    {/* Profile Picture Section */}
                    <div className="profile-picture-section">
                        <div className="picture-container">
                            <ProfilePicture user={profileData} size="xlarge" />
                        </div>
                        <div className="picture-info">
                            <div className="user-basic-info">
                                <h3 className="user-name">{profileData.firstName} {profileData.lastName}</h3>
                                <p className="user-username">@{profileData.username}</p>
                                <p className="user-email">{profileData.email}</p>
                            </div>
                            <div className="picture-actions">
                                {profileData.profilePicture && profileData.profilePicture.url && (
                                    <button
                                        onClick={handleRemoveProfilePicture}
                                        title="Remove profile picture"
                                        className="btn btn-danger btn-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                                <button
                                    onClick={handleProfilePictureUpload}
                                    className="btn btn-primary btn-sm"
                                >
                                    Upload New Picture
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Read-Only Account Info Cards */}
                    <div className="info-cards">
                        <div className="info-card" style={{ '--animation-order': 0 }}>
                            <div className="card-icon green">
                                <FiUser />
                            </div>
                            <div className="card-content">
                                <div className="card-label">Account Status</div>
                                <div className="card-value">
                                    <span className={`status-badge ${profileData.isActive ? 'status-active' : 'status-inactive'}`}>
                                        {profileData.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="info-card" style={{ '--animation-order': 1 }}>
                            <div className="card-icon purple">
                                <FiSettings />
                            </div>
                            <div className="card-content">
                                <div className="card-label">Role</div>
                                <div className="card-value">
                                    <RoleBadge role={profileData.isAdmin ? 'admin' : 'user'} />
                                </div>
                            </div>
                        </div>
                        <div className="info-card" style={{ '--animation-order': 2 }}>
                            <div className="card-icon blue">
                                <FiCalendar />
                            </div>
                            <div className="card-content">
                                <div className="card-label">Member Since</div>
                                <div className="card-value">{formatDate(profileData.createdAt)}</div>
                            </div>
                        </div>
                        <div className="info-card" style={{ '--animation-order': 3 }}>
                            <div className="card-icon teal">
                                <FiClock />
                            </div>
                            <div className="card-content">
                                <div className="card-label">Last Login</div>
                                <div className="card-value">{formatDate(profileData.lastLogin)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Editable Form Fields */}
                    <div className="form-fields">
                        <div className="form-row">
                            <FloatingInput
                                type="text"
                                id="firstName"
                                label="First Name"
                                value={editForm.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                onBlur={(e) => handleInputBlur('firstName', e.target.value)}
                                onKeyPress={handleKeyPress}
                                error={formErrors.firstName}
                                required
                            />
                            <FloatingInput
                                type="text"
                                id="lastName"
                                label="Last Name"
                                value={editForm.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                onBlur={(e) => handleInputBlur('lastName', e.target.value)}
                                onKeyPress={handleKeyPress}
                                error={formErrors.lastName}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <FloatingInput
                                type="text"
                                id="username"
                                label="Username"
                                value={editForm.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                onBlur={(e) => handleInputBlur('username', e.target.value)}
                                onKeyPress={handleKeyPress}
                                error={formErrors.username}
                                required
                            />
                            <FloatingInput
                                type="email"
                                id="email"
                                label="Email Address"
                                value={editForm.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                onBlur={(e) => handleInputBlur('email', e.target.value)}
                                onKeyPress={handleKeyPress}
                                error={formErrors.email}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <FloatingInput
                                type="tel"
                                id="phone"
                                label="Phone Number"
                                value={editForm.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                onBlur={(e) => handleInputBlur('phone', e.target.value)}
                                onKeyPress={handleKeyPress}
                                error={formErrors.phone}
                            />
                        </div>
                    </div>
                    {/* Save Changes Button */}
                    <div className="form-actions flex-end">
                        <button
                            id="saveButton"
                            onClick={handleProfileUpdate}
                            disabled={isLoading}
                            className="btn btn-primary"
                        >
                            {isLoading ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </section>

                {/* Password Change Section */}
                <section className="profile-section">
                    <div className="section-header">
                        <h2 className="section-title">Password Management</h2>
                    </div>
                    <div className="security-cards">
                        <div className="security-card" style={{ '--animation-order': 0 }}>
                            <div className="card-header">
                                <div className="card-icon orange">
                                    <FiKey />
                                </div>
                                <div className="card-content">
                                    <h3 className="card-title">Password</h3>
                                    <p className="card-description">Change your account password</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowChangePassword(true)}
                                className="btn btn-primary"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </section>

                {/* Security Settings Section */}
                <section className="profile-section">
                    <div className="section-header">
                        <h2 className="section-title">Security Settings</h2>
                    </div>
                    <div className="security-cards">
                        <div className="security-card" style={{ '--animation-order': 0 }}>
                            <div className="card-header">
                                <div className="card-icon purple">
                                    {profileData.twoFactorEnabled ? <FiLock /> : <FiUnlock />}
                                </div>
                                <div className="card-content">
                                    <h3 className="card-title">Two-Factor Authentication</h3>
                                    <p className="card-description">{profileData.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleTwoFactorToggle}
                                className={`btn ${profileData.twoFactorEnabled ? 'btn-danger' : 'btn-primary'}`}
                            >
                                {profileData.twoFactorEnabled ? 'Disable' : 'Enable'}
                            </button>
                        </div>

                        <div className="security-card" style={{ '--animation-order': 1 }}>
                            <div className="card-header">
                                <div className="card-icon green">
                                    {profileData.emailVerified && !emailChanged ? <FiCheckCircle /> : <FiAlertCircle />}
                                </div>
                                <div className="card-content">
                                    <h3 className="card-title">Email Verification</h3>
                                    <p className="card-description">{profileData.emailVerified && !emailChanged ? 'Verified' : emailChanged ? 'New email requires verification' : 'Not verified'}</p>
                                </div>
                            </div>
                            {(!profileData.emailVerified || emailChanged) && (
                                <button
                                    onClick={handleEmailVerification}
                                    className="btn btn-primary"
                                >
                                    {emailChanged ? 'Verify New Email' : 'Verify Email'}
                                </button>
                            )}
                        </div>

                        <div className="security-card" style={{ '--animation-order': 2 }}>
                            <div className="card-header">
                                <div className="card-icon red">
                                    <FiKey />
                                </div>
                                <div className="card-content">
                                    <h3 className="card-title">Password Strength</h3>
                                    <p className="card-description">
                                        {securityStatus.passwordStrength?.level !== 'unknown'
                                            ? `Current strength: ${getPasswordStrengthText(securityStatus.passwordStrength?.level)}`
                                            : 'Password strength not available'
                                        }
                                    </p>
                                    {securityStatus.passwordStrength?.level !== 'unknown' && (
                                        <div className="password-strength-meter">
                                            <div className="strength-bar">
                                                <div
                                                    className={`strength-fill strength-${securityStatus.passwordStrength?.level}`}
                                                    style={{ width: `${(securityStatus.passwordStrength?.score / 4) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="strength-score">Score: {securityStatus.passwordStrength?.score}/4</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowChangePassword(true)}
                                className="btn btn-primary"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
                onSuccess={() => {
                    setShowChangePassword(false);
                    showSuccessToast('Password Changed!', 'Your password has been updated successfully.');
                }}
            />

            {/* Profile Picture Upload Modal */}
            {showProfilePictureUpload && (
                <ProfilePictureUpload
                    onUploadSuccess={handleProfilePictureSuccess}
                    onUploadError={handleProfilePictureError}
                    onCancel={() => setShowProfilePictureUpload(false)}
                />
            )}

            {/* Two-Factor Authentication Modal */}
            <TwoFactorModal
                isOpen={showTwoFactorModal}
                onClose={() => setShowTwoFactorModal(false)}
                onSuccess={handleTwoFactorSuccess}
                mode={twoFactorMode}
            />
        </div>
    );
};

export default Profile; 