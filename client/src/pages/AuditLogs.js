import React, { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';
import axios from 'axios';
import moment from 'moment';
import 'moment-timezone';
import Select from 'react-select';
import { applyUserTheme } from '../utils/themeUtils';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiLock,
  FiMail,
  FiShield,
  FiWifi,
  FiShield as FiShieldCheck,
  FiAlertCircle,
  FiGlobe,
  FiServer,
  FiClock,
  FiActivity,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiCalendar,
  FiMapPin,
  FiMonitor,
  FiUser,
  FiKey,
  FiSmartphone,
  FiX
} from 'react-icons/fi';
import { getStatusClass } from '../utils/classUtils';

const AuditLogs = () => {
  const user = authService.getCurrentUser();
  const sidebarRef = useRef(null);

  // Apply user theme preference
  useEffect(() => {
    if (user) {
      applyUserTheme(user);
    }
  }, [user]);

  // Extract user preferences with fallbacks
  const userTimezone = user?.userPreferences?.timezone || 'Asia/Beirut';
  const userDateFormat = user?.userPreferences?.dateFormat || 'MMM dd, yyyy h:mm a';

  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    riskLevel: '',
    success: '',
    dateRange: '24h'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0
  });
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersVisible && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setFiltersVisible(false);
      }
    };

    if (filtersVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filtersVisible]);

  // Create a single axios instance for all API calls
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

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    if (!authService.isUserAuthenticated()) return;

    setLoading(true);
    setError(null);

    try {
      const api = createApiInstance();

      // Calculate date range
      let cutoff;
      switch (filters.dateRange) {
        case '1h':
          cutoff = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case '24h':
          cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      // Build query parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        cutoff: cutoff.toISOString()
      };

      if (filters.action) params.action = filters.action;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.success !== '') params.success = filters.success;

      const response = await api.get('/auth/audit-logs', { params });

      if (response.data.success) {
        setAuditLogs(response.data.data.logs);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.total
        }));
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to fetch audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [createApiInstance, filters, pagination.page, pagination.limit]);

  // Fetch audit logs on mount and when filters change
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Format date for display with user's timezone and date format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return moment(dateString).tz(userTimezone).format(userDateFormat);
  };

  // Get action icon
  const getActionIcon = (action) => {
    switch (action) {
      case 'login':
        return <FiUser />;
      case 'login_failed':
        return <FiAlertTriangle />;
      case 'logout':
        return <FiUser />;
      case 'password_change':
        return <FiKey />;
      case 'password_reset_request':
        return <FiKey />;
      case 'password_reset_complete':
        return <FiKey />;
      case 'two_factor_enable':
        return <FiShield />;
      case 'two_factor_disable':
        return <FiShield />;
      case 'two_factor_verify':
        return <FiShield />;
      case 'two_factor_backup_used':
        return <FiShield />;
      case 'account_lock':
        return <FiLock />;
      case 'account_unlock':
        return <FiLock />;
      case 'session_create':
        return <FiWifi />;
      case 'session_destroy':
        return <FiWifi />;
      case 'profile_update':
        return <FiUser />;
      case 'permission_change':
        return <FiShield />;
      case 'user_create':
        return <FiUser />;
      case 'user_update':
        return <FiUser />;
      case 'user_delete':
        return <FiUser />;
      case 'admin_action':
        return <FiShield />;
      case 'suspicious_activity':
        return <FiAlertCircle />;
      case 'rate_limit_exceeded':
        return <FiAlertTriangle />;
      case 'security_alert':
        return <FiAlertTriangle />;
      default:
        return <FiActivity />;
    }
  };

  // Get action display name
  const getActionDisplayName = (action) => {
    // Replace underscores with spaces and capitalize first letter
    return action.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  };

  // Get risk level color
  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'unknown';
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle limit change
  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when changing limit
    }));
  };

  // Refresh audit logs
  const handleRefresh = () => {
    fetchAuditLogs();
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      action: '',
      riskLevel: '',
      success: '',
      dateRange: '24h'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Toggle filters sidebar
  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  // Handle quick filter selection
  const handleQuickFilter = (filterType) => {
    switch (filterType) {
      case 'failed_logins':
        setFilters({
          action: 'login_failed',
          riskLevel: '',
          success: 'false',
          dateRange: '24h'
        });
        break;
      case 'high_risk':
        setFilters({
          action: '',
          riskLevel: 'high',
          success: '',
          dateRange: '24h'
        });
        break;
      case 'critical_events':
        setFilters({
          action: '',
          riskLevel: 'critical',
          success: '',
          dateRange: '24h'
        });
        break;
      case 'successful_logins':
        setFilters({
          action: 'login',
          riskLevel: '',
          success: 'true',
          dateRange: '24h'
        });
        break;
      case 'two_factor':
        setFilters({
          action: 'two_factor_enable',
          riskLevel: '',
          success: '',
          dateRange: '24h'
        });
        break;
      case 'security_alerts':
        setFilters({
          action: 'security_alert',
          riskLevel: '',
          success: '',
          dateRange: '24h'
        });
        break;
      case 'recent_hour':
        setFilters({
          action: '',
          riskLevel: '',
          success: '',
          dateRange: '1h'
        });
        break;
      case 'last_week':
        setFilters({
          action: '',
          riskLevel: '',
          success: '',
          dateRange: '7d'
        });
        break;
      default:
        break;
    }
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Check if a quick filter is currently active
  const isQuickFilterActive = (filterType) => {
    switch (filterType) {
      case 'failed_logins':
        return filters.action === 'login_failed' && filters.success === 'false';
      case 'high_risk':
        return filters.riskLevel === 'high';
      case 'critical_events':
        return filters.riskLevel === 'critical';
      case 'successful_logins':
        return filters.action === 'login' && filters.success === 'true';
      case 'two_factor':
        return filters.action === 'two_factor_enable';
      case 'security_alerts':
        return filters.action === 'security_alert';
      case 'recent_hour':
        return filters.dateRange === '1h';
      case 'last_week':
        return filters.dateRange === '7d';
      default:
        return false;
    }
  };

  // Select options
  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'login_failed', label: 'Failed Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'password_change', label: 'Password Change' },
    { value: 'two_factor_enable', label: '2FA Enable' },
    { value: 'two_factor_disable', label: '2FA Disable' },
    { value: 'account_lock', label: 'Account Lock' },
    { value: 'suspicious_activity', label: 'Suspicious Activity' },
    { value: 'security_alert', label: 'Security Alert' },
    { value: 'rate_limit_exceeded', label: 'Rate Limit Exceeded' }
  ];

  const riskLevelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Successful' },
    { value: 'false', label: 'Failed' }
  ];

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  const limitOptions = [
    { value: 25, label: '25 rows' },
    { value: 100, label: '100 rows' },
    { value: 500, label: '500 rows' },
    { value: 1000, label: '1000 rows' }
  ];

  // Custom styles for React Select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'var(--bg-main)',
      border: `1px solid ${state.isFocused ? 'var(--accent-red)' : 'var(--border-color)'}`,
      boxShadow: state.isFocused ? '0 0 0 3px rgba(215, 38, 56, 0.1)' : 'none',
      '&:hover': {
        borderColor: 'var(--gray-500)'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--bg-main)',
      border: '1px solid var(--border-color)',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'var(--accent-red)'
        : state.isFocused
          ? 'var(--gray-100)'
          : 'transparent',
      color: state.isSelected ? 'white' : 'var(--text-main)',
      '&:hover': {
        backgroundColor: state.isSelected ? 'var(--accent-red)' : 'var(--gray-100)'
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-main)'
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--text-main)'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-muted)'
    })
  };

  return (
    <div className="audit-logs">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FiActivity /> Audit Logs
          </h1>
          <p className="page-description">
            View detailed security events and user activity logs
          </p>
        </div>
        <div className="header-actions">
          {/* Row Limit Selector */}
          <div className="row-limit-controls">
            <label htmlFor="row-limit" className="limit-label">
              Rows per page:
            </label>
            <Select
              id="row-limit"
              value={limitOptions.find(option => option.value === pagination.limit)}
              onChange={(selectedOption) => handleLimitChange(selectedOption ? selectedOption.value : 25)}
              options={limitOptions}
              styles={customStyles}
              placeholder="Select rows per page..."
              isClearable={false}
              isSearchable={false}
              className="limit-select"
            />
          </div>
          <button
            className="btn btn--secondary"
            onClick={toggleFilters}
            aria-label="Toggle filters"
          >
            <FiFilter />
            Filters
          </button>
          <button
            className="btn btn--secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="audit-content">
        {/* Main Content */}
        <div className={`audit-main ${filtersVisible ? 'with-sidebar' : ''}`}>
          {/* Results Summary */}
          <div className="audit-summary">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-number">{pagination.total}</span>
                <span className="stat-label">Total Events</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {auditLogs.filter(log => log.riskLevel === 'high' || log.riskLevel === 'critical').length}
                </span>
                <span className="stat-label">High Risk</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {auditLogs.filter(log => log.action === 'login_failed').length}
                </span>
                <span className="stat-label">Failed Logins</span>
              </div>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="quick-filters">
            <div className="quick-filter-buttons">
              <button
                className={`quick-filter-btn ${isQuickFilterActive('failed_logins') ? 'active' : ''}`}
                onClick={() => handleQuickFilter('failed_logins')}
              >
                <FiAlertTriangle />
                Failed Logins
              </button>
              <button
                className={`quick-filter-btn ${isQuickFilterActive('high_risk') ? 'active' : ''}`}
                onClick={() => handleQuickFilter('high_risk')}
              >
                <FiAlertCircle />
                High Risk
              </button>
              <button
                className={`quick-filter-btn ${isQuickFilterActive('critical_events') ? 'active' : ''}`}
                onClick={() => handleQuickFilter('critical_events')}
              >
                <FiShield />
                Critical Events
              </button>
              <button
                className={`quick-filter-btn ${isQuickFilterActive('successful_logins') ? 'active' : ''}`}
                onClick={() => handleQuickFilter('successful_logins')}
              >
                <FiCheckCircle />
                Successful Logins
              </button>
              <button
                className={`quick-filter-btn ${isQuickFilterActive('two_factor') ? 'active' : ''}`}
                onClick={() => handleQuickFilter('two_factor')}
              >
                <FiShield />
                2FA Events
              </button>
              <button
                className={`quick-filter-btn ${isQuickFilterActive('security_alerts') ? 'active' : ''}`}
                onClick={() => handleQuickFilter('security_alerts')}
              >
                <FiAlertTriangle />
                Security Alerts
              </button>
              <button
                className={`quick-filter-btn ${isQuickFilterActive('recent_hour') ? 'active' : ''}`}
                onClick={() => handleQuickFilter('recent_hour')}
              >
                <FiClock />
                Last Hour
              </button>
              <button
                className={`quick-filter-btn ${isQuickFilterActive('last_week') ? 'active' : ''}`}
                onClick={() => handleQuickFilter('last_week')}
              >
                <FiCalendar />
                Last Week
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="audit-table-container">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading audit logs...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <FiAlertCircle />
                <p>{error}</p>
                <button className="btn btn--primary" onClick={fetchAuditLogs}>
                  Try Again
                </button>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="empty-state">
                <FiEye />
                <h3>No Audit Logs Found</h3>
                <p>No security events match your current filters.</p>
                <button className="btn btn--secondary" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Status</th>
                        <th>Risk Level</th>
                        <th>IP Address</th>
                        <th>Device</th>
                        <th>Location</th>
                        <th>Timestamp</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, index) => (
                        <tr key={log._id || index} className={`audit-row`}>
                          <td className="action-cell">
                            <div className="action-info">
                              <div className="action-details">
                                <span className="action-name">
                                  {getActionDisplayName(log.action)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="status-cell">
                            <span className={`status-badge ${getStatusClass(log.success ? 'success' : 'error')}`}>
                              {log.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className="risk-cell">
                            <span className={`risk-badge ${getStatusClass(getRiskLevelColor(log.riskLevel))}`}>
                              {log.riskLevel || 'low'}
                            </span>
                          </td>
                          <td className="ip-cell">
                            <span className="ip-address">{log.ip}</span>
                          </td>
                          <td className="device-cell">
                            <span className="device-info">{log.device || 'Unknown'}</span>
                          </td>
                          <td className="location-cell">
                            {log.location ? (
                              <div className="location-info">
                                <span className="location-country">
                                  <FiMapPin /> {log.location.country || 'Unknown'}
                                </span>
                                {log.location.city && (
                                  <span className="location-city">{log.location.city}</span>
                                )}
                              </div>
                            ) : (
                              <span className="no-location">No location data</span>
                            )}
                          </td>
                          <td className="timestamp-cell">
                            <span className="timestamp">
                              {formatDate(log.timestamp)}
                            </span>
                          </td>
                          <td className="details-cell">
                            {log.details ? (
                              <div className="details-content">
                                {log.details.type && (
                                  <span className="detail-item">
                                    Type: {log.details.type}
                                  </span>
                                )}
                                {log.details.message && (
                                  <span className="detail-item">
                                    {log.details.message}
                                  </span>
                                )}
                                {log.details.severity && (
                                  <span className="detail-item">
                                    Severity: {log.details.severity}
                                  </span>
                                )}
                                {log.details.reason && (
                                  <span className="detail-item">
                                    {log.details.reason.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="detail-item">No additional details</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination and Row Limit Controls */}
                <div className="pagination-container">
                  {/* Pagination */}
                  {pagination.total > pagination.limit && (
                    <div className="pagination">
                      <button
                        className="btn btn--secondary"
                        disabled={pagination.page === 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                      >
                        Previous
                      </button>

                      <span className="pagination-info">
                        Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                        <span className="total-info">
                          ({pagination.total} total records)
                        </span>
                      </span>

                      <button
                        className="btn btn--secondary"
                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        onClick={() => handlePageChange(pagination.page + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters Sidebar */}
        <div className={`filters-sidebar ${filtersVisible ? 'visible' : ''}`} ref={sidebarRef}>
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button
              className="sidebar-close-btn"
              onClick={toggleFilters}
              aria-label="Close filters"
            >
              <FiX />
            </button>
          </div>

          <div className="sidebar-content">
            <div className="filter-section">
              <h4>Action Type</h4>
              <Select
                value={actionOptions.find(option => option.value === filters.action)}
                onChange={(selectedOption) => handleFilterChange('action', selectedOption ? selectedOption.value : '')}
                options={actionOptions}
                styles={customStyles}
                placeholder="Select action type..."
                isClearable
                isSearchable
              />
            </div>

            <div className="filter-section">
              <h4>Risk Level</h4>
              <Select
                value={riskLevelOptions.find(option => option.value === filters.riskLevel)}
                onChange={(selectedOption) => handleFilterChange('riskLevel', selectedOption ? selectedOption.value : '')}
                options={riskLevelOptions}
                styles={customStyles}
                placeholder="Select risk level..."
                isClearable
                isSearchable
              />
            </div>

            <div className="filter-section">
              <h4>Status</h4>
              <Select
                value={statusOptions.find(option => option.value === filters.success)}
                onChange={(selectedOption) => handleFilterChange('success', selectedOption ? selectedOption.value : '')}
                options={statusOptions}
                styles={customStyles}
                placeholder="Select status..."
                isClearable
                isSearchable
              />
            </div>

            <div className="filter-section">
              <h4>Time Range</h4>
              <Select
                value={timeRangeOptions.find(option => option.value === filters.dateRange)}
                onChange={(selectedOption) => handleFilterChange('dateRange', selectedOption ? selectedOption.value : '24h')}
                options={timeRangeOptions}
                styles={customStyles}
                placeholder="Select time range..."
                isClearable={false}
                isSearchable
              />
            </div>

            <div className="filter-actions">
              <button
                className="btn btn--primary btn--full"
                onClick={handleClearFilters}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
