const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateInput, sanitizeInput } = require('../middleware/validation');
const emailService = require('../services/emailService');
const geolocationService = require('../services/geolocationService');
const securityConfig = require('../config/security');
const passwordStrengthAnalyzer = require('../utils/passwordStrength');
const { uploadProfilePicture, handleUploadError, deleteOldProfilePicture, getProfilePictureUrl } = require('../middleware/upload');
const moment = require('moment-timezone');

const router = express.Router();

// In-memory store for rate limiting (in production, use Redis)
const loginAttempts = new Map();
const blockedIPs = new Map();

// Helper functions for real-time data (copied from index.js)
async function getSecurityStats(user) {
    // Get security events from last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const securityEvents = await AuditLog.countDocuments({
        userId: user._id,
        eventType: { $in: ['login_failed', 'suspicious_activity', 'security_alert'] },
        timestamp: { $gte: last24Hours }
    });

    const failedLogins = await AuditLog.countDocuments({
        userId: user._id,
        eventType: 'login_failed',
        timestamp: { $gte: last24Hours }
    });

    const successfulLogins = await AuditLog.countDocuments({
        userId: user._id,
        eventType: 'login_success',
        timestamp: { $gte: last24Hours }
    });

    return {
        securityEvents,
        failedLogins,
        successfulLogins,
        period: '24 hours'
    };
}

async function getChartData(user) {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Security events over time
    const securityEvents = await AuditLog.aggregate([
        {
            $match: {
                userId: user._id,
                eventType: { $in: ['login_failed', 'suspicious_activity', 'security_alert'] },
                timestamp: { $gte: last7Days }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                events: { $sum: 1 },
                failedLogins: {
                    $sum: { $cond: [{ $eq: ["$eventType", "login_failed"] }, 1, 0] }
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Login success rate
    const loginStats = await AuditLog.aggregate([
        {
            $match: {
                userId: user._id,
                eventType: { $in: ['login_success', 'login_failed'] },
                timestamp: { $gte: last24Hours }
            }
        },
        {
            $group: {
                _id: "$eventType",
                count: { $sum: 1 }
            }
        }
    ]);

    const successful = loginStats.find(stat => stat._id === 'login_success')?.count || 0;
    const failed = loginStats.find(stat => stat._id === 'login_failed')?.count || 0;
    const total = successful + failed;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    // Geographic activity
    const geographicActivity = await AuditLog.aggregate([
        {
            $match: {
                userId: user._id,
                eventType: 'login_success',
                timestamp: { $gte: last24Hours },
                location: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$location.country',
                logins: { $sum: 1 }
            }
        },
        { $sort: { logins: -1 } },
        { $limit: 10 }
    ]);

    // Device usage
    const deviceData = await AuditLog.aggregate([
        {
            $match: {
                userId: user._id,
                eventType: 'login_success',
                timestamp: { $gte: last24Hours },
                device: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$device',
                usage: { $sum: 1 }
            }
        },
        { $sort: { usage: -1 } },
        { $limit: 10 }
    ]);

    // Calculate total usage and percentages for device data
    const totalUsage = deviceData.reduce((sum, item) => sum + item.usage, 0);
    const deviceUsage = deviceData.map(item => ({
        device: item._id,
        usage: item.usage,
        percentage: totalUsage > 0 ? Math.round((item.usage / totalUsage) * 100) : 0
    }));

    // Calculate percentages for geographic data
    const totalLogins = geographicActivity.reduce((sum, item) => sum + item.logins, 0);
    const geographicActivityWithPercentages = geographicActivity.map(item => ({
        country: item._id,
        logins: item.logins,
        percentage: totalLogins > 0 ? Math.round((item.logins / totalLogins) * 100) : 0
    }));

    return {
        securityEvents: securityEvents.map(item => ({
            date: item._id,
            events: item.events,
            failedLogins: item.failedLogins
        })),
        loginSuccessRate: {
            successful: successRate,
            failed: 100 - successRate
        },
        geographicActivity: geographicActivityWithPercentages,
        deviceUsage: deviceUsage
    };
}

// Function to extract device information from user agent
const extractDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';

    const ua = userAgent.toLowerCase();

    // Browser detection - check Edge first since it contains "chrome" in its user agent
    if (ua.includes('edg/') || ua.includes('edge')) {
        return 'Edge';
    }
    if (ua.includes('chrome') && !ua.includes('edg/')) {
        return 'Chrome';
    }
    if (ua.includes('firefox')) {
        return 'Firefox';
    }
    if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('edg/')) {
        return 'Safari';
    }
    if (ua.includes('opera')) {
        return 'Opera';
    }
    if (ua.includes('ie') || ua.includes('trident')) {
        return 'Internet Explorer';
    }

    // Mobile detection
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
        if (ua.includes('android')) {
            return 'Android';
        }
        if (ua.includes('iphone')) {
            return 'iPhone';
        }
        if (ua.includes('ipad')) {
            return 'iPad';
        }
        return 'Mobile';
    }

    // Desktop OS detection
    if (ua.includes('windows')) {
        return 'Windows';
    }
    if (ua.includes('macintosh') || ua.includes('mac os')) {
        return 'Mac';
    }
    if (ua.includes('linux')) {
        return 'Linux';
    }

    return 'Other';
};

// Function to extract geographic location from IP address using real geolocation service
const extractLocationFromIP = async (ip) => {
    if (!ip) return null;

    try {
        const location = await geolocationService.getLocationFromIP(ip);
        return {
            country: location.country,
            city: location.city,
            region: location.region,
            countryCode: location.countryCode,
            regionCode: location.regionCode,
            latitude: location.latitude,
            longitude: location.longitude,
            timezone: location.timezone,
            isp: location.isp,
            asn: location.asn,
            accuracy: location.accuracy
        };
    } catch (error) {
        console.error('Geolocation error:', error);
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            countryCode: 'UNKNOWN',
            regionCode: 'UNKNOWN',
            latitude: null,
            longitude: null,
            timezone: 'Unknown',
            isp: 'Unknown',
            asn: 'Unknown',
            accuracy: 'unknown'
        };
    }
};

// Enhanced rate limiting middleware
const enhancedRateLimit = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = securityConfig.rateLimit.windowMs;
    const maxAttempts = securityConfig.rateLimit.maxAttempts;

    // Check if IP is blocked
    const blocked = blockedIPs.get(ip);
    if (blocked && blocked.until > now) {
        return res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again later.',
            retryAfter: Math.ceil((blocked.until - now) / 1000)
        });
    }

    // Get attempts for this IP
    const attempts = loginAttempts.get(ip) || [];
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

    if (recentAttempts.length >= maxAttempts) {
        // Block IP for configured duration
        blockedIPs.set(ip, { until: now + securityConfig.rateLimit.blockDurationMs });
        return res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again later.'
        });
    }

    next();
};

