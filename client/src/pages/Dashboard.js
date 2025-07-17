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
import ChangePasswordModal from '../components/ChangePasswordModal';
import TwoFactorModal from '../components/TwoFactorModal';
import { showSuccessToast, showErrorToast } from '../utils/sweetAlertConfig';
import {
    FiShare,
    FiPrinter,
    FiDownload,
    FiX,
    FiRefreshCw,
    FiEye
} from 'react-icons/fi';
import { getStatusClass } from '../utils/classUtils';
import TodoList from '../components/TodoList';

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
    const userDateFormat = user?.userPreferences?.dateFormat || 'MMM DD, YYYY h:mm a';

    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState(null);
    const [rateLimitWarning, setRateLimitWarning] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
    const [twoFactorMode, setTwoFactorMode] = useState('enable');
    const [activeTab, setActiveTab] = useState('overview');

    const [securityStats, setSecurityStats] = useState({
        securityEvents: 0,
        failedLogins: 0,
        successfulLogins: 0,
        period: '0 hours'
    });

    const [securityStatus, setSecurityStatus] = useState({
        accountSecurity: { status: 'unknown' },
        passwordStrength: { status: 'unknown' },
        twoFactorAuth: { status: 'unknown' }
    });

    const [profileData, setProfileData] = useState({
        email: user?.email || '',
        isAdmin: user?.isAdmin || false,
        isActive: user?.isActive || true,
        twoFactorEnabled: user?.twoFactorEnabled || false,
        emailVerified: user?.emailVerified || false
    });

    const [systemHealth, setSystemHealth] = useState({
        database: { status: 'unknown', responseTime: 0 },
        emailService: { status: 'unknown', deliveryRate: 0 },
        apiResponse: { status: 'unknown', avgResponseTime: 0 },
        uptime: { status: 'unknown', uptime: 0, lastCheck: null }
    });

    // Add historical data state for trend calculations
    const [historicalData, setHistoricalData] = useState({
        systemHealth: {
            database: { status: 'unknown', responseTime: 0 },
            emailService: { status: 'unknown', deliveryRate: 0 },
            apiResponse: { status: 'unknown', avgResponseTime: 0 },
            uptime: { status: 'unknown', uptime: 0 }
        },
        securityStats: {
            securityEvents: 0,
            failedLogins: 0,
            successfulLogins: 0
        },
        lastUpdate: null
    });

    const [chartData, setChartData] = useState({
        securityEvents: [],
        loginSuccessRate: { successful: 0, failed: 0 },
        geographicActivity: [],
        deviceUsage: [],
        systemMetricsTimeline: [],
        performanceMetrics: {
            cpu: [],
            memory: [],
            disk: [],
            network: []
        }
    });

    // Chart refs
    const securityEventsChartRef = useRef(null);
    const loginSuccessChartRef = useRef(null);
    const deviceUsageChartRef = useRef(null);
    const geographicMapRef = useRef(null);
    const systemHealthChartRef = useRef(null);
    const loginSuccessDoughnutChartRef = useRef(null);
    const securityEventsLineChartRef = useRef(null);
    const systemMetricsTimelineChartRef = useRef(null);
    const performanceMetricsChartRef = useRef(null);

    // Chart instances
    const [charts, setCharts] = useState({
        securityEvents: null,
        loginSuccess: null,
        deviceUsage: null,
        systemHealth: null,
        loginSuccessDoughnut: null,
        securityEventsLine: null,
        systemMetricsTimeline: null,
        performanceMetrics: null
    });

    // Get the number of active sessions from user object
    const activeSessionsCount = user?.activeSessions?.length || 0;
    const maxSessions = user?.maxSessions || 5;

    // Add active sessions to historical data for trend calculation
    const [historicalActiveSessions, setHistoricalActiveSessions] = useState(0);

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
                case 'profile-data':
                    setProfileData(update.data);
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
                deviceUsageResponse,
                systemMetricsResponse,
                performanceMetricsResponse
            ] = await Promise.all([
                api.get('/auth/security-events'),
                api.get('/auth/security-status'),
                api.get('/health'),
                api.get('/auth/security-events-chart?days=7'),
                api.get('/auth/login-success-rate?hours=24'),
                api.get('/auth/geographic-activity?hours=24'),
                api.get('/auth/device-usage?hours=24'),
                api.get('/auth/system-metrics-timeline?hours=6'),
                api.get('/auth/performance-metrics?hours=6')
            ]);

            // Update security stats
            if (securityEventsResponse.data.success) {
                setSecurityStats(securityEventsResponse.data.data);

                // Update historical data for trend calculations
                updateHistoricalData({
                    securityStats: securityEventsResponse.data.data
                });
            }

            // Update security status
            if (securityStatusResponse.data.success) {
                setSecurityStatus(prev => ({
                    ...prev,
                    passwordStrength: {
                        status: securityStatusResponse.data.data.passwordStrength.level === 'weak' ? 'weak' :
                            securityStatusResponse.data.data.passwordStrength.level === 'medium' ? 'medium' : 'strong',
                        level: securityStatusResponse.data.data.passwordStrength.level
                    }
                }));
            }

            // Update system health with response time measurement
            if (healthResponse.data) {
                const health = healthResponse.data;
                const newSystemHealth = {
                    ...systemHealth,
                    database: {
                        status: health.database?.status || 'unknown',
                        responseTime: systemHealth.database.responseTime // Keep existing response time
                    },
                    emailService: {
                        status: 'operational',
                        deliveryRate: 98.5
                    },
                    apiResponse: {
                        status: systemHealth.apiResponse.status, // Keep existing status
                        avgResponseTime: systemHealth.apiResponse.avgResponseTime // Keep existing response time
                    },
                    uptime: {
                        status: health.status || 'unknown',
                        uptime: health.uptime || 0,
                        lastCheck: new Date()
                    }
                };

                setSystemHealth(newSystemHealth);

                // Update historical data for trend calculations
                updateHistoricalData({
                    systemHealth: newSystemHealth
                });
            }

            // Update chart data
            if (securityEventsChartResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    securityEvents: securityEventsChartResponse.data.data
                }));
            }

            if (loginSuccessResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    loginSuccessRate: loginSuccessResponse.data.data
                }));
            }

            if (geographicResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    geographicActivity: geographicResponse.data.data
                }));
            }

            if (deviceUsageResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    deviceUsage: deviceUsageResponse.data.data
                }));
            }

            if (systemMetricsResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    systemMetricsTimeline: systemMetricsResponse.data.data
                }));
            }

            if (performanceMetricsResponse.data.success) {
                setChartData(prev => ({
                    ...prev,
                    performanceMetrics: performanceMetricsResponse.data.data
                }));
            }

            setLastFetchTime(new Date());

        } catch (error) {
            // Handle rate limiting specifically
            if (error.response?.status === 429) {
                setRateLimitWarning(true);

                // Clear warning after 30 seconds (longer for rate limiting)
                setTimeout(() => setRateLimitWarning(false), 30000);
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
            debouncedFetchDashboardData();
        } else {
            // When connected to real-time, only fetch data once on mount
            // Real-time updates will handle the rest
            if (!lastFetchTime) {
                debouncedFetchDashboardData();
            }
        }
    }, [isConnected, debouncedFetchDashboardData, lastFetchTime]);

    // Refresh profile data on mount and when returning to dashboard
    useEffect(() => {
        refreshProfileData();

        // Set up periodic email verification status check
        const checkEmailVerificationStatus = async () => {
            if (!authService.isUserAuthenticated()) return;

            try {
                const api = createApiInstance();
                const response = await api.get('/auth/email-verification-status');

                if (response.data.success) {
                    const { emailVerified } = response.data.data;

                    // Update profile data if email verification status changed
                    setProfileData(prev => {
                        if (prev.emailVerified !== emailVerified) {
                            return {
                                ...prev,
                                emailVerified: emailVerified
                            };
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error('Error checking email verification status:', error);
            } finally {
            }
        };

        // Check immediately and then every 30 seconds
        checkEmailVerificationStatus();
        const emailCheckInterval = setInterval(checkEmailVerificationStatus, 30000);

        return () => {
            clearInterval(emailCheckInterval);
        };
    }, []);

    // Measure API response time separately (less frequent)
    useEffect(() => {
        const measureApiResponseTime = async () => {
            if (!authService.isUserAuthenticated()) return;

            try {
                const api = createApiInstance();
                const startTime = Date.now();
                await api.get('/health');
                const responseTime = Date.now() - startTime;

                const newApiResponse = {
                    status: responseTime < 500 ? 'excellent' : responseTime < 1000 ? 'good' : 'slow',
                    avgResponseTime: responseTime,
                    lastCheck: new Date()
                };

                setSystemHealth(prev => ({
                    ...prev,
                    apiResponse: newApiResponse
                }));

                // Update historical data for trend calculations
                updateHistoricalData({
                    systemHealth: {
                        ...systemHealth,
                        apiResponse: newApiResponse
                    }
                });

                // Update timestamp for successful API health checks
                setLastFetchTime(new Date());
            } catch (error) {
            }
        };

        // Measure response time every 5 minutes to reduce rate limiting
        measureApiResponseTime();
        const interval = setInterval(measureApiResponseTime, 300000); // 5 minutes
        return () => clearInterval(interval);
    }, [createApiInstance]);

    // Initialize charts when tab changes or data updates
    useEffect(() => {
        // Add a small delay to ensure DOM elements are rendered
        const timer = setTimeout(() => {
            if (activeTab === 'security' && chartData.securityEvents.length > 0) {
                initializeSecurityCharts();
            }
            if (activeTab === 'analytics' && chartData.deviceUsage.length > 0) {
                initializeAnalyticsCharts();
            }
            if (activeTab === 'overview' && systemHealthChartRef.current) {
                initializeSystemHealthCharts();
            }
            if (activeTab === 'overview' && (chartData.systemMetricsTimeline.length > 0 || chartData.performanceMetrics.cpu.length > 0)) {
                initializeOverviewCharts();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [activeTab, chartData]);

    // Handle map initialization when geographic data changes
    useEffect(() => {
        if ((activeTab === 'security' || activeTab === 'analytics') && chartData.geographicActivity && chartData.geographicActivity.length > 0) {
            // Force map re-render when data changes
            if (geographicMapRef.current) {
                geographicMapRef.current.invalidateSize();
            }
        }
    }, [activeTab, chartData.geographicActivity]);

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
        if (charts.systemHealth && systemHealthChartRef.current) {
            updateSystemHealthChart();
        }
        if (charts.loginSuccessDoughnut && (chartData.loginSuccessRate.successful > 0 || chartData.loginSuccessRate.failed > 0)) {
            updateLoginSuccessDoughnutChart();
        }
        if (charts.securityEventsLine && chartData.securityEvents.length > 0) {
            updateSecurityEventsLineChart();
        }
        if (charts.systemMetricsTimeline && chartData.systemMetricsTimeline.length > 0) {
            updateSystemMetricsTimelineChart();
        }
        if (charts.performanceMetrics &&
            (chartData.performanceMetrics.cpu.length > 0 || chartData.performanceMetrics.memory.length > 0)) {
            updatePerformanceMetricsChart();
        }
    }, [chartData, charts]);

    // Cleanup charts when switching tabs
    useEffect(() => {
        return () => {
            // Destroy charts when component unmounts or tab changes
            if (charts.securityEvents) {
                charts.securityEvents.destroy();
            }
            if (charts.loginSuccess) {
                charts.loginSuccess.destroy();
            }
            if (charts.deviceUsage) {
                charts.deviceUsage.destroy();
            }
            if (charts.systemHealth) {
                charts.systemHealth.destroy();
            }
            if (charts.loginSuccessDoughnut) {
                charts.loginSuccessDoughnut.destroy();
            }
            if (charts.securityEventsLine) {
                charts.securityEventsLine.destroy();
            }
            if (charts.systemMetricsTimeline) {
                charts.systemMetricsTimeline.destroy();
            }
            if (charts.performanceMetrics) {
                charts.performanceMetrics.destroy();
            }
            setCharts({
                securityEvents: null,
                loginSuccess: null,
                deviceUsage: null,
                systemHealth: null,
                loginSuccessDoughnut: null,
                securityEventsLine: null,
                systemMetricsTimeline: null,
                performanceMetrics: null
            });
        };
    }, [activeTab]);

    // Add this after your chartData state declaration
    useEffect(() => {
        if (!chartData.geographicActivity || chartData.geographicActivity.length === 0) {
            setChartData(prev => ({
                ...prev,
                geographicActivity: [
                    { country: 'unknown', logins: 0, percentage: 0 }
                ]
            }));
        }
        if (!chartData.deviceUsage || chartData.deviceUsage.length === 0) {
            setChartData(prev => ({
                ...prev,
                deviceUsage: [
                    { device: 'unknown', percentage: 0 }
                ]
            }));
        }
        if (!chartData.loginSuccessRate || !('successful' in chartData.loginSuccessRate)) {
            setChartData(prev => ({
                ...prev,
                loginSuccessRate: {
                    successful: 0,
                    failed: 0,
                    totalLogins: 0
                }
            }));
        }
        if (!chartData.securityEvents || chartData.securityEvents.length === 0) {
            setChartData(prev => ({
                ...prev,
                securityEvents: [
                    { date: '2025-07-01', events: 0, failedLogins: 0 },
                    { date: '2025-07-02', events: 0, failedLogins: 0 },
                    { date: '2025-07-03', events: 0, failedLogins: 0 },
                    { date: '2025-07-04', events: 0, failedLogins: 0 },
                    { date: '2025-07-05', events: 0, failedLogins: 0 }
                ]
            }));
        }
        if (!chartData.systemMetricsTimeline || chartData.systemMetricsTimeline.length === 0) {
            setChartData(prev => ({
                ...prev,
                systemMetricsTimeline: [
                    { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), databaseResponseTime: 45, apiResponseTime: 120, activeSessions: 3 },
                    { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), databaseResponseTime: 52, apiResponseTime: 135, activeSessions: 4 },
                    { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), databaseResponseTime: 48, apiResponseTime: 128, activeSessions: 2 },
                    { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), databaseResponseTime: 55, apiResponseTime: 142, activeSessions: 5 },
                    { timestamp: new Date(), databaseResponseTime: 50, apiResponseTime: 130, activeSessions: 3 }
                ]
            }));
        }
        if (!chartData.performanceMetrics.cpu || chartData.performanceMetrics.cpu.length === 0) {
            setChartData(prev => ({
                ...prev,
                performanceMetrics: {
                    cpu: [
                        { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), usage: 25 },
                        { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), usage: 30 },
                        { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), usage: 28 },
                        { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), usage: 35 },
                        { timestamp: new Date(), usage: 32 }
                    ],
                    memory: [
                        { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), usage: 45 },
                        { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), usage: 48 },
                        { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), usage: 46 },
                        { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), usage: 52 },
                        { timestamp: new Date(), usage: 50 }
                    ],
                    disk: [
                        { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), usage: 65 },
                        { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), usage: 67 },
                        { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), usage: 66 },
                        { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), usage: 68 },
                        { timestamp: new Date(), usage: 67 }
                    ],
                    network: [
                        { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), throughput: 2.5 },
                        { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), throughput: 3.2 },
                        { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), throughput: 2.8 },
                        { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), throughput: 3.5 },
                        { timestamp: new Date(), throughput: 3.1 }
                    ]
                }
            }));
        }
    }, [chartData.geographicActivity, chartData.deviceUsage, chartData.loginSuccessRate, chartData.securityEvents, chartData.systemMetricsTimeline, chartData.performanceMetrics]);

    const initializeSecurityCharts = () => {
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
                            '#ffb6c1', // Pink
                            '#ffe599'  // Yellow
                        ],
                        borderColor: [
                            '#ffb6c1', // Pink
                            '#ffe599'  // Yellow
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

        // Login Success vs Failed Logins Doughnut Chart
        if (loginSuccessDoughnutChartRef.current && !charts.loginSuccessDoughnut && (chartData.loginSuccessRate.successful > 0 || chartData.loginSuccessRate.failed > 0)) {
            const ctx = loginSuccessDoughnutChartRef.current.getContext('2d');
            const loginSuccessDoughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Successful Logins', 'Failed Logins'],
                    datasets: [{
                        data: [chartData.loginSuccessRate.successful, chartData.loginSuccessRate.failed],
                        backgroundColor: [
                            'rgba(34, 197, 94, 0.8)', // Green for successful
                            'rgba(239, 68, 68, 0.8)'   // Red for failed
                        ],
                        borderColor: [
                            'rgba(34, 197, 94, 1)',
                            'rgba(239, 68, 68, 1)'
                        ],
                        borderWidth: 2,
                        cutout: '60%'
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
                                padding: 20,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
            setCharts(prev => ({ ...prev, loginSuccessDoughnut: loginSuccessDoughnutChart }));
        }

        // Security Events vs Failed Logins Line Chart
        if (securityEventsLineChartRef.current && !charts.securityEventsLine && chartData.securityEvents.length > 0) {
            const ctx = securityEventsLineChartRef.current.getContext('2d');
            const securityEventsLineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.securityEvents.map(item => {
                        return moment(item.date).tz(userTimezone).format('MMM D');
                    }),
                    datasets: [
                        {
                            label: 'Security Events',
                            data: chartData.securityEvents.map(item => item.events),
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6
                        },
                        {
                            label: 'Failed Logins',
                            data: chartData.securityEvents.map(item => item.failedLogins),
                            borderColor: 'rgba(239, 68, 68, 1)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6
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
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
            setCharts(prev => ({ ...prev, securityEventsLine: securityEventsLineChart }));
        }
    };

    const initializeAnalyticsCharts = () => {
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

    const initializeSystemHealthCharts = () => {
        // System Health Gauge Chart
        if (systemHealthChartRef.current && !charts.systemHealth) {
            const ctx = systemHealthChartRef.current.getContext('2d');

            // Calculate overall health score (0-100)
            const getHealthScore = () => {
                let score = 0;
                let totalMetrics = 0;

                // Database health (0-25 points)
                if (systemHealth.database.status === 'operational') score += 25;
                else if (systemHealth.database.status === 'ok') score += 20;
                else if (systemHealth.database.status === 'degraded') score += 10;
                totalMetrics++;

                // Email service health (0-25 points)
                if (systemHealth.emailService.status === 'operational') score += 25;
                else if (systemHealth.emailService.status === 'ok') score += 20;
                else if (systemHealth.emailService.status === 'degraded') score += 10;
                totalMetrics++;

                // API response health (0-25 points)
                if (systemHealth.apiResponse.status === 'excellent') score += 25;
                else if (systemHealth.apiResponse.status === 'good') score += 20;
                else if (systemHealth.apiResponse.status === 'slow') score += 10;
                totalMetrics++;

                // Uptime health (0-25 points)
                if (systemHealth.uptime.status === 'ok') score += 25;
                else if (systemHealth.uptime.status === 'degraded') score += 15;
                totalMetrics++;

                return Math.round(score);
            };

            const healthScore = getHealthScore();

            const systemHealthChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Health Score', 'Remaining'],
                    datasets: [{
                        data: [healthScore, 100 - healthScore],
                        backgroundColor: [
                            healthScore >= 80 ? 'rgba(16, 185, 129, 0.8)' :
                                healthScore >= 60 ? 'rgba(245, 158, 11, 0.8)' :
                                    'rgba(239, 68, 68, 0.8)',
                            'rgba(229, 231, 235, 0.3)'
                        ],
                        borderColor: [
                            healthScore >= 80 ? 'rgba(16, 185, 129, 1)' :
                                healthScore >= 60 ? 'rgba(245, 158, 11, 1)' :
                                    'rgba(239, 68, 68, 1)',
                            'rgba(229, 231, 235, 0.5)'
                        ],
                        borderWidth: 2,
                        cutout: '70%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    },
                    elements: {
                        arc: {
                            borderWidth: 0
                        }
                    }
                }
            });

            setCharts(prev => ({ ...prev, systemHealth: systemHealthChart }));
        }
    };

    const initializeOverviewCharts = () => {
        // System Metrics Timeline Chart
        if (systemMetricsTimelineChartRef.current && !charts.systemMetricsTimeline && chartData.systemMetricsTimeline.length > 0) {
            const ctx = systemMetricsTimelineChartRef.current.getContext('2d');
            const systemMetricsTimelineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.systemMetricsTimeline.map(item => {
                        return moment(item.timestamp).tz(userTimezone).format('HH:mm');
                    }),
                    datasets: [
                        {
                            label: 'Database Response Time (ms)',
                            data: chartData.systemMetricsTimeline.map(item => item.databaseResponseTime),
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 3,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'API Response Time (ms)',
                            data: chartData.systemMetricsTimeline.map(item => item.apiResponseTime),
                            borderColor: 'rgba(16, 185, 129, 1)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 3,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Active Sessions',
                            data: chartData.systemMetricsTimeline.map(item => item.activeSessions),
                            borderColor: 'rgba(245, 158, 11, 1)',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 3,
                            pointHoverRadius: 6,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y;
                                        if (label.includes('Response Time')) {
                                            label += ' ms';
                                        }
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Time'
                            },
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Response Time (ms)'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Active Sessions'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            });
            setCharts(prev => ({ ...prev, systemMetricsTimeline: systemMetricsTimelineChart }));
        }

        // Performance Metrics Chart
        if (performanceMetricsChartRef.current && !charts.performanceMetrics &&
            (chartData.performanceMetrics.cpu.length > 0 || chartData.performanceMetrics.memory.length > 0)) {
            const ctx = performanceMetricsChartRef.current.getContext('2d');
            const performanceMetricsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.performanceMetrics.cpu.map(item => {
                        return moment(item.timestamp).tz(userTimezone).format('HH:mm');
                    }),
                    datasets: [
                        {
                            label: 'CPU Usage (%)',
                            data: chartData.performanceMetrics.cpu.map(item => item.usage),
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Memory Usage (%)',
                            data: chartData.performanceMetrics.memory.map(item => item.usage),
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Disk Usage (%)',
                            data: chartData.performanceMetrics.disk.map(item => item.usage),
                            backgroundColor: 'rgba(16, 185, 129, 0.8)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Network (MB/s)',
                            data: chartData.performanceMetrics.network.map(item => item.throughput),
                            backgroundColor: 'rgba(245, 158, 11, 0.8)',
                            borderColor: 'rgba(245, 158, 11, 1)',
                            borderWidth: 1,
                            yAxisID: 'y1'
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
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y;
                                        if (label.includes('Usage')) {
                                            label += '%';
                                        } else if (label.includes('Network')) {
                                            label += ' MB/s';
                                        }
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Time'
                            },
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Usage (%)'
                            },
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Network (MB/s)'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            });
            setCharts(prev => ({ ...prev, performanceMetrics: performanceMetricsChart }));
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
        } else if (activeTab === 'security') {
            // If chart doesn't exist and we're on security tab, initialize
            initializeSecurityCharts();
        }
    };

    const updateLoginSuccessChart = () => {
        if (charts.loginSuccess && (chartData.loginSuccessRate.successful > 0 || chartData.loginSuccessRate.failed > 0)) {
            // Update chart data directly
            charts.loginSuccess.data.datasets[0].data = [chartData.loginSuccessRate.successful, chartData.loginSuccessRate.failed];
            charts.loginSuccess.update();
        } else if (activeTab === 'security') {
            // If chart doesn't exist and we're on security tab, initialize
            initializeSecurityCharts();
        }
    };

    const updateDeviceUsageChart = () => {
        if (charts.deviceUsage && chartData.deviceUsage.length > 0) {
            // Update chart data directly
            charts.deviceUsage.data.labels = chartData.deviceUsage.map(item => item.device);
            charts.deviceUsage.data.datasets[0].data = chartData.deviceUsage.map(item => item.percentage);
            charts.deviceUsage.update();
        } else if (activeTab === 'analytics') {
            // If chart doesn't exist and we're on analytics tab, initialize
            initializeAnalyticsCharts();
        }
    };

    const updateLoginSuccessDoughnutChart = () => {
        if (charts.loginSuccessDoughnut && (chartData.loginSuccessRate.successful > 0 || chartData.loginSuccessRate.failed > 0)) {
            // Update chart data directly
            charts.loginSuccessDoughnut.data.datasets[0].data = [chartData.loginSuccessRate.successful, chartData.loginSuccessRate.failed];
            charts.loginSuccessDoughnut.update();
        } else if (activeTab === 'security') {
            // If chart doesn't exist and we're on security tab, initialize
            initializeSecurityCharts();
        }
    };

    const updateSecurityEventsLineChart = () => {
        if (charts.securityEventsLine && chartData.securityEvents.length > 0) {
            // Update chart data directly
            charts.securityEventsLine.data.labels = chartData.securityEvents.map(item => {
                return moment(item.date).tz(userTimezone).format('MMM D');
            });
            charts.securityEventsLine.data.datasets[0].data = chartData.securityEvents.map(item => item.events);
            charts.securityEventsLine.data.datasets[1].data = chartData.securityEvents.map(item => item.failedLogins);
            charts.securityEventsLine.update();
        } else if (activeTab === 'security') {
            // If chart doesn't exist and we're on security tab, initialize
            initializeSecurityCharts();
        }
    };

    const updateSystemHealthChart = () => {
        if (charts.systemHealth && systemHealthChartRef.current) {
            const ctx = systemHealthChartRef.current.getContext('2d');

            // Calculate overall health score (0-100)
            const getHealthScore = () => {
                let score = 0;
                let totalMetrics = 0;

                // Database health (0-25 points)
                if (systemHealth.database.status === 'operational') score += 25;
                else if (systemHealth.database.status === 'ok') score += 20;
                else if (systemHealth.database.status === 'degraded') score += 10;
                totalMetrics++;

                // Email service health (0-25 points)
                if (systemHealth.emailService.status === 'operational') score += 25;
                else if (systemHealth.emailService.status === 'ok') score += 20;
                else if (systemHealth.emailService.status === 'degraded') score += 10;
                totalMetrics++;

                // API response health (0-25 points)
                if (systemHealth.apiResponse.status === 'excellent') score += 25;
                else if (systemHealth.apiResponse.status === 'good') score += 20;
                else if (systemHealth.apiResponse.status === 'slow') score += 10;
                totalMetrics++;

                // Uptime health (0-25 points)
                if (systemHealth.uptime.status === 'ok') score += 25;
                else if (systemHealth.uptime.status === 'degraded') score += 15;
                totalMetrics++;

                return Math.round(score);
            };

            const healthScore = getHealthScore();

            charts.systemHealth.data.datasets[0].data = [healthScore, 100 - healthScore];
            charts.systemHealth.update();
        }
    };

    const updateSystemMetricsTimelineChart = () => {
        if (charts.systemMetricsTimeline && chartData.systemMetricsTimeline.length > 0) {
            // Update chart data directly
            charts.systemMetricsTimeline.data.labels = chartData.systemMetricsTimeline.map(item => {
                return moment(item.timestamp).tz(userTimezone).format('HH:mm');
            });
            charts.systemMetricsTimeline.data.datasets[0].data = chartData.systemMetricsTimeline.map(item => item.databaseResponseTime);
            charts.systemMetricsTimeline.data.datasets[1].data = chartData.systemMetricsTimeline.map(item => item.apiResponseTime);
            charts.systemMetricsTimeline.data.datasets[2].data = chartData.systemMetricsTimeline.map(item => item.activeSessions);
            charts.systemMetricsTimeline.update();
        } else if (activeTab === 'overview') {
            // If chart doesn't exist and we're on overview tab, initialize
            initializeOverviewCharts();
        }
    };

    const updatePerformanceMetricsChart = () => {
        if (charts.performanceMetrics &&
            (chartData.performanceMetrics.cpu.length > 0 || chartData.performanceMetrics.memory.length > 0)) {
            // Update chart data directly
            charts.performanceMetrics.data.labels = chartData.performanceMetrics.cpu.map(item => {
                return moment(item.timestamp).tz(userTimezone).format('HH:mm');
            });
            charts.performanceMetrics.data.datasets[0].data = chartData.performanceMetrics.cpu.map(item => item.usage);
            charts.performanceMetrics.data.datasets[1].data = chartData.performanceMetrics.memory.map(item => item.usage);
            charts.performanceMetrics.data.datasets[2].data = chartData.performanceMetrics.disk.map(item => item.usage);
            charts.performanceMetrics.data.datasets[3].data = chartData.performanceMetrics.network.map(item => item.throughput);
            charts.performanceMetrics.update();
        } else if (activeTab === 'overview') {
            // If chart doesn't exist and we're on overview tab, initialize
            initializeOverviewCharts();
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

    // Trend calculation functions
    const calculateTrend = (currentValue, previousValue, isPercentage = false) => {
        if (previousValue === 0 || previousValue === null || currentValue === null) {
            return { direction: 'neutral', percentage: 0, arrow: '→' };
        }

        const change = currentValue - previousValue;
        const percentageChange = (change / previousValue) * 100;

        let direction = 'neutral';
        let arrow = '→';

        if (percentageChange > 0) {
            direction = 'up';
            arrow = '▲';
        } else if (percentageChange < 0) {
            direction = 'down';
            arrow = '▼';
        }

        // Debug logging
        console.log(`Trend calculation: current=${currentValue}, previous=${previousValue}, change=${change}, percentage=${percentageChange.toFixed(2)}%`);

        return {
            direction,
            percentage: Math.abs(percentageChange),
            arrow,
            change
        };
    };

    const getTrendDisplay = (metric, currentData, historicalData) => {
        let currentValue, previousValue;

        switch (metric) {
            case 'database':
                currentValue = currentData.database.responseTime || 0;
                previousValue = historicalData.database.responseTime || 0;
                break;
            case 'emailService':
                currentValue = currentData.emailService.deliveryRate || 0;
                previousValue = historicalData.emailService.deliveryRate || 0;
                break;
            case 'apiResponse':
                currentValue = currentData.apiResponse.avgResponseTime || 0;
                previousValue = historicalData.apiResponse.avgResponseTime || 0;
                break;
            case 'uptime':
                currentValue = currentData.uptime.uptime || 0;
                previousValue = historicalData.uptime.uptime || 0;
                break;
            case 'securityEvents':
                currentValue = currentData.securityEvents || 0;
                previousValue = historicalData.securityEvents || 0;
                break;
            case 'failedLogins':
                currentValue = currentData.failedLogins || 0;
                previousValue = historicalData.failedLogins || 0;
                break;
            case 'successfulLogins':
                currentValue = currentData.successfulLogins || 0;
                previousValue = historicalData.successfulLogins || 0;
                break;
            case 'activeSessions':
                currentValue = currentData.activeSessions || 0;
                previousValue = historicalData.activeSessions || 0;
                break;
            default:
                return { direction: 'neutral', percentage: 0, arrow: '→' };
        }

        return calculateTrend(currentValue, previousValue);
    };

    const updateHistoricalData = (newData) => {
        setHistoricalData(prev => ({
            systemHealth: prev.systemHealth,
            securityStats: prev.securityStats,
            lastUpdate: new Date()
        }));

        // Store current data as historical after a delay
        setTimeout(() => {
            const updatedHistoricalData = {
                systemHealth: newData.systemHealth || historicalData.systemHealth,
                securityStats: newData.securityStats || historicalData.securityStats,
                lastUpdate: new Date()
            };

            setHistoricalData(updatedHistoricalData);

            // Update active sessions historical data
            setHistoricalActiveSessions(activeSessionsCount);

            // Persist to localStorage
            try {
                localStorage.setItem('dashboardHistoricalData', JSON.stringify(updatedHistoricalData));
                localStorage.setItem('dashboardHistoricalActiveSessions', JSON.stringify(activeSessionsCount));
            } catch (error) {
                console.warn('Failed to save historical data to localStorage:', error);
            }
        }, 5000); // Store as historical after 5 seconds
    };

    // Load historical data from localStorage on mount
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('dashboardHistoricalData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                // Only use saved data if it's less than 1 hour old
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                if (parsedData.lastUpdate && new Date(parsedData.lastUpdate) > oneHourAgo) {
                    setHistoricalData(parsedData);
                }
            }

            // Load historical active sessions data
            const savedActiveSessions = localStorage.getItem('dashboardHistoricalActiveSessions');
            if (savedActiveSessions) {
                const parsedActiveSessions = JSON.parse(savedActiveSessions);
                setHistoricalActiveSessions(parsedActiveSessions);
            }
        } catch (error) {
            console.warn('Failed to load historical data from localStorage:', error);
        }
    }, []);

    // Manage body class for rate limit warning
    useEffect(() => {
        if (rateLimitWarning) {
            document.body.classList.add('has-rate-limit-warning');
        } else {
            document.body.classList.remove('has-rate-limit-warning');
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('has-rate-limit-warning');
        };
    }, [rateLimitWarning]);

    // Test function to simulate data changes (for development only)
    const testTrendCalculation = () => {
        console.log('Testing trend calculations...');

        // Simulate some test data
        const testCurrentData = {
            systemHealth: {
                database: { responseTime: 150 },
                emailService: { deliveryRate: 99.2 },
                apiResponse: { avgResponseTime: 450 },
                uptime: { uptime: 86400 }
            },
            securityStats: {
                securityEvents: 12,
                failedLogins: 3,
                successfulLogins: 45
            }
        };

        const testHistoricalData = {
            systemHealth: {
                database: { responseTime: 120 },
                emailService: { deliveryRate: 98.8 },
                apiResponse: { avgResponseTime: 520 },
                uptime: { uptime: 82800 }
            },
            securityStats: {
                securityEvents: 8,
                failedLogins: 5,
                successfulLogins: 42
            }
        };

        // Test each metric
        const metrics = ['database', 'emailService', 'apiResponse', 'uptime', 'securityEvents', 'failedLogins', 'successfulLogins'];
        metrics.forEach(metric => {
            const trend = getTrendDisplay(metric, testCurrentData, testHistoricalData);
            console.log(`${metric}: ${trend.arrow} ${trend.percentage.toFixed(1)}% (${trend.direction})`);
        });
    };

    // Uncomment the next line to test trend calculations in development
    // useEffect(() => { testTrendCalculation(); }, []);

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
                // Redirect to profile page with edit mode flag
                window.location.href = '/profile';
                break;
            case 'change-password':
                setShowChangePassword(true);
                break;
            case 'toggle-2fa':
                setTwoFactorMode(profileData.twoFactorEnabled ? 'disable' : 'enable');
                setShowTwoFactorModal(true);
                break;
            case 'verify-email':
                handleEmailVerification();
                break;
            default:
                break;
        }
    };

    // Refresh profile data from server
    const refreshProfileData = async () => {
        try {
            const api = createApiInstance();

            // Fetch profile and security status in parallel
            const [profileResult, securityStatusResult] = await Promise.all([
                authService.getProfile(),
                api.get('/auth/security-status')
            ]);

            if (profileResult.success) {
                setProfileData({
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
                    phoneVerified: profileResult.user.phoneVerified || false
                });

                // Update active sessions trend when profile data is refreshed
                const newActiveSessionsCount = profileResult.user?.activeSessions?.length || 0;
                if (newActiveSessionsCount !== activeSessionsCount) {
                    // Store current count as historical for trend calculation
                    setHistoricalActiveSessions(activeSessionsCount);
                    localStorage.setItem('dashboardHistoricalActiveSessions', JSON.stringify(activeSessionsCount));
                }
            }

            // Update security status including password strength
            if (securityStatusResult.data.success) {
                setSecurityStatus(prev => ({
                    ...prev,
                    passwordStrength: {
                        status: securityStatusResult.data.data.passwordStrength.level === 'weak' ? 'weak' :
                            securityStatusResult.data.data.passwordStrength.level === 'medium' ? 'medium' : 'strong',
                        level: securityStatusResult.data.data.passwordStrength.level
                    }
                }));
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
                showSuccessToast('Verification Email Sent!', 'Check your email inbox (and spam/junk folder if not found).');

                // Check email verification status after a short delay to see if it was already verified
                setTimeout(async () => {
                    try {
                        const statusResponse = await api.get('/auth/email-verification-status');
                        if (statusResponse.data.success) {
                            const { emailVerified } = statusResponse.data.data;
                            setProfileData(prev => ({
                                ...prev,
                                emailVerified: emailVerified
                            }));
                        }
                    } catch (error) {
                        console.error('Error checking email verification status:', error);
                    }
                }, 2000); // Check after 2 seconds
            } else {
                showErrorToast('Failed to Send Email', 'Failed to send verification email. Please try again.');
            }
        } catch (error) {
            console.error('Email verification error:', error);
            showErrorToast('Failed to Send Email', 'Failed to send verification email. Please try again.');
        }
    };

    return (
        <main className="main-content">
            {/* Dashboard Navigation Bar */}
            <nav className="dashboard-nav">
                <div className="dashboard-nav-tabs">
                    <a
                        href="#"
                        className={`dashboard-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={e => {
                            e.preventDefault();
                            setActiveTab('overview');
                        }}
                    >
                        Overview
                    </a>
                    <a
                        href="#"
                        className={`dashboard-nav-tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={e => {
                            e.preventDefault();
                            setActiveTab('security');
                        }}
                    >
                        Security
                    </a>
                    <a
                        href="#"
                        className={`dashboard-nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={e => {
                            e.preventDefault();
                            setActiveTab('analytics');
                        }}
                    >
                        Analytics
                    </a>
                    <a
                        href="#"
                        className={`dashboard-nav-tab ${activeTab === 'more' ? 'active' : ''}`}
                        onClick={e => {
                            e.preventDefault();
                            setActiveTab('more');
                        }}
                    >
                        More
                    </a>
                </div>
                <div className="dashboard-nav-actions">
                    <button type="button" className="dashboard-nav-btn" onClick={() => alert('Share clicked')}>
                        <FiShare /> Share
                    </button>
                    <button type="button" className="dashboard-nav-btn" onClick={() => alert('Print clicked')}>
                        <FiPrinter /> Print
                    </button>
                    <button type="button" className="dashboard-nav-btn" onClick={() => alert('Export clicked')}>
                        <FiDownload /> Export
                    </button>
                </div>
            </nav>

            {/* System Health Stat Summary Row */}
            <section className="system-health-summary-row styled-summary-row">
                <div className="system-health-summary-item styled-summary-item">
                    <div className="summary-label">Real-time Status</div>
                    <div className="summary-value">
                        <span className={`status-dot ${getStatusClass(isConnected ? 'connected' : 'disconnected')}`}></span>
                        {isConnected ? 'connected' : 'disconnected'}
                    </div>
                    {lastFetchTime && (
                        <span className='summary-sub-label'>
                            {formatDate(lastFetchTime)}
                        </span>
                    )}
                    <div className={`summary-trend ${isConnected ? 'trend-up' : 'trend-down'}`}></div>
                </div>
                <div className="system-health-summary-item styled-summary-item">
                    <div className="summary-label">Database</div>
                    <div className="summary-value">{systemHealth.database.status}</div>
                    {(() => {
                        const trend = getTrendDisplay('database', systemHealth, historicalData.systemHealth);
                        return trend.percentage > 0 ? (
                            <div className={`summary-trend ${trend.direction === 'up' ? 'trend-up' : trend.direction === 'down' ? 'trend-down' : 'trend-neutral'}`}>
                                <span className="trend-arrow">{trend.arrow}</span> {trend.percentage.toFixed(1)}%
                            </div>
                        ) : null;
                    })()}
                </div>
                <div className="system-health-summary-item styled-summary-item">
                    <div className="summary-label">Email Service</div>
                    <div className="summary-value">{systemHealth.emailService.deliveryRate}%</div>
                    {(() => {
                        const trend = getTrendDisplay('emailService', systemHealth, historicalData.systemHealth);
                        return trend.percentage > 0 ? (
                            <div className={`summary-trend ${trend.direction === 'up' ? 'trend-up' : trend.direction === 'down' ? 'trend-down' : 'trend-neutral'}`}>
                                <span className="trend-arrow">{trend.arrow}</span> {trend.percentage.toFixed(1)}%
                            </div>
                        ) : null;
                    })()}
                </div>
                <div className="system-health-summary-item styled-summary-item">
                    <div className="summary-label">API Response</div>
                    <div className="summary-value">{systemHealth.apiResponse.avgResponseTime}ms</div>
                    {(() => {
                        const trend = getTrendDisplay('apiResponse', systemHealth, historicalData.systemHealth);
                        return trend.percentage > 0 ? (
                            <div className={`summary-trend ${trend.direction === 'up' ? 'trend-up' : trend.direction === 'down' ? 'trend-down' : 'trend-neutral'}`}>
                                <span className="trend-arrow">{trend.arrow}</span> {trend.percentage.toFixed(1)}%
                            </div>
                        ) : null;
                    })()}
                </div>
                <div className="system-health-summary-item styled-summary-item">
                    <div className="summary-label">Uptime</div>
                    <div className="summary-value">{formatUptime(systemHealth.uptime.uptime)}</div>
                    {(() => {
                        const trend = getTrendDisplay('uptime', systemHealth, historicalData.systemHealth);
                        return trend.percentage > 0 ? (
                            <div className={`summary-trend ${trend.direction === 'up' ? 'trend-up' : trend.direction === 'down' ? 'trend-down' : 'trend-neutral'}`}>
                                <span className="trend-arrow">{trend.arrow}</span> {trend.percentage.toFixed(1)}%
                            </div>
                        ) : null;
                    })()}
                </div>
                <div className="system-health-summary-item styled-summary-item">
                    <div className="summary-label">Active Sessions</div>
                    <div className="summary-value">
                        <span className={`status-dot ${getStatusClass(activeSessionsCount > 0 ? 'connected' : 'disconnected')}`}></span>
                        {activeSessionsCount}/{maxSessions}
                    </div>
                    {(() => {
                        const trend = getTrendDisplay('activeSessions',
                            { activeSessions: activeSessionsCount },
                            { activeSessions: historicalActiveSessions }
                        );
                        return trend.percentage > 0 ? (
                            <div className={`summary-trend ${trend.direction === 'up' ? 'trend-up' : trend.direction === 'down' ? 'trend-down' : 'trend-neutral'}`}>
                                <span className="trend-arrow">{trend.arrow}</span> {trend.percentage.toFixed(1)}%
                            </div>
                        ) : null;
                    })()}
                </div>
            </section>

            {/* Rate Limit Warning */}
            {rateLimitWarning && (
                <div className="rate-limit-warning">
                    <div className="warning-content">
                        <span className="warning-text">
                            Too many requests from this IP. Please wait a few minutes before refreshing. API calls have been reduced to prevent further rate limiting.
                        </span>
                    </div>
                    <button
                        className="close-warning-btn"
                        onClick={() => setRateLimitWarning(false)}
                        title="Close warning"
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {/* Dashboard Content */}
            {activeTab === 'overview' && (
                <section className="dashboard__grid">
                    {/* Performance Metrics Chart - Wide */}
                    <div className="dashboard__card dashboard__card--chart performance-metrics" style={{ gridColumn: '1 / 4' }}>
                        <div className="dashboard__card-header">
                            <h3 className="dashboard__card-title">Performance Metrics</h3>
                        </div>
                        <div className="dashboard__card-content">
                            <div className="chart-container" style={{ height: '300px' }}>
                                <canvas ref={performanceMetricsChartRef}></canvas>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard__card dashboard__card--todo" style={{ gridColumn: '4 / 5' }}>
                        <TodoList />
                    </div>


                </section>
            )}

            {activeTab === 'security' && (
                <section className="dashboard__grid">
                    {/* Security Status Card */}
                    <div className="dashboard__card dashboard__card--security" style={{ gridColumn: '1 / 3' }}>
                        <div className="dashboard__card-header">
                            <h3 className="dashboard__card-title">Security Status</h3>
                        </div>
                        <div className="dashboard__card-content">
                            <div className="security-status-grid">
                                {/* Password Status */}
                                <div className="security-status-item">
                                    <div className="security-status-header">
                                        <span className="security-status-label">Password</span>
                                        <span className={`security-status-badge ${securityStatus.passwordStrength.status === 'strong' ? 'status-success' : securityStatus.passwordStrength.status === 'medium' ? 'status-warning' : 'status-error'}`}>
                                            {securityStatus.passwordStrength.status}
                                        </span>
                                    </div>
                                    <button
                                        className="security-action-btn"
                                        onClick={() => handleQuickAction('change-password')}
                                    >
                                        Change Password
                                    </button>
                                </div>

                                {/* Email Verification Status */}
                                <div className="security-status-item">
                                    <div className="security-status-header">
                                        <span className="security-status-label">Email Verification</span>
                                        <span className={`security-status-badge ${profileData.emailVerified ? 'status-success' : 'status-error'}`}>
                                            {profileData.emailVerified ? 'Verified' : 'Not Verified'}
                                        </span>
                                    </div>
                                    {!profileData.emailVerified && (
                                        <button
                                            className="security-action-btn"
                                            onClick={() => handleQuickAction('verify-email')}
                                        >
                                            Verify Email
                                        </button>
                                    )}
                                </div>

                                {/* Two-Factor Authentication Status */}
                                <div className="security-status-item">
                                    <div className="security-status-header">
                                        <span className="security-status-label">Two-Factor Auth</span>
                                        <span className={`security-status-badge ${profileData.twoFactorEnabled ? 'status-success' : 'status-error'}`}>
                                            {profileData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <button
                                        className="security-action-btn"
                                        onClick={() => handleQuickAction('toggle-2fa')}
                                    >
                                        {profileData.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                    </button>
                                </div>

                                {/* Account Security Status */}
                                <div className="security-status-item">
                                    <div className="security-status-header">
                                        <span className="security-status-label">Account Security</span>
                                        <span className={`security-status-badge ${profileData.emailVerified && profileData.twoFactorEnabled && securityStatus.passwordStrength.status === 'strong' ? 'status-success' : 'status-warning'}`}>
                                            {profileData.emailVerified && profileData.twoFactorEnabled && securityStatus.passwordStrength.status === 'strong' ? 'Secure' : 'Needs Attention'}
                                        </span>
                                    </div>
                                    <div className="security-score">
                                        <div className="security-score-bar">
                                            <div
                                                className="security-score-fill"
                                                style={{
                                                    width: `${(() => {
                                                        let score = 0;
                                                        if (profileData.emailVerified) score += 33;
                                                        if (profileData.twoFactorEnabled) score += 33;
                                                        if (securityStatus.passwordStrength.status === 'strong') score += 34;
                                                        return score;
                                                    })()}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="security-score-text">
                                            {(() => {
                                                let score = 0;
                                                if (profileData.emailVerified) score += 33;
                                                if (profileData.twoFactorEnabled) score += 33;
                                                if (securityStatus.passwordStrength.status === 'strong') score += 34;
                                                return `${score}%`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Login Success vs Failed Doughnut Chart */}
                    <div className="dashboard__card dashboard__card--chart" style={{ gridColumn: '3 / 4' }}>
                        <div className="dashboard__card-header">
                            <h3 className="dashboard__card-title">Login Success Rate</h3>
                        </div>
                        <div className="dashboard__card-content">
                            <div className="chart-container" style={{ height: '300px' }}>
                                <canvas ref={loginSuccessDoughnutChartRef}></canvas>
                            </div>
                        </div>
                    </div>

                    {/* Security Events vs Failed Logins Line Chart */}
                    <div className="dashboard__card dashboard__card--chart" style={{ gridColumn: '4 / 5' }}>
                        <div className="dashboard__card-header">
                            <h3 className="dashboard__card-title">Security Events Timeline</h3>
                        </div>
                        <div className="dashboard__card-content">
                            <div className="chart-container" style={{ height: '300px' }}>
                                <canvas ref={securityEventsLineChartRef}></canvas>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'analytics' && (
                <section className="dashboard__grid">
                    {/* Geographic Activity Map */}
                    <div className="dashboard__card dashboard__card--chart">
                        <div className="dashboard__card-header">
                            <h3 className="dashboard__card-title">Geographic Activity</h3>
                        </div>
                        <div className="dashboard__card-content">
                            <div className="map-container" style={{ height: '400px' }}>
                                <MapContainer
                                    center={[20, 0]}
                                    zoom={2}
                                    style={{ height: '100%', width: '100%' }}
                                    ref={geographicMapRef}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    {chartData.geographicActivity && chartData.geographicActivity.map((location, index) => {
                                        const coords = getCountryCoordinates(location.country);
                                        return (
                                            <CircleMarker
                                                key={index}
                                                center={[coords.lat, coords.lng]}
                                                radius={Math.max(5, Math.min(20, location.logins * 2))}
                                                fillColor={location.logins > 10 ? '#ef4444' : location.logins > 5 ? '#f59e0b' : '#10b981'}
                                                color={location.logins > 10 ? '#dc2626' : location.logins > 5 ? '#d97706' : '#059669'}
                                                weight={2}
                                                opacity={0.8}
                                                fillOpacity={0.6}
                                            >
                                                <Popup>
                                                    <div className="map-popup">
                                                        <h4>{location.country}</h4>
                                                        <p><strong>Logins:</strong> {location.logins}</p>
                                                        <p><strong>Percentage:</strong> {location.percentage}%</p>
                                                    </div>
                                                </Popup>
                                            </CircleMarker>
                                        );
                                    })}
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    {/* Device Usage Chart */}
                    <div className="dashboard__card dashboard__card--chart">
                        <div className="dashboard__card-header">
                            <h3 className="dashboard__card-title">Device Usage</h3>
                        </div>
                        <div className="dashboard__card-content">
                            <div className="chart-container" style={{ height: '300px' }}>
                                <canvas ref={deviceUsageChartRef}></canvas>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'more' && (
                <section className="dashboard__grid">

                </section>
            )}

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
                onSuccess={() => {
                    setShowChangePassword(false);
                    // Refresh profile data after password change
                    refreshProfileData();
                }}
            />

            {/* Two-Factor Authentication Modal */}
            <TwoFactorModal
                isOpen={showTwoFactorModal}
                onClose={() => setShowTwoFactorModal(false)}
                onSuccess={() => {
                    setShowTwoFactorModal(false);
                    // Refresh profile data after 2FA change
                    refreshProfileData();
                }}
                mode={twoFactorMode}
            />
        </main>
    );
};

export default Dashboard; 