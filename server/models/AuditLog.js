const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'login_failed',
      'password_change',
      'password_reset_request',
      'password_reset_complete',
      'two_factor_enable',
      'two_factor_disable',
      'two_factor_verify',
      'two_factor_backup_used',
      'account_lock',
      'account_unlock',
      'session_create',
      'session_destroy',
      'profile_update',
      'permission_change',
      'user_create',
      'user_update',
      'user_delete',
      'admin_action',
      'suspicious_activity',
      'rate_limit_exceeded',
      'security_alert'
    ]
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  device: {
    type: String
  },
  location: {
    country: String,
    city: String,
    region: String
  },
  success: {
    type: Boolean,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  sessionId: {
    type: String
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetResource: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });
auditLogSchema.index({ success: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, timestamp: -1 });

// Compound indexes for pagination queries
auditLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, riskLevel: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, success: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, riskLevel: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, success: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, success: 1, timestamp: -1 });

// Static method to log events
auditLogSchema.statics.logEvent = function(eventData) {
  const log = new this(eventData);
  return log.save();
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('targetUserId', 'username firstName lastName');
};

// Static method to get suspicious activity
auditLogSchema.statics.getSuspiciousActivity = function(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    timestamp: { $gte: cutoff },
    $or: [
      { riskLevel: { $in: ['high', 'critical'] } },
      { action: 'suspicious_activity' },
      { action: 'rate_limit_exceeded' },
      { action: 'security_alert' }
    ]
  }).sort({ timestamp: -1 });
};

// Static method to get failed login attempts
auditLogSchema.statics.getFailedLogins = function(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    timestamp: { $gte: cutoff },
    action: 'login_failed'
  }).sort({ timestamp: -1 });
};

// Static method to get security alerts
auditLogSchema.statics.getSecurityAlerts = function(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    timestamp: { $gte: cutoff },
    $or: [
      { riskLevel: { $in: ['high', 'critical'] } },
      { action: 'suspicious_activity' },
      { action: 'security_alert' }
    ]
  }).sort({ timestamp: -1 });
};

// Static method to clean old logs
auditLogSchema.statics.cleanOldLogs = function(days = 90) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.deleteMany({ timestamp: { $lt: cutoff } });
};

// Static method for paginated audit logs with comprehensive server-side filtering
auditLogSchema.statics.getPaginatedLogs = function(options) {
  const {
    userId = null,
    page = 1,
    limit = 25,
    cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000),
    action = null,
    riskLevel = null,
    success = null,
    ip = null,
    device = null,
    location = null,
    sessionId = null,
    filterUserId = null
  } = options;

  // Build comprehensive server-side query
  const query = { timestamp: { $gte: cutoff } };
  
  // User filtering
  if (userId) query.userId = userId;
  if (filterUserId) {
    // Support both single user ID and multiple user IDs (comma-separated)
    const userIds = filterUserId.split(',').map(id => id.trim()).filter(id => id);
    if (userIds.length === 1) {
      query.userId = userIds[0];
    } else if (userIds.length > 1) {
      query.userId = { $in: userIds };
    }
  }
  
  // Action filtering
  if (action) {
    if (Array.isArray(action)) {
      query.action = { $in: action };
    } else {
      query.action = action;
    }
  }
  
  // Risk level filtering
  if (riskLevel) {
    if (Array.isArray(riskLevel)) {
      query.riskLevel = { $in: riskLevel };
    } else {
      query.riskLevel = riskLevel;
    }
  }
  
  // Success/failure filtering
  if (success !== null && success !== undefined) {
    query.success = success;
  }
  
  // IP address filtering
  if (ip) {
    query.ip = { $regex: ip, $options: 'i' };
  }
  
  // Device filtering
  if (device) {
    query.device = { $regex: device, $options: 'i' };
  }
  
  // Location filtering
  if (location) {
    if (location.country) {
      query['location.country'] = { $regex: location.country, $options: 'i' };
    }
    if (location.city) {
      query['location.city'] = { $regex: location.city, $options: 'i' };
    }
  }
  
  // Session ID filtering
  if (sessionId) {
    query.sessionId = sessionId;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Add debugging for query construction
  console.log('🔍 Database query:', JSON.stringify(query, null, 2));

  return Promise.all([
    this.countDocuments(query),
    this.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean()
  ]).then(([total, logs]) => {
    const result = {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };
    
    console.log('📊 Query results:', {
      totalRecords: total,
      returnedRecords: logs.length,
      page: page,
      limit: limit,
      totalPages: result.totalPages
    });
    
    return result;
  });
};

module.exports = mongoose.model('AuditLog', auditLogSchema); 