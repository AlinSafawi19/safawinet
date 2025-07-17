const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'safawinet',
    audience: 'safawinet-users',
    algorithm: 'HS256'
  },

  // Password Configuration
  password: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
    preventCommonPasswords: true
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000), // 1 minute in dev, 15 minutes in prod
    maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || (process.env.NODE_ENV === 'development' ? 20 : 5),
    blockDurationMs: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION_MS) || (process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 30 * 60 * 1000), // 5 minutes in dev, 30 minutes in prod
    // Per-user rate limiting
    userWindowMs: process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 60 * 60 * 1000, // 5 minutes in dev, 1 hour in prod
    userMaxAttempts: process.env.NODE_ENV === 'development' ? 50 : 10,
    // API rate limiting
    apiWindowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in prod
    apiMaxRequests: process.env.NODE_ENV === 'development' ? 500 : 100
  },

  // Cookie Configuration
  cookie: {
    secret: process.env.COOKIE_SECRET || 'your-super-secret-cookie-key-change-this-in-production',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400 // 24 hours
  },

  // Session Configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    rolling: true,
    secure: process.env.NODE_ENV === 'production',
    name: 'safawinet_session'
  },

  // Security Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Download-Options': 'noopen',
    'X-DNS-Prefetch-Control': 'off'
  },

  // CSRF Protection
  csrf: {
    enabled: true,
    secret: process.env.CSRF_SECRET || 'your-csrf-secret-key-change-this',
    tokenLength: 32,
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
  },

  // Input Validation
  validation: {
    maxInputLength: 1000,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    sanitizeHtml: true
  },

  // Environment-specific settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Validation helpers
  validatePassword: (password) => {
    const config = securityConfig.password;
    
    // Check length
    if (password.length < config.minLength || password.length > config.maxLength) {
      return {
        isValid: false,
        errors: { length: `Password must be between ${config.minLength} and ${config.maxLength} characters` }
      };
    }

    // Check complexity requirements
    const hasUppercase = config.requireUppercase ? /[A-Z]/.test(password) : true;
    const hasLowercase = config.requireLowercase ? /[a-z]/.test(password) : true;
    const hasNumbers = config.requireNumbers ? /\d/.test(password) : true;
    const hasSpecialChars = config.requireSpecialChars ? /[@$!%*?&]/.test(password) : true;

    // Check for common passwords (if enabled)
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    const isCommonPassword = config.preventCommonPasswords && commonPasswords.includes(password.toLowerCase());

    return {
      isValid: hasUppercase && hasLowercase && hasNumbers && hasSpecialChars && !isCommonPassword,
      errors: {
        uppercase: !hasUppercase,
        lowercase: !hasLowercase,
        numbers: !hasNumbers,
        specialChars: !hasSpecialChars,
        commonPassword: isCommonPassword
      }
    };
  },

  getPasswordRequirements: () => {
    const config = securityConfig.password;
    return {
      minLength: config.minLength,
      maxLength: config.maxLength,
      requireUppercase: config.requireUppercase,
      requireLowercase: config.requireLowercase,
      requireNumbers: config.requireNumbers,
      requireSpecialChars: config.requireSpecialChars,
      preventCommonPasswords: config.preventCommonPasswords
    };
  },

  // Generate secure random tokens
  generateSecureToken: (length = 32) => {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  },

  // Hash sensitive data
  hashData: (data) => {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Sanitize user input
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
};

module.exports = securityConfig; 