// Enhanced login route with 2FA support
router.post('/login', enhancedRateLimit, sanitizeInput, validateInput({
    body: {
        identifier: { required: true, type: 'string', minLength: 3, maxLength: 100 },
        password: { required: true, type: 'string', minLength: 6, maxLength: 128 },
        rememberMe: { type: 'boolean' },
        twoFactorCode: { type: 'string', maxLength: 10 },
        backupCode: { type: 'string', maxLength: 10 }
    }
}), async (req, res) => {
    try {
        const { identifier, password, rememberMe, twoFactorCode, backupCode } = req.body;
        let usedBackupCode = false; // Declare at function scope

        console.log('Login request received:', {
            identifier,
            hasPassword: !!password,
            rememberMe,
            hasTwoFactorCode: !!twoFactorCode,
            hasBackupCode: !!backupCode,
            twoFactorCode,
            backupCode
        });

        // Find user by username, email, or phone
        const user = await User.findOne({
            $or: [
                { username: identifier },
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ]
        }).select('+twoFactorSecret');

        if (!user) {
            // Log failed attempt
            const ip = req.ip;
            const attempts = loginAttempts.get(ip) || [];
            attempts.push(Date.now());
            loginAttempts.set(ip, attempts);

            await AuditLog.logEvent({
                userId: null,
                username: identifier,
                action: 'login_failed',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                device: extractDeviceInfo(req.headers['user-agent']),
                location: await extractLocationFromIP(req.ip),
                success: false,
                details: { reason: 'user_not_found' },
                riskLevel: 'medium'
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is locked
        if (user.isAccountLocked()) {
            await AuditLog.logEvent({
                userId: user._id,
                username: user.username,
                action: 'login_failed',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                device: extractDeviceInfo(req.headers['user-agent']),
                location: await extractLocationFromIP(req.ip),
                success: false,
                details: { reason: 'account_locked' },
                riskLevel: 'high'
            });

            return res.status(401).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts'
            });
        }

        if (!user.isActive) {
            await AuditLog.logEvent({
                userId: user._id,
                username: user.username,
                action: 'login_failed',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                device: extractDeviceInfo(req.headers['user-agent']),
                location: await extractLocationFromIP(req.ip),
                success: false,
                details: { reason: 'account_inactive' },
                riskLevel: 'medium'
            });

            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            // Increment failed attempts
            await user.incrementFailedAttempts();

            // Log failed attempt
            const ip = req.ip;
            const attempts = loginAttempts.get(ip) || [];
            attempts.push(Date.now());
            loginAttempts.set(ip, attempts);

            await AuditLog.logEvent({
                userId: user._id,
                username: user.username,
                action: 'login_failed',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                device: extractDeviceInfo(req.headers['user-agent']),
                location: await extractLocationFromIP(req.ip),
                success: false,
                details: { reason: 'invalid_password' },
                riskLevel: 'medium'
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check 2FA if enabled
        if (user.twoFactorEnabled) {
            console.log('2FA check - twoFactorCode:', !!twoFactorCode, 'backupCode:', !!backupCode);

            if (!twoFactorCode && !backupCode) {
                console.log('2FA check - no codes provided, requiring 2FA');
                return res.status(401).json({
                    success: false,
                    message: 'Two-factor authentication code required',
                    requiresTwoFactor: true
                });
            }

            // Validate TOTP code format if provided
            if (twoFactorCode && !/^\d{6}$/.test(twoFactorCode)) {
                return res.status(401).json({
                    success: false,
                    message: 'Two-factor authentication code must be exactly 6 digits'
                });
            }

            let twoFactorVerified = false;

            // Try TOTP code first if provided
            if (twoFactorCode) {
                // Check if user has a valid secret
                if (!user.twoFactorSecret) {
                    console.log('2FA Login Debug - User has no twoFactorSecret');
                    return res.status(401).json({
                        success: false,
                        message: 'Two-factor authentication not properly configured'
                    });
                }

                // For debugging: show expected code (remove in production)
                const expectedCode = speakeasy.totp({
                    secret: user.twoFactorSecret,
                    encoding: 'base32'
                });
                console.log('2FA Login Debug - Expected code:', expectedCode, 'Provided code:', twoFactorCode, 'Secret length:', user.twoFactorSecret.length);

                twoFactorVerified = speakeasy.totp.verify({
                    secret: user.twoFactorSecret,
                    encoding: 'base32',
                    token: twoFactorCode,
                    window: 4 // Increased from 2 to 4 to allow more time steps
                });

                console.log('2FA Login Debug - Verification result:', twoFactorVerified);
            }

            // If TOTP failed or not provided, try backup code
            if (!twoFactorVerified && backupCode) {
                console.log('Attempting backup code verification');
                const backupCodeEntry = user.twoFactorBackupCodes.find(
                    code => code.code === backupCode.toUpperCase() && !code.used
                );

                if (backupCodeEntry) {
                    twoFactorVerified = true;
                    usedBackupCode = true;

                    // Mark the backup code as used
                    backupCodeEntry.used = true;
                    await user.save();

                    // Log backup code usage
                    await AuditLog.logEvent({
                        userId: user._id,
                        username: user.username,
                        action: 'login',
                        ip: req.ip,
                        userAgent: req.headers['user-agent'],
                        device: extractDeviceInfo(req.headers['user-agent']),
                        location: await extractLocationFromIP(req.ip),
                        success: true,
                        details: {
                            backupCodeUsed: backupCodeEntry.code,
                            remainingCodes: user.twoFactorBackupCodes.filter(code => !code.used).length,
                            usedBackupCode: true
                        }
                    });
                }
            }

            if (!twoFactorVerified) {
                await AuditLog.logEvent({
                    userId: user._id,
                    username: user.username,
                    action: 'login_failed',
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    device: extractDeviceInfo(req.headers['user-agent']),
                    location: await extractLocationFromIP(req.ip),
                    success: false,
                    details: {
                        reason: backupCode ? 'invalid_backup_code' : 'invalid_2fa_code',
                        usedBackupCode: backupCode ? true : false
                    },
                    riskLevel: 'high'
                });

                return res.status(401).json({
                    success: false,
                    message: backupCode ? 'Invalid backup code' : 'Invalid two-factor authentication code'
                });
            }
        }

        // Clear failed attempts on successful login
        loginAttempts.delete(req.ip);
        await user.resetFailedAttempts();

        // Update last login
        user.lastLogin = new Date();

        // Generate session ID
        const sessionId = crypto.randomBytes(32).toString('hex');

        // Add session to user
        await user.addSession({
            sessionId,
            location: await extractLocationFromIP(req.ip),
            device: req.headers['user-agent'],
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Generate JWT token with appropriate expiration
        const tokenExpiry = rememberMe ? '7d' : '24h';
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                sessionId,
                twoFactorEnabled: user.twoFactorEnabled
            },
            securityConfig.jwt.secret,
            {
                expiresIn: tokenExpiry,
                issuer: securityConfig.jwt.issuer,
                audience: securityConfig.jwt.audience,
                algorithm: securityConfig.jwt.algorithm
            }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET || securityConfig.jwt.secret,
            { expiresIn: '7d' }
        );

        // Set secure HTTP-only cookie
        const cookieOptions = {
            httpOnly: securityConfig.cookie.httpOnly,
            secure: securityConfig.cookie.secure,
            sameSite: securityConfig.cookie.sameSite,
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
            path: securityConfig.cookie.path
        };

        res.cookie('authToken', token, cookieOptions);

        // Send welcome email on first login if not sent before
        if (!user.welcomeEmailSent) {
            try {
                const emailResult = await emailService.sendWelcomeEmail(user);
                if (emailResult.success) {
                    user.welcomeEmailSent = true;
                    await user.save();
                    console.log('✅ Welcome email sent successfully to:', user.email);
                } else {
                    console.error('❌ Welcome email failed:', emailResult.error);
                    // Don't set welcomeEmailSent to true if email failed
                }
            } catch (emailError) {
                console.error('❌ Welcome email error:', emailError);
                // Don't fail the login if email fails, and don't set welcomeEmailSent to true
            }
        }

        // Log successful login
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'login',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true,
            sessionId,
            details: {
                twoFactorUsed: user.twoFactorEnabled,
                usedBackupCode: usedBackupCode || false
            }
        });

        // Emit real-time dashboard updates
        try {
            const { emitUserUpdate } = require('../index');

            // Emit security stats update
            const securityStats = await getSecurityStats(user);
            await emitUserUpdate(user._id, 'security-stats', securityStats);

            // Emit chart data update (includes device usage)
            const chartData = await getChartData(user);
            await emitUserUpdate(user._id, 'chart-data', chartData);

        } catch (socketError) {
            console.error('Socket.IO update error:', socketError);
            // Don't fail the login if socket update fails
        }

        // Return user data (without password) and token
        const userResponse = user.toJSON();
        delete userResponse.password;

        console.log('Login successful response:', {
            success: true,
            userId: user._id,
            username: user.username,
            hasToken: !!token,
            hasRefreshToken: !!refreshToken,
            usedBackupCode: usedBackupCode || false
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token,
                refreshToken,
                expiresIn: tokenExpiry
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Logout route
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Remove session from user
        if (req.user && req.token) {
            const decoded = jwt.verify(req.token, securityConfig.jwt.secret);
            await req.user.removeSession(decoded.sessionId);
        }

        // Log logout event
        await AuditLog.logEvent({
            userId: req.user._id,
            username: req.user.username,
            action: 'logout',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true,
            sessionId: req.token ? jwt.verify(req.token, securityConfig.jwt.secret).sessionId : null
        });

        // Clear the HTTP-only cookie
        res.clearCookie('authToken', {
            httpOnly: securityConfig.cookie.httpOnly,
            secure: securityConfig.cookie.secure,
            sameSite: securityConfig.cookie.sameSite,
            path: securityConfig.cookie.path
        });

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// Password reset request
router.post('/forgot-password', sanitizeInput, validateInput({
    body: {
        email: { required: true, type: 'email', maxLength: 100 }
    }
}), async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal if email exists or not
            return res.json({
                success: true,
                message: 'If an account with this email exists, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetExpires;
        await user.save();

        // Send email
        await emailService.sendPasswordResetEmail(user, resetToken);

        // Log password reset request
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'password_reset_request',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true
        });

        res.json({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request'
        });
    }
});

// Password reset with token
router.post('/reset-password', sanitizeInput, validateInput({
    body: {
        token: { required: true, type: 'string', maxLength: 100 },
        newPassword: { required: true, type: 'string', minLength: 8, maxLength: 128 }
    }
}), async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Validate password strength using the new analyzer
        const passwordValidation = passwordStrengthAnalyzer.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password does not meet security requirements',
                errors: passwordValidation.errors,
                strength: passwordValidation.analysis
            });
        }

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        // Log password reset
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'password_reset_complete',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true
        });

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
});

