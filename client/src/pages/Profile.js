import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import authService from '../services/authService';
import axios from 'axios';
import moment from 'moment';
import 'moment-timezone';
import ProfilePicture from '../components/ProfilePicture';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { applyUserTheme } from '../utils/themeUtils';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';
import Swal from 'sweetalert2';
import {
    FiUser,
    FiMail,
    FiPhone,
    FiCalendar,
    FiClock,
    FiShield,
    FiCheckCircle,
    FiAlertCircle,
    FiEdit3,
    FiSave,
    FiX,
    FiKey,
    FiCamera,
    FiTrash2,
    FiSettings,
    FiLock,
    FiUnlock
} from 'react-icons/fi';
import '../styles/Profile.css';
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

    const [isEditing, setIsEditing] = useState(false);
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
            setIsEditing(true);
            
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

    // Get password strength color
    const getPasswordStrengthColor = (level) => {
        switch (level) {
            case 'very_strong':
            case 'strong':
                return 'success';
            case 'medium':
                return 'warning';
            case 'weak':
            case 'very_weak':
                return 'error';
            default:
                return 'unknown';
        }
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

    // Handle edit mode toggle
    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel editing - reset form to original values
            setEditForm({
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                email: profileData.email,
                phone: profileData.phone,
                username: profileData.username
            });
            setEmailChanged(false); // Reset email changed status
        }
        setIsEditing(!isEditing);
    };

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
                setIsEditing(false);
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

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>Profile & Account Settings</h1>
                <p>Manage your account information and preferences</p>
            </div>

            <div className="profile-content">
                {/* Account Information Section */}
                <section className="profile-section">
                    <div className="section-header">
                        <h2>Account Information</h2>
                        <div className="section-actions">
                            {isEditing ? (
                                <>
                                    <button
                                        className="action-btn secondary"
                                        onClick={handleEditToggle}
                                        disabled={isLoading}
                                    >
                                        <FiX /> Cancel
                                    </button>
                                    <button
                                        className="action-btn primary"
                                        onClick={handleProfileUpdate}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <ButtonLoadingOverlay text="Saving..." /> : (
                                            <>
                                                <FiSave /> Save Changes
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="action-btn primary"
                                    onClick={handleEditToggle}
                                >
                                    <FiEdit3 /> Edit Account
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Picture Section */}
                    <div className="profile-picture-container">
                        <div className="profile-picture-wrapper">
                            <ProfilePicture user={profileData} size="xlarge" />
                        </div>
                        <div className="picture-actions">
                            {profileData.profilePicture && profileData.profilePicture.url && (
                                <button
                                    className="action-btn primary"
                                    onClick={handleRemoveProfilePicture}
                                    title="Remove profile picture"
                                >
                                    Remove
                                </button>
                            )}
                            <button
                                className="action-btn primary"
                                onClick={handleProfilePictureUpload}
                            >
                                Upload New Picture
                            </button>
                        </div>
                    </div>

                    {/* Read-Only Account Info Cards */}
                    <div className="account-info-cards">
                        <div className="info-card">
                            <div className="info-card-icon">
                                <FiUser />
                            </div>
                            <div className="info-card-content">
                                <div className="info-card-label">Account Status</div>
                                <div className="info-card-value">
                                    <span className={`status-badge ${profileData.isActive ? 'active' : 'inactive'}`}>
                                        {profileData.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <FiSettings />
                            </div>
                            <div className="info-card-content">
                                <div className="info-card-label">Role</div>
                                <div className="info-card-value">
                                    <span className={`status-badge ${profileData.isAdmin ? 'admin' : 'user'}`}>
                                        {profileData.isAdmin ? 'Administrator' : 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <FiCalendar />
                            </div>
                            <div className="info-card-content">
                                <div className="info-card-label">Member Since</div>
                                <div className="info-card-value">{formatDate(profileData.createdAt)}</div>
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <FiClock />
                            </div>
                            <div className="info-card-content">
                                <div className="info-card-label">Last Login</div>
                                <div className="info-card-value">{formatDate(profileData.lastLogin)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Editable Form Fields */}
                    <div className="profile-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        id="firstName"
                                        value={editForm.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        placeholder="Enter your first name"
                                    />
                                ) : (
                                    <div className="form-value">
                                        {profileData.firstName || 'Not provided'}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        id="lastName"
                                        value={editForm.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        placeholder="Enter your last name"
                                    />
                                ) : (
                                    <div className="form-value">
                                        {profileData.lastName || 'Not provided'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        id="username"
                                        value={editForm.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        placeholder="Enter your username"
                                    />
                                ) : (
                                    <div className="form-value">
                                        {profileData.username}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        id="email"
                                        value={editForm.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="Enter your email address"
                                    />
                                ) : (
                                    <div className="form-value">
                                        <span className="email-value">{profileData.email}</span>
                                        {profileData.emailVerified && !emailChanged ? (
                                            <span className="verified-badge">
                                                <FiCheckCircle /> Verified
                                            </span>
                                        ) : (
                                            <button
                                                className="action-btn primary"
                                                onClick={handleEmailVerification}
                                                style={{ marginLeft: '0.5rem', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                            >
                                                {emailChanged ? 'Verify New Email' : 'Verify Email'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={editForm.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="Enter your phone number"
                                    />
                                ) : (
                                    <div className="form-value">
                                        {profileData.phone || 'Not provided'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Password Change Section */}
                <section className="profile-section">
                    <div className="section-header">
                        <h2>Password Management</h2>
                    </div>
                    <div className="security-settings">
                        <div className="security-item">
                            <div className="security-info">
                                <div className="security-icon">
                                    <FiKey />
                                </div>
                                <div className="security-details">
                                    <h3>Password</h3>
                                    <p>Change your account password</p>
                                </div>
                            </div>
                            <button
                                className="action-btn primary"
                                onClick={() => setShowChangePassword(true)}
                            >
                                Change Password
                            </button>
                        </div>

                        <div className="security-item">
                            <div className="security-info">
                                <div className="security-icon">
                                    <FiShield />
                                </div>
                                <div className="security-details">
                                    <h3>Password Strength</h3>
                                    <p>Current password security level</p>
                                </div>
                            </div>
                            <div className="password-strength-display">
                                <span className={`status-badge ${getPasswordStrengthColor(securityStatus.passwordStrength?.level)}`}>
                                    {getPasswordStrengthText(securityStatus.passwordStrength?.level)}
                                </span>
                                <div className="strength-bar">
                                    <div
                                        className={`strength-fill ${getPasswordStrengthColor(securityStatus.passwordStrength?.level)}`}
                                        style={{
                                            width: `${(securityStatus.passwordStrength?.score / 5) * 100}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security Settings Section */}
                <section className="profile-section">
                    <div className="section-header">
                        <h2>Security Settings</h2>
                    </div>
                    <div className="security-settings">
                        <div className="security-item">
                            <div className="security-info">
                                <div className="security-icon">
                                    {profileData.twoFactorEnabled ? <FiLock /> : <FiUnlock />}
                                </div>
                                <div className="security-details">
                                    <h3>Two-Factor Authentication</h3>
                                    <p>{profileData.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>
                            <button
                                className="action-btn primary"
                                onClick={() => console.log('Toggle 2FA')}
                            >
                                {profileData.twoFactorEnabled ? 'Disable' : 'Enable'}
                            </button>
                        </div>

                        <div className="security-item">
                            <div className="security-info">
                                <div className="security-icon">
                                    {profileData.emailVerified && !emailChanged ? <FiCheckCircle /> : <FiAlertCircle />}
                                </div>
                                <div className="security-details">
                                    <h3>Email Verification</h3>
                                    <p>{profileData.emailVerified && !emailChanged ? 'Verified' : emailChanged ? 'New email requires verification' : 'Not verified'}</p>
                                </div>
                            </div>
                            {(!profileData.emailVerified || emailChanged) && (
                                <button
                                    className="action-btn primary"
                                    onClick={handleEmailVerification}
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <ProfilePicture
                            user={profileData}
                            isUploadModal={true}
                            onUploadSuccess={handleProfilePictureSuccess}
                            onUploadError={handleProfilePictureError}
                            onCancel={() => setShowProfilePictureUpload(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile; 