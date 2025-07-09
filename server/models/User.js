const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // 2FA Configuration
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false // Don't include in queries by default
  },
  twoFactorBackupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  // Account Security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: {
    type: Date
  },
  lastFailedLogin: {
    type: Date
  },
  // Password Reset
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date
  },
  // Session Management
  activeSessions: [{
    sessionId: String,
    device: String,
    ip: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }],
  maxSessions: {
    type: Number,
    default: 5
  },
  permissions: [{
    page: {
      type: String,
      required: true,
      enum: ['dashboard', 'audit-logs', 'knowledge-guide']
    },
    actions: [{
      type: String,
      enum: ['view', 'add', 'edit', 'delete']
    }]
  }],
  lastLogin: {
    type: Date
  },
  welcomeEmailSent: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has permission for specific action on page
userSchema.methods.hasPermission = function(page, action) {
  if (this.isAdmin) return true;
  
  const permission = this.permissions.find(p => p.page === page);
  if (!permission) return false;
  
  return permission.actions.includes(action);
};

// Method to get user's permissions for a specific page
userSchema.methods.getPagePermissions = function(page) {
  if (this.isAdmin) return ['view', 'add', 'edit', 'delete'];
  
  const permission = this.permissions.find(p => p.page === page);
  return permission ? permission.actions : [];
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  if (!this.accountLocked) return false;
  
  if (this.lockedUntil && new Date() > this.lockedUntil) {
    // Auto-unlock if lock period has expired
    this.accountLocked = false;
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    return false;
  }
  
  return true;
};

// Method to increment failed login attempts
userSchema.methods.incrementFailedAttempts = function() {
  this.failedLoginAttempts += 1;
  this.lastFailedLogin = new Date();
  
  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.accountLocked = true;
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return this.save();
};

// Method to reset failed login attempts
userSchema.methods.resetFailedAttempts = function() {
  this.failedLoginAttempts = 0;
  this.accountLocked = false;
  this.lockedUntil = null;
  return this.save();
};

// Method to add new session
userSchema.methods.addSession = function(sessionData) {
  // Remove old sessions if max sessions reached
  if (this.activeSessions.length >= this.maxSessions) {
    this.activeSessions.sort((a, b) => b.lastActivity - a.lastActivity);
    this.activeSessions = this.activeSessions.slice(0, this.maxSessions - 1);
  }
  
  this.activeSessions.push(sessionData);
  return this.save();
};

// Method to remove session
userSchema.methods.removeSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(session => session.sessionId !== sessionId);
  return this.save();
};

// Method to update session activity
userSchema.methods.updateSessionActivity = function(sessionId) {
  const session = this.activeSessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve();
};

// Method to generate backup codes for 2FA
userSchema.methods.generateBackupCodes = function() {
  const crypto = require('crypto');
  const codes = [];
  
  for (let i = 0; i < 10; i++) {
    codes.push({
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      used: false
    });
  }
  
  this.twoFactorBackupCodes = codes;
  return this.save();
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.twoFactorSecret;
    delete ret.passwordResetToken;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 