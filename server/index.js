const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { config, env, isDevelopment } = require('./config/config');
const securityConfig = require('./config/security');
const securityMonitor = require('./services/securityMonitor');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = config.server.port;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// CORS configuration
app.use(cors({
  origin: securityConfig.cors.origin,
  credentials: securityConfig.cors.credentials,
  methods: securityConfig.cors.methods,
  allowedHeaders: securityConfig.cors.allowedHeaders
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', globalLimiter);

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(securityConfig.cookie.secret));

// Security headers middleware
app.use((req, res, next) => {
  // Set security headers
  Object.entries(securityConfig.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Additional security headers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  
  next();
});

// Request logging middleware (development only)
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Security monitoring routes (admin only)
app.get('/api/security/report', async (req, res) => {
  try {
    const report = await securityMonitor.generateSecurityReport(24);
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Security report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate security report'
    });
  }
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is running successfully!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env,
        database: {
            status: states[dbState],
            readyState: dbState
        },
        server: {
            port: PORT,
            url: config.server.url
        },
        security: {
            cors: securityConfig.cors.origin,
            jwt: {
                issuer: securityConfig.jwt.issuer,
                audience: securityConfig.jwt.audience
            },
            rateLimiting: {
                enabled: true,
                windowMs: securityConfig.rateLimit.windowMs,
                maxAttempts: securityConfig.rateLimit.maxAttempts
            },
            twoFactor: {
                enabled: true,
                algorithm: 'TOTP'
            },
            monitoring: {
                enabled: true,
                suspiciousActivityDetection: true
            }
        }
    };

    // Return 503 if database is not connected
    if (dbState !== 1) {
        health.status = 'degraded';
        health.database.status = 'disconnected';
        return res.status(503).json(health);
    }

    res.json(health);
});

// MongoDB Connection with enhanced security
const connectDB = async () => {
    try {
        const mongoOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        // Add authentication in production
        if (process.env.NODE_ENV === 'production') {
            mongoOptions.auth = {
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD
            };
            mongoOptions.ssl = true;
            mongoOptions.sslValidate = true;
        }

        await mongoose.connect(config.database.uri, mongoOptions);
        console.log(`MongoDB connected successfully to ${config.database.uri}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Test MongoDB connection route
app.get('/api/test-mongo', async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        res.json({
            message: 'MongoDB connection test',
            status: states[dbState],
            readyState: dbState,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'MongoDB test failed',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    // Don't leak error details in production
    const message = isDevelopment ? err.message : 'Internal server error';
    const stack = isDevelopment ? err.stack : undefined;
    
    res.status(500).json({
        success: false,
        message: message,
        ...(stack && { stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
});

// Connect to MongoDB and start server
connectDB().then(() => {
    // Start security monitoring
    securityMonitor.startMonitoring();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server is running in ${env} mode on port ${PORT}`);
        console.log(`🔗 Server URL: ${config.server.url}`);
        console.log(`🌐 Client URL: ${config.client.url}`);
        console.log(`🗄️  Database: ${config.database.uri}`);
        console.log(`🔒 Security: CORS enabled for ${securityConfig.cors.origin}`);
        console.log(`🛡️  Security monitoring: ENABLED`);
        console.log(`🔐 Two-factor authentication: ENABLED`);
        console.log(`📊 Audit logging: ENABLED`);
        console.log(`📧 Email notifications: ENABLED`);
        console.log(`⚡ Rate limiting: ENABLED`);
        console.log(`🔍 Suspicious activity detection: ENABLED`);
    });
}); 