// 2FA setup - generate secret and QR code
router.post('/2fa/setup', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+twoFactorSecret');

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication is already enabled'
            });
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: 'SafawiNet',
            issuer: 'SafawiNet',
            length: 20
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Generate backup codes
        await user.generateBackupCodes();

        // Save secret temporarily (not enabled yet)
        user.twoFactorSecret = secret.base32;
        await user.save();

        res.json({
            success: true,
            data: {
                secret: secret.base32,
                qrCodeUrl,
                backupCodes: user.twoFactorBackupCodes.map(code => code.code)
            }
        });

    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to setup two-factor authentication'
        });
    }
});

// 2FA enable - verify and enable
router.post('/2fa/enable', authenticateToken, sanitizeInput, validateInput({
    body: {
        code: { required: true, type: 'string', maxLength: 10 }
    }
}), async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id).select('+twoFactorSecret');

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication is already enabled'
            });
        }

        // Validate code format
        if (!code || !/^\d{6}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: 'Verification code must be exactly 6 digits'
            });
        }

        // Check if user has a secret
        if (!user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication setup not completed. Please complete setup first.'
            });
        }

        // Verify code
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 4 // Increased from 2 to 4 to allow more time steps
        });

        // For debugging: show expected code (remove in production)
        const expectedCode = speakeasy.totp({
            secret: user.twoFactorSecret,
            encoding: 'base32'
        });
        console.log('2FA Debug - Expected code:', expectedCode, 'Provided code:', code);

        if (!verified) {
            // Add debugging information
            console.log('2FA Enable Debug:', {
                userId: user._id,
                username: user.username,
                hasSecret: !!user.twoFactorSecret,
                secretLength: user.twoFactorSecret ? user.twoFactorSecret.length : 0,
                codeProvided: code,
                codeLength: code ? code.length : 0,
                codeIsNumeric: /^\d+$/.test(code),
                timestamp: new Date().toISOString()
            });

            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Enable 2FA
        user.twoFactorEnabled = true;
        await user.save();

        // Send email notification
        await emailService.sendTwoFactorSetupEmail(user, null, user.twoFactorBackupCodes.map(code => code.code));

        // Log 2FA enable
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'two_factor_enable',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true
        });

        // Emit real-time security status update
        try {
            const { emitUserUpdate } = require('../index');
            const securityStatus = {
                accountSecurity: {
                    status: user.isActive ? 'good' : 'locked',
                    failedAttempts: user.failedLoginAttempts || 0
                },
                passwordStrength: {
                    status: user.getPasswordStrength().level === 'weak' ? 'weak' :
                        user.getPasswordStrength().level === 'medium' ? 'medium' : 'strong',
                    level: user.getPasswordStrength().level
                },
                twoFactorAuth: {
                    enabled: true,
                    backupCodesCount: user.twoFactorBackupCodes?.filter(code => !code.used).length || 0
                }
            };
            await emitUserUpdate(user._id, 'security-status', securityStatus);

            // Also emit profile data update for 2FA status
            const profileData = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                username: user.username || '',
                isAdmin: user.isAdmin || false,
                isActive: user.isActive || true,
                createdAt: user.createdAt || '',
                lastLogin: user.lastLogin || '',
                twoFactorEnabled: true,
                emailVerified: user.emailVerified || false,
                phoneVerified: user.phoneVerified || false
            };
            await emitUserUpdate(user._id, 'profile-data', profileData);
        } catch (socketError) {
            console.error('Socket.IO update error:', socketError);
            // Don't fail the 2FA enable if socket update fails
        }

        res.json({
            success: true,
            message: 'Two-factor authentication enabled successfully'
        });

    } catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to enable two-factor authentication'
        });
    }
});

// 2FA disable
router.post('/2fa/disable', authenticateToken, sanitizeInput, validateInput({
    body: {
        code: { required: true, type: 'string', maxLength: 10 }
    }
}), async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id).select('+twoFactorSecret');

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication is not enabled'
            });
        }

        // Verify code
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Disable 2FA
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        user.twoFactorBackupCodes = [];
        await user.save();

        // Log 2FA disable
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'two_factor_disable',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true
        });

        // Emit real-time security status update
        try {
            const { emitUserUpdate } = require('../index');
            const securityStatus = {
                accountSecurity: {
                    status: user.isActive ? 'good' : 'locked',
                    failedAttempts: user.failedLoginAttempts || 0
                },
                passwordStrength: {
                    status: user.getPasswordStrength().level === 'weak' ? 'weak' :
                        user.getPasswordStrength().level === 'medium' ? 'medium' : 'strong',
                    level: user.getPasswordStrength().level
                },
                twoFactorAuth: {
                    enabled: false,
                    backupCodesCount: 0
                }
            };
            await emitUserUpdate(user._id, 'security-status', securityStatus);

            // Also emit profile data update for 2FA status
            const profileData = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                username: user.username || '',
                isAdmin: user.isAdmin || false,
                isActive: user.isActive || true,
                createdAt: user.createdAt || '',
                lastLogin: user.lastLogin || '',
                twoFactorEnabled: false,
                emailVerified: user.emailVerified || false,
                phoneVerified: user.phoneVerified || false
            };
            await emitUserUpdate(user._id, 'profile-data', profileData);
        } catch (socketError) {
            console.error('Socket.IO update error:', socketError);
            // Don't fail the 2FA disable if socket update fails
        }

        res.json({
            success: true,
            message: 'Two-factor authentication disabled successfully'
        });

    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disable two-factor authentication'
        });
    }
});

// Backup code verification endpoint
router.post('/2fa/verify-backup-code', authenticateToken, sanitizeInput, validateInput({
    body: {
        backupCode: { required: true, type: 'string', maxLength: 10 }
    }
}), async (req, res) => {
    try {
        const { backupCode } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication is not enabled'
            });
        }

        // Find the backup code
        const backupCodeEntry = user.twoFactorBackupCodes.find(
            code => code.code === backupCode.toUpperCase() && !code.used
        );

        if (!backupCodeEntry) {
            // Log failed backup code attempt
            await AuditLog.logEvent({
                userId: user._id,
                username: user.username,
                action: 'backup_code_failed',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                device: extractDeviceInfo(req.headers['user-agent']),
                location: await extractLocationFromIP(req.ip),
                success: false,
                details: { reason: 'invalid_or_used_backup_code' },
                riskLevel: 'high'
            });

            return res.status(400).json({
                success: false,
                message: 'Invalid or already used backup code'
            });
        }

        // Mark the backup code as used
        backupCodeEntry.used = true;
        await user.save();

        // Log successful backup code usage
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'backup_code_used',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true,
            details: {
                backupCodeUsed: backupCodeEntry.code,
                remainingCodes: user.twoFactorBackupCodes.filter(code => !code.used).length
            }
        });

        res.json({
            success: true,
            message: 'Backup code verified successfully',
            data: {
                remainingCodes: user.twoFactorBackupCodes.filter(code => !code.used).length
            }
        });

    } catch (error) {
        console.error('Backup code verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify backup code'
        });
    }
});

