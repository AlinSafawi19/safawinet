import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUsers, HiShieldCheck, HiUserAdd, HiChevronLeft, HiChevronRight, HiRefresh, HiSearch, HiFilter, HiSortAscending, HiSortDescending, HiTrash, HiEye, HiPencil, HiX } from 'react-icons/hi';
import { FiDownload, FiXCircle } from 'react-icons/fi';
import Select from 'react-select';
import moment from 'moment-timezone';
import Swal from 'sweetalert2';
import userService from '../services/userService';
import authService from '../services/authService';
import roleTemplateService from '../services/roleTemplateService';
import { getProfileDisplay, getInitialsColor } from '../utils/avatarUtils';
import UserViewModal from '../components/UserViewModal';
import FloatingInput from '../components/FloatingInput';
import Checkbox from '../components/Checkbox';
import RoleBadge from '../components/RoleBadge';
import StatusBadge from '../components/StatusBadge';
import { DateRangePicker } from '../components';
import { showSuccessToast } from '../utils/sweetAlertConfig';
import '../styles/Users.css';

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
    createdBy: [], // Changed to array for multi-select
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

  // Search terms for filter dropdowns
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [createdBySearchTerm, setCreatedBySearchTerm] = useState('');

  // Debounced search terms
  const debouncedRoleSearch = useDebounce(roleSearchTerm, 300);
  const debouncedCreatedBySearch = useDebounce(createdBySearchTerm, 300);

  // Cache for options to avoid unnecessary API calls
  const [roleCache, setRoleCache] = useState(new Map());
  const [createdByCache, setCreatedByCache] = useState(new Map());

  // Pagination state for filter dropdowns
  const [rolePagination, setRolePagination] = useState({
    page: 1,
    hasNextPage: false,
    loading: false
  });
  const [createdByPagination, setCreatedByPagination] = useState({
    page: 1,
    hasNextPage: false,
    loading: false
  });

  // Delete functionality state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // User view modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Filter section visibility state
  const [isFilterSectionOpen, setIsFilterSectionOpen] = useState(true);

  // Handle filter section toggle
  const handleFilterToggle = () => {
    setIsFilterSectionOpen(!isFilterSectionOpen);
  };

  const hasPermission = (page, action) => {
    if (!currentUser) return false;
    return authService.hasPermission(page, action);
  };

  const canViewUsers = hasPermission('users', 'view');
  const canViewOwnUsers = hasPermission('users', 'view_own');
  const canCreateUsers = hasPermission('users', 'add');
  const canEditUsers = hasPermission('users', 'edit');
  const canDeleteUsers = hasPermission('users', 'delete');
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
  const fetchRoleOptions = async (search = '', page = 1, append = false) => {
    // Define cacheKey at the beginning of the function
    const cacheKey = `${search}-${page}`;

    try {
      setLoadingRoles(true);
      setRolePagination(prev => ({ ...prev, loading: true }));

      // Check cache first for first page only
      if (!append && roleCache.has(cacheKey)) {
        setRoleOptions(roleCache.get(cacheKey));
        setLoadingRoles(false);
        setRolePagination(prev => ({ ...prev, loading: false }));
        return;
      }

      // Try the active templates method first with pagination
      let response;
      try {
        response = await roleTemplateService.getActiveTemplatesForUserCreation({
          page,
          limit: 50, // Load 50 templates at a time
          search
        });
        console.log('Active templates API response:', response);
      } catch (error) {
        console.log('Active templates failed, trying regular templates');
        response = await roleTemplateService.getTemplates({
          page,
          limit: 50,
          status: 'all',
          search
        });
        console.log('Regular templates API response:', response);
      }

      // Handle different possible response structures
      let templates = [];
      let pagination = { hasNextPage: false };

      if (response.success && response.data && response.data.templates) {
        templates = response.data.templates;
        pagination = response.data.pagination || { hasNextPage: false };
      } else if (response.success && response.data && Array.isArray(response.data)) {
        templates = response.data;
        pagination = response.pagination || { hasNextPage: false };
      } else if (response.success && response.templates) {
        templates = response.templates;
        pagination = response.pagination || { hasNextPage: false };
      } else if (Array.isArray(response)) {
        templates = response;
        pagination = { hasNextPage: false };
      } else if (response.data && Array.isArray(response.data)) {
        templates = response.data;
        pagination = response.pagination || { hasNextPage: false };
      }

      console.log('Templates extracted:', templates);

      if (templates && templates.length > 0) {
        const newOptions = templates.map(template => ({
          value: template.name.toLowerCase(),
          label: template.name
        }));

        if (append) {
          // Append to existing options
          setRoleOptions(prev => {
            const existingOptions = prev.filter(option => option.value !== ''); // Remove "All Roles"
            const combinedOptions = [
              { value: '', label: 'All Roles' },
              ...existingOptions,
              ...newOptions
            ];
            return combinedOptions;
          });
        } else {
          // Replace options
          const options = [
            { value: '', label: 'All Roles' },
            ...newOptions
          ];
          setRoleOptions(options);

          // Cache the results for first page only
          setRoleCache(prev => new Map(prev).set(cacheKey, options));
        }

        // Update pagination state
        setRolePagination(prev => ({
          ...prev,
          page,
          hasNextPage: pagination.hasNextPage || false,
          loading: false
        }));
      } else {
        console.log('No templates found, using fallback options');
        // Set fallback options
        const fallbackOptions = [
          { value: '', label: 'All Roles' },
          { value: 'admin', label: 'Admin' },
          { value: 'manager', label: 'Manager' },
          { value: 'viewer', label: 'Viewer' }
        ];
        setRoleOptions(fallbackOptions);
        setRoleCache(prev => new Map(prev).set(cacheKey, fallbackOptions));
        setRolePagination(prev => ({ ...prev, hasNextPage: false, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching role templates:', error);
      // Fallback to basic options if API fails
      const fallbackOptions = [
        { value: '', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'viewer', label: 'Viewer' }
      ];
      setRoleOptions(fallbackOptions);
      setRoleCache(prev => new Map(prev).set(cacheKey, fallbackOptions));
      setRolePagination(prev => ({ ...prev, hasNextPage: false, loading: false }));
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
  const fetchCreatedByOptions = async (search = '', page = 1, append = false) => {
    // Define cacheKey at the beginning of the function
    const cacheKey = `${search}-${page}`;

    try {
      setLoadingCreatedBy(true);
      setCreatedByPagination(prev => ({ ...prev, loading: true }));

      // Check cache first for first page only
      if (!append && createdByCache.has(cacheKey)) {
        setCreatedByOptions(createdByCache.get(cacheKey));
        setLoadingCreatedBy(false);
        setCreatedByPagination(prev => ({ ...prev, loading: false }));
        return;
      }

      const response = await userService.getFilterOptions({
        search,
        page,
        limit: 20 // Load 20 users at a time
      });

      console.log('Filter options API response:', response);

      if (response.success && response.data && response.data.users) {
        const newOptions = response.data.users;

        if (append) {
          // Append to existing options
          setCreatedByOptions(prev => {
            const existingOptions = prev.filter(option =>
              option.value !== '' && option.value !== 'system' && option.value !== 'me'
            );
            const combinedOptions = [
              { value: '', label: 'All Creators' },
              { value: 'system', label: 'System' },
              { value: 'me', label: 'Me' },
              ...existingOptions,
              ...newOptions
            ];
            return combinedOptions;
          });
        } else {
          // Replace options
          const options = [
            { value: '', label: 'All Creators' },
            { value: 'system', label: 'System' },
            { value: 'me', label: 'Me' },
            ...newOptions
          ];
          console.log('Created By options created:', options);
          setCreatedByOptions(options);

          // Cache the results for first page only
          setCreatedByCache(prev => new Map(prev).set(cacheKey, options));
        }

        // Update pagination state
        const pagination = response.data.pagination || { hasNextPage: false };
        setCreatedByPagination(prev => ({
          ...prev,
          page,
          hasNextPage: pagination.hasNextPage || false,
          loading: false
        }));
      } else {
        console.log('No users found, using fallback options');
        const fallbackOptions = [
          { value: '', label: 'All Creators' },
          { value: 'system', label: 'System' },
          { value: 'me', label: 'Me' }
        ];
        setCreatedByOptions(fallbackOptions);
        setCreatedByCache(prev => new Map(prev).set(cacheKey, fallbackOptions));
        setCreatedByPagination(prev => ({ ...prev, hasNextPage: false, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching users for Created By options:', error);
      // Fallback to basic options if API fails
      const fallbackOptions = [
        { value: '', label: 'All Creators' },
        { value: 'system', label: 'System' },
        { value: 'me', label: 'Me' }
      ];
      setCreatedByOptions(fallbackOptions);
      setCreatedByCache(prev => new Map(prev).set(cacheKey, fallbackOptions));
      setCreatedByPagination(prev => ({ ...prev, hasNextPage: false, loading: false }));
    } finally {
      setLoadingCreatedBy(false);
    }
  };

  useEffect(() => {
    if (canViewUsers) {
      fetchCreatedByOptions();
    }
  }, [canViewUsers]);

  // Trigger role search when debounced search term changes
  useEffect(() => {
    fetchRoleOptions(debouncedRoleSearch, 1);
  }, [debouncedRoleSearch]);

  // Trigger created by search when debounced search term changes
  useEffect(() => {
    if (canViewUsers) {
      fetchCreatedByOptions(debouncedCreatedBySearch, 1);
    }
  }, [debouncedCreatedBySearch, canViewUsers]);

  // Load more functions for filter dropdowns
  const loadMoreRoles = async () => {
    if (rolePagination.hasNextPage && !rolePagination.loading) {
      const nextPage = rolePagination.page + 1;
      await fetchRoleOptions(debouncedRoleSearch, nextPage, true);
    }
  };

  const loadMoreCreatedBy = async () => {
    if (createdByPagination.hasNextPage && !createdByPagination.loading) {
      const nextPage = createdByPagination.page + 1;
      await fetchCreatedByOptions(debouncedCreatedBySearch, nextPage, true);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sorting.field,
        sortOrder: sorting.order,
        search: filters.search,
        role: filters.role,
        isActive: filters.status,
        createdBy: filters.createdBy
      };

      // Handle multiple createdBy values
      if (filters.createdBy && Array.isArray(filters.createdBy) && filters.createdBy.length > 0) {
        // Join multiple values with commas for backend
        params.createdBy = filters.createdBy.join(',');
      }

      // Convert date range to separate parameters for API
      if (filters.createdDateRange) {
        const userTimezone = currentUser?.userPreferences?.timezone || 'Asia/Beirut';

        if (filters.createdDateRange.start) {
          // Convert user's local date to UTC for database query
          // Start of day in user's timezone converted to UTC
          const startDate = moment.tz(filters.createdDateRange.start, userTimezone).startOf('day').utc().toISOString();
          params.createdAfter = startDate;
        }
        if (filters.createdDateRange.end) {
          // Convert user's local date to UTC for database query
          // End of day in user's timezone converted to UTC
          const endDate = moment.tz(filters.createdDateRange.end, userTimezone).endOf('day').utc().toISOString();
          params.createdBefore = endDate;
        }
        delete params.createdDateRange; // Remove the object from params
      }

      // Add user's timezone to the request for server-side processing
      const userTimezone = currentUser?.userPreferences?.timezone || 'Asia/Beirut';
      params.userTimezone = userTimezone;

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
      [filterType]: filterType === 'createdBy' ? (Array.isArray(value) ? value : []) : value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle sorting changes
  const handleSortChange = (field, order) => {
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
      createdBy: [], // Changed to empty array
      createdDateRange: null
    });
    setSorting({
      field: 'createdAt',
      order: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Quick Filters
  const handleQuickFilter = (filterType) => {
    switch (filterType) {
      case 'active_users':
        setFilters(prev => ({
          ...prev,
          status: 'true',
          role: '',
          createdBy: [],
          createdDateRange: null,
          search: ''
        }));
        break;
      case 'inactive_users':
        setFilters(prev => ({
          ...prev,
          status: 'false',
          role: '',
          createdBy: [],
          createdDateRange: null,
          search: ''
        }));
        break;
      case 'admin_users':
        setFilters(prev => ({
          ...prev,
          status: '',
          role: 'admin',
          createdBy: [],
          createdDateRange: null,
          search: ''
        }));
        break;
      case 'manager_users':
        setFilters(prev => ({
          ...prev,
          status: '',
          role: 'manager',
          createdBy: [],
          createdDateRange: null,
          search: ''
        }));
        break;
      case 'viewer_users':
        setFilters(prev => ({
          ...prev,
          status: '',
          role: 'viewer',
          createdBy: [],
          createdDateRange: null,
          search: ''
        }));
        break;
      case 'recent_users':
        setFilters(prev => ({
          ...prev,
          status: '',
          role: '',
          createdBy: [],
          createdDateRange: {
            start: moment().subtract(7, 'days').toISOString().split('T')[0],
            end: moment().toISOString().split('T')[0]
          },
          search: ''
        }));
        break;
      case 'my_users':
        setFilters(prev => ({
          ...prev,
          status: '',
          role: '',
          createdBy: ['me'],
          createdDateRange: null,
          search: ''
        }));
        break;
      case 'system_users':
        setFilters(prev => ({
          ...prev,
          status: '',
          role: '',
          createdBy: ['system'],
          createdDateRange: null,
          search: ''
        }));
        break;
      default:
        break;
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const isQuickFilterActive = (filterType) => {
    switch (filterType) {
      case 'active_users':
        return filters.status === 'true' && !filters.role && (!filters.createdBy || filters.createdBy.length === 0);
      case 'inactive_users':
        return filters.status === 'false' && !filters.role && (!filters.createdBy || filters.createdBy.length === 0);
      case 'admin_users':
        return filters.role === 'admin';
      case 'manager_users':
        return filters.role === 'manager';
      case 'viewer_users':
        return filters.role === 'viewer';
      case 'recent_users':
        if (!filters.createdDateRange) return false;
        const start = filters.createdDateRange.start;
        const end = filters.createdDateRange.end;
        const expectedStart = moment().subtract(7, 'days').toISOString().split('T')[0];
        const expectedEnd = moment().toISOString().split('T')[0];
        return start === expectedStart && end === expectedEnd;
      case 'my_users':
        return Array.isArray(filters.createdBy) && filters.createdBy.includes('me');
      case 'system_users':
        return Array.isArray(filters.createdBy) && filters.createdBy.includes('system');
      default:
        return false;
    }
  };

  // Delete functionality
  const handleDeleteUser = async (userId) => {
    try {
      setDeleteLoading(true);
      setError('');

      const response = await userService.deleteUser(userId);

      if (response.success) {
        // Remove the deleted user from the list
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));

        // Update total count
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1
        }));

        // Show success message
        showSuccessToast('User deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) {
      setError('No users selected for deletion');
      return;
    }

    try {
      setBulkDeleteLoading(true);
      setError('');

      const userIds = selectedUsers.map(user => user._id);
      const response = await userService.bulkDeleteUsers(userIds);

      if (response.success) {
        // Remove deleted users from the list
        setUsers(prevUsers => prevUsers.filter(user => !selectedUsers.includes(user)));

        // Update total count
        setPagination(prev => ({
          ...prev,
          total: prev.total - response.deletedCount
        }));

        // Clear selection
        setSelectedUsers([]);

        // Show success message
        showSuccessToast(`${response.deletedCount} user(s) deleted successfully`);
      }
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      setError(error.message || 'Failed to delete users');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleUserSelection = (user, isSelected) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedUsers([...users]);
    } else {
      setSelectedUsers([]);
    }
  };

  const confirmDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: 'Delete User',
      text: `Are you sure you want to delete user ${user.firstName} ${user.lastName} (${user.username || user.email})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete user',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        confirmButton: 'swal2-confirm-danger',
        cancelButton: 'swal2-cancel'
      }
    });

    if (result.isConfirmed) {
      handleDeleteUser(user._id);
    }
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

      // Handle multiple createdBy values for export
      if (filters.createdBy && Array.isArray(filters.createdBy) && filters.createdBy.length > 0) {
        exportParams.createdBy = filters.createdBy.join(',');
      }

      // Convert date range to separate parameters for API
      if (filters.createdDateRange) {
        const userTimezone = currentUser?.userPreferences?.timezone || 'Asia/Beirut';

        if (filters.createdDateRange.start) {
          // Convert user's local date to UTC for database query
          // Start of day in user's timezone converted to UTC
          const startDate = moment.tz(filters.createdDateRange.start, userTimezone).startOf('day').utc().toISOString();
          exportParams.createdAfter = startDate;
        }
        if (filters.createdDateRange.end) {
          // Convert user's local date to UTC for database query
          // End of day in user's timezone converted to UTC
          const endDate = moment.tz(filters.createdDateRange.end, userTimezone).endOf('day').utc().toISOString();
          exportParams.createdBefore = endDate;
        }
        delete exportParams.createdDateRange; // Remove the object from params
      }

      // Add user's timezone to the request for server-side processing
      const userTimezone = currentUser?.userPreferences?.timezone || 'Asia/Beirut';
      exportParams.userTimezone = userTimezone;

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
    const userDateFormat = currentUser?.userPreferences?.dateFormat || 'MMM DD, YYYY h:mm a';

    return moment(dateString).tz(userTimezone).format(userDateFormat);
  };

  // Filter options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
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

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-header">
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
            />
          </div>
          <div className="page-controls-right">
            {/* Selected Count Display */}
            {canDeleteUsers && selectedUsers.length > 0 && (
              <span className="selected-count-display">
                {selectedUsers.length} user(s) selected
              </span>
            )}

            {/* Bulk Delete Button */}
            {canDeleteUsers && selectedUsers.length > 0 && (
              <button
                className="btn btn-danger"
                onClick={async () => {
                  const result = await Swal.fire({
                    title: 'Delete Multiple Users',
                    text: `Are you sure you want to delete ${selectedUsers.length} selected user(s)?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: `Yes, delete ${selectedUsers.length} user(s)`,
                    cancelButtonText: 'Cancel',
                    reverseButtons: true,
                    customClass: {
                      confirmButton: 'swal2-confirm-danger',
                      cancelButton: 'swal2-cancel'
                    }
                  });

                  if (result.isConfirmed) {
                    handleBulkDeleteUsers();
                  }
                }}
                disabled={bulkDeleteLoading}
                title="Delete selected users"
              >
                <HiTrash />
                {bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedUsers.length}`}
              </button>
            )}

            {/* Create User Button */}
            {canCreateUsers && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/users/create')}
              >
                <HiUserAdd />
                Create User
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleRefresh}
              disabled={loading}
            >
              <HiRefresh />
              Refresh
            </button>
            {(canExportUsers || authService.isAdmin()) && (
              <button
                className="btn btn-info"
                onClick={handleExport}
                disabled={loading}
                title="Export users to CSV"
              >
                <FiDownload />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="users-main-content">
        {/* Filter Section - Positioned absolutely on the right */}
        <div className={`filter-section ${isFilterSectionOpen ? 'open' : 'closed'}`}>
          <div className="filter-header" onClick={handleFilterToggle}>
            <h3>
              <HiFilter />
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
              <HiX />
            </button>
          </div>

          <div className="filter-content">
            <div className="filter-grid">

              {/* Status Filter */}
              <div className="filter-item">
                <h4>Status</h4>
                <Select
                  value={statusOptions.find(option => option.value === filters.status)}
                  onChange={(selectedOption) => handleFilterChange('status', selectedOption ? selectedOption.value : '')}
                  options={statusOptions}
                  placeholder="Select status..."
                  isClearable
                  isSearchable
                />
              </div>

              {/* Role Filter */}
              <div className="filter-item">
                <h4>Role</h4>
                <Select
                  value={roleOptions.find(option => option.value === filters.role)}
                  onChange={(selectedOption) => handleFilterChange('role', selectedOption ? selectedOption.value : '')}
                  onInputChange={(newValue) => setRoleSearchTerm(newValue)}
                  inputValue={roleSearchTerm}
                  options={roleOptions}
                  placeholder={loadingRoles ? "Loading roles..." : "Select role..."}
                  isClearable
                  isSearchable
                  isLoading={loadingRoles}
                  filterOption={() => true}
                  onMenuScrollToBottom={loadMoreRoles}
                  closeMenuOnSelect={false}
                  loadingMessage={() => "Loading more roles..."}
                  noOptionsMessage={() => "No roles found"}
                />
              </div>

              {/* Created By Filter */}
              {canViewUsers && (
                <div className="filter-item">
                  <h4>Created By</h4>
                  <Select
                    value={Array.isArray(filters.createdBy) ? filters.createdBy.map(value => createdByOptions.find(option => option.value === value)).filter(Boolean) : []}
                    onChange={(selectedOptions) => {
                      const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
                      handleFilterChange('createdBy', selectedValues);
                    }}
                    onInputChange={(newValue) => setCreatedBySearchTerm(newValue)}
                    inputValue={createdBySearchTerm}
                    options={createdByOptions}
                    placeholder={loadingCreatedBy ? "Loading users..." : "Select users..."}
                    isMulti
                    isClearable
                    isSearchable
                    isLoading={loadingCreatedBy}
                    closeMenuOnSelect={false}
                    filterOption={() => true}
                    onMenuScrollToBottom={loadMoreCreatedBy}
                    loadingMessage={() => "Loading more users..."}
                    noOptionsMessage={() => "No users found"}
                  />
                </div>
              )}

              {/* Sort By Filter */}
              <div className="filter-item">
                <h4>Sort By</h4>
                <Select
                  value={sortOptions.find(option => option.value === sorting.field)}
                  onChange={(selectedOption) => handleSortChange(selectedOption ? selectedOption.value : 'createdAt')}
                  options={sortOptions}
                  placeholder="Select sort field..."
                  isClearable
                  isSearchable
                />
              </div>

              {/* Sort Order Filter */}
              <div className="filter-item">
                <h4>Sort Order</h4>
                <div className="sort-order-buttons">
                  <button
                    className={`btn ${sorting.order === 'asc' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleSortChange(sorting.field, 'asc')}
                    title="Sort ascending"
                  >
                    <HiSortAscending />
                  </button>
                  <button
                    className={`btn ${sorting.order === 'desc' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleSortChange(sorting.field, 'desc')}
                    title="Sort descending"
                  >
                    <HiSortDescending />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="filter-actions">
              <div className="filter-actions-left">
                <span className="filter-summary">
                  {(() => {
                    const activeFilters = [];
                    if (filters.status) activeFilters.push(`Status: ${filters.status === 'true' ? 'Active' : 'Inactive'}`);
                    if (filters.role) activeFilters.push(`Role: ${filters.role}`);
                    if (filters.createdBy && filters.createdBy.length > 0) activeFilters.push(`Created By: ${filters.createdBy.length} selected`);
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
        <div className="users-content">
          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-section">
              <FloatingInput
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                icon={<HiSearch />}
              />
              {/* Date Range Picker */}
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
                      createdDateRange: {
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      }
                    }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }
                }}
                placeholder="Select date range..."
                dateFormat="yyyy-MM-dd"
                showMonthDropdown={false}
                showYearDropdown={false}
                dropdownMode="select"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              className="btn btn-light"
              onClick={handleFilterToggle}
              title={isFilterSectionOpen ? "Hide filters" : "Show filters"}
            >
              <HiFilter />
              {isFilterSectionOpen ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {/* Quick Filters Row */}
          <div className="quick-filters-row">
            <button
              className={`btn ${isQuickFilterActive('active_users') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('active_users')}
            >
              Active Users
            </button>
            <button
              className={`btn ${isQuickFilterActive('inactive_users') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('inactive_users')}
            >
              Inactive Users
            </button>
            <button
              className={`btn ${isQuickFilterActive('admin_users') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('admin_users')}
            >
              Admins
            </button>
            <button
              className={`btn ${isQuickFilterActive('manager_users') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('manager_users')}
            >
              Managers
            </button>
            <button
              className={`btn ${isQuickFilterActive('viewer_users') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('viewer_users')}
            >
              Viewers
            </button>
            <button
              className={`btn ${isQuickFilterActive('recent_users') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('recent_users')}
            >
              Recent (7 days)
            </button>
            <button
              className={`btn ${isQuickFilterActive('my_users') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('my_users')}
            >
              My Users
            </button>
            <button
              className={`btn ${isQuickFilterActive('system_users') ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleQuickFilter('system_users')}
            >
              System Users
            </button>
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
                        {canDeleteUsers && (
                          <th className="checkbox-column">
                            <Checkbox
                              checked={selectedUsers.length === users.length && users.length > 0}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              title="Select all users"
                              size="small"
                              className="select-all-checkbox"
                            />
                          </th>
                        )}
                        <th>User Information</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Created By</th>
                        {(canEditUsers || canDeleteUsers) && (
                          <th className="actions-column">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id}>
                          {canDeleteUsers && (
                            <td className="checkbox-column">
                              <Checkbox
                                checked={selectedUsers.some(u => u._id === user._id)}
                                onChange={(e) => handleUserSelection(user, e.target.checked)}
                                title={`Select ${user.firstName} ${user.lastName}`}
                                size="medium"
                              />
                            </td>
                          )}
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
                                <span className="user-name">{user.firstName} {user.lastName}</span>
                                <span className="username">@{user.username}</span>
                                {user.phone && (
                                  <span className="user-phone">{user.phone}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {user.email}
                          </td>
                          <td><RoleBadge role={user.role} /></td>
                          <td><StatusBadge isActive={user.isActive} /></td>
                          <td>
                            {user.lastLogin ? (
                              formatDate(user.lastLogin)
                            ) : (
                              <span className="last-login never">Never</span>
                            )}
                          </td>
                          <td>
                            {user.createdBy ? (
                              user.createdBy.firstName + ' ' + user.createdBy.lastName
                            ) : (
                              <span className="created-by">System</span>
                            )}
                          </td>
                          {(canEditUsers || canDeleteUsers) && (
                            <td className="actions-column">
                              <div className="action-buttons">
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => handleViewUser(user)}
                                  title="View user details"
                                >
                                  <HiEye />
                                </button>
                                {canEditUsers && (
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/users/${user._id}/edit`)}
                                    title="Edit user"
                                  >
                                    <HiPencil />
                                  </button>
                                )}
                                {canDeleteUsers && (
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => confirmDeleteUser(user)}
                                    title="Delete user"
                                    disabled={deleteLoading}
                                  >
                                    <HiTrash />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
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
                        className="btn btn-secondary"
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
                            const end = Math.min(totalPages - 1, currentPage + 1);

                            for (let i = start; i <= end; i++) {
                              if (i !== 1 && i !== totalPages) {
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
                                  className={`btn ${totalPages === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
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
                        className="btn btn-secondary"
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
                    <button className="btn btn-secondary" onClick={handleClearFilters}>
                      Clear Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>


      </div>

      {/* User View Modal */}
      <UserViewModal
        user={selectedUser}
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        currentUser={currentUser}
        onEditUser={(user) => navigate(`/users/${user._id}/edit`)}
      />

    </div>
  );
};

export default Users;
