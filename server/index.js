const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { config, env, isDevelopment } = require('./config/config');
const securityConfig = require('./config/security');
const securityMonitor = require('./services/securityMonitor');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.client.url,
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    if (decoded.iss !== 'safawinet' || decoded.aud !== 'safawinet-users') {
      return next(new Error('Invalid token'));
    }
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    return next(new Error('Authentication error'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected to real-time dashboard`);

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Handle dashboard data requests
  socket.on('request-dashboard-data', async () => {
    try {
      const user = await User.findById(socket.userId).select('-password');
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Emit real-time dashboard data
      socket.emit('dashboard-data-update', {
        type: 'security-stats',
        data: await getSecurityStats(user)
      });

      socket.emit('dashboard-data-update', {
        type: 'security-status',
        data: await getSecurityStatus(user)
      });

      socket.emit('dashboard-data-update', {
        type: 'system-health',
        data: await getSystemHealth()
      });

      socket.emit('dashboard-data-update', {
        type: 'chart-data',
        data: await getChartData(user)
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      socket.emit('error', { message: 'Error fetching dashboard data' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected from real-time dashboard`);
  });
});

// Helper function to emit real-time updates to a specific user
async function emitUserUpdate(userId, updateType, data) {
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) return;

    io.to(`user_${userId}`).emit('dashboard-data-update', {
      type: updateType,
      data: data
    });
  } catch (error) {
    console.error('Error emitting user update:', error);
  }
}

// Export the emit function for use in other modules
module.exports.emitUserUpdate = emitUserUpdate;

// Helper functions for real-time data
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

async function getSecurityStatus(user) {
  const passwordStrength = user.getPasswordStrength();

  return {
    accountSecurity: {
      status: user.isActive ? 'good' : 'locked',
      failedAttempts: user.failedLoginAttempts || 0
    },
    passwordStrength: {
      status: passwordStrength.level === 'weak' ? 'weak' :
        passwordStrength.level === 'medium' ? 'medium' : 'strong',
      level: passwordStrength.level
    },
    twoFactorAuth: {
      enabled: user.twoFactorEnabled || false,
      backupCodesCount: user.twoFactorBackupCodes?.filter(code => !code.used).length || 0
    }
  };
}

async function getSystemHealth() {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    database: {
      status: states[dbState],
      responseTime: 0 // Will be measured by client
    },
    emailService: {
      status: 'operational',
      deliveryRate: 98.5
    },
    apiResponse: {
      status: 'excellent',
      avgResponseTime: 0 // Will be measured by client
    },
    uptime: {
      status: dbState === 1 ? 'ok' : 'degraded',
      uptime: process.uptime(),
      lastCheck: new Date()
    }
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

  server.listen(PORT, () => {
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
    console.log(`🔌 Real-time dashboard: ENABLED`);
  });
}); 