// Regenerate backup codes
router.post('/2fa/regenerate-backup-codes', authenticateToken, sanitizeInput, validateInput({
    body: {
        code: { required: true, type: 'string', maxLength: 10 }
    }
}), async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id).select('+twoFactorSecret');

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication is not enabled'
            });
        }

        // Verify current 2FA code first
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Generate new backup codes
        await user.generateBackupCodes();

        // Send email with new backup codes
        await emailService.sendTwoFactorSetupEmail(user, null, user.twoFactorBackupCodes.map(code => code.code));

        // Log backup codes regeneration
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'backup_codes_regenerated',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true
        });

        res.json({
            success: true,
            message: 'Backup codes regenerated successfully',
            data: {
                backupCodes: user.twoFactorBackupCodes.map(code => code.code)
            }
        });

    } catch (error) {
        console.error('Backup codes regeneration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to regenerate backup codes'
        });
    }
});

// Get remaining backup codes count
router.get('/2fa/backup-codes-count', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication is not enabled'
            });
        }

        const remainingCodes = user.twoFactorBackupCodes.filter(code => !code.used).length;

        res.json({
            success: true,
            data: {
                remainingCodes,
                totalCodes: user.twoFactorBackupCodes.length
            }
        });

    } catch (error) {
        console.error('Get backup codes count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get backup codes count'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, sanitizeInput, validateInput({
    body: {
        firstName: { required: true, type: 'string', minLength: 2, maxLength: 50 },
        lastName: { required: true, type: 'string', minLength: 2, maxLength: 50 },
        username: { required: true, type: 'string', minLength: 3, maxLength: 30 },
        email: { required: true, type: 'email', maxLength: 100 },
        phone: { type: 'string', maxLength: 20 }
    }
}), async (req, res) => {
    try {
        const { firstName, lastName, username, email, phone } = req.body;

        // Check if username is already taken by another user
        if (username && username !== req.user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username is already taken'
                });
            }
        }

        // Check if email is already taken by another user
        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken'
                });
            }
        }

        // Check if phone is already taken by another user
        if (phone && phone !== req.user.phone) {
            const existingUser = await User.findOne({ phone });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is already taken'
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                firstName: firstName || req.user.firstName,
                lastName: lastName || req.user.lastName,
                username: username || req.user.username,
                email: email ? email.toLowerCase() : req.user.email,
                phone: phone || req.user.phone,
                // Reset email verification if email changed
                emailVerified: email && email.toLowerCase() !== req.user.email ? false : req.user.emailVerified
            },
            { new: true, runValidators: true }
        ).select('-password');

        // Update profile initials if name changed
        if ((firstName && firstName !== req.user.firstName) || (lastName && lastName !== req.user.lastName)) {
            await updatedUser.updateProfileInitials();
        }

        // Log profile update
        await AuditLog.logEvent({
            userId: req.user._id,
            username: req.user.username,
            action: 'profile_update',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Upload profile picture
router.post('/profile-picture', authenticateToken, uploadProfilePicture.single('profilePicture'), handleUploadError, async (req, res) => {
    try {
        console.log('=== Profile Picture Upload Debug ===');
        console.log('Request file:', req.file);
        console.log('Request body:', req.body);
        console.log('User ID:', req.user._id);

        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete old profile picture if it exists
        await deleteOldProfilePicture(user);

        // Update user with new profile picture
        const profilePictureUrl = getProfilePictureUrl(req.file.filename);
        console.log('Profile picture URL:', profilePictureUrl);
        console.log('File saved as:', req.file.filename);
        console.log('File path:', req.file.path);

        user.profilePicture = {
            url: profilePictureUrl,
            filename: req.file.filename,
            uploadedAt: new Date()
        };

        await user.save();
        console.log('User profile picture updated in database');

        // Log profile picture upload
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'profile_update',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true,
            details: { action: 'profile_picture_upload' }
        });

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: {
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile picture'
        });
    }
});

// Remove profile picture
router.delete('/profile-picture', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete the file from storage
        await deleteOldProfilePicture(user);

        // Remove profile picture from user
        user.profilePicture = {
            url: null,
            filename: null,
            uploadedAt: null
        };

        await user.save();

        // Log profile picture removal
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'profile_update',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true,
            details: { action: 'profile_picture_removal' }
        });

        res.json({
            success: true,
            message: 'Profile picture removed successfully'
        });

    } catch (error) {
        console.error('Profile picture removal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove profile picture'
        });
    }
});

// Change password
router.put('/change-password', authenticateToken, sanitizeInput, validateInput({
    body: {
        currentPassword: { required: true, type: 'string', minLength: 6 },
        newPassword: { required: true, type: 'string', minLength: 8, maxLength: 128 }
    }
}), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate password strength using the new analyzer
        const passwordValidation = passwordStrengthAnalyzer.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password does not meet security requirements',
                errors: passwordValidation.errors,
                strength: passwordValidation.analysis
            });
        }

        const user = await User.findById(req.user._id);

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Log password change
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'password_change',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true
        });

        // Emit real-time security status update
        try {
            const { emitUserUpdate } = require('../index');
            const securityStatus = {
                accountSecurity: {
                    status: user.isActive ? 'good' : 'locked',
                    failedAttempts: user.failedLoginAttempts || 0
                },
                passwordStrength: {
                    status: passwordValidation.analysis.level === 'weak' ? 'weak' :
                        passwordValidation.analysis.level === 'medium' ? 'medium' : 'strong',
                    level: passwordValidation.analysis.level
                },
                twoFactorAuth: {
                    enabled: user.twoFactorEnabled || false,
                    backupCodesCount: user.twoFactorBackupCodes?.filter(code => !code.used).length || 0
                }
            };
            await emitUserUpdate(user._id, 'security-status', securityStatus);
        } catch (socketError) {
            console.error('Socket.IO update error:', socketError);
            // Don't fail the password change if socket update fails
        }

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

// Validate token endpoint
router.get('/validate', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        data: {
            user: req.user
        }
    });
});

// Get user sessions
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            data: {
                sessions: user.activeSessions,
                maxSessions: user.maxSessions
            }
        });
    } catch (error) {
        console.error('Sessions fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions'
        });
    }
});

// Revoke session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const user = await User.findById(req.user._id);

        await user.removeSession(sessionId);

        // Log session revocation
        await AuditLog.logEvent({
            userId: user._id,
            username: user.username,
            action: 'session_destroy',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            device: extractDeviceInfo(req.headers['user-agent']),
            location: await extractLocationFromIP(req.ip),
            success: true,
            details: { sessionId }
        });

        res.json({
            success: true,
            message: 'Session revoked successfully'
        });
    } catch (error) {
        console.error('Session revocation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke session'
        });
    }
});

// Get user security events count
router.get('/security-events', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const hours = parseInt(req.query.hours) || 24; // Default to 24 hours
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        // Count security events for this user
        const securityEventsCount = await AuditLog.countDocuments({
            userId: userId,
            timestamp: { $gte: cutoff },
            $or: [
                { riskLevel: { $in: ['high', 'critical'] } },
                { action: 'suspicious_activity' },
                { action: 'rate_limit_exceeded' },
                { action: 'security_alert' },
                { action: 'account_lock' }
            ]
        });

        // Count failed login attempts
        const failedLoginCount = await AuditLog.countDocuments({
            userId: userId,
            action: 'login_failed',
            timestamp: { $gte: cutoff }
        });

        // Count successful logins
        const successfulLoginCount = await AuditLog.countDocuments({
            userId: userId,
            action: 'login',
            success: true,
            timestamp: { $gte: cutoff }
        });

        res.json({
            success: true,
            data: {
                securityEvents: securityEventsCount,
                failedLogins: failedLoginCount,
                successfulLogins: successfulLoginCount,
                period: `${hours} hours`
            }
        });
    } catch (error) {
        console.error('Security events fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch security events'
        });
    }
});

