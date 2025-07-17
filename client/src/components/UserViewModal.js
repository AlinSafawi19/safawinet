import React, { useState, useEffect } from 'react';
import { HiX, HiUser, HiMail, HiPhone, HiShieldCheck, HiCalendar, HiClock, HiGlobe, HiCog, HiLockClosed, HiEye, HiEyeOff, HiCheckCircle, HiXCircle, HiExclamationTriangle, HiInformationCircle, HiDocumentText, HiKey, HiDeviceMobile, HiDesktopComputer, HiLocationMarker, HiStar, HiBadgeCheck, HiUserGroup, HiChartBar, HiDocumentReport, HiBell, HiBookOpen, HiQuestionMarkCircle, HiShieldExclamation, HiHeart, HiLightBulb, HiAcademicCap, HiClipboardList, HiClipboardCheck, HiClipboardCopy, HiPlus, HiPencil, HiTrash, HiCloud } from 'react-icons/hi';
import { FiDownload, FiCalendar, FiClock, FiXCircle, FiUser, FiMail, FiPhone, FiShield, FiSettings, FiGlobe, FiStar, FiCheckCircle, FiXCircle as FiXCircleIcon, FiAlertTriangle, FiInfo, FiEye, FiEyeOff, FiLock, FiUnlock, FiKey, FiSmartphone, FiMonitor, FiMapPin, FiUsers, FiCog, FiBarChart3, FiFileText, FiBell, FiBook, FiHelpCircle, FiTool, FiCloud, FiHeart, FiZap, FiGraduationCap, FiClipboard, FiCheckSquare, FiSquare } from 'react-icons/fi';
import moment from 'moment-timezone';
import { getProfileDisplay, getInitialsColor } from '../utils/avatarUtils';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';

