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
  // Remove sidebarRef, filtersVisible, and sidebar toggling logic

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
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [summaryStats, setSummaryStats] = useState({
    highRiskCount: 0,
    failedLoginsCount: 0
  });
  // Remove sidebarRef, filtersVisible, and sidebar toggling logic

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

      // Calculate date range in user's timezone
      let cutoff;
      const now = moment.tz(userTimezone);
      switch (filters.dateRange) {
        case '1h':
          cutoff = now.clone().subtract(1, 'hour');
          break;
        case '24h':
          cutoff = now.clone().subtract(24, 'hours');
          break;
        case '7d':
          cutoff = now.clone().subtract(7, 'days');
          break;
        case '30d':
          cutoff = now.clone().subtract(30, 'days');
          break;
        default:
          cutoff = now.clone().subtract(24, 'hours');
      }

      // Build query parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        cutoff: cutoff.toISOString(),
        timezone: userTimezone // Send user's timezone to backend
      };

      if (filters.action) params.action = filters.action;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.success !== '') params.success = filters.success;

      const response = await api.get('/auth/audit-logs', { params });

      if (response.data.success) {
        setAuditLogs(response.data.data.logs);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages,
          hasNextPage: response.data.data.hasNextPage,
          hasPrevPage: response.data.data.hasPrevPage
        }));
        
        // Update summary statistics from server
        if (response.data.data.summary) {
          setSummaryStats(response.data.data.summary);
        }
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to fetch audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [createApiInstance, filters, pagination.page, pagination.limit, userTimezone]);

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
    // setFiltersVisible(!filtersVisible); // This line is removed
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

  return (
    <div className="audit-logs-container">
      <div className="audit-logs-header-row">
        <div className="audit-logs-header">
          <h1 className="audit-logs-title">
            <FiActivity /> Audit Logs
          </h1>
          <p className="audit-logs-description">
            View detailed security events and user activity logs
          </p>
        </div>
        <div className="audit-logs-controls">
          {/* Row Limit Selector */}
          <div className="row-limit-selector">
            <label htmlFor="row-limit">
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
            />
          </div>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Row - now above summary cards and table */}
      <div className="filters-row">
        <div className="filters-group">
          <div className="filter-group">
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
          <div className="filter-group">
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
          <div className="filter-group">
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
          <div className="filter-group">
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
        </div>
        <div className="filter-actions">
          <button
            className="clear-filters-btn"
            onClick={handleClearFilters}
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Move summary cards here, directly below filters */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-value">{pagination.total}</span>
          <span className="summary-label">Total Events</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">
            {summaryStats.highRiskCount}
          </span>
          <span className="summary-label">High Risk</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">
            {summaryStats.failedLoginsCount}
          </span>
          <span className="summary-label">Failed Logins</span>
        </div>
      </div>

      <div className="audit-logs-main-content">
        {/* Main Content */}
        <div className="audit-logs-content">
          {/* Quick Filter Buttons */}
          <div className="quick-filters-row">
            <div className="quick-filters">
              <button
                className={`quick-filter-btn${isQuickFilterActive('failed_logins') ? ' active' : ''}`}
                onClick={() => handleQuickFilter('failed_logins')}
              >
                <FiAlertTriangle />
                Failed Logins
              </button>
              <button
                className={`quick-filter-btn${isQuickFilterActive('high_risk') ? ' active' : ''}`}
                onClick={() => handleQuickFilter('high_risk')}
              >
                <FiAlertCircle />
                High Risk
              </button>
              <button
                className={`quick-filter-btn${isQuickFilterActive('critical_events') ? ' active' : ''}`}
                onClick={() => handleQuickFilter('critical_events')}
              >
                <FiShield />
                Critical Events
              </button>
              <button
                className={`quick-filter-btn${isQuickFilterActive('successful_logins') ? ' active' : ''}`}
                onClick={() => handleQuickFilter('successful_logins')}
              >
                <FiCheckCircle />
                Successful Logins
              </button>
              <button
                className={`quick-filter-btn${isQuickFilterActive('two_factor') ? ' active' : ''}`}
                onClick={() => handleQuickFilter('two_factor')}
              >
                <FiShield />
                2FA Events
              </button>
              <button
                className={`quick-filter-btn${isQuickFilterActive('security_alerts') ? ' active' : ''}`}
                onClick={() => handleQuickFilter('security_alerts')}
              >
                <FiAlertTriangle />
                Security Alerts
              </button>
              <button
                className={`quick-filter-btn${isQuickFilterActive('recent_hour') ? ' active' : ''}`}
                onClick={() => handleQuickFilter('recent_hour')}
              >
                <FiClock />
                Last Hour
              </button>
              <button
                className={`quick-filter-btn${isQuickFilterActive('last_week') ? ' active' : ''}`}
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
              <div className="audit-logs-loading">
                <div className="spinner"></div>
                <p>Loading audit logs...</p>
              </div>
            ) : error ? (
              <div className="audit-logs-error">
                <FiAlertCircle />
                <p>{error}</p>
                <button className="retry-btn" onClick={fetchAuditLogs}>
                  Try Again
                </button>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="audit-logs-empty">
                <FiEye />
                <h3>No Audit Logs Found</h3>
                <p>No security events match your current filters.</p>
                <button className="clear-filters-btn" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="audit-table-scroll">
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
                        <tr key={log._id || index}>
                          <td>
                            <div className="action-cell">
                              <div className="action-name">
                                <span>
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
                          <td>
                            <span>{log.ip}</span>
                          </td>
                          <td>
                            <span>{log.device || 'Unknown'}</span>
                          </td>
                          <td>
                            {log.location ? (
                              <div className="location-cell">
                                <span>
                                  <FiMapPin /> {log.location.country || 'Unknown'}
                                </span>
                                {log.location.city && (
                                  <span>{log.location.city}</span>
                                )}
                              </div>
                            ) : (
                              <span>No location data</span>
                            )}
                          </td>
                          <td>
                            <span>
                              {formatDate(log.timestamp)}
                            </span>
                          </td>
                          <td>
                            {log.details ? (
                              <div className="details-cell">
                                {log.details.type && (
                                  <span className="details-type">
                                    Type: {log.details.type}
                                  </span>
                                )}
                                {log.details.message && (
                                  <span className="details-message">
                                    {log.details.message}
                                  </span>
                                )}
                                {log.details.severity && (
                                  <span className="details-severity">
                                    Severity: {log.details.severity}
                                  </span>
                                )}
                                {log.details.reason && (
                                  <span className="details-reason">
                                    {log.details.reason.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span>No additional details</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && !error && auditLogs.length > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
              </div>
              <div className="pagination-navigation">
                <button
                  className="pagination-btn pagination-prev"
                  onClick={() => handlePageChange(pagination.page - 1)}
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
                    const totalPages = Math.ceil(pagination.total / pagination.limit);
                    const currentPage = pagination.page;
                    
                    if (pagination.totalPages <= 7) {
                      // Show all pages if 7 or fewer
                      for (let i = 1; i <= pagination.totalPages; i++) {
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
                      const end = Math.min(pagination.totalPages - 1, currentPage + 1);
                      
                      for (let i = start; i <= end; i++) {
                        if (i !== 1 && i !== pagination.totalPages) {
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
                      if (currentPage < pagination.totalPages - 3) {
                        indicators.push(
                          <span key="ellipsis2" className="page-ellipsis">
                            ...
                          </span>
                        );
                      }
                      
                      // Show last page
                      if (pagination.totalPages > 1) {
                        indicators.push(
                          <button
                            key={pagination.totalPages}
                            className={`page-indicator ${pagination.totalPages === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(pagination.totalPages)}
                            title={`Page ${pagination.totalPages}`}
                          >
                            <span className="indicator-number">{pagination.totalPages}</span>
                          </button>
                        );
                      }
                    }
                    
                    return indicators;
                  })()}
                </div>

                <button
                  className="pagination-btn pagination-next"
                  onClick={() => handlePageChange(pagination.page + 1)}
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
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
