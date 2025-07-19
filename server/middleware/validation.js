const securityConfig = require('../config/security');

// Input validation middleware
const validateInput = (schema) => {
    return (req, res, next) => {
        const errors = [];

        // Validate request body
        if (req.body && schema.body) {
            Object.keys(schema.body).forEach(field => {
                const value = req.body[field];
                const rules = schema.body[field];

                const fieldErrors = validateField(value, rules, field);
                errors.push(...fieldErrors);
            });
        }

        // Validate query parameters
        if (req.query && schema.query) {
            Object.keys(schema.query).forEach(field => {
                const value = req.query[field];
                const rules = schema.query[field];

                const fieldErrors = validateField(value, rules, field);
                errors.push(...fieldErrors);
            });
        }

        // Validate URL parameters
        if (req.params && schema.params) {
            Object.keys(schema.params).forEach(field => {
                const value = req.params[field];
                const rules = schema.params[field];

                const fieldErrors = validateField(value, rules, field);
                errors.push(...fieldErrors);
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        next();
    };
};

// Validate individual field
const validateField = (value, rules, fieldName) => {
    const errors = [];

    // Required check
    if (rules.required && (!value || value.toString().trim() === '')) {
        errors.push(`${fieldName} is required`);
        return errors;
    }

    // Skip other validations if value is empty and not required
    if (!value || value.toString().trim() === '') {
        return errors;
    }

    const stringValue = value.toString();

    // Type validation
    if (rules.type) {
        switch (rules.type) {
            case 'string':
                if (typeof value !== 'string') {
                    errors.push(`${fieldName} must be a string`);
                }
                break;
            case 'email':
                if (!securityConfig.validateEmail(stringValue)) {
                    errors.push(`${fieldName} must be a valid email address`);
                }
                break;
            case 'number':
                if (isNaN(Number(value))) {
                    errors.push(`${fieldName} must be a number`);
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean' && !['true', 'false', '0', '1'].includes(stringValue)) {
                    errors.push(`${fieldName} must be a boolean`);
                }
                break;
            case 'date':
                if (isNaN(Date.parse(stringValue))) {
                    errors.push(`${fieldName} must be a valid date`);
                }
                break;
        }
    }

    // Length validation
    if (rules.minLength && stringValue.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
    }

    if (rules.maxLength && stringValue.length > rules.maxLength) {
        errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
        errors.push(`${fieldName} format is invalid`);
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(stringValue)) {
        errors.push(`${fieldName} must be one of: ${rules.enum.join(', ')}`);
    }

    // Range validation for numbers
    if (rules.type === 'number' || rules.type === 'date') {
        const numValue = rules.type === 'date' ? Date.parse(stringValue) : Number(value);

        if (rules.min !== undefined && numValue < rules.min) {
            errors.push(`${fieldName} must be at least ${rules.min}`);
        }

        if (rules.max !== undefined && numValue > rules.max) {
            errors.push(`${fieldName} must be no more than ${rules.max}`);
        }
    }

    return errors;
};

// Sanitize input middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize request body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = securityConfig.sanitizeInput(req.body[key]);
            }
        });
    }

    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = securityConfig.sanitizeInput(req.query[key]);
            }
        });
    }

    // Sanitize URL parameters
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            if (typeof req.params[key] === 'string') {
                req.params[key] = securityConfig.sanitizeInput(req.params[key]);
            }
        });
    }

    next();
};

// Notification validation
const validateNotification = (req, res, next) => {
    const errors = [];
    const { title, message, type, category, priority, channels, targetUsers } = req.body;

    // Required fields
    if (!title || title.trim().length === 0) {
        errors.push('Title is required');
    } else if (title.length > 200) {
        errors.push('Title must be no more than 200 characters');
    }

    if (!message || message.trim().length === 0) {
        errors.push('Message is required');
    } else if (message.length > 1000) {
        errors.push('Message must be no more than 1000 characters');
    }

    // Type validation
    const validTypes = ['info', 'success', 'warning', 'error', 'security', 'system', 'user', 'email', 'sms'];
    if (type && !validTypes.includes(type)) {
        errors.push(`Type must be one of: ${validTypes.join(', ')}`);
    }

    // Category validation
    const validCategories = ['security', 'system', 'user', 'email', 'sms', 'audit', 'login', 'password', 'profile', 'admin', 'general'];
    if (category && !validCategories.includes(category)) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Priority validation
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
        errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Channels validation
    const validChannels = ['in_app', 'email', 'sms', 'push'];
    if (channels && Array.isArray(channels)) {
        channels.forEach(channel => {
            if (!validChannels.includes(channel)) {
                errors.push(`Channel must be one of: ${validChannels.join(', ')}`);
            }
        });
    }

    // Target users validation (if provided)
    if (targetUsers && Array.isArray(targetUsers)) {
        targetUsers.forEach(userId => {
            if (typeof userId !== 'string' || userId.trim().length === 0) {
                errors.push('Invalid target user ID');
            }
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Notification validation failed',
            errors: errors
        });
    }

    next();
};

// File upload validation
const validateFileUpload = (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next();
    }

    const errors = [];

    Object.keys(req.files).forEach(fieldName => {
        const file = req.files[fieldName];

        // Check file size
        if (file.size > securityConfig.validation.maxFileSize) {
            errors.push(`${fieldName} file size exceeds maximum allowed size`);
        }

        // Check file type
        if (!securityConfig.validation.allowedFileTypes.includes(file.mimetype)) {
            errors.push(`${fieldName} file type is not allowed`);
        }

        // Check for malicious file extensions
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (dangerousExtensions.includes(fileExtension)) {
            errors.push(`${fieldName} file type is not allowed for security reasons`);
        }
    });

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'File validation failed',
            errors: errors
        });
    }

    next();
};

// Rate limiting per user
const userRateLimit = (windowMs, maxRequests) => {
    const requests = new Map();

    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const now = Date.now();

        if (!requests.has(userId)) {
            requests.set(userId, []);
        }

        const userRequests = requests.get(userId);

        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => now - time < windowMs);

        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded for this user'
            });
        }

        validRequests.push(now);
        requests.set(userId, validRequests);

        next();
    };
};

// Common validation schemas
const commonSchemas = {
    login: {
        body: {
            identifier: {
                required: true,
                type: 'string',
                minLength: 3,
                maxLength: 100
            },
            password: {
                required: true,
                type: 'string',
                minLength: 6,
                maxLength: 128
            },
            rememberMe: {
                type: 'boolean'
            }
        }
    },

    userProfile: {
        body: {
            firstName: {
                required: true,
                type: 'string',
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-Z\s]+$/
            },
            lastName: {
                required: true,
                type: 'string',
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-Z\s]+$/
            },
            email: {
                required: true,
                type: 'email',
                maxLength: 100
            },
            phone: {
                type: 'string',
                maxLength: 20,
                pattern: /^[\d\s\-\(\)\+]+$/
            }
        }
    },

    changePassword: {
        body: {
            currentPassword: {
                required: true,
                type: 'string',
                minLength: 6
            },
            newPassword: {
                required: true,
                type: 'string',
                minLength: 8,
                maxLength: 128
            }
        }
    },

    userId: {
        params: {
            id: {
                required: true,
                type: 'string',
                pattern: /^[0-9a-fA-F]{24}$/
            }
        }
    }
};

module.exports = {
    validateInput,
    sanitizeInput,
    validateFileUpload,
    validateNotification,
    userRateLimit,
    commonSchemas
}; 