const UserViewModal = ({ user, isOpen, onClose, currentUser, onEditUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const userTimezone = currentUser?.userPreferences?.timezone || 'Asia/Beirut';
    const userDateFormat = currentUser?.userPreferences?.dateFormat || 'MMM DD, YYYY h:mm a';
    return moment(dateString).tz(userTimezone).format(userDateFormat);
  };

  const formatDuration = (dateString) => {
    if (!dateString) return 'N/A';
    return moment(dateString).fromNow();
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      viewer: 'bg-green-100 text-green-800',
      custom: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`role-badge ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getVerificationBadge = (isVerified) => {
    return (
      <span className={`verification-badge ${isVerified ? 'verified' : 'unverified'}`}>
        {isVerified ? (
          <>
            <HiCheckCircle className="verification-icon" />
            Verified
          </>
        ) : (
          <>
            <HiXCircle className="verification-icon" />
            Unverified
          </>
        )}
      </span>
    );
  };

  const getPasswordStrengthBadge = (strength) => {
    const strengthColors = {
      very_weak: 'bg-red-100 text-red-800',
      weak: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      strong: 'bg-green-100 text-green-800',
      very_strong: 'bg-emerald-100 text-emerald-800',
      unknown: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`password-strength-badge ${strengthColors[strength.level] || strengthColors.unknown}`}>
        {strength.level.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPermissionIcon = (page) => {
    const pageIcons = {
      'dashboard': HiChartBar,
      'users': HiUserGroup,
      'audit-logs': HiDocumentText,
      'knowledge-guide': HiBookOpen,
      'profile': HiUser,
      'reports': HiDocumentReport,
      'analytics': HiChartBar,
      'notifications': HiBell,
      'settings': HiCog,
      'backups': HiCloud,
      'integrations': HiCog,
      'security': HiShieldExclamation,
      'help': HiQuestionMarkCircle,
      'support': HiHeart
    };

    const IconComponent = pageIcons[page] || HiDocumentText;
    return <IconComponent className="permission-page-icon" />;
  };

  const getActionIcon = (action) => {
    const actionIcons = {
      'view': HiEye,
      'view_own': HiEye,
      'add': HiPlus,
      'edit': HiPencil,
      'delete': HiTrash,
      'export': FiDownload
    };

    const IconComponent = actionIcons[action] || HiEye;
    return <IconComponent className="permission-action-icon" />;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiUser },
    { id: 'security', label: 'Security', icon: HiShieldCheck },
    { id: 'preferences', label: 'Preferences', icon: HiCog },
    { id: 'permissions', label: 'Permissions', icon: HiKey },
    { id: 'activity', label: 'Activity', icon: HiClock },
    { id: 'sessions', label: 'Sessions', icon: HiDeviceMobile }
  ];

  const renderOverviewTab = () => (
    <div className="user-overview-tab">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div
            className="profile-avatar-large"
            style={{ backgroundColor: getInitialsColor(user.username || user.email || user.firstName || '') }}
          >
            {(() => {
              const profileDisplay = getProfileDisplay(user);
              if (profileDisplay.type === 'image') {
                return (
                  <>
                    <img
                      src={profileDisplay.value}
                      alt={`${user.firstName} ${user.lastName}'s profile picture`}
                      className="profile-image-large"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="profile-initials-large"
                      style={{ display: 'none' }}
                    >
                      {user.profileInitials || profileDisplay.value}
                    </div>
                  </>
                );
              } else {
                return (
                  <div className="profile-initials-large">
                    {profileDisplay.value}
                  </div>
                );
              }
            })()}
          </div>
          <div className="profile-status">
            {getStatusBadge(user.isActive)}
            {getRoleBadge(user.role)}
          </div>
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{user.firstName} {user.lastName}</h2>
          <p className="profile-username">@{user.username}</p>
          <div className="profile-meta">
            <span className="profile-email">
              <HiMail className="meta-icon" />
              {user.email}
              {getVerificationBadge(user.emailVerified)}
            </span>
            {user.phone && (
              <span className="profile-phone">
                <HiPhone className="meta-icon" />
                {user.phone}
                {getVerificationBadge(user.phoneVerified)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="info-section">
        <h3 className="section-title">
          <HiUser className="section-icon" />
          Basic Information
        </h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Full Name</label>
            <span>{user.firstName} {user.lastName}</span>
          </div>
          <div className="info-item">
            <label>Username</label>
            <span>{user.username}</span>
          </div>
          <div className="info-item">
            <label>Email</label>
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="info-item">
              <label>Phone</label>
              <span>{user.phone}</span>
            </div>
          )}
          <div className="info-item">
            <label>Role</label>
            <span>{getRoleBadge(user.role)}</span>
          </div>
          <div className="info-item">
            <label>Status</label>
            <span>{getStatusBadge(user.isActive)}</span>
          </div>
          <div className="info-item">
            <label>Admin Access</label>
            <span className={user.isAdmin ? 'admin-badge' : 'non-admin-badge'}>
              {user.isAdmin ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="info-section">
        <h3 className="section-title">
          <HiCalendar className="section-icon" />
          Account Information
        </h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Created</label>
            <span>{formatDate(user.createdAt)}</span>
          </div>
          <div className="info-item">
            <label>Created By</label>
            <span>
              {user.createdBy ? (
                `${user.createdBy.firstName} ${user.createdBy.lastName}`
              ) : (
                'System'
              )}
            </span>
          </div>
          <div className="info-item">
            <label>Last Updated</label>
            <span>{formatDate(user.updatedAt)}</span>
          </div>
          <div className="info-item">
            <label>Last Login</label>
            <span>
              {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
            </span>
          </div>
          <div className="info-item">
            <label>Account Age</label>
            <span>{formatDuration(user.createdAt)}</span>
          </div>
          <div className="info-item">
            <label>Welcome Email</label>
            <span className={user.welcomeEmailSent ? 'sent-badge' : 'not-sent-badge'}>
              {user.welcomeEmailSent ? 'Sent' : 'Not Sent'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="user-security-tab">
      {/* Two-Factor Authentication */}
      <div className="security-section">
        <h3 className="section-title">
          <HiShieldCheck className="section-icon" />
          Two-Factor Authentication
        </h3>
        <div className="security-status">
          <div className="security-item">
            <label>2FA Status</label>
            <span className={user.twoFactorEnabled ? 'enabled-badge' : 'disabled-badge'}>
              {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {user.twoFactorEnabled && (
            <>
              <div className="security-item">
                <label>Backup Codes</label>
                <span>
                  {user.twoFactorBackupCodes ? 
                    `${user.twoFactorBackupCodes.filter(code => !code.used).length} remaining` : 
                    'Not generated'
                  }
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Password Information */}
      <div className="security-section">
        <h3 className="section-title">
          <HiLockClosed className="section-icon" />
          Password Security
        </h3>
        <div className="password-info">
          <div className="password-strength-display">
            <div className="strength-header">
              <label>Password Strength</label>
              <button
                className="toggle-password-strength"
                onClick={() => setShowPasswordStrength(!showPasswordStrength)}
              >
                {showPasswordStrength ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
            <div className="strength-content">
              {getPasswordStrengthBadge(user.passwordStrength || { level: 'unknown' })}
              {showPasswordStrength && user.passwordStrength && (
                <div className="strength-details">
                  <div className="strength-score">
                    Score: {user.passwordStrength.score || 0}/100
                  </div>
                  <div className="strength-requirements">
                    <div className={`requirement ${user.passwordStrength.details?.length >= 8 ? 'met' : 'unmet'}`}>
                      <HiCheckCircle className="requirement-icon" />
                      At least 8 characters
                    </div>
                    <div className={`requirement ${user.passwordStrength.details?.hasUppercase ? 'met' : 'unmet'}`}>
                      <HiCheckCircle className="requirement-icon" />
                      Contains uppercase letter
                    </div>
                    <div className={`requirement ${user.passwordStrength.details?.hasLowercase ? 'met' : 'unmet'}`}>
                      <HiCheckCircle className="requirement-icon" />
                      Contains lowercase letter
                    </div>
                    <div className={`requirement ${user.passwordStrength.details?.hasNumbers ? 'met' : 'unmet'}`}>
                      <HiCheckCircle className="requirement-icon" />
                      Contains number
                    </div>
                    <div className={`requirement ${user.passwordStrength.details?.hasSpecialChars ? 'met' : 'unmet'}`}>
                      <HiCheckCircle className="requirement-icon" />
                      Contains special character
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="password-meta">
            <div className="password-item">
              <label>Last Changed</label>
              <span>{formatDate(user.passwordLastChanged)}</span>
            </div>
            <div className="password-item">
              <label>Last Checked</label>
              <span>{formatDate(user.passwordStrength?.lastChecked)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Security */}
      <div className="security-section">
        <h3 className="section-title">
          <HiShieldExclamation className="section-icon" />
          Account Security
        </h3>
        <div className="security-grid">
          <div className="security-item">
            <label>Account Locked</label>
            <span className={user.accountLocked ? 'locked-badge' : 'unlocked-badge'}>
              {user.accountLocked ? 'Yes' : 'No'}
            </span>
          </div>
          {user.accountLocked && user.lockedUntil && (
            <div className="security-item">
              <label>Locked Until</label>
              <span>{formatDate(user.lockedUntil)}</span>
            </div>
          )}
          <div className="security-item">
            <label>Failed Login Attempts</label>
            <span className={user.failedLoginAttempts > 0 ? 'warning-badge' : 'normal-badge'}>
              {user.failedLoginAttempts}
            </span>
          </div>
          {user.lastFailedLogin && (
            <div className="security-item">
              <label>Last Failed Login</label>
              <span>{formatDate(user.lastFailedLogin)}</span>
            </div>
          )}
          <div className="security-item">
            <label>Max Sessions</label>
            <span>{user.maxSessions || 5}</span>
          </div>
          <div className="security-item">
            <label>Active Sessions</label>
            <span>{user.activeSessions?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="security-section">
        <h3 className="section-title">
          <HiCheckCircle className="section-icon" />
          Verification Status
        </h3>
        <div className="verification-grid">
          <div className="verification-item">
            <label>Email Verification</label>
            {getVerificationBadge(user.emailVerified)}
          </div>
          <div className="verification-item">
            <label>Phone Verification</label>
            {getVerificationBadge(user.phoneVerified)}
          </div>
          <div className="verification-item">
            <label>Fully Verified</label>
            {getVerificationBadge(user.isFullyVerified?.() || (user.emailVerified && (user.phoneVerified || !user.phone)))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="user-preferences-tab">
      {/* User Preferences */}
      <div className="preferences-section">
        <h3 className="section-title">
          <HiCog className="section-icon" />
          User Preferences
        </h3>
        <div className="preferences-grid">
          <div className="preference-item">
            <label>Timezone</label>
            <span>
              <HiGlobe className="preference-icon" />
              {user.userPreferences?.timezone || 'Asia/Beirut'}
            </span>
          </div>
          <div className="preference-item">
            <label>Language</label>
            <span>
              <HiDocumentText className="preference-icon" />
              {user.userPreferences?.language || 'English'}
            </span>
          </div>
          <div className="preference-item">
            <label>Theme</label>
            <span>
              <HiStar className="preference-icon" />
              {user.userPreferences?.theme || 'Light'}
            </span>
          </div>
          <div className="preference-item">
            <label>Date Format</label>
            <span>
              <HiCalendar className="preference-icon" />
              {user.userPreferences?.dateFormat || 'MMM DD, YYYY h:mm a'}
            </span>
          </div>
          <div className="preference-item">
            <label>Auto Logout Time</label>
            <span>
              <HiClock className="preference-icon" />
              {user.userPreferences?.autoLogoutTime || 30} minutes
            </span>
          </div>
        </div>
      </div>

      {/* Profile Picture Information */}
      {user.profilePicture && (
        <div className="preferences-section">
          <h3 className="section-title">
            <HiUser className="section-icon" />
            Profile Picture
          </h3>
          <div className="profile-picture-info">
            <div className="picture-item">
              <label>Uploaded</label>
              <span>{formatDate(user.profilePicture.uploadedAt)}</span>
            </div>
            <div className="picture-item">
              <label>Filename</label>
              <span>{user.profilePicture.filename || 'N/A'}</span>
            </div>
            <div className="picture-item">
              <label>Profile Initials</label>
              <span>{user.profileInitials || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="user-permissions-tab">
      {/* Permissions Overview */}
      <div className="permissions-section">
        <h3 className="section-title">
          <HiKey className="section-icon" />
          Permissions Overview
        </h3>
        <div className="permissions-summary">
          <div className="summary-item">
            <label>Total Pages</label>
            <span>{user.permissions?.length || 0}</span>
          </div>
          <div className="summary-item">
            <label>Total Actions</label>
            <span>
              {user.permissions?.reduce((total, perm) => total + perm.actions.length, 0) || 0}
            </span>
          </div>
          <div className="summary-item">
            <label>Admin Access</label>
            <span className={user.isAdmin ? 'admin-badge' : 'non-admin-badge'}>
              {user.isAdmin ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Permissions */}
      <div className="permissions-section">
        <h3 className="section-title">
          <HiDocumentText className="section-icon" />
          Detailed Permissions
        </h3>
        <div className="permissions-list">
          {user.permissions?.map((permission, index) => (
            <div key={index} className="permission-group">
              <div className="permission-header">
                {getPermissionIcon(permission.page)}
                <span className="permission-page">{permission.page.replace('-', ' ').toUpperCase()}</span>
              </div>
              <div className="permission-actions">
                {permission.actions.map((action, actionIndex) => (
                  <span key={actionIndex} className="permission-action">
                    {getActionIcon(action)}
                    {action.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )) || (
            <div className="no-permissions">
              <HiInformationCircle className="no-permissions-icon" />
              <span>No specific permissions assigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="user-activity-tab">
      {/* Login Activity */}
      <div className="activity-section">
        <h3 className="section-title">
          <HiClock className="section-icon" />
          Login Activity
        </h3>
        <div className="activity-grid">
          <div className="activity-item">
            <label>Last Login</label>
            <span>
              {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
            </span>
          </div>
          <div className="activity-item">
            <label>Last Login Duration</label>
            <span>
              {user.lastLogin ? formatDuration(user.lastLogin) : 'N/A'}
            </span>
          </div>
          <div className="activity-item">
            <label>Failed Login Attempts</label>
            <span className={user.failedLoginAttempts > 0 ? 'warning-badge' : 'normal-badge'}>
              {user.failedLoginAttempts}
            </span>
          </div>
          {user.lastFailedLogin && (
            <div className="activity-item">
              <label>Last Failed Login</label>
              <span>{formatDate(user.lastFailedLogin)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Account Activity */}
      <div className="activity-section">
        <h3 className="section-title">
          <HiCalendar className="section-icon" />
          Account Activity
        </h3>
        <div className="activity-grid">
          <div className="activity-item">
            <label>Account Created</label>
            <span>{formatDate(user.createdAt)}</span>
          </div>
          <div className="activity-item">
            <label>Last Updated</label>
            <span>{formatDate(user.updatedAt)}</span>
          </div>
          <div className="activity-item">
            <label>Account Age</label>
            <span>{formatDuration(user.createdAt)}</span>
          </div>
          <div className="activity-item">
            <label>Password Last Changed</label>
            <span>{formatDate(user.passwordLastChanged)}</span>
          </div>
          {user.passwordStrength?.lastChecked && (
            <div className="activity-item">
              <label>Password Last Checked</label>
              <span>{formatDate(user.passwordStrength.lastChecked)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSessionsTab = () => (
    <div className="user-sessions-tab">
      {/* Active Sessions */}
      <div className="sessions-section">
        <h3 className="section-title">
          <HiDeviceMobile className="section-icon" />
          Active Sessions
        </h3>
        <div className="sessions-summary">
          <div className="summary-item">
            <label>Active Sessions</label>
            <span>{user.activeSessions?.length || 0}</span>
          </div>
          <div className="summary-item">
            <label>Max Sessions</label>
            <span>{user.maxSessions || 5}</span>
          </div>
          <div className="summary-item">
            <label>Session Limit</label>
            <span className={user.activeSessions?.length >= (user.maxSessions || 5) ? 'limit-reached-badge' : 'limit-ok-badge'}>
              {user.activeSessions?.length || 0} / {user.maxSessions || 5}
            </span>
          </div>
        </div>
      </div>

      {/* Session Details */}
      {user.activeSessions && user.activeSessions.length > 0 && (
        <div className="sessions-section">
          <h3 className="section-title">
            <HiDesktopComputer className="section-icon" />
            Session Details
          </h3>
          <div className="sessions-list">
            {user.activeSessions.map((session, index) => (
              <div key={index} className="session-item">
                <div className="session-header">
                  <div className="session-device">
                    {session.device?.includes('Mobile') ? <HiDeviceMobile /> : <HiDesktopComputer />}
                    <span>{session.device || 'Unknown Device'}</span>
                  </div>
                  <div className="session-ip">
                    <HiLocationMarker />
                    <span>{session.ip || 'Unknown IP'}</span>
                  </div>
                </div>
                <div className="session-details">
                  <div className="session-info">
                    <label>Session ID</label>
                    <span className="session-id">{session.sessionId}</span>
                  </div>
                  <div className="session-info">
                    <label>Created</label>
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                  <div className="session-info">
                    <label>Last Activity</label>
                    <span>{formatDate(session.lastActivity)}</span>
                  </div>
                  <div className="session-info">
                    <label>User Agent</label>
                    <span className="user-agent">{session.userAgent || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!user.activeSessions || user.activeSessions.length === 0) && (
        <div className="no-sessions">
          <HiInformationCircle className="no-sessions-icon" />
          <span>No active sessions</span>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'security':
        return renderSecurityTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'permissions':
        return renderPermissionsTab();
      case 'activity':
        return renderActivityTab();
      case 'sessions':
        return renderSessionsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className={`user-view-modal-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}>
      <div className="user-view-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <HiUser className="title-icon" />
            User Details
          </div>
          <div className="modal-actions">
            {onEditUser && (
              <button 
                className="modal-edit-btn" 
                onClick={() => {
                  onEditUser(user);
                  onClose();
                }}
                title="Edit User"
              >
                <HiPencil />
                Edit User
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>
              <HiX />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Tab Navigation */}
          <div className="modal-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="tab-icon" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserViewModal; 