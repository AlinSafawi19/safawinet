const crypto = require('crypto');
const securityConfig = require('../config/security');

class CSRFProtection {
  constructor() {
    this.tokens = new Map();
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  // Generate CSRF token
  generateToken(sessionId) {
    const token = crypto.randomBytes(securityConfig.csrf.tokenLength).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    this.tokens.set(token, {
      sessionId,
      expiresAt
    });
    
    return token;
  }

  // Validate CSRF token
  validateToken(token, sessionId) {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return false;
    }
    
    if (tokenData.sessionId !== sessionId) {
      return false;
    }
    
    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(token);
      return false;
    }
    
    return true;
  }

  // Cleanup expired tokens
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }

  // CSRF middleware
  middleware() {
    return (req, res, next) => {
      // Skip CSRF check for safe methods
      if (securityConfig.csrf.ignoreMethods.includes(req.method)) {
        return next();
      }

      // Skip CSRF check for API routes that use JWT
      if (req.path.startsWith('/api/auth/') || req.path.startsWith('/api/users/')) {
        return next();
      }

      const sessionId = req.session?.id || req.headers['x-session-id'];
      const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;

      if (!sessionId) {
        return res.status(403).json({
          success: false,
          message: 'Session required for CSRF protection'
        });
      }

      if (!csrfToken) {
        return res.status(403).json({
          success: false,
          message: 'CSRF token required'
        });
      }

      if (!this.validateToken(csrfToken, sessionId)) {
        return res.status(403).json({
          success: false,
          message: 'Invalid CSRF token'
        });
      }

      next();
    };
  }

  // Generate and send CSRF token
  generateAndSendToken(req, res) {
    const sessionId = req.session?.id || req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session required'
      });
    }

    const token = this.generateToken(sessionId);
    
    res.json({
      success: true,
      data: {
        csrfToken: token
      }
    });
  }

  // Cleanup on server shutdown
  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.tokens.clear();
  }
}

const csrfProtection = new CSRFProtection();

// Graceful shutdown
process.on('SIGTERM', () => {
  csrfProtection.cleanup();
});

process.on('SIGINT', () => {
  csrfProtection.cleanup();
});

module.exports = csrfProtection; 