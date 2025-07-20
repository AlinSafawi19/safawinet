import React, { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import axios from 'axios';
import moment from 'moment';
import 'moment-timezone';
import Select from 'react-select';
import { applyUserTheme } from '../utils/themeUtils';
import { getProfileDisplay, getInitialsColor } from '../utils/avatarUtils';
import DateRangePicker from '../components/DateRangePicker';
import { RiskBadge, StatusBadge } from '../components';
import '../styles/AuditLogs.css';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiShield,
  FiAlertCircle,
  FiClock,
  FiActivity,
  FiEye,
  FiRefreshCw,
  FiCalendar,
  FiMapPin,
  FiDownload,
  FiFilter,
  FiX
} from 'react-icons/fi';
import { getStatusClass } from '../utils/classUtils';
import 'react-datepicker/dist/react-datepicker.css';

// Debounce utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const AuditLogs = () => {
  const user = authService.getCurrentUser();
  // Apply user theme preference
  useEffect(() => {
    if (user) {
      applyUserTheme(user);
    }
  }, [user]);

  // Extract user preferences with fallbacks
  const userTimezone = user?.userPreferences?.timezone || 'Asia/Beirut';
  const userDateFormat = user?.userPreferences?.dateFormat || 'MMM DD, YYYY h:mm a';

  // Check user permissions for audit logs
  const hasViewPermission = user ? authService.hasPermission('audit-logs', 'view') : false;
  const hasViewOwnPermission = user ? authService.hasPermission('audit-logs', 'view_own') : false;
  const hasExportPermission = user ? authService.hasPermission('audit-logs', 'export') : false;
  const hasAnyPermission = hasViewPermission || hasViewOwnPermission;

  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    riskLevel: '',
    success: '',
    dateRange: '24h', // Default to last 24 hours
    customDateRange: null, // New field for custom date range
    userId: '', // Changed to array for multi-select
    sortBy: 'timestamp',
    sortOrder: 'desc'
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
  const [userOptions, setUserOptions] = useState([]);
  // Remove sidebarRef, filtersVisible, and sidebar toggling logic

  // Search term for user filter
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const debouncedUserSearch = useDebounce(userSearchTerm, 300);

  // Pagination state for user filter
  const [userPagination, setUserPagination] = useState({
    page: 1,
    hasNextPage: false,
    loading: false
  });

  // Date range state for the date picker
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Filter section visibility state
  const [isFilterSectionOpen, setIsFilterSectionOpen] = useState(false);

  // Handle filter section toggle
  const handleFilterToggle = () => {
    setIsFilterSectionOpen(!isFilterSectionOpen);
  };

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

  // Fetch user options for filter (only for admin and view permission users)
  const fetchUserOptions = useCallback(async (search = '', page = 1, append = false) => {
    if (!authService.isUserAuthenticated()) return;
    if (!hasViewPermission && !authService.isAdmin()) return;

    try {
      setUserPagination(prev => ({ ...prev, loading: true }));
      const api = createApiInstance();
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (page) params.append('page', page);
      params.append('limit', '20'); // Load 20 users at a time

      const response = await api.get(`/auth/audit-logs/users?${params}`);

      if (response.data.success) {
        const newOptions = response.data.data;
        const pagination = response.data.pagination || { hasNextPage: false };

        if (append) {
          // Append to existing options
          setUserOptions(prev => [...prev, ...newOptions]);
        } else {
          // Replace options
          setUserOptions(newOptions);
        }

        // Update pagination state
        setUserPagination(prev => ({
          ...prev,
          page,
          hasNextPage: pagination.hasNextPage || false,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error fetching user options:', error);
      setUserPagination(prev => ({ ...prev, loading: false }));
    }
  }, [createApiInstance, hasViewPermission]);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    if (!authService.isUserAuthenticated()) return;

    setLoading(true);
    setError(null);

    try {
      const api = createApiInstance();

      // Calculate date range in user's timezone, then convert to UTC for backend
      let cutoff;
      const now = moment.tz(userTimezone);

      // Check if custom date range is set
      if (filters.customDateRange && filters.customDateRange.start && filters.customDateRange.end) {
        // Use custom date range
        const startDate = moment.tz(filters.customDateRange.start, userTimezone).startOf('day').utc();
        const endDate = moment.tz(filters.customDateRange.end, userTimezone).endOf('day').utc();

        // Set cutoff to start date for backward compatibility
        cutoff = startDate;
      } else {
        // Use predefined date ranges
        switch (filters.dateRange) {
          case '1h':
            cutoff = now.clone().subtract(1, 'hour').utc();
            break;
          case '24h':
            cutoff = now.clone().subtract(24, 'hours').utc();
            break;
          case '7d':
            cutoff = now.clone().subtract(7, 'days').utc();
            break;
          case '30d':
            cutoff = now.clone().subtract(30, 'days').utc();
            break;
          default:
            cutoff = now.clone().subtract(24, 'hours').utc();
        }
      }

      // Build query parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        cutoff: cutoff.toISOString(),
        timezone: userTimezone, // Send user's timezone to backend for display purposes
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      // Add custom date range parameters if set
      if (filters.customDateRange && filters.customDateRange.start && filters.customDateRange.end) {
        const startDate = moment.tz(filters.customDateRange.start, userTimezone).startOf('day').utc();
        const endDate = moment.tz(filters.customDateRange.end, userTimezone).endOf('day').utc();
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      if (filters.action) params.action = filters.action;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.success !== '') params.success = filters.success;
      if (filters.userId && Array.isArray(filters.userId) && filters.userId.length > 0) {
        // Join multiple user IDs with commas for backend
        params.userId = filters.userId.join(',');
      }

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

      // Handle permission errors specifically
      if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view audit logs.');
      } else {
        setError('Failed to fetch audit logs. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [createApiInstance, filters, pagination.page, pagination.limit, userTimezone]);

  // Fetch audit logs on mount and when filters change
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Fetch user options on mount (only for admin and view permission users)
  useEffect(() => {
    fetchUserOptions();
  }, [fetchUserOptions]);

  // Trigger user search when debounced search term changes
  useEffect(() => {
    if (hasViewPermission || authService.isAdmin()) {
      fetchUserOptions(debouncedUserSearch, 1);
    }
  }, [debouncedUserSearch, hasViewPermission]);

  // Load more function for user filter
  const loadMoreUsers = async () => {
    if (userPagination.hasNextPage && !userPagination.loading) {
      const nextPage = userPagination.page + 1;
      await fetchUserOptions(debouncedUserSearch, nextPage, true);
    }
  };

  // Format date for display with user's timezone and date format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return moment(dateString).tz(userTimezone).format(userDateFormat);
  };

  // Get action display name
  const getActionDisplayName = (action) => {
    // Replace underscores with spaces and capitalize first letter
    return action.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  };



  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'userId' ? (Array.isArray(value) ? value : []) : value
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

  // Export audit logs to CSV
  const handleExport = async () => {
    if (!hasExportPermission && !authService.isAdmin()) {
      setError('You do not have permission to export audit logs.');
      return;
    }

    try {
      setLoading(true);
      const api = createApiInstance();

      // Calculate date range in user's timezone, then convert to UTC for backend
      let cutoff;
      const now = moment.tz(userTimezone);

      // Check if custom date range is set
      if (filters.customDateRange && filters.customDateRange.start && filters.customDateRange.end) {
        // Use custom date range
        const startDate = moment.tz(filters.customDateRange.start, userTimezone).startOf('day').utc();
        const endDate = moment.tz(filters.customDateRange.end, userTimezone).endOf('day').utc();

        // Set cutoff to start date for backward compatibility
        cutoff = startDate;
      } else {
        // Use predefined date ranges
        switch (filters.dateRange) {
          case '1h':
            cutoff = now.clone().subtract(1, 'hour').utc();
            break;
          case '24h':
            cutoff = now.clone().subtract(24, 'hours').utc();
            break;
          case '7d':
            cutoff = now.clone().subtract(7, 'days').utc();
            break;
          case '30d':
            cutoff = now.clone().subtract(30, 'days').utc();
            break;
          default:
            cutoff = now.clone().subtract(24, 'hours').utc();
        }
      }

      // Build query parameters for export
      const params = {
        cutoff: cutoff.toISOString(),
        timezone: userTimezone,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      // Add custom date range parameters if set
      if (filters.customDateRange && filters.customDateRange.start && filters.customDateRange.end) {
        const startDate = moment.tz(filters.customDateRange.start, userTimezone).startOf('day').utc();
        const endDate = moment.tz(filters.customDateRange.end, userTimezone).endOf('day').utc();
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      if (filters.action) params.action = filters.action;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.success !== '') params.success = filters.success;
      if (filters.userId && Array.isArray(filters.userId) && filters.userId.length > 0) {
        params.userId = filters.userId.join(',');
      }

      // Make the export request
      const response = await api.get('/auth/audit-logs/export', {
        params,
        responseType: 'blob' // Important for file download
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${moment().format('YYYY-MM-DD-HH-mm-ss')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting audit logs:', error);

      if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to export audit logs.');
      } else {
        setError('Failed to export audit logs. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      action: '',
      riskLevel: '',
      success: '',
      dateRange: '24h',
      customDateRange: null,
      userId: [], // Changed to empty array
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
    setStartDate(null);
    setEndDate(null);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle quick filter selection
  const handleQuickFilter = (filterType) => {
    switch (filterType) {
      case 'failed_logins':
        setFilters({
          action: 'login_failed',
          riskLevel: '',
          success: 'false',
          dateRange: '24h',
          customDateRange: null,
          userId: [],
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
        break;
      case 'high_risk':
        setFilters({
          action: '',
          riskLevel: 'high',
          success: '',
          dateRange: '24h',
          customDateRange: null,
          userId: [],
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
        break;
      case 'critical_events':
        setFilters({
          action: '',
          riskLevel: 'critical',
          success: '',
          dateRange: '24h',
          customDateRange: null,
          userId: [],
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
        break;
      case 'successful_logins':
        setFilters({
          action: 'login',
          riskLevel: '',
          success: 'true',
          dateRange: '24h',
          customDateRange: null,
          userId: [],
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
        break;
      case 'two_factor':
        setFilters({
          action: 'two_factor_enable',
          riskLevel: '',
          success: '',
          dateRange: '24h',
          customDateRange: null,
          userId: [],
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
        break;
      case 'security_alerts':
        setFilters({
          action: 'security_alert',
          riskLevel: '',
          success: '',
          dateRange: '24h',
          customDateRange: null,
          userId: [],
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
        break;
      case 'last_24_hours':
        setFilters({
          action: '',
          riskLevel: '',
          success: '',
          dateRange: '24h',
          customDateRange: null,
          userId: [],
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
        break;
      case 'last_30_days':
        setFilters({
          action: '',
          riskLevel: '',
          success: '',
          dateRange: '30d',
          customDateRange: null,
          userId: [],
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
        break;
      case 'last_hour':
        setFilters({
          action: '',
          riskLevel: '',
          success: '',
          dateRange: '1h',
          customDateRange: null,
          userId: [],
          sortBy: 'timestamp',
          sortOrder: 'desc'
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
      case 'last_24_hours':
        // Only active if dateRange is '24h' AND no custom date range is set
        return filters.dateRange === '24h' && !filters.customDateRange;
      case 'last_30_days':
        // Only active if dateRange is '30d' AND no custom date range is set
        return filters.dateRange === '30d' && !filters.customDateRange;
      case 'last_hour':
        // Only active if dateRange is '1h' AND no custom date range is set
        return filters.dateRange === '1h' && !filters.customDateRange;

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



  const limitOptions = [
    { value: 25, label: '25 rows' },
    { value: 100, label: '100 rows' },
    { value: 500, label: '500 rows' },
    { value: 1000, label: '1000 rows' }
  ];

  // Handle sort changes
  const handleSortChange = (sortType, value) => {
    setFilters(prev => ({
      ...prev,
      [sortType]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Sort options
  const sortByOptions = [
    { value: 'timestamp', label: 'Timestamp' },
    { value: 'action', label: 'Action' },
    { value: 'riskLevel', label: 'Risk Level' },
    { value: 'success', label: 'Status' },
    { value: 'ip', label: 'IP Address' }
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'Newest First' },
    { value: 'asc', label: 'Oldest First' }
  ];

  // Show access denied message if user has no permissions
  if (!hasAnyPermission) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <h1 className="page-title">
              <FiActivity /> Audit Logs
            </h1>
            <p className="page-description">
              View detailed security events and user activity logs
            </p>
          </div>
        </div>
        <div className="page-content">
          <div className="page-content">
            <div className="page-error">
              <FiAlertTriangle />
              <h3>Access Denied</h3>
              <p>You do not have permission to view audit logs. Please contact your administrator for access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">
            <FiActivity /> Audit Logs
          </h1>
          <p className="page-description">
            View detailed security events and user activity logs
            {hasViewOwnPermission && !hasViewPermission && (
              <span className="permission-notice">
                {' '}(Viewing your own logs only)
              </span>
            )}
          </p>
        </div>

        {/* Summary Cards */}
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

        <div className="page-controls">
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
              placeholder="Select rows per page..."
              isClearable={false}
              isSearchable={false}
              styles={{
                menu: (provided) => ({
                  ...provided,
                  zIndex: 9999
                }),
                menuPortal: (provided) => ({
                  ...provided,
                  zIndex: 9999
                })
              }}
              menuPortalTarget={document.body}
            />
          </div>
          <div className="filter-controls-right">
            <button
              className="btn btn-secondary"
              onClick={handleRefresh}
              disabled={loading}
            >
              <FiRefreshCw />
              Refresh
            </button>
            {(hasExportPermission || authService.isAdmin()) && (
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={loading}
                title="Export audit logs to CSV"
              >
                <FiDownload />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="audit-logs-main-content">
        {/* Filter Section - Positioned absolutely on the right */}
        <div className={`filter-section ${isFilterSectionOpen ? 'open' : 'closed'}`}>
          <div className="filter-header" onClick={handleFilterToggle}>
            <h3>
              <FiFilter />
              Filters
            </h3>
            <button
              className="btn btn-light"
              onClick={(e) => {
                e.stopPropagation();
                handleFilterToggle();
              }}
              title={isFilterSectionOpen ? "Hide filters" : "Show filters"}
            >
              <FiX />
            </button>
          </div>

          <div className="filter-content">
            <div className="filter-grid">
              {/* Action Type Filter */}
              <div className="filter-item">
                <h4>Action Type</h4>
                <Select
                  value={actionOptions.find(option => option.value === filters.action)}
                  onChange={(selectedOption) => handleFilterChange('action', selectedOption ? selectedOption.value : '')}
                  options={actionOptions}
                  placeholder="Select action type..."
                  isClearable
                  isSearchable
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    }),
                    menuPortal: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    })
                  }}
                  menuPortalTarget={document.body}
                />
              </div>

              {/* Risk Level Filter */}
              <div className="filter-item">
                <h4>Risk Level</h4>
                <Select
                  value={riskLevelOptions.find(option => option.value === filters.riskLevel)}
                  onChange={(selectedOption) => handleFilterChange('riskLevel', selectedOption ? selectedOption.value : '')}
                  options={riskLevelOptions}
                  placeholder="Select risk level..."
                  isClearable
                  isSearchable
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    }),
                    menuPortal: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    })
                  }}
                  menuPortalTarget={document.body}
                />
              </div>

              {/* Status Filter */}
              <div className="filter-item">
                <h4>Status</h4>
                <Select
                  value={statusOptions.find(option => option.value === filters.success)}
                  onChange={(selectedOption) => handleFilterChange('success', selectedOption ? selectedOption.value : '')}
                  options={statusOptions}
                  placeholder="Select status..."
                  isClearable
                  isSearchable
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    }),
                    menuPortal: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    })
                  }}
                  menuPortalTarget={document.body}
                />
              </div>



              {/* Sort By Filter */}
              <div className="filter-item">
                <h4>Sort By</h4>
                <Select
                  value={sortByOptions.find(option => option.value === filters.sortBy)}
                  onChange={(selectedOption) => handleSortChange('sortBy', selectedOption ? selectedOption.value : 'timestamp')}
                  options={sortByOptions}
                  placeholder="Select sort field..."
                  isClearable
                  isSearchable
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    }),
                    menuPortal: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    })
                  }}
                  menuPortalTarget={document.body}
                />
              </div>

              {/* Sort Order Filter */}
              <div className="filter-item">
                <h4>Sort Order</h4>
                <Select
                  value={sortOrderOptions.find(option => option.value === filters.sortOrder)}
                  onChange={(selectedOption) => handleSortChange('sortOrder', selectedOption ? selectedOption.value : 'desc')}
                  options={sortOrderOptions}
                  placeholder="Select sort order..."
                  isClearable
                  isSearchable
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    }),
                    menuPortal: (provided) => ({
                      ...provided,
                      zIndex: 9999
                    })
                  }}
                  menuPortalTarget={document.body}
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="filter-actions">
              <div className="filter-actions-left">
                <span className="filter-summary">
                  {(() => {
                    const activeFilters = [];
                    if (filters.action) activeFilters.push(`Action: ${filters.action}`);
                    if (filters.riskLevel) activeFilters.push(`Risk Level: ${filters.riskLevel}`);
                    if (filters.success !== '') activeFilters.push(`Status: ${filters.success === 'true' ? 'Success' : 'Failed'}`);
                    if (filters.userId && filters.userId.length > 0) activeFilters.push(`Users: ${filters.userId.length} selected`);
                    if (filters.customDateRange) activeFilters.push('Custom Date Range');
                    return activeFilters.length > 0 ? `${activeFilters.length} filter(s) active` : 'No filters applied';
                  })()}
                </span>
              </div>
              <div className="filter-actions-right">
                <button
                  className="btn btn-secondary"
                  onClick={handleClearFilters}
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="audit-logs-content">


          {/* Date Range Picker and Users Select - Always visible */}
          <div className="search-bar-container">
            <div className="search-controls">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  const [start, end] = update;
                  setStartDate(start);
                  setEndDate(end);
                  if (start && end) {
                    setFilters(prev => ({
                      ...prev,
                      customDateRange: {
                        start: start.toISOString().split('T')[0], // Keep as YYYY-MM-DD for display
                        end: end.toISOString().split('T')[0]      // Keep as YYYY-MM-DD for display
                      }
                    }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  } else if (!start && !end) {
                    // Clear custom date range when both dates are cleared
                    setFilters(prev => ({
                      ...prev,
                      customDateRange: null
                    }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }
                }}
                placeholder="Select date range..."
                className="date-range-input"
                dateFormat="yyyy-MM-dd"
                showMonthDropdown={false}
                showYearDropdown={false}
                dropdownMode="select"
              />
              {/* Users Select */}
              {(hasViewPermission || authService.isAdmin()) && (
                <div className="users-select-container">
                  <Select
                    value={Array.isArray(filters.userId) ? filters.userId.map(userId => userOptions.find(option => option.value === userId)).filter(Boolean) : []}
                    onChange={(selectedOptions) => {
                      const selectedUserIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
                      handleFilterChange('userId', selectedUserIds);
                    }}
                    onInputChange={(newValue) => setUserSearchTerm(newValue)}
                    inputValue={userSearchTerm}
                    options={userOptions}
                    placeholder="Select users..."
                    isMulti
                    isClearable
                    isSearchable
                    closeMenuOnSelect={false}
                    filterOption={() => true} // Disable client-side filtering since we're doing server-side search
                    onMenuScrollToBottom={loadMoreUsers}
                    loadingMessage={() => "Loading more users..."}
                    noOptionsMessage={() => "No users found"}
                    styles={{
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9999
                      }),
                      menuPortal: (provided) => ({
                        ...provided,
                        zIndex: 9999
                      })
                    }}
                    menuPortalTarget={document.body}
                  />
                </div>
              )}
            </div>
            {/* Filter Toggle Button */}
            <div className="filter-toggle-container">
              <button
                className="btn btn-light"
                onClick={handleFilterToggle}
                title={isFilterSectionOpen ? "Hide filters" : "Show filters"}
              >
                <FiFilter />
                {isFilterSectionOpen ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="quick-filters-row">
            <button
              className={`btn ${isQuickFilterActive('failed_logins') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('failed_logins')}
            >
              <FiAlertTriangle />
              Failed Logins
            </button>
            <button
              className={`btn ${isQuickFilterActive('high_risk') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('high_risk')}
            >
              <FiAlertCircle />
              High Risk
            </button>
            <button
              className={`btn ${isQuickFilterActive('critical_events') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('critical_events')}
            >
              <FiShield />
              Critical Events
            </button>
            <button
              className={`btn ${isQuickFilterActive('successful_logins') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('successful_logins')}
            >
              <FiCheckCircle />
              Successful Logins
            </button>
            <button
              className={`btn ${isQuickFilterActive('two_factor') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('two_factor')}
            >
              <FiShield />
              2FA Events
            </button>
            <button
              className={`btn ${isQuickFilterActive('security_alerts') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('security_alerts')}
            >
              <FiAlertTriangle />
              Security Alerts
            </button>
            <button
              className={`btn ${isQuickFilterActive('last_hour') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('last_hour')}
            >
              <FiClock />
              Last Hour
            </button>
            <button
              className={`btn ${isQuickFilterActive('last_24_hours') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('last_24_hours')}
            >
              <FiClock />
              Last 24 Hours
            </button>
            <button
              className={`btn ${isQuickFilterActive('last_30_days') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('last_30_days')}
            >
              <FiCalendar />
              Last 30 Days
            </button>

          </div>

          {/* Audit Logs Table */}
          <div className="audit-table-container">
            {loading ? (
              <div className="loading-state">
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
              <div className="empty-state">
                <FiEye />
                <h3>No Audit Logs Found</h3>
                <p>No security events match your current filters.</p>
                <button className="btn btn-secondary" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        {(hasViewPermission || authService.isAdmin()) && <th>User</th>}
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
                          {(hasViewPermission || authService.isAdmin()) && (
                            <td className="user-cell">
                              {log.user ? (
                                <div className="user-info">
                                  <div
                                    className="user-avatar"
                                    style={{ backgroundColor: getInitialsColor(log.user.username || log.user.email || log.user.firstName || '') }}
                                  >
                                    {(() => {
                                      const profileDisplay = getProfileDisplay(log.user);

                                      if (profileDisplay.type === 'image') {
                                        return (
                                          <>
                                            <img
                                              src={profileDisplay.value}
                                              alt={`${log.user.fullName}'s profile picture`}
                                              className="user-profile-image"
                                              onError={(e) => {
                                                // Fall back to initials if image fails to load
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                              }}
                                            />
                                            <div
                                              className="user-initials"
                                              style={{ display: 'none' }}
                                            >
                                              {log.user.profileInitials || profileDisplay.value}
                                            </div>
                                          </>
                                        );
                                      } else {
                                        return (
                                          <div className="user-initials">
                                            {profileDisplay.value}
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                  <div className="user-details">
                                    <div className="user-name">{log.user.fullName}</div>
                                    <div className="user-email">{log.user.username}</div>
                                  </div>
                                </div>
                              ) : (
                                <span>Unknown User</span>
                              )}
                            </td>
                          )}
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
                            <StatusBadge
                              isActive={log.success}
                              activeText="Success"
                              inactiveText="Failed"
                            />
                          </td>
                          <td className="risk-cell">
                            <RiskBadge riskLevel={log.riskLevel || 'low'} size="sm" />
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
                  className="btn btn-secondary btn-sm"
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
                      const end = Math.min(pagination.totalPages - 1, currentPage + 1);

                      for (let i = start; i <= end; i++) {
                        if (i !== 1 && i !== pagination.totalPages) {
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
                            className={`btn ${pagination.totalPages === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
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
                  className="btn btn-secondary btn-sm"
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
