import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import authService from '../services/authService';
import axios from 'axios';
import moment from 'moment';
import 'moment-timezone';
import ProfilePicture from '../components/ProfilePicture';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { applyUserTheme } from '../utils/themeUtils';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';
import Swal from 'sweetalert2';
import {
    FiUser,
    FiCalendar,
    FiClock,
    FiShield,
    FiCheckCircle,
    FiAlertCircle,
    FiEdit3,
    FiSave,
    FiX,
    FiKey,
    FiSettings,
    FiLock,
    FiUnlock
} from 'react-icons/fi';
import ButtonLoadingOverlay from '../components/ButtonLoadingOverlay';

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
    const userDateFormat = user?.userPreferences?.dateFormat || 'MMM dd, yyyy h:mm a';

    // Remove isEditing and related logic
    // const [isEditing, setIsEditing] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showProfilePictureUpload, setShowProfilePictureUpload] = useState(false);
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

    // Add focus state for each input
    const [inputFocus, setInputFocus] = useState({
        firstName: false,
        lastName: false,
        email: false,
        phone: false,
        username: false
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

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));

        // Track if email has changed
        if (field === 'email' && value !== profileData.email) {
            setEmailChanged(true);
        } else if (field === 'email' && value === profileData.email) {
            setEmailChanged(false);
        }
    };

    // Remove handleEditToggle
    // Remove all references to setIsEditing

    // Handle profile update
    const handleProfileUpdate = async () => {
        setIsLoading(true);
        try {
            const api = createApiInstance();
            const response = await api.put('/auth/profile', editForm);

            if (response.data.success) {
                const emailWasChanged = emailChanged;
                showSuccessToast('Profile Updated!', 'Your profile has been updated successfully.');
                await refreshProfileData();
                // setIsEditing(false); // Removed
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

    // Helper to get floating label class
    const getFloatingLabelClass = (field) => {
        let cls = 'form-group floating-label';
        if (inputFocus[field]) cls += ' focused';
        if (editForm[field]) cls += ' filled';
        return cls;
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1 className="page-title">Profile & Account Settings</h1>
                <p className="page-subtitle">Manage your account information and preferences</p>
            </div>

            <div className="profile-content">
                {/* Account Information Section */}
                <section className="profile-section">
                    <div className="section-header">
                        <h2 className="section-title">Account Information</h2>
                        <div className="section-actions">
                            <button
                                onClick={handleProfileUpdate}
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? <ButtonLoadingOverlay isLoading={isLoading} /> : (
                                    <>
                                        <FiSave /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Profile Picture Section */}
                    <div className="profile-picture-section">
                        <div className="picture-container">
                            <ProfilePicture user={profileData} size="xlarge" />
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
                                className="btn btn-secondary"
                            >
                                Upload New Picture
                            </button>
                        </div>
                    </div>

                    {/* Read-Only Account Info Cards */}
                    <div className="info-cards">
                        <div className="info-card">
                            <div className="card-icon">
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
                        <div className="info-card">
                            <div className="card-icon">
                                <FiSettings />
                            </div>
                            <div className="card-content">
                                <div className="card-label">Role</div>
                                <div className="card-value">
                                    <span className={`role-badge ${profileData.isAdmin ? 'role-admin' : 'role-user'}`}>
                                        {profileData.isAdmin ? 'Administrator' : 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="card-icon">
                                <FiCalendar />
                            </div>
                            <div className="card-content">
                                <div className="card-label">Member Since</div>
                                <div className="card-value">{formatDate(profileData.createdAt)}</div>
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="card-icon">
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
                            <div className={getFloatingLabelClass('firstName')}>
                                <input
                                    type="text"
                                    id="firstName"
                                    value={editForm.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    onFocus={() => setInputFocus(f => ({ ...f, firstName: true }))}
                                    onBlur={() => setInputFocus(f => ({ ...f, firstName: false }))}
                                    placeholder={inputFocus.firstName || editForm.firstName ? '' : 'First Name'}
                                    className="form-input"
                                />
                                <label htmlFor="firstName" className="form-label">First Name</label>
                            </div>
                            <div className={getFloatingLabelClass('lastName')}>
                                <input
                                    type="text"
                                    id="lastName"
                                    value={editForm.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    onFocus={() => setInputFocus(f => ({ ...f, lastName: true }))}
                                    onBlur={() => setInputFocus(f => ({ ...f, lastName: false }))}
                                    placeholder={inputFocus.lastName || editForm.lastName ? '' : 'Last Name'}
                                    className="form-input"
                                />
                                <label htmlFor="lastName" className="form-label">Last Name</label>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className={getFloatingLabelClass('username')}>
                                <input
                                    type="text"
                                    id="username"
                                    value={editForm.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    onFocus={() => setInputFocus(f => ({ ...f, username: true }))}
                                    onBlur={() => setInputFocus(f => ({ ...f, username: false }))}
                                    placeholder={inputFocus.username || editForm.username ? '' : 'Username'}
                                    className="form-input"
                                />
                                <label htmlFor="username" className="form-label">Username</label>
                            </div>
                            <div className={getFloatingLabelClass('email')}>
                                <input
                                    type="email"
                                    id="email"
                                    value={editForm.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    onFocus={() => setInputFocus(f => ({ ...f, email: true }))}
                                    onBlur={() => setInputFocus(f => ({ ...f, email: false }))}
                                    placeholder={inputFocus.email || editForm.email ? '' : 'Email Address'}
                                    className="form-input"
                                />
                                <label htmlFor="email" className="form-label">Email Address</label>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className={getFloatingLabelClass('phone')}>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={editForm.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    onFocus={() => setInputFocus(f => ({ ...f, phone: true }))}
                                    onBlur={() => setInputFocus(f => ({ ...f, phone: false }))}
                                    placeholder={inputFocus.phone || editForm.phone ? '' : 'Phone Number'}
                                    className="form-input"
                                />
                                <label htmlFor="phone" className="form-label">Phone Number</label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Password Change Section */}
                <section className="profile-section">
                    <div className="section-header">
                        <h2 className="section-title">Password Management</h2>
                    </div>
                    <div className="security-cards">
                        <div className="security-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <FiKey />
                                </div>
                                <div className="card-content">
                                    <h3 className="card-title">Password</h3>
                                    <p className="card-description">Change your account password</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowChangePassword(true)}
                                className="btn btn-secondary"
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
                        <div className="security-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    {profileData.twoFactorEnabled ? <FiLock /> : <FiUnlock />}
                                </div>
                                <div className="card-content">
                                    <h3 className="card-title">Two-Factor Authentication</h3>
                                    <p className="card-description">{profileData.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => console.log('Toggle 2FA')}
                                className={`btn ${profileData.twoFactorEnabled ? 'btn-danger' : 'btn-primary'}`}
                            >
                                {profileData.twoFactorEnabled ? 'Disable' : 'Enable'}
                            </button>
                        </div>

                        <div className="security-card">
                            <div className="card-header">
                                <div className="card-icon">
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
                                    className="btn btn-secondary"
                                >
                                    {emailChanged ? 'Verify New Email' : 'Verify Email'}
                                </button>
                            )}
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
        </div>
    );
};

export default Profile; 