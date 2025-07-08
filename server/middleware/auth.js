const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { config } = require('../config/config');

// Middleware to verify JWT token from headers or cookies
const authenticateToken = async (req, res, next) => {
    try {
        let token = null;

        // Check for token in Authorization header
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // If no token in header, check for cookie
        if (!token && req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Check token issuer and audience
        if (decoded.issuer !== 'safawinet' || decoded.audience !== 'safawinet-users') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        // Add user to request object
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Middleware to check permissions for specific page and action
const requirePermission = (page, action) => {
    return (req, res, next) => {
        if (req.user.isAdmin) {
            return next();
        }

        if (!req.user.hasPermission(page, action)) {
            return res.status(403).json({
                success: false,
                message: `Insufficient permissions: ${action} on ${page}`
            });
        }
        next();
    };
};

// Middleware to check if user has any permission for a page
const requirePageAccess = (page) => {
    return (req, res, next) => {
        if (req.user.isAdmin) {
            return next();
        }

        const permissions = req.user.getPagePermissions(page);
        if (permissions.length === 0) {
            return res.status(403).json({
                success: false,
                message: `No access to ${page}`
            });
        }
        next();
    };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        let token = null;

        // Check for token in Authorization header
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // If no token in header, check for cookie
        if (!token && req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user && user.isActive) {
                req.user = user;
                req.token = token;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requirePermission,
    requirePageAccess,
    optionalAuth
}; 