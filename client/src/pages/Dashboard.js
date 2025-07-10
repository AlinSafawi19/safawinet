import React, { useState, useEffect, useRef, useCallback } from 'react';
import authService from '../services/authService';
import axios from 'axios';
import Chart from 'chart.js/auto';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import config from '../config/config';
import moment from 'moment';
import 'moment-timezone';
import { useToast } from '../components/DashboardLayout';
import {
    FiAlertTriangle,
    FiCheckCircle,
    FiLock,
    FiMail,
    //FiSmartphone, 
    FiShield,
    FiWifi,
    // FiWifiOff,
    FiRefreshCw,
    FiUser,
    //FiSettings,
    FiKey,
    FiShield as FiShieldCheck,
    FiAlertCircle,
    FiGlobe,
    // FiMonitor,
    FiServer,
    FiClock,
    FiActivity
} from 'react-icons/fi';
import '../styles/Dashboard.css';

// Fix for Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Dashboard = () => {
    const user = authService.getCurrentUser();

    // Extract user preferences with fallbacks
    const userTimezone = user?.userPreferences?.timezone || 'Asia/Beirut';
    const userDateFormat = user?.userPreferences?.dateFormat || 'MMM dd, yyyy h:mm a';

    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState(null);
    const [rateLimitWarning, setRateLimitWarning] = useState(false);
    const [currentTime, setCurrentTime] = useState(moment().tz(userTimezone));
    const { setToast } = useToast();
    //console.log(user);
    const [securityStats, setSecurityStats] = useState({
        securityEvents: 0,
        failedLogins: 0,
        successfulLogins: 0,
        period: '24 hours'
    });

    const [securityStatus, setSecurityStatus] = useState({
        accountSecurity: { status: 'good' },
        passwordStrength: { status: 'strong' },
        twoFactorAuth: { status: 'disabled' }
    });

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

    const [systemHealth, setSystemHealth] = useState({
        database: { status: 'unknown', responseTime: 0 },
        emailService: { status: 'unknown', deliveryRate: 0 },
        apiResponse: { status: 'unknown', avgResponseTime: 0 },
        uptime: { status: 'unknown', uptime: 0, lastCheck: null }
    });

    const [chartData, setChartData] = useState({
        securityEvents: [],
        loginSuccessRate: { successful: 0, failed: 0 },
        geographicActivity: [],
        deviceUsage: []
    });

    const [apiErrors, setApiErrors] = useState({
        securityEvents: false,
        loginSuccessRate: false,
        geographicActivity: false,
        deviceUsage: false
    });

    // Loading states for charts
    const [chartLoading, setChartLoading] = useState({
        securityEvents: true,
        loginSuccessRate: true,
        geographicActivity: true,
        deviceUsage: true
    });

    // Chart refs
    const securityEventsChartRef = useRef(null);
    const loginSuccessChartRef = useRef(null);
    const deviceUsageChartRef = useRef(null);
    const geographicMapRef = useRef(null);

    // Chart instances
    const [charts, setCharts] = useState({
        securityEvents: null,
        loginSuccess: null,
        deviceUsage: null
    });

    // Get the number of active sessions from user object
    const activeSessionsCount = user?.activeSessions?.length || 0;
    const maxSessions = user?.maxSessions || 5;

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

    // Debounced fetch function to prevent rapid API calls
    const debouncedFetch = useCallback((fetchFunction, delay = 1000) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fetchFunction(...args), delay);
        };
    }, []);

    // Initialize Socket.IO connection
    useEffect(() => {
        if (!authService.isUserAuthenticated()) return;

        const token = localStorage.getItem('authToken');
        if (!token) return;

        const socketInstance = io(config.serverUrl, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            console.log('Connected to real-time dashboard');
            setIsConnected(true);

            // Request initial dashboard data
            socketInstance.emit('request-dashboard-data');

            // Set loading states when requesting data via socket
            setChartLoading({
                securityEvents: true,
                loginSuccessRate: true,
                geographicActivity: true,
                deviceUsage: true
            });
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from real-time dashboard');
            setIsConnected(false);
        });

        socketInstance.on('dashboard-data-update', (update) => {
            console.log('Received real-time update:', update.type);

            // Update timestamp for real-time events
            setLastFetchTime(new Date());

            switch (update.type) {
                case 'security-stats':
                    setSecurityStats(update.data);
                    break;
                case 'security-status':
                    setSecurityStatus(update.data);
                    break;
                case 'system-health':
                    setSystemHealth(prev => ({
                        ...prev,
                        ...update.data,
                        apiResponse: {
                            ...update.data.apiResponse,
                            avgResponseTime: prev.apiResponse.avgResponseTime // Keep client-measured response time
                        }
                    }));
                    break;
                case 'chart-data':
                    // Update chart data including device usage
                    setChartData(prev => ({
                        ...prev,
                        ...update.data
                    }));

                    // Clear API errors for chart data since we received real-time updates
                    setApiErrors(prev => ({
                        ...prev,
                        securityEvents: false,
                        loginSuccessRate: false,
                        geographicActivity: false,
                        deviceUsage: false
                    }));

                    // Clear loading states for chart data since we received real-time updates
                    setChartLoading(prev => ({
                        ...prev,
                        securityEvents: false,
                        loginSuccessRate: false,
                        geographicActivity: false,
                        deviceUsage: false
                    }));
                    break;
                default:
                    break;
            }
        });

        socketInstance.on('error', (error) => {
            console.error('Socket.IO error:', error);
        });

        setSocket(socketInstance);

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    // Combined data fetching function to reduce API calls
    const fetchDashboardData = useCallback(async () => {
        if (!authService.isUserAuthenticated()) return;

        // Set all charts to loading state
        setChartLoading({
            securityEvents: true,
            loginSuccessRate: true,
            geographicActivity: true,
            deviceUsage: true
        });

        // Add a timeout to clear loading states if API calls take too long
        const loadingTimeout = setTimeout(() => {
            setChartLoading({
                securityEvents: false,
                loginSuccessRate: false,
                geographicActivity: false,
                deviceUsage: false
            });
        }, 10000); // 10 second timeout

        try {
            const api = createApiInstance();

            // Fetch all data in parallel to reduce total request time
            const [
                securityEventsResponse,
                securityStatusResponse,
                healthResponse,
                securityEventsChartResponse,
                loginSuccessResponse,
                geographicResponse,
                deviceUsageResponse
            ] = await Promise.all([
                api.get('/auth/security-events'),
                api.get('/auth/security-status'),
                api.get('/health'),
                api.get('/auth/security-events-chart?days=7'),
                api.get('/auth/login-success-rate?hours=24'),
                api.get('/auth/geographic-activity?hours=24'),
                api.get('/auth/device-usage?hours=24')
            ]);

            // Update security stats
            if (securityEventsResponse.data.success) {
                setSecurityStats(securityEventsResponse.data.data);
            }

            // Update security status
            if (securityStatusResponse.data.success) {
                setSecurityStatus(securityStatusResponse.data.data);
            }

            // Update system health with response time measurement
            if (healthResponse.data) {
                const health = healthResponse.data;
                setSystemHealth(prev => ({
                    ...prev,
                    database: {
                        status: health.database?.status || 'unknown',
                        responseTime: prev.database.responseTime // Keep existing response time
                    },
                    emailService: {
                        status: 'operational',
                        deliveryRate: 98.5
                    },
                    apiResponse: {
                        status: prev.apiResponse.status, // Keep existing status
                        avgResponseTime: prev.apiResponse.avgResponseTime // Keep existing response time
                    },
                    uptime: {
                        status: health.status || 'unknown',
                        uptime: health.uptime || 0,
                        lastCheck: new Date()
                    }
                }));
            }

            // Update chart data
            if (securityEventsChartResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    securityEvents: securityEventsChartResponse.data.data
                }));
                setApiErrors(prev => ({ ...prev, securityEvents: false }));
                setChartLoading(prev => ({ ...prev, securityEvents: false }));
            } else {
                setApiErrors(prev => ({ ...prev, securityEvents: true }));
                setChartLoading(prev => ({ ...prev, securityEvents: false }));
            }

            if (loginSuccessResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    loginSuccessRate: loginSuccessResponse.data.data
                }));
                setApiErrors(prev => ({ ...prev, loginSuccessRate: false }));
                setChartLoading(prev => ({ ...prev, loginSuccessRate: false }));
            } else {
                setApiErrors(prev => ({ ...prev, loginSuccessRate: true }));
                setChartLoading(prev => ({ ...prev, loginSuccessRate: false }));
            }

            if (geographicResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    geographicActivity: geographicResponse.data.data
                }));
                setApiErrors(prev => ({ ...prev, geographicActivity: false }));
                setChartLoading(prev => ({ ...prev, geographicActivity: false }));
            } else {
                setApiErrors(prev => ({ ...prev, geographicActivity: true }));
                setChartLoading(prev => ({ ...prev, geographicActivity: false }));
            }

            if (deviceUsageResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    deviceUsage: deviceUsageResponse.data.data
                }));
                setApiErrors(prev => ({ ...prev, deviceUsage: false }));
                setChartLoading(prev => ({ ...prev, deviceUsage: false }));
            } else {
                setApiErrors(prev => ({ ...prev, deviceUsage: true }));
                setChartLoading(prev => ({ ...prev, deviceUsage: false }));
            }

            setLastFetchTime(new Date());

            // Clear the loading timeout since API calls completed
            clearTimeout(loadingTimeout);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);

            // Clear the loading timeout since API calls failed
            clearTimeout(loadingTimeout);

            // Handle rate limiting specifically
            if (error.response?.status === 429) {
                console.warn('Rate limit exceeded, using cached data');
                setRateLimitWarning(true);

                // Clear warning after 30 seconds (longer for rate limiting)
                setTimeout(() => setRateLimitWarning(false), 30000);

                // Set error states for all APIs on rate limiting
                setApiErrors({
                    securityEvents: true,
                    loginSuccessRate: true,
                    geographicActivity: true,
                    deviceUsage: true
                });
                setChartLoading({
                    securityEvents: false,
                    loginSuccessRate: false,
                    geographicActivity: false,
                    deviceUsage: false
                });

                // Show user-friendly message
                console.log('Dashboard data temporarily unavailable due to rate limiting. Please try again in a few minutes.');
            } else {
                // Set error states for all APIs on general error
                setApiErrors({
                    securityEvents: true,
                    loginSuccessRate: true,
                    geographicActivity: true,
                    deviceUsage: true
                });
                setChartLoading({
                    securityEvents: false,
                    loginSuccessRate: false,
                    geographicActivity: false,
                    deviceUsage: false
                });
            }
        } finally {
        }
    }, [createApiInstance]);

    // Debounced version of fetchDashboardData
    const debouncedFetchDashboardData = useCallback(
        debouncedFetch(fetchDashboardData, 5000), // 5 second debounce to reduce rate limiting
        [fetchDashboardData, debouncedFetch]
    );

    // Fetch data on mount and when not connected to real-time
    useEffect(() => {
        if (!isConnected) {
            // Set loading states when starting to fetch data
            setChartLoading({
                securityEvents: true,
                loginSuccessRate: true,
                geographicActivity: true,
                deviceUsage: true
            });
            debouncedFetchDashboardData();
        } else {
            // When connected to real-time, only fetch data once on mount
            // Real-time updates will handle the rest
            if (!lastFetchTime) {
                // Set loading states when starting to fetch data
                setChartLoading({
                    securityEvents: true,
                    loginSuccessRate: true,
                    geographicActivity: true,
                    deviceUsage: true
                });
                debouncedFetchDashboardData();
            }
        }
    }, [isConnected, debouncedFetchDashboardData, lastFetchTime]);

    // Refresh profile data on mount and when returning to dashboard
    useEffect(() => {
        refreshProfileData();
    }, []);

    // Update current time every second
    useEffect(() => {
        const timeInterval = setInterval(() => {
            setCurrentTime(moment().tz(userTimezone));
        }, 1000);

        return () => clearInterval(timeInterval);
    }, [userTimezone]);

    // Measure API response time separately (less frequent)
    useEffect(() => {
        const measureApiResponseTime = async () => {
            if (!authService.isUserAuthenticated()) return;

            try {
                const api = createApiInstance();
                const startTime = Date.now();
                await api.get('/health');
                const responseTime = Date.now() - startTime;

                setSystemHealth(prev => ({
                    ...prev,
                    apiResponse: {
                        status: responseTime < 500 ? 'excellent' : responseTime < 1000 ? 'good' : 'slow',
                        avgResponseTime: responseTime,
                        lastCheck: new Date()
                    }
                }));

                // Update timestamp for successful API health checks
                setLastFetchTime(new Date());
            } catch (error) {
                console.error('Error measuring API response time:', error);
            }
        };

        // Measure response time every 5 minutes to reduce rate limiting
        measureApiResponseTime();
        const interval = setInterval(measureApiResponseTime, 300000); // 5 minutes
        return () => clearInterval(interval);
    }, [createApiInstance]);

    // Initialize charts
    useEffect(() => {
        // Only initialize charts if we have data and charts haven't been created yet
        if (chartData.securityEvents.length > 0 || chartData.loginSuccessRate.successful > 0 || chartData.deviceUsage.length > 0) {
            initializeCharts();
        }
    }, [chartData]);

    // Update charts when data changes (real-time updates)
    useEffect(() => {
        if (charts.securityEvents && chartData.securityEvents.length > 0) {
            updateSecurityEventsChart();
        }
        if (charts.loginSuccess && (chartData.loginSuccessRate.successful > 0 || chartData.loginSuccessRate.failed > 0)) {
            updateLoginSuccessChart();
        }
        if (charts.deviceUsage && chartData.deviceUsage.length > 0) {
            updateDeviceUsageChart();
        }
    }, [chartData, charts]);

    const initializeCharts = () => {
        // Security Events Chart
        if (securityEventsChartRef.current && !charts.securityEvents && chartData.securityEvents.length > 0) {
            const ctx = securityEventsChartRef.current.getContext('2d');
            const securityEventsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.securityEvents.map(item => {
                        return moment(item.date).tz(userTimezone).format('MMM D');
                    }),
                    datasets: [
                        {
                            label: 'Security Events',
                            data: chartData.securityEvents.map(item => item.events),
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Failed Logins',
                            data: chartData.securityEvents.map(item => item.failedLogins),
                            backgroundColor: 'rgba(245, 158, 11, 0.8)',
                            borderColor: 'rgba(245, 158, 11, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            setCharts(prev => ({ ...prev, securityEvents: securityEventsChart }));
        }

        // Login Success Rate Chart
        if (loginSuccessChartRef.current && !charts.loginSuccess && (chartData.loginSuccessRate.successful > 0 || chartData.loginSuccessRate.failed > 0)) {
            const ctx = loginSuccessChartRef.current.getContext('2d');
            const loginSuccessChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Successful', 'Failed'],
                    datasets: [{
                        data: [chartData.loginSuccessRate.successful, chartData.loginSuccessRate.failed],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ],
                        borderColor: [
                            'rgba(16, 185, 129, 1)',
                            'rgba(239, 68, 68, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        }
                    }
                }
            });
            setCharts(prev => ({ ...prev, loginSuccess: loginSuccessChart }));
        }

        // Device Usage Chart
        if (deviceUsageChartRef.current && !charts.deviceUsage && chartData.deviceUsage.length > 0) {
            const ctx = deviceUsageChartRef.current.getContext('2d');
            const deviceUsageChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.deviceUsage.map(item => item.device),
                    datasets: [{
                        label: 'Usage (%)',
                        data: chartData.deviceUsage.map(item => item.percentage),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            setCharts(prev => ({ ...prev, deviceUsage: deviceUsageChart }));
        }
    };

    // Update charts when data changes (real-time updates)
    const updateSecurityEventsChart = () => {
        if (charts.securityEvents && chartData.securityEvents.length > 0) {
            // Update chart data directly
            charts.securityEvents.data.labels = chartData.securityEvents.map(item => {
                return moment(item.date).tz(userTimezone).format('MMM D');
            });
            charts.securityEvents.data.datasets[0].data = chartData.securityEvents.map(item => item.events);
            charts.securityEvents.data.datasets[1].data = chartData.securityEvents.map(item => item.failedLogins);
            charts.securityEvents.update();
        } else {
            // If chart doesn't exist, initialize
            initializeCharts();
        }
    };

    const updateLoginSuccessChart = () => {
        if (charts.loginSuccess && (chartData.loginSuccessRate.successful > 0 || chartData.loginSuccessRate.failed > 0)) {
            // Update chart data directly
            charts.loginSuccess.data.datasets[0].data = [chartData.loginSuccessRate.successful, chartData.loginSuccessRate.failed];
            charts.loginSuccess.update();
        } else {
            // If chart doesn't exist, initialize
            initializeCharts();
        }
    };

    const updateDeviceUsageChart = () => {
        if (charts.deviceUsage && chartData.deviceUsage.length > 0) {
            // Update chart data directly
            charts.deviceUsage.data.labels = chartData.deviceUsage.map(item => item.device);
            charts.deviceUsage.data.datasets[0].data = chartData.deviceUsage.map(item => item.percentage);
            charts.deviceUsage.update();
        } else {
            // If chart doesn't exist, initialize
            initializeCharts();
        }
    };

    // Format date for display with user's timezone and date format
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return moment(dateString).tz(userTimezone).format(userDateFormat);
    };

    // Format uptime
    const formatUptime = (seconds) => {
        if (!seconds) return 'N/A';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'connected':
            case 'operational':
            case 'excellent':
            case 'ok':
                return 'success';
            case 'connecting':
            case 'good':
                return 'warning';
            case 'disconnected':
            case 'error':
            case 'slow':
                return 'error';
            default:
                return 'unknown';
        }
    };

    // Helper function to get country coordinates
    const getCountryCoordinates = (countryName) => {
        const coordinates = {
            'United States': { lat: 39.8283, lng: -98.5795 },
            'United Kingdom': { lat: 55.3781, lng: -3.4360 },
            'Canada': { lat: 56.1304, lng: -106.3468 },
            'Germany': { lat: 51.1657, lng: 10.4515 },
            'France': { lat: 46.2276, lng: 2.2137 },
            'Australia': { lat: -25.2744, lng: 133.7751 },
            'Japan': { lat: 36.2048, lng: 138.2529 },
            'China': { lat: 35.8617, lng: 104.1954 },
            'India': { lat: 20.5937, lng: 78.9629 },
            'Brazil': { lat: -14.2350, lng: -51.9253 },
            'Mexico': { lat: 23.6345, lng: -102.5528 },
            'Spain': { lat: 40.4637, lng: -3.7492 },
            'Italy': { lat: 41.8719, lng: 12.5674 },
            'Netherlands': { lat: 52.1326, lng: 5.2913 },
            'Sweden': { lat: 60.1282, lng: 18.6435 },
            'Norway': { lat: 60.4720, lng: 8.4689 },
            'Denmark': { lat: 56.2639, lng: 9.5018 },
            'Finland': { lat: 61.9241, lng: 25.7482 },
            'Switzerland': { lat: 46.8182, lng: 8.2275 },
            'Austria': { lat: 47.5162, lng: 14.5501 },
            'Local': { lat: 0, lng: 0 }, // Center of world map
            'Unknown': { lat: 0, lng: 0 }, // Center of world map
            'Other': { lat: 0, lng: 0 }, // Center of world map
            'US': { lat: 39.8283, lng: -98.5795 },
            'UK': { lat: 55.3781, lng: -3.4360 },
            'USA': { lat: 39.8283, lng: -98.5795 }
        };
        return coordinates[countryName] || { lat: 0, lng: 0 }; // Default to center if not found
    };

    // Handle quick actions
    const handleQuickAction = (action) => {
        switch (action) {
            case 'edit-profile':
                // TODO: Implement profile edit modal/page
                console.log('Edit profile clicked');
                break;
            case 'change-password':
                // TODO: Implement password change modal
                console.log('Change password clicked');
                break;
            case 'toggle-2fa':
                // TODO: Implement 2FA toggle
                console.log('Toggle 2FA clicked');
                break;
            case 'verify-email':
                handleEmailVerification();
                break;
            // --- PHONE VERIFICATION UI & LOGIC DISABLED ---
            // case 'verify-phone':
            //     handlePhoneVerification();
            //     break;
            default:
                break;
        }
    };

    // Refresh profile data from server
    const refreshProfileData = async () => {
        try {
            const result = await authService.getProfile();
            if (result.success) {
                setProfileData({
                    firstName: result.user.firstName || '',
                    lastName: result.user.lastName || '',
                    email: result.user.email || '',
                    phone: result.user.phone || '',
                    username: result.user.username || '',
                    isAdmin: result.user.isAdmin || false,
                    isActive: result.user.isActive || true,
                    createdAt: result.user.createdAt || '',
                    lastLogin: result.user.lastLogin || '',
                    twoFactorEnabled: result.user.twoFactorEnabled || false,
                    emailVerified: result.user.emailVerified || false,
                    phoneVerified: result.user.phoneVerified || false
                });
            }
        } catch (error) {
            console.error('Error refreshing profile data:', error);
        } finally {
        }
    };

    // Handle email verification
    const handleEmailVerification = async () => {
        try {
            const api = createApiInstance();
            const response = await api.post('/auth/send-email-verification');

            if (response.data.success) {
                setToast({ show: true, message: 'Verification email sent! Check your email inbox (and spam/junk folder if not found).', type: 'success' });
                // Auto-hide toast after 6 seconds (longer for more detailed message)
                setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 6000);
            } else {
                setToast({ show: true, message: 'Failed to send verification email. Please try again.', type: 'error' });
                // Auto-hide toast after 4 seconds
                setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
            }
        } catch (error) {
            console.error('Email verification error:', error);
            setToast({ show: true, message: 'Failed to send verification email. Please try again.', type: 'error' });
            // Auto-hide toast after 4 seconds
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
        }
    };

    // --- PHONE VERIFICATION UI & LOGIC DISABLED ---
    // Handle phone verification
    /*
    const handlePhoneVerification = async () => {
        const phoneNumber = prompt('Please enter your phone number (with country code):');
        if (!phoneNumber) return;

        try {
            const api = createApiInstance();
            const response = await api.post('/auth/send-phone-verification', {
                phoneNumber: phoneNumber
            });

            if (response.data.success) {
                alert('Verification code sent! Please check your phone for the SMS.');

                const code = prompt('Please enter the verification code:');
                if (code) {
                    const verifyResponse = await api.post('/auth/verify-phone', { code });
                    if (verifyResponse.data.success) {
                        alert('Phone number verified successfully!');
                        // Refresh profile data
                        setProfileData(prev => ({ ...prev, phoneVerified: true }));
                    } else {
                        alert('Invalid verification code. Please try again.');
                    }
                }
            } else {
                alert('Failed to send verification code. Please try again.');
            }
        } catch (error) {
            console.error('Phone verification error:', error);
            alert('Failed to send verification code. Please try again.');
        }
    };
    */

    // Loading placeholder components
    const ChartLoadingPlaceholder = ({ title, icon: Icon }) => (
        <div className="chart-loading-placeholder">
            <div className="loading-spinner">
                <div className="spinner-ring"></div>
            </div>
            <div className="loading-content">
                <h4>{Icon && <Icon />} {title}</h4>
                <p>Loading chart data...</p>
            </div>
        </div>
    );

    const MapLoadingPlaceholder = () => (
        <div className="map-loading-placeholder">
            <div className="loading-spinner">
                <div className="spinner-ring"></div>
            </div>
            <div className="loading-content">
                <h4><FiGlobe /> Geographic Activity Map</h4>
                <p>Loading geographic data...</p>
            </div>
        </div>
    );

    return (
        <main className="dashboard">
            {/* Rate Limit Warning */}
            {rateLimitWarning && (
                <div className="rate-limit-warning">
                    <div className="warning-content">
                        <span className="warning-icon"><FiAlertTriangle /></span>
                        <span className="warning-text">
                            Too many requests from this IP. Please wait a few minutes before refreshing.
                            API calls have been reduced to prevent further rate limiting.
                        </span>
                    </div>
                </div>
            )}

            {/* Connection Status */}
            <section className="dashboard__connection-status">
                <div className="status-indicator-group">
                    <div className="status-indicator">
                        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                        <span className="status-text">
                            Real-time Status: {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    {lastFetchTime && (
                        <span className="last-update">
                            Last Update: {formatDate(lastFetchTime)}
                            {isConnected && ' (Real-time)'}
                            {!isConnected && ' (Polling)'}
                        </span>
                    )}
                </div>
                <div className="timezone-info">
                    <span className="timezone-label">Timezone:</span>
                    <span className="timezone-value">
                        {currentTime.format('z')} ({currentTime.format('Z')})
                    </span>
                    <span className="current-time">
                        {currentTime.format('h:mm:ss A')}
                    </span>
                </div>
            </section>

            {/* Dashboard Grid */}
            <section className="dashboard__grid">
                {/* Profile Card */}
                <article className="dashboard__card dashboard__card--profile">
                    <div className="card-header">
                        <h3>Profile & Account</h3>
                    </div>
                    <div className="card-content">
                        <div className="profile-summary">
                            <div className="profile-avatar">
                                <div className="avatar-circle">
                                    {profileData.firstName && profileData.lastName ?
                                        `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}` :
                                        profileData.username ? profileData.username.charAt(0).toUpperCase() : 'U'
                                    }
                                </div>
                            </div>
                            <div className="profile-info">
                                <h4 className="profile-name">
                                    {profileData.firstName && profileData.lastName ?
                                        `${profileData.firstName} ${profileData.lastName}` :
                                        profileData.username || 'User'
                                    }
                                </h4>
                                <p className="profile-email">{profileData.email}</p>
                                <p className="profile-phone">{profileData.phone || 'No phone number'}</p>
                            </div>
                        </div>

                        <div className="account-status">
                            <div className="status-item">
                                <span className="status-label">Account Status:</span>
                                <span className={`status-badge ${profileData.isActive ? 'active' : 'inactive'}`}>
                                    {profileData.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="status-item">
                                <span className="status-label">Role:</span>
                                <span className={`status-badge ${profileData.isAdmin ? 'admin' : 'user'}`}>
                                    {profileData.isAdmin ? 'Admin' : 'User'}
                                </span>
                            </div>
                            <div className="status-item">
                                <span className="status-label">2FA:</span>
                                <span className={`status-badge ${profileData.twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                                    {profileData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </div>

                        <div className="account-details">
                            <div className="detail-item">
                                <span className="detail-label">Username:</span>
                                <span className="detail-value">{profileData.username}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Member Since:</span>
                                <span className="detail-value">{formatDate(profileData.createdAt)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Last Login:</span>
                                <span className="detail-value">{formatDate(profileData.lastLogin)}</span>
                            </div>
                        </div>

                        <div className="quick-actions">
                            <div className="action-buttons">
                                <a
                                    href="#"
                                    className="action-btn edit-profile"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleQuickAction('edit-profile');
                                    }}
                                >
                                    Edit Profile
                                </a>
                                <a
                                    href="#"
                                    className="action-btn change-password"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleQuickAction('change-password');
                                    }}
                                >
                                    Change Password
                                </a>
                            </div>
                        </div>
                    </div>
                </article>

                {/* Health Card */}
                <article className="dashboard__card dashboard__card--health">
                    <div className="card-header">
                        <h3>System Health & Performance</h3>
                    </div>
                    <div className="card-content">
                        <div className="health-metrics">
                            <div className="metric-item">
                                <div className="metric-header">
                                    <span className="metric-title"><FiServer /> Database Status</span>
                                    <span className={`status-indicator ${getStatusColor(systemHealth.database.status)}`}></span>
                                </div>
                                <div className="metric-value">
                                    <span className="metric-main">{systemHealth.database.status}</span>
                                    <span className="metric-sub">{systemHealth.database.responseTime}ms</span>
                                </div>
                            </div>

                            <div className="metric-item">
                                <div className="metric-header">
                                    <span className="metric-title"><FiMail /> Email Service</span>
                                    <span className={`status-indicator ${getStatusColor(systemHealth.emailService.status)}`}></span>
                                </div>
                                <div className="metric-value">
                                    <span className="metric-main">{systemHealth.emailService.status}</span>
                                    <span className="metric-sub">{systemHealth.emailService.deliveryRate}% delivery</span>
                                </div>
                            </div>

                            <div className="metric-item">
                                <div className="metric-header">
                                    <span className="metric-title"><FiActivity /> API Response</span>
                                    <span className={`status-indicator ${getStatusColor(systemHealth.apiResponse.status)}`}></span>
                                </div>
                                <div className="metric-value">
                                    <span className="metric-main">{systemHealth.apiResponse.status}</span>
                                    <span className="metric-sub">{systemHealth.apiResponse.avgResponseTime}ms avg</span>
                                </div>
                            </div>

                            <div className="metric-item">
                                <div className="metric-header">
                                    <span className="metric-title"><FiClock /> System Uptime</span>
                                    <span className={`status-indicator ${getStatusColor(systemHealth.uptime.status)}`}></span>
                                </div>
                                <div className="metric-value">
                                    <span className="metric-main">{formatUptime(systemHealth.uptime.uptime)}</span>
                                    <span className="metric-sub">
                                        {systemHealth.uptime.lastCheck &&
                                            `Last check: ${formatDate(systemHealth.uptime.lastCheck)}`
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="health-summary">
                            <div className="summary-item">
                                <span className="summary-label">Overall Status:</span>
                                <span className={`summary-value ${getStatusColor(systemHealth.uptime.status)}`}>
                                    {systemHealth.uptime.status === 'ok' ? 'All Systems Operational' :
                                        systemHealth.uptime.status === 'degraded' ? 'Degraded Performance' :
                                            'System Issues Detected'}
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Last Updated:</span>
                                <span className="summary-value">
                                    {systemHealth.uptime.lastCheck ?
                                        formatDate(systemHealth.uptime.lastCheck) :
                                        'Never'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </article>

                {/* Stats Card */}
                <article className="dashboard__card dashboard__card--stats">
                    <div className="card-header">
                        <h3>Quick Stats</h3>
                        <span className="stats-period">Last {securityStats.period}</span>
                    </div>
                    <div className="card-content">
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-number">{activeSessionsCount}/{maxSessions}</span>
                                <span className="stat-label"><FiWifi /> Active Sessions</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{securityStats.failedLogins || 0}</span>
                                <span className="stat-label"><FiAlertCircle /> Failed Logins</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{securityStats.securityEvents || 0}</span>
                                <span className="stat-label"><FiShield /> Security Events</span>
                            </div>
                        </div>
                    </div>
                </article>

                {/* Security Card */}
                <article className="dashboard__card dashboard__card--security">
                    <div className="card-header">
                        <h3>Security Status</h3>
                    </div>
                    <div className="card-content">
                        <div className="security-status-list">
                            <div className="security-status-item good">
                                <span className="status-icon"><FiShieldCheck /></span>
                                <div>
                                    <div className="status-title">Account Security</div>
                                    <div className="status-desc">Your account is secure.</div>
                                </div>
                            </div>
                            <div className={`security-status-item ${securityStatus.passwordStrength?.status === 'strong' ? 'good' : 'warning'}`}>
                                <span className="status-icon">{securityStatus.passwordStrength?.status === 'strong' ? <FiCheckCircle /> : <FiAlertCircle />}</span>
                                <div>
                                    <div className="status-title">Password Strength</div>
                                    <div className="status-desc">
                                        {securityStatus.passwordStrength?.status === 'strong' ?
                                            'Your password is strong and secure.' :
                                            <>
                                                Your password is weak. <a href="#">Change password</a>
                                            </>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className={`security-status-item ${profileData.twoFactorEnabled ? 'good' : 'error'}`}>
                                <span className="status-icon">{profileData.twoFactorEnabled ? <FiCheckCircle /> : <FiLock />}</span>
                                <div>
                                    <div className="status-title">Two-Factor Auth</div>
                                    <div className="status-desc">
                                        {profileData.twoFactorEnabled ?
                                            '2FA is enabled and active.' :
                                            <>
                                                2FA is disabled. <a href="#">Enable now</a>
                                            </>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className={`security-status-item ${profileData.emailVerified ? 'good' : 'warning'}`}>
                                <span className="status-icon">{profileData.emailVerified ? <FiCheckCircle /> : <FiMail />}</span>
                                <div>
                                    <div className="status-title">Email Verification</div>
                                    <div className="status-desc">
                                        {profileData.emailVerified ?
                                            'Email is verified and secure.' :
                                            <>
                                                Email not verified. <a href="#" onClick={() => handleQuickAction('verify-email')}>Verify now</a>
                                            </>
                                        }
                                    </div>
                                </div>
                            </div>
                            {/* --- PHONE VERIFICATION UI & LOGIC DISABLED --- */}
                            {/* <div className={`security-status-item ${profileData.phoneVerified ? 'good' : 'warning'}`}>
                                <span className="status-icon">{profileData.phoneVerified ? <FiCheckCircle /> : <FiSmartphone />}</span>
                                <div>
                                    <div className="status-title">Phone Verification</div>
                                    <div className="status-desc">
                                        {profileData.phoneVerified ? 
                                            'Phone is verified and secure.' : 
                                            <>
                                                Phone not verified. <a href="#" onClick={() => handleQuickAction('verify-phone')}>Verify now</a>
                                            </>
                                        }
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </article>

                {/* Security Events Chart */}
                <article className="dashboard__card dashboard__card--chart dashboard__card--security-events">
                    <div className="card-header">
                        <h3>Security Events Over Time</h3>
                    </div>
                    <div className="card-content">
                        {apiErrors.securityEvents ? (
                            <div className="chart-error">
                                <div className="error-content">
                                    <span className="error-icon"><FiAlertTriangle /></span>
                                    <div className="error-text">
                                        <h4>Security Events Data Unavailable</h4>
                                        <p>Unable to load security events statistics. The API may be temporarily unavailable.</p>
                                    </div>
                                </div>
                            </div>
                        ) : chartData.securityEvents.length > 0 ? (
                            <div className="chart-container">
                                <canvas ref={securityEventsChartRef} height="300"></canvas>
                            </div>
                        ) : (
                            <div className="chart-loading-placeholder">
                                <div className="loading-content">
                                    <h4><FiShield /> Security Events Over Time</h4>
                                    <p>No security events data available</p>
                                    <p className="placeholder-subtitle">Security events over time will appear here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </article>

                {/* Login Success Rate Chart */}
                <article className="dashboard__card dashboard__card--chart dashboard__card--login-success">
                    <div className="card-header">
                        <h3>Login Success Rate</h3>
                    </div>
                    <div className="card-content">
                        {apiErrors.loginSuccessRate ? (
                            <div className="chart-error">
                                <div className="error-content">
                                    <span className="error-icon"><FiAlertTriangle /></span>
                                    <div className="error-text">
                                        <h4>Login Success Rate Data Unavailable</h4>
                                        <p>Unable to load login success rate statistics. The API may be temporarily unavailable.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (chartData.loginSuccessRate.totalLogins > 0) ? (
                            <>
                                <div className="chart-container">
                                    <canvas ref={loginSuccessChartRef} height="300"></canvas>
                                </div>
                                <div className="chart-stats">
                                    <div className="stat-item">
                                        <span className="stat-number">{chartData.loginSuccessRate.successful}%</span>
                                        <span className="stat-label">Successful</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{chartData.loginSuccessRate.failed}%</span>
                                        <span className="stat-label">Failed</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="chart-loading-placeholder">
                                <div className="loading-content">
                                    <h4><FiCheckCircle /> Login Success Rate</h4>
                                    <p>No login success rate data available</p>
                                    <p className="placeholder-subtitle">Login success rate statistics will appear here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </article>

                {/* Device Usage Chart */}
                <article className="dashboard__card dashboard__card--chart dashboard__card--device-usage">
                    <div className="card-header">
                        <h3>Device Usage</h3>
                    </div>
                    <div className="card-content">
                        {apiErrors.deviceUsage ? (
                            <div className="chart-error">
                                <div className="error-content">
                                    <span className="error-icon"><FiAlertTriangle /></span>
                                    <div className="error-text">
                                        <h4>Device Usage Data Unavailable</h4>
                                        <p>Unable to load device usage statistics. The API may be temporarily unavailable.</p>
                                    </div>
                                </div>
                            </div>
                        ) : chartData.deviceUsage.length > 0 ? (
                            <div className="chart-container">
                                <canvas ref={deviceUsageChartRef} height="300"></canvas>
                            </div>
                        ) : (
                            <div className="chart-loading-placeholder">
                                <div className="loading-content">
                                    <h4><FiActivity /> Device Usage</h4>
                                    <p>No device usage data available</p>
                                    <p className="placeholder-subtitle">Device usage statistics will appear here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </article>

                {/* Geographic Activity Map */}
                <article className="dashboard__card dashboard__card--map">
                    <div className="card-header">
                        <h3>Geographic Activity</h3>
                    </div>
                    <div className="card-content">
                        {chartLoading.geographicActivity ? (
                            <MapLoadingPlaceholder />
                        ) : apiErrors.geographicActivity ? (
                            <div className="chart-error">
                                <div className="error-content">
                                    <span className="error-icon"><FiAlertTriangle /></span>
                                    <div className="error-text">
                                        <h4>Geographic Activity Data Unavailable</h4>
                                        <p>Unable to load geographic activity statistics. The API may be temporarily unavailable.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="map-container" ref={geographicMapRef}>
                                {chartData.geographicActivity.length > 0 ? (
                                    <MapContainer
                                        center={[20, 0]}
                                        zoom={2}
                                        style={{ height: '300px', width: '100%' }}
                                        className="geographic-map"
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        {chartData.geographicActivity.map((location, index) => {
                                            const coordinates = getCountryCoordinates(location.country);

                                            return (
                                                <CircleMarker
                                                    key={index}
                                                    center={[coordinates.lat, coordinates.lng]}
                                                    radius={Math.max(8, Math.sqrt(location.logins) * 4)}
                                                    color={location.country === 'Local' ? "#10B981" : "#3B82F6"}
                                                    fillColor={location.country === 'Local' ? "#10B981" : "#3B82F6"}
                                                    fillOpacity={0.8}
                                                    weight={2}
                                                >
                                                    <Popup>
                                                        <div className="map-popup">
                                                            <h4>{location.country}</h4>
                                                            <p><strong>Logins:</strong> {location.logins}</p>
                                                            <p><strong>Percentage:</strong> {location.percentage}%</p>
                                                            {location.country === 'Local' && (
                                                                <p><em>Local network activity</em></p>
                                                            )}
                                                        </div>
                                                    </Popup>
                                                </CircleMarker>
                                            );
                                        })}
                                    </MapContainer>
                                ) : (
                                    <div className="map-placeholder">
                                        <h4><FiGlobe /> Geographic Activity Map</h4>
                                        <p>No geographic data available</p>
                                        <p className="placeholder-subtitle">Login activity by location will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </article>
            </section>
        </main>
    );
};

export default Dashboard; 