// Get security events chart data (daily breakdown for the last 7 days)
router.get('/security-events-chart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const days = parseInt(req.query.days) || 7; // Default to 7 days
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Get daily security events for the last 7 days
        const securityEventsData = await AuditLog.aggregate([
            {
                $match: {
                    userId: userId,
                    timestamp: { $gte: cutoff },
                    $or: [
                        { riskLevel: { $in: ['high', 'critical'] } },
                        { action: 'suspicious_activity' },
                        { action: 'rate_limit_exceeded' },
                        { action: 'security_alert' },
                        { action: 'account_lock' }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp"
                        }
                    },
                    events: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get daily failed logins
        const failedLoginsData = await AuditLog.aggregate([
            {
                $match: {
                    userId: userId,
                    action: 'login_failed',
                    timestamp: { $gte: cutoff }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp"
                        }
                    },
                    failedLogins: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get daily successful logins
        const successfulLoginsData = await AuditLog.aggregate([
            {
                $match: {
                    userId: userId,
                    action: 'login',
                    success: true,
                    timestamp: { $gte: cutoff }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp"
                        }
                    },
                    successfulLogins: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Create a complete date range and merge data
        const dateRange = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dateRange.push(date.toISOString().split('T')[0]);
        }

        const chartData = dateRange.map(date => {
            const securityEvent = securityEventsData.find(item => item._id === date);
            const failedLogin = failedLoginsData.find(item => item._id === date);
            const successfulLogin = successfulLoginsData.find(item => item._id === date);

            return {
                date: date,
                events: securityEvent ? securityEvent.events : 0,
                failedLogins: failedLogin ? failedLogin.failedLogins : 0,
                successfulLogins: successfulLogin ? successfulLogin.successfulLogins : 0
            };
        });

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        console.error('Security events chart fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch security events chart data'
        });
    }
});

// Get login success rate data
router.get('/login-success-rate', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const hours = parseInt(req.query.hours) || 24; // Default to 24 hours
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        // Count successful logins
        const successfulLogins = await AuditLog.countDocuments({
            userId: userId,
            action: 'login',
            success: true,
            timestamp: { $gte: cutoff }
        });

        // Count failed logins
        const failedLogins = await AuditLog.countDocuments({
            userId: userId,
            action: 'login_failed',
            timestamp: { $gte: cutoff }
        });

        const totalLogins = successfulLogins + failedLogins;
        const successRate = totalLogins > 0 ? Math.round((successfulLogins / totalLogins) * 100) : 0;
        const failureRate = 100 - successRate;

        res.json({
            success: true,
            data: {
                successful: successRate,
                failed: failureRate,
                totalLogins: totalLogins,
                successfulCount: successfulLogins,
                failedCount: failedLogins
            }
        });
    } catch (error) {
        console.error('Login success rate fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch login success rate'
        });
    }
});

// Get geographic activity data
router.get('/geographic-activity', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const hours = parseInt(req.query.hours) || 24; // Default to 24 hours
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        // Get login activity by location
        const geographicData = await AuditLog.aggregate([
            {
                $match: {
                    userId: userId,
                    action: 'login',
                    success: true,
                    timestamp: { $gte: cutoff },
                    'location.country': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$location.country',
                    logins: { $sum: 1 }
                }
            },
            { $sort: { logins: -1 } },
            { $limit: 10 }
        ]);

        // Calculate total logins and percentages
        const totalLogins = geographicData.reduce((sum, item) => sum + item.logins, 0);

        const chartData = geographicData.map(item => ({
            country: item._id,
            logins: item.logins,
            percentage: totalLogins > 0 ? Math.round((item.logins / totalLogins) * 100) : 0
        }));

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        console.error('Geographic activity fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch geographic activity'
        });
    }
});

// Get device usage data
router.get('/device-usage', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const hours = parseInt(req.query.hours) || 24; // Default to 24 hours
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        // Get login activity by device
        const deviceData = await AuditLog.aggregate([
            {
                $match: {
                    userId: userId,
                    action: 'login',
                    success: true,
                    timestamp: { $gte: cutoff },
                    device: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$device',
                    usage: { $sum: 1 }
                }
            },
            { $sort: { usage: -1 } },
            { $limit: 10 }
        ]);

        // Calculate total usage and percentages
        const totalUsage = deviceData.reduce((sum, item) => sum + item.usage, 0);

        const chartData = deviceData.map(item => ({
            device: item._id,
            usage: item.usage,
            percentage: totalUsage > 0 ? Math.round((item.usage / totalUsage) * 100) : 0
        }));

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        console.error('Device usage fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch device usage'
        });
    }
});

// Get user security status
router.get('/security-status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Check account security status
        const accountSecurityStatus = user.isAccountLocked() ? 'locked' :
            user.failedLoginAttempts > 0 ? 'warning' : 'good';

        // Check password strength using the user model's method
        const passwordStrength = user.getPasswordStrength();

        // Check two-factor authentication status
        const twoFactorStatus = user.twoFactorEnabled ? 'enabled' : 'disabled';

        // Get recent security events for additional context
        const hours = 24;
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        const recentSecurityEvents = await AuditLog.countDocuments({
            userId: user._id,
            timestamp: { $gte: cutoff },
            $or: [
                { riskLevel: { $in: ['high', 'critical'] } },
                { action: 'suspicious_activity' },
                { action: 'rate_limit_exceeded' },
                { action: 'security_alert' },
                { action: 'account_lock' }
            ]
        });

        res.json({
            success: true,
            data: {
                accountSecurity: {
                    status: accountSecurityStatus,
                    failedAttempts: user.failedLoginAttempts,
                    isLocked: user.accountLocked,
                    lockedUntil: user.lockedUntil
                },
                passwordStrength: passwordStrength,
                twoFactorAuth: {
                    status: twoFactorStatus,
                    enabled: user.twoFactorEnabled,
                    backupCodesCount: user.twoFactorBackupCodes?.filter(code => !code.used).length || 0
                },
                recentSecurityEvents: recentSecurityEvents,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Security status fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch security status'
        });
    }
});

