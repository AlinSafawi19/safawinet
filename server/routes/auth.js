const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticateToken } = require('../middleware/auth');
const { validateInput, sanitizeInput } = require('../middleware/validation');
const emailService = require('../services/emailService');
const securityConfig = require('../config/security');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// In-memory store for rate limiting (in production, use Redis)
const loginAttempts = new Map();
const blockedIPs = new Map();

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
        twoFactorCode: { type: 'string', maxLength: 10 }
    }
}), async (req, res) => {
    try {
        const { identifier, password, rememberMe, twoFactorCode } = req.body;

        // Find user by username, email, or phone
        const user = await User.findOne({
            $or: [
                { username: identifier },
                { email: identifier.toLowerCase() },
                { phone: identifier }
            ]
        });

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
            if (!twoFactorCode) {
                return res.status(401).json({
                    success: false,
                    message: 'Two-factor authentication code required',
                    requiresTwoFactor: true
                });
            }

            // Verify 2FA code
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 2 // Allow 2 time steps for clock skew
            });

            if (!verified) {
                await AuditLog.logEvent({
                    userId: user._id,
                    username: user.username,
                    action: 'login_failed',
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    success: false,
                    details: { reason: 'invalid_2fa_code' },
                    riskLevel: 'high'
                });

                return res.status(401).json({
                    success: false,
                    message: 'Invalid two-factor authentication code'
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
            success: true,
            sessionId,
            details: { twoFactorUsed: user.twoFactorEnabled }
        });

        // Return user data (without password) and token
        const userResponse = user.toJSON();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token,
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

        // Validate password strength
        const passwordValidation = securityConfig.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password does not meet security requirements',
                errors: passwordValidation.errors
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
            success: true
        });

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
            success: true
        });

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
        email: { required: true, type: 'email', maxLength: 100 },
        phone: { type: 'string', maxLength: 20 }
    }
}), async (req, res) => {
    try {
        const { firstName, lastName, email, phone } = req.body;

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
                email: email ? email.toLowerCase() : req.user.email,
                phone: phone || req.user.phone
            },
            { new: true, runValidators: true }
        ).select('-password');

        // Log profile update
        await AuditLog.logEvent({
            userId: req.user._id,
            username: req.user.username,
            action: 'profile_update',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
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

// Change password
router.put('/change-password', authenticateToken, sanitizeInput, validateInput({
    body: {
        currentPassword: { required: true, type: 'string', minLength: 6 },
        newPassword: { required: true, type: 'string', minLength: 8, maxLength: 128 }
    }
}), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate password strength
        const passwordValidation = securityConfig.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password does not meet security requirements',
                errors: passwordValidation.errors
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
            success: true
        });

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
                hasAuditLogsPermission: user.hasPermission('audit-logs', 'view'),
                hasAuditPermission: user.hasPermission('audit-logs', 'view'),
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

module.exports = router; 