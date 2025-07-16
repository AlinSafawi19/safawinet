import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUsers, HiShieldCheck, HiUserAdd, HiChevronLeft, HiChevronRight, HiRefresh, HiSearch, HiFilter, HiSortAscending, HiSortDescending } from 'react-icons/hi';
import { FiDownload, FiCalendar, FiClock, FiXCircle } from 'react-icons/fi';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment-timezone';
import userService from '../services/userService';
import authService from '../services/authService';
import roleTemplateService from '../services/roleTemplateService';
import { getProfileDisplay, getInitialsColor } from '../utils/avatarUtils';
import 'react-datepicker/dist/react-datepicker.css';

const Users = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: '',
    createdBy: '',
    createdDateRange: null
  });
  const [sorting, setSorting] = useState({
    field: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [roleOptions, setRoleOptions] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [createdByOptions, setCreatedByOptions] = useState([]);
  const [loadingCreatedBy, setLoadingCreatedBy] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const hasPermission = (page, action) => {
    if (!currentUser) return false;
    return authService.hasPermission(page, action);
  };

  const canViewUsers = hasPermission('users', 'view');
  const canViewOwnUsers = hasPermission('users', 'view_own');
  const canCreateUsers = hasPermission('users', 'add');
  const canExportUsers = hasPermission('users', 'export');

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    loadUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [pagination.page, pagination.limit, filters, sorting]);

  // Fetch role templates for filter options
  const fetchRoleOptions = async () => {
    try {
      setLoadingRoles(true);

      // Try the active templates method first
      let response;
      try {
        response = await roleTemplateService.getActiveTemplatesForUserCreation({
          limit: 100
        });
        console.log('Active templates API response:', response);
      } catch (error) {
        console.log('Active templates failed, trying regular templates');
        response = await roleTemplateService.getTemplates({
          limit: 100,
          status: 'all'
        });
        console.log('Regular templates API response:', response);
      }

      // Handle different possible response structures
      let templates = [];
      if (response.success && response.data && response.data.templates) {
        templates = response.data.templates;
      } else if (response.success && response.data && Array.isArray(response.data)) {
        templates = response.data;
      } else if (response.success && response.templates) {
        templates = response.templates;
      } else if (Array.isArray(response)) {
        templates = response;
      } else if (response.data && Array.isArray(response.data)) {
        templates = response.data;
      }

      console.log('Templates extracted:', templates);

      if (templates && templates.length > 0) {
        const options = [
          { value: '', label: 'All Roles' },
          ...templates.map(template => ({
            value: template.name,
            label: template.name
          }))
        ];
        console.log('Role options created:', options);
        setRoleOptions(options);
      } else {
        console.log('No templates found, using fallback options');
        // Set fallback options
        setRoleOptions([
          { value: '', label: 'All Roles' },
          { value: 'admin', label: 'Admin' },
          { value: 'manager', label: 'Manager' },
          { value: 'viewer', label: 'Viewer' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching role templates:', error);
      // Fallback to basic options if API fails
      setRoleOptions([
        { value: '', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'viewer', label: 'Viewer' }
      ]);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchRoleOptions();
  }, []);

  // Debug: Log roleOptions when it changes
  useEffect(() => {
    console.log('Role options state updated:', roleOptions);
  }, [roleOptions]);

  // Fetch all users for "Created By" filter options
  const fetchCreatedByOptions = async () => {
    try {
      setLoadingCreatedBy(true);
      const response = await userService.getUsers({
        page: 1,
        limit: 1000, // Get all users
        sortField: 'firstName',
        sortOrder: 'asc'
      });

      console.log('Users API response for Created By options:', response);

      if (response.data && response.data.users) {
        const options = [
          { value: '', label: 'All Creators' },
          { value: 'system', label: 'System' },
          ...response.data.users.map(user => ({
            value: user._id,
            label: `${user.firstName} ${user.lastName} (${user.username || user.email})`
          }))
        ];
        console.log('Created By options created:', options);
        setCreatedByOptions(options);
      } else {
        console.log('No users found, using fallback options');
        setCreatedByOptions([
          { value: '', label: 'All Creators' },
          { value: 'system', label: 'System' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching users for Created By options:', error);
      // Fallback to basic options if API fails
      setCreatedByOptions([
        { value: '', label: 'All Creators' },
        { value: 'system', label: 'System' }
      ]);
    } finally {
      setLoadingCreatedBy(false);
    }
  };

  useEffect(() => {
    if (canViewUsers) {
      fetchCreatedByOptions();
    }
  }, [canViewUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortField: sorting.field,
        sortOrder: sorting.order,
        ...filters
      };

      // Convert date range to separate parameters for API
      if (filters.createdDateRange) {
        if (filters.createdDateRange.start) {
          params.createdAfter = filters.createdDateRange.start;
        }
        if (filters.createdDateRange.end) {
          params.createdBefore = filters.createdDateRange.end;
        }
        delete params.createdDateRange; // Remove the object from params
      }

      const response = await userService.getUsers(params);

      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
        hasNextPage: response.data.pagination.hasNextPage,
        hasPrevPage: response.data.pagination.hasPrevPage
      }));
    } catch (error) {
      setError(error.message);
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when changing limit
    }));
  };

  const handleRefresh = () => {
    loadUsers();
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle date range changes
  const handleDateRangeChange = (rangeType, date) => {
    setFilters(prev => ({
      ...prev,
      createdDateRange: {
        ...prev.createdDateRange,
        [rangeType]: date
      }
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle sorting changes
  const handleSortChange = (field) => {
    setSorting(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      role: '',
      createdBy: '',
      createdDateRange: null
    });
    setSorting({
      field: 'createdAt',
      order: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };



  // Export users to CSV
  const handleExport = async () => {
    if (!canExportUsers && !authService.isAdmin()) {
      setError('You do not have permission to export users.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get current filters/parameters
      const exportParams = {
        ...filters,
        sortField: sorting.field,
        sortOrder: sorting.order
      };

      const blob = await userService.exportUsers(exportParams);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting users:', error);
      setError(error.message || 'Failed to export users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!canViewUsers && !canViewOwnUsers) {
    return (
      <div className="users-page">
        <div className="users-header">
          <h1>Users</h1>
        </div>
        <div className="access-denied">
          <HiShieldCheck />
          <h2>Access Denied</h2>
          <p>You don't have permission to view users.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    // Get user's timezone and date format preferences
    const userTimezone = currentUser?.userPreferences?.timezone || 'Asia/Beirut';
    const userDateFormat = currentUser?.userPreferences?.dateFormat || 'MMM dd, yyyy h:mm a';

    return moment(dateString).tz(userTimezone).format(userDateFormat);
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

  // Filter options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'lastLogin', label: 'Last Login' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'username', label: 'Username' },
    { value: 'role', label: 'Role' },
    { value: 'isActive', label: 'Status' }
  ];

  // Row limit options
  const limitOptions = [
    { value: 25, label: '25 rows' },
    { value: 50, label: '50 rows' },
    { value: 100, label: '100 rows' },
    { value: 250, label: '250 rows' }
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
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#eaf0fb',
      borderRadius: '6px',
      border: '1px solid #1f3bb3'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1f3bb3',
      fontWeight: 500,
      fontSize: '0.875rem'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#1f3bb3',
      '&:hover': {
        backgroundColor: '#1f3bb3',
        color: '#fff'
      }
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
    <div className="users-page">
      <div className="users-header">
        <div className="header-content">
          <h1 className="page-title">
            <HiUsers /> Users
          </h1>
          <p className="page-description">
            Manage system users and their permissions
            {canViewOwnUsers && !canViewUsers && (
              <span className="permission-notice">
                {' '}(Viewing your own users only)
              </span>
            )}
          </p>
        </div>
        <div className="users-controls">
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
            <HiRefresh />
            Refresh
          </button>
          {(canExportUsers || authService.isAdmin()) && (
            <button
              className="export-btn"
              onClick={handleExport}
              disabled={loading}
              title="Export users to CSV"
            >
              <FiDownload />
              Export CSV
            </button>
          )}
          {canCreateUsers && (
            <button
              className="create-user-btn"
              onClick={() => navigate('/users/create')}
            >
              <HiUserAdd />
              Create User
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="users-filters-row">
        {/* Top Row - Search and Date Range */}
        <div className="filters-top-row">
          <div className="search-section">
            <div className="search-input-wrapper">
              <HiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users by name, email, username..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
              {filters.search && (
                <button
                  className="clear-search-btn"
                  onClick={() => handleFilterChange('search', '')}
                >
                  <FiXCircle />
                </button>
              )}
            </div>
          </div>

          <div className="date-range-section">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                const [start, end] = update;
                setStartDate(start);
                setEndDate(end);
                if (start && end) {
                  setFilters(prev => ({
                    ...prev,
                    createdDateRange: {
                      start: start.toISOString().split('T')[0],
                      end: end.toISOString().split('T')[0]
                    }
                  }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }
              }}
              isClearable={true}
              placeholderText="Select date range..."
              className="date-range-input"
              dateFormat="yyyy-MM-dd"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
        </div>

        {/* Bottom Row - Filter Controls and Actions */}
        <div className="filters-bottom-row">
          <div className="filters-group">
            <div className="filter-group">
              <h4>Status</h4>
              <Select
                value={statusOptions.find(option => option.value === filters.status)}
                onChange={(selectedOption) => handleFilterChange('status', selectedOption ? selectedOption.value : '')}
                options={statusOptions}
                styles={customStyles}
                placeholder="Select status..."
                isClearable
                isSearchable
              />
            </div>

            <div className="filter-group">
              <h4>Role</h4>
              <Select
                value={roleOptions.find(option => option.value === filters.role)}
                onChange={(selectedOption) => handleFilterChange('role', selectedOption ? selectedOption.value : '')}
                options={roleOptions}
                styles={customStyles}
                placeholder={loadingRoles ? "Loading roles..." : "Select role..."}
                isClearable
                isSearchable
                isLoading={loadingRoles}
              />
            </div>

            {canViewUsers && (
              <div className="filter-group">
                <h4>Created By</h4>
                <Select
                  value={createdByOptions.find(option => option.value === filters.createdBy)}
                  onChange={(selectedOption) => handleFilterChange('createdBy', selectedOption ? selectedOption.value : '')}
                  options={createdByOptions}
                  styles={customStyles}
                  placeholder={loadingCreatedBy ? "Loading creators..." : "Select creator..."}
                  isClearable
                  isSearchable
                  isLoading={loadingCreatedBy}
                />
              </div>
            )}

            <div className="sort-group">
              <h4>Sort By</h4>
              <Select
                value={sortOptions.find(option => option.value === sorting.field)}
                onChange={(selectedOption) => handleSortChange(selectedOption ? selectedOption.value : 'createdAt')}
                options={sortOptions}
                styles={customStyles}
                placeholder="Select sort field..."
                isClearable={false}
                isSearchable
              />
            </div>

            <div className="sort-order-group">
              <h4>Order</h4>
              <div className="sort-order-buttons">
                <button
                  className={`sort-order-btn ${sorting.order === 'asc' ? 'active' : ''}`}
                  onClick={() => setSorting(prev => ({ ...prev, order: 'asc' }))}
                  title="Ascending"
                >
                  <HiSortAscending />
                </button>
                <button
                  className={`sort-order-btn ${sorting.order === 'desc' ? 'active' : ''}`}
                  onClick={() => setSorting(prev => ({ ...prev, order: 'desc' }))}
                  title="Descending"
                >
                  <HiSortDescending />
                </button>
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
        </div>
      </div>



      {/* Users Table */}
      <div className="users-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadUsers} className="btn btn-primary">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Timezone</th>
                    <th>Last Login</th>
                    <th>Created</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-info">
                          <div
                            className="user-avatar"
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
                                      {user.profileInitials || profileDisplay.value}
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
                            <div className="user-name">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.phone && (
                              <div className="user-phone">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="username">{user.username}</span>
                      </td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.isActive)}</td>
                      <td>
                        <span className="timezone">
                          {user.userPreferences?.timezone || 'Asia/Beirut'}
                        </span>
                      </td>
                      <td>
                        {user.lastLogin ? (
                          <span className="last-login">
                            {formatDate(user.lastLogin)}
                          </span>
                        ) : (
                          <span className="last-login never">Never</span>
                        )}
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        {user.createdBy ? (
                          <span className="created-by">
                            {user.createdBy.firstName} {user.createdBy.lastName}
                          </span>
                        ) : (
                          <span className="created-by">System</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            {!loading && !error && users.length > 0 && (
              <div className="pagination-controls">
                <div className="pagination-info">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </div>
                <div className="pagination-navigation">
                  <button
                    className="pagination-btn pagination-prev"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    title="Previous page"
                  >
                    <HiChevronLeft />
                  </button>

                  {/* Page indicators */}
                  <div className="page-indicators">
                    {(() => {
                      const indicators = [];
                      const totalPages = Math.ceil(pagination.total / pagination.limit);
                      const currentPage = pagination.page;

                      if (totalPages <= 7) {
                        // Show all pages if 7 or fewer
                        for (let i = 1; i <= totalPages; i++) {
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
                        const end = Math.min(totalPages - 1, currentPage + 1);

                        for (let i = start; i <= end; i++) {
                          if (i !== 1 && i !== totalPages) {
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
                              onClick={() => handlePageChange(totalPages)}
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
                    className="pagination-btn pagination-next"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    title="Next page"
                  >
                    <HiChevronRight />
                  </button>
                </div>
              </div>
            )}

            {users.length === 0 && !loading && (
              <div className="empty-state">
                <HiUsers />
                <h3>No users found</h3>
                <p>No users match your current filters.</p>
                <button className="clear-filters-btn" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Users;