// Get users for audit logs filter (admin and view permission only)
router.get('/audit-logs/users', authenticateToken, async (req, res) => {
    try {
        const hasViewPermission = req.user.hasPermission('audit-logs', 'view');
        const hasViewOwnPermission = req.user.hasPermission('audit-logs', 'view_own');

        // Only allow access if user has view permission or is admin
        if (!req.user.isAdmin && !hasViewPermission) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view all users.'
            });
        }

        // Get all active users for the filter dropdown
        const users = await User.find({ isActive: true })
            .select('_id firstName lastName username email')
            .sort({ firstName: 1, lastName: 1 })
            .lean();

        const userOptions = users.map(user => ({
            value: user._id.toString(),
            label: `${user.firstName} ${user.lastName} (${user.username})`
        }));

        res.json({
            success: true,
            data: userOptions
        });
    } catch (error) {
        console.error('Error fetching users for audit logs filter:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Get audit logs for the current user with enhanced server-side pagination
router.get('/audit-logs', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;

        // Check user permissions for audit logs
        const hasViewPermission = req.user.hasPermission('audit-logs', 'view');
        const hasViewOwnPermission = req.user.hasPermission('audit-logs', 'view_own');

        // If user has no permissions for audit logs, deny access
        if (!hasViewPermission && !hasViewOwnPermission) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view audit logs.'
            });
        }

        // Parse and validate pagination parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 25)); // Max 1000, min 1, default 25

        // Use user's timezone for cutoff calculation
        const userTimezone = req.query.timezone || 'Asia/Beirut';
        let cutoff;
        if (req.query.cutoff) {
            // Interpret cutoff in user's timezone, then convert to UTC for MongoDB
            cutoff = moment.tz(req.query.cutoff, userTimezone).utc().toDate();
        } else {
            // Default to 24 hours ago in user's timezone
            cutoff = moment.tz(userTimezone).subtract(24, 'hours').utc().toDate();
        }

        // Build query with enhanced filtering
        const query = {
            timestamp: { $gte: cutoff }
        };

        // Apply permission-based filtering
        let filterUserId = null;

        if (req.user.isAdmin) {
            // Admin can see all logs regardless of permissions
            filterUserId = null;
        } else if (hasViewPermission) {
            // User has 'view' permission - can see all logs
            filterUserId = null;
        } else if (hasViewOwnPermission) {
            // User has only 'view_own' permission - can only see their own logs
            filterUserId = userId;
        } else {
            // No permissions - this should not happen due to earlier check
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view audit logs.'
            });
        }

        // Add action filter
        if (req.query.action && req.query.action.trim()) {
            query.action = req.query.action.trim();
        }

        // Add risk level filter
        if (req.query.riskLevel && req.query.riskLevel.trim()) {
            const validRiskLevels = ['low', 'medium', 'high', 'critical'];
            if (validRiskLevels.includes(req.query.riskLevel.trim())) {
                query.riskLevel = req.query.riskLevel.trim();
            }
        }

        // Add success filter
        if (req.query.success !== undefined && req.query.success !== '') {
            query.success = req.query.success === 'true';
        }

        // Add user filter (only for admin and view permission users)
        if (req.query.userId && req.query.userId.trim() && (req.user.isAdmin || hasViewPermission)) {
            // Support both single user ID and multiple user IDs (comma-separated)
            const userIds = req.query.userId.trim().split(',').map(id => id.trim()).filter(id => id);
            if (userIds.length === 1) {
                query.userId = userIds[0];
            } else if (userIds.length > 1) {
                query.userId = { $in: userIds };
            }
        }

        // Enhanced server-side filtering with debugging
        const filterParams = {
            userId: filterUserId,
            page,
            limit,
            cutoff,
            action: req.query.action && req.query.action.trim() ? req.query.action.trim() : null,
            riskLevel: req.query.riskLevel && req.query.riskLevel.trim() ? req.query.riskLevel.trim() : null,
            success: req.query.success !== undefined && req.query.success !== '' ? req.query.success === 'true' : null,
            filterUserId: req.query.userId && req.query.userId.trim() && (req.user.isAdmin || hasViewPermission) ? req.query.userId.trim() : null
        };

        // Add debugging logs to verify server-side filtering
        console.log('🔍 Server-side filtering parameters:', {
            page: filterParams.page,
            limit: filterParams.limit,
            action: filterParams.action,
            riskLevel: filterParams.riskLevel,
            success: filterParams.success,
            cutoff: filterParams.cutoff,
            isAdmin: req.user.isAdmin,
            hasViewPermission,
            hasViewOwnPermission,
            filterUserId: filterUserId ? filterUserId.toString() : 'all users'
        });

        const paginationResult = await AuditLog.getPaginatedLogs(filterParams);

        // Populate user information for logs
        const logsWithUsers = await Promise.all(paginationResult.logs.map(async (log) => {
            try {
                const user = await User.findById(log.userId).select('firstName lastName username email profilePicture profileInitials').lean();
                return {
                    ...log,
                    user: user ? {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: user.username,
                        email: user.email,
                        fullName: `${user.firstName} ${user.lastName}`,
                        profilePicture: user.profilePicture,
                        profileInitials: user.profileInitials
                    } : null
                };
            } catch (error) {
                console.error('Error populating user for log:', error);
                return {
                    ...log,
                    user: null
                };
            }
        }));

        console.log('📊 Server-side pagination results:', {
            totalRecords: paginationResult.total,
            returnedRecords: logsWithUsers.length,
            currentPage: paginationResult.page,
            totalPages: paginationResult.totalPages,
            hasNextPage: paginationResult.hasNextPage
        });

        // Calculate summary statistics for the filtered data
        const highRiskCount = paginationResult.logs.filter(log =>
            log.riskLevel === 'high' || log.riskLevel === 'critical'
        ).length;

        const failedLoginsCount = paginationResult.logs.filter(log =>
            log.action === 'login_failed'
        ).length;

        res.json({
            success: true,
            data: {
                logs: logsWithUsers,
                total: paginationResult.total,
                page: paginationResult.page,
                limit: paginationResult.limit,
                totalPages: paginationResult.totalPages,
                hasNextPage: paginationResult.hasNextPage,
                hasPrevPage: paginationResult.hasPrevPage,
                nextPage: paginationResult.hasNextPage ? paginationResult.page + 1 : null,
                prevPage: paginationResult.hasPrevPage ? paginationResult.page - 1 : null,
                summary: {
                    highRiskCount,
                    failedLoginsCount
                }
            }
        });
    } catch (error) {
        console.error('Audit logs fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
});

// Export audit logs to CSV/Excel
router.get('/audit-logs/export', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;

        // Check user permissions for audit logs export
        const hasViewPermission = req.user.hasPermission('audit-logs', 'view');
        const hasViewOwnPermission = req.user.hasPermission('audit-logs', 'view_own');
        const hasExportPermission = req.user.hasPermission('audit-logs', 'export');

        // If user has no permissions for audit logs, deny access
        if (!hasViewPermission && !hasViewOwnPermission) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view audit logs.'
            });
        }

        // Check if user has export permission
        if (!hasExportPermission && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to export audit logs.'
            });
        }

        // Use user's timezone and date format preferences
        const userTimezone = req.user.userPreferences?.timezone || req.query.timezone || 'Asia/Beirut';
        const userDateFormat = req.user.userPreferences?.dateFormat || 'MMM dd, yyyy h:mm a';
        
        let cutoff;
        if (req.query.cutoff) {
            cutoff = moment.tz(req.query.cutoff, userTimezone).utc().toDate();
        } else {
            cutoff = moment.tz(userTimezone).subtract(24, 'hours').utc().toDate();
        }

        // Build query with enhanced filtering
        const query = {
            timestamp: { $gte: cutoff }
        };

        // Apply permission-based filtering
        let filterUserId = null;

        if (req.user.isAdmin) {
            filterUserId = null;
        } else if (hasViewPermission) {
            filterUserId = null;
        } else if (hasViewOwnPermission) {
            filterUserId = userId;
        }

        // Add action filter
        if (req.query.action && req.query.action.trim()) {
            query.action = req.query.action.trim();
        }

        // Add risk level filter
        if (req.query.riskLevel && req.query.riskLevel.trim()) {
            const validRiskLevels = ['low', 'medium', 'high', 'critical'];
            if (validRiskLevels.includes(req.query.riskLevel.trim())) {
                query.riskLevel = req.query.riskLevel.trim();
            }
        }

        // Add success filter
        if (req.query.success !== undefined && req.query.success !== '') {
            query.success = req.query.success === 'true';
        }

        // Add user filter (only for admin and view permission users)
        if (req.query.userId && req.query.userId.trim() && (req.user.isAdmin || hasViewPermission)) {
            const userIds = req.query.userId.trim().split(',').map(id => id.trim()).filter(id => id);
            if (userIds.length === 1) {
                query.userId = userIds[0];
            } else if (userIds.length > 1) {
                query.userId = { $in: userIds };
            }
        }

        // Get all logs matching the criteria (no pagination for export)
        const logs = await AuditLog.find(query)
            .populate('userId', 'firstName lastName username email')
            .sort({ timestamp: -1 })
            .lean();

        // Format data for export
        const exportData = logs.map(log => ({
            'User': log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'Unknown User',
            'Username': log.userId ? log.userId.username : 'Unknown',
            'Email': log.userId ? log.userId.email : 'Unknown',
            'Action': log.action.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
            'Status': log.success ? 'Success' : 'Failed',
            'Risk Level': log.riskLevel || 'low',
            'IP Address': log.ip || 'Unknown',
            'Device': log.device || 'Unknown',
            'Country': log.location?.country || 'Unknown',
            'City': log.location?.city || 'Unknown',
            'Timestamp': moment(log.timestamp).tz(userTimezone).format(userDateFormat),
            'Details': log.details?.message || log.details?.reason || 'No additional details'
        }));

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${moment().format('YYYY-MM-DD-HH-mm-ss')}.csv"`);

        // Create CSV content
        if (exportData.length === 0) {
            res.send('No data to export');
            return;
        }

        // Get headers from first row
        const headers = Object.keys(exportData[0]);
        
        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...exportData.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    // Escape commas and quotes in CSV
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        res.send(csvContent);

    } catch (error) {
        console.error('Export audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export audit logs'
        });
    }
});

// Get all audit logs (admin only) with enhanced server-side pagination
router.get('/admin/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Parse and validate pagination parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 25));

        // Parse date range with better validation
        let cutoff;
        if (req.query.cutoff) {
            cutoff = new Date(req.query.cutoff);
            if (isNaN(cutoff.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid cutoff date format'
                });
            }
        } else {
            // Default to 24 hours ago
            cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        }

        // Build query with enhanced filtering for admin
        const query = {
            timestamp: { $gte: cutoff }
        };

        // Add action filter
        if (req.query.action && req.query.action.trim()) {
            query.action = req.query.action.trim();
        }

        // Add risk level filter
        if (req.query.riskLevel && req.query.riskLevel.trim()) {
            const validRiskLevels = ['low', 'medium', 'high', 'critical'];
            if (validRiskLevels.includes(req.query.riskLevel.trim())) {
                query.riskLevel = req.query.riskLevel.trim();
            }
        }

        // Add success filter
        if (req.query.success !== undefined && req.query.success !== '') {
            query.success = req.query.success === 'true';
        }

        // Add user filter for admin
        if (req.query.userId && req.query.userId.trim()) {
            // Support both single user ID and multiple user IDs (comma-separated)
            const userIds = req.query.userId.trim().split(',').map(id => id.trim()).filter(id => id);
            if (userIds.length === 1) {
                query.userId = userIds[0];
            } else if (userIds.length > 1) {
                query.userId = { $in: userIds };
            }
        }

        // Add IP filter for admin
        if (req.query.ip && req.query.ip.trim()) {
            query.ip = { $regex: req.query.ip.trim(), $options: 'i' };
        }

        // Add device filter
        if (req.query.device && req.query.device.trim()) {
            query.device = { $regex: req.query.device.trim(), $options: 'i' };
        }

        // Add location filters
        if (req.query.country && req.query.country.trim()) {
            query['location.country'] = { $regex: req.query.country.trim(), $options: 'i' };
        }
        if (req.query.city && req.query.city.trim()) {
            query['location.city'] = { $regex: req.query.city.trim(), $options: 'i' };
        }

        // Add session ID filter
        if (req.query.sessionId && req.query.sessionId.trim()) {
            query.sessionId = req.query.sessionId.trim();
        }

        // Use optimized pagination method for admin
        const paginationResult = await AuditLog.getPaginatedLogs({
            userId: null, // Admin can see all users
            page,
            limit,
            cutoff,
            action: req.query.action && req.query.action.trim() ? req.query.action.trim() : null,
            riskLevel: req.query.riskLevel && req.query.riskLevel.trim() ? req.query.riskLevel.trim() : null,
            success: req.query.success !== undefined && req.query.success !== '' ? req.query.success === 'true' : null,
            ip: req.query.ip && req.query.ip.trim() ? req.query.ip.trim() : null
        });

        // Populate user information for admin view
        const logsWithUsers = await AuditLog.populate(paginationResult.logs, {
            path: 'userId',
            select: 'username firstName lastName email profilePicture profileInitials'
        });

        // Calculate summary statistics for the filtered data
        const highRiskCount = logsWithUsers.filter(log =>
            log.riskLevel === 'high' || log.riskLevel === 'critical'
        ).length;

        const failedLoginsCount = logsWithUsers.filter(log =>
            log.action === 'login_failed'
        ).length;

        const uniqueUsersCount = new Set(logsWithUsers.map(log => log.userId?._id?.toString() || log.userId?.toString())).size;

        res.json({
            success: true,
            data: {
                logs: logsWithUsers,
                total: paginationResult.total,
                page: paginationResult.page,
                limit: paginationResult.limit,
                totalPages: paginationResult.totalPages,
                hasNextPage: paginationResult.hasNextPage,
                hasPrevPage: paginationResult.hasPrevPage,
                nextPage: paginationResult.hasNextPage ? paginationResult.page + 1 : null,
                prevPage: paginationResult.hasPrevPage ? paginationResult.page - 1 : null,
                summary: {
                    highRiskCount,
                    failedLoginsCount,
                    uniqueUsersCount
                }
            }
        });
    } catch (error) {
        console.error('Admin audit logs fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin audit logs'
        });
    }
});

// Debug endpoint to check user permissions
router.get('/debug/permissions', authenticateToken, (req, res) => {
    try {
        const user = req.user;
        const permissions = user.permissions || [];
        const isAdmin = user.isAdmin;

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isAdmin: isAdmin,
                    isActive: user.isActive
                },
                permissions: permissions,
                hasUsersPermission: user.hasPermission('users', 'view'),
                allPermissions: permissions.map(p => `${p.page}: ${p.actions.join(', ')}`)
            }
        });
    } catch (error) {
        console.error('Debug permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get debug info'
        });
    }
});

// Email verification endpoints
router.post('/send-email-verification', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+emailVerificationToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate verification token
        await user.generateEmailVerificationToken();

        // Send verification email
        const emailResult = await emailService.sendEmailVerification(user, user.emailVerificationToken);

        if (emailResult.success) {
            // Emit real-time profile data update to show verification email was sent
            try {
                const { emitUserUpdate } = require('../index');
                const profileData = {
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    username: user.username || '',
                    isAdmin: user.isAdmin || false,
                    isActive: user.isActive || true,
                    createdAt: user.createdAt || '',
                    lastLogin: user.lastLogin || '',
                    twoFactorEnabled: user.twoFactorEnabled || false,
                    emailVerified: user.emailVerified || false,
                    phoneVerified: user.phoneVerified || false
                };
                await emitUserUpdate(user._id, 'profile-data', profileData);
            } catch (socketError) {
                console.error('Socket.IO update error:', socketError);
                // Don't fail the email verification request if socket update fails
            }

            res.json({
                success: true,
                message: 'Email verification sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send verification email'
            });
        }
    } catch (error) {
        console.error('Send email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email verification'
        });
    }
});

router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        }).select('+emailVerificationToken +emailVerificationExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Verify the email
        const verificationResult = await user.verifyEmail(token);

        if (verificationResult) {
            // Send confirmation email
            await emailService.sendEmailVerifiedConfirmation(user);

            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Email verification failed'
            });
        }
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify email'
        });
    }
});

// Check email verification status
router.get('/email-verification-status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                emailVerified: user.emailVerified || false,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Email verification status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check email verification status'
        });
    }
});

// --- PHONE VERIFICATION ENDPOINTS DISABLED ---
// router.post('/send-phone-verification', authenticateToken, sanitizeInput, validateInput({
//     body: {
//         phoneNumber: { required: true, type: 'string', minLength: 10, maxLength: 15 }
//     }
// }), async (req, res) => {
//     try {
//         const { phoneNumber } = req.body;
//         const user = await User.findById(req.user._id).select('+phoneVerificationCode');
//         
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
//
//         // Validate phone number format
//         if (!smsService.validatePhoneNumber(phoneNumber)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid phone number format'
//             });
//         }
//
//         // Check if phone number is already verified
//         if (user.phoneVerified && user.phone === phoneNumber) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Phone number is already verified'
//             });
//         }
//
//         // Update user's phone number if different
//         if (user.phone !== phoneNumber) {
//             user.phone = phoneNumber;
//             user.phoneVerified = false;
//         }
//
//         // Generate verification code
//         await user.generatePhoneVerificationCode();
//         
//         // Send verification SMS
//         const smsResult = await smsService.sendVerificationCode(phoneNumber, user.phoneVerificationCode);
//         
//         if (smsResult.success) {
//             res.json({
//                 success: true,
//                 message: 'Phone verification code sent successfully'
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 message: 'Failed to send verification code',
//                 error: smsResult.error
//             });
//         }
//     } catch (error) {
//         console.error('Send phone verification error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to send phone verification'
//         });
//     }
// });

// router.post('/verify-phone', authenticateToken, sanitizeInput, validateInput({
//     body: {
//         code: { required: true, type: 'string', minLength: 6, maxLength: 6 }
//     }
// }), async (req, res) => {
//     try {
//         const { code } = req.body;
//         const user = await User.findById(req.user._id).select('+phoneVerificationCode');
//         
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
//
//         if (!user.phoneVerificationCode) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No verification code found. Please request a new code.'
//             });
//         }
//
//         // Verify the phone
//         const verificationResult = await user.verifyPhone(code);
//         
//         if (verificationResult) {
//             // Send confirmation SMS
//             await smsService.sendVerificationSuccess(user.phone);
//             
//             res.json({
//                 success: true,
//                 message: 'Phone number verified successfully'
//             });
//         } else {
//             res.status(400).json({
//                 success: false,
//                 message: 'Invalid or expired verification code'
//             });
//         }
//     } catch (error) {
//         console.error('Verify phone error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to verify phone number'
//         });
//     }
// });

// Get verification status
router.get('/verification-status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                phone: user.phone,
                isFullyVerified: user.isFullyVerified()
            }
        });
    } catch (error) {
        console.error('Get verification status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get verification status'
        });
    }
});

// Debug endpoint to check 2FA status (remove in production)
router.get('/debug/2fa-status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+twoFactorSecret');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate current expected code for debugging
        let expectedCode = null;
        if (user.twoFactorSecret) {
            expectedCode = speakeasy.totp({
                secret: user.twoFactorSecret,
                encoding: 'base32'
            });
        }

        res.json({
            success: true,
            data: {
                twoFactorEnabled: user.twoFactorEnabled,
                hasSecret: !!user.twoFactorSecret,
                secretLength: user.twoFactorSecret ? user.twoFactorSecret.length : 0,
                expectedCode: expectedCode,
                backupCodesCount: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.length : 0,
                unusedBackupCodes: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.filter(code => !code.used).length : 0
            }
        });
    } catch (error) {
        console.error('Debug 2FA status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get 2FA debug status'
        });
    }
});

// Debug endpoint to check user 2FA by username/email (remove in production)
router.get('/debug/user-2fa/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;

        const user = await User.findOne({
            $or: [
                { username: identifier },
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ]
        }).select('+twoFactorSecret');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate current expected code for debugging
        let expectedCode = null;
        if (user.twoFactorSecret) {
            expectedCode = speakeasy.totp({
                secret: user.twoFactorSecret,
                encoding: 'base32'
            });
        }

        res.json({
            success: true,
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
                twoFactorEnabled: user.twoFactorEnabled,
                hasSecret: !!user.twoFactorSecret,
                secretLength: user.twoFactorSecret ? user.twoFactorSecret.length : 0,
                expectedCode: expectedCode,
                backupCodesCount: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.length : 0,
                unusedBackupCodes: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.filter(code => !code.used).length : 0
            }
        });
    } catch (error) {
        console.error('Debug user 2FA error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user 2FA debug status'
        });
    }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

        // Find the user
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Generate new refresh token
        const newRefreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken,
                refreshToken: newRefreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified,
                    phoneVerified: user.phoneVerified,
                    twoFactorEnabled: user.twoFactorEnabled
                }
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);

        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to refresh token'
        });
    }
});

// Get system metrics timeline data
router.get('/system-metrics-timeline', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const hours = parseInt(req.query.hours) || 6; // Default to 6 hours
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        // Get user activity for simulation
        const userActivity = await AuditLog.aggregate([
            {
                $match: {
                    userId: userId,
                    timestamp: { $gte: cutoff }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%dT%H:00:00.000Z",
                            date: "$timestamp"
                        }
                    },
                    activityCount: { $sum: 1 },
                    loginCount: {
                        $sum: { $cond: [{ $eq: ["$action", "login"] }, 1, 0] }
                    },
                    apiCallCount: {
                        $sum: { $cond: [{ $in: ["$action", ["login", "profile_update", "password_change"]] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Create timeline data points with simulated metrics
        const timelineData = [];
        const now = new Date();

        for (let i = hours - 1; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            const timeKey = timestamp.toISOString().split('.')[0] + 'Z';

            const activity = userActivity.find(item => item._id === timeKey);
            const baseLoad = activity ? activity.activityCount : 0;

            // Simulate database response time (40-80ms based on activity)
            const dbResponseTime = 40 + (baseLoad * 2) + Math.floor(Math.random() * 20);

            // Simulate API response time (100-200ms based on activity)
            const apiResponseTime = 100 + (baseLoad * 5) + Math.floor(Math.random() * 50);

            // Simulate active sessions (1-5 based on login activity)
            const activeSessions = activity ? Math.min(5, Math.max(1, activity.loginCount + 1)) : Math.floor(Math.random() * 3) + 1;

            timelineData.push({
                timestamp: timestamp,
                databaseResponseTime: Math.round(dbResponseTime),
                apiResponseTime: Math.round(apiResponseTime),
                activeSessions: activeSessions
            });
        }

        res.json({
            success: true,
            data: timelineData
        });
    } catch (error) {
        console.error('System metrics timeline fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system metrics timeline'
        });
    }
});

// Get performance metrics data
router.get('/performance-metrics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const hours = parseInt(req.query.hours) || 6; // Default to 6 hours
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        // Get user activity for simulation
        const userActivity = await AuditLog.aggregate([
            {
                $match: {
                    userId: userId,
                    timestamp: { $gte: cutoff }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%dT%H:00:00.000Z",
                            date: "$timestamp"
                        }
                    },
                    activityCount: { $sum: 1 },
                    loginCount: {
                        $sum: { $cond: [{ $eq: ["$action", "login"] }, 1, 0] }
                    },
                    apiCallCount: {
                        $sum: { $cond: [{ $in: ["$action", ["login", "profile_update", "password_change"]] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Generate performance metrics based on activity
        const performanceData = {
            cpu: [],
            memory: [],
            disk: [],
            network: []
        };

        const now = new Date();

        for (let i = hours - 1; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            const timeKey = timestamp.toISOString().split('.')[0] + 'Z';

            const activity = userActivity.find(item => item._id === timeKey);
            const baseLoad = activity ? Math.min(activity.activityCount * 3, 60) : 15;

            // CPU usage (15-75% based on activity)
            performanceData.cpu.push({
                timestamp: timestamp,
                usage: Math.max(15, Math.min(75, baseLoad + Math.floor(Math.random() * 15)))
            });

            // Memory usage (35-65% based on activity)
            performanceData.memory.push({
                timestamp: timestamp,
                usage: Math.max(35, Math.min(65, baseLoad * 0.8 + Math.floor(Math.random() * 10)))
            });

            // Disk usage (55-75% with slow growth)
            performanceData.disk.push({
                timestamp: timestamp,
                usage: Math.max(55, Math.min(75, 60 + (i * 0.3) + Math.floor(Math.random() * 5)))
            });

            // Network throughput (0.5-4 MB/s based on activity)
            performanceData.network.push({
                timestamp: timestamp,
                throughput: Math.max(0.5, Math.min(4, (baseLoad / 25) + Math.random() * 1.5))
            });
        }

        res.json({
            success: true,
            data: performanceData
        });
    } catch (error) {
        console.error('Performance metrics fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance metrics'
        });
    }
});

module.exports = router; 