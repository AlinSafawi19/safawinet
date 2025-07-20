const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const emailService = require('./emailService');

class SecurityMonitor {
  constructor() {
    this.suspiciousPatterns = new Map();
    this.alertThresholds = {
      failedLogins: 5, // per hour
      newLocations: 3, // per day
      unusualActivity: 10, // per hour
      accountLockouts: 2 // per day
    };
  }

  // Monitor login attempts
  async monitorLoginAttempt(userId, ip, userAgent, success) {
    const key = `login_${userId}`;
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    if (!this.suspiciousPatterns.has(key)) {
      this.suspiciousPatterns.set(key, []);
    }

    const attempts = this.suspiciousPatterns.get(key);
    attempts.push({ timestamp: now, ip, userAgent, success });

    // Keep only last hour
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > hourAgo);
    this.suspiciousPatterns.set(key, recentAttempts);

    // Check for suspicious patterns
    await this.detectSuspiciousActivity(userId, recentAttempts);
  }

  // Detect suspicious activity
  async detectSuspiciousActivity(userId, attempts) {
    const user = await User.findById(userId);
    if (!user) return;

    const failedAttempts = attempts.filter(a => !a.success).length;
    const uniqueIPs = new Set(attempts.map(a => a.ip)).size;
    const uniqueUserAgents = new Set(attempts.map(a => a.userAgent)).size;

    let alerts = [];

    // Multiple failed attempts
    if (failedAttempts >= this.alertThresholds.failedLogins) {
      alerts.push({
        type: 'multiple_failed_logins',
        severity: 'high',
        message: `Multiple failed login attempts detected (${failedAttempts} in the last hour)`
      });
    }

    // Multiple IP addresses
    if (uniqueIPs > 3) {
      alerts.push({
        type: 'multiple_ips',
        severity: 'medium',
        message: `Login attempts from ${uniqueIPs} different IP addresses`
      });
    }

    // Multiple user agents
    if (uniqueUserAgents > 3) {
      alerts.push({
        type: 'multiple_user_agents',
        severity: 'medium',
        message: `Login attempts from ${uniqueUserAgents} different devices/browsers`
      });
    }

    // Send alerts if any detected
    if (alerts.length > 0) {
      await this.sendSecurityAlerts(user, alerts);
    }
  }

  // Send security alerts
  async sendSecurityAlerts(user, alerts) {
    for (const alert of alerts) {
      // Log security alert
      await AuditLog.logEvent({
        userId: user._id,
        username: user.username,
        action: 'security_alert',
        ip: 'system',
        userAgent: 'security_monitor',
        success: true,
        details: alert,
        riskLevel: alert.severity
      });

      // Send email alert
      await emailService.sendSecurityAlert(user, {
        type: alert.type,
        ip: 'Multiple IPs detected',
        device: 'Multiple devices detected',
        severity: alert.severity
      });
    }
  }

  // Monitor account lockouts
  async monitorAccountLockout(userId, reason) {
    const user = await User.findById(userId);
    if (!user) return;

    // Log account lockout
    await AuditLog.logEvent({
      userId: user._id,
      username: user.username,
      action: 'account_lock',
      ip: 'system',
      userAgent: 'security_monitor',
      success: true,
      details: { reason },
      riskLevel: 'high'
    });

    // Send email notification
    await emailService.sendAccountLockedEmail(user, reason);
  }

  // Monitor new login locations
  async monitorNewLocation(userId, ip, userAgent) {
    const user = await User.findById(userId);
    if (!user) return;

    // Check if this is a new location (simplified - in production, use geolocation)
    const recentLogins = await AuditLog.find({
      userId: user._id,
      action: 'login',
      success: true,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ timestamp: -1 });

    const uniqueIPs = new Set(recentLogins.map(log => log.ip));
    
    if (uniqueIPs.size > this.alertThresholds.newLocations) {
      await this.sendSecurityAlerts(user, [{
        type: 'new_location',
        severity: 'medium',
        message: `Login from new location detected (${uniqueIPs.size} locations in 24h)`
      }]);
    }
  }

  // Monitor unusual activity patterns
  async monitorActivityPatterns(userId) {
    const user = await User.findById(userId);
    if (!user) return;

    const recentActivity = await AuditLog.find({
      userId: user._id,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    const activityCount = recentActivity.length;
    
    if (activityCount > this.alertThresholds.unusualActivity) {
      await this.sendSecurityAlerts(user, [{
        type: 'unusual_activity',
        severity: 'medium',
        message: `Unusual activity detected (${activityCount} actions in the last hour)`
      }]);
    }
  }

  // Generate security report
  async generateSecurityReport(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const report = {
      period: `${hours} hours`,
      generatedAt: new Date(),
      statistics: {},
      alerts: [],
      recommendations: []
    };

    // Failed login attempts
    const failedLogins = await AuditLog.countDocuments({
      action: 'login_failed',
      timestamp: { $gte: cutoff }
    });

    // Successful logins
    const successfulLogins = await AuditLog.countDocuments({
      action: 'login',
      success: true,
      timestamp: { $gte: cutoff }
    });

    // Security alerts
    const securityAlerts = await AuditLog.countDocuments({
      action: 'security_alert',
      timestamp: { $gte: cutoff }
    });

    // Account lockouts
    const accountLockouts = await AuditLog.countDocuments({
      action: 'account_lock',
      timestamp: { $gte: cutoff }
    });

    // Password changes
    const passwordChanges = await AuditLog.countDocuments({
      action: 'password_change',
      timestamp: { $gte: cutoff }
    });

    // 2FA activities
    const twoFactorActivities = await AuditLog.countDocuments({
      action: { $in: ['two_factor_enable', 'two_factor_disable'] },
      timestamp: { $gte: cutoff }
    });

    report.statistics = {
      failedLogins,
      successfulLogins,
      securityAlerts,
      accountLockouts,
      passwordChanges,
      twoFactorActivities,
      loginSuccessRate: successfulLogins / (successfulLogins + failedLogins) * 100
    };

    // Generate alerts based on statistics
    if (failedLogins > 50) {
      report.alerts.push({
        type: 'high_failed_logins',
        message: `High number of failed login attempts: ${failedLogins}`,
        severity: 'high'
      });
    }

    if (accountLockouts > 10) {
      report.alerts.push({
        type: 'high_account_lockouts',
        message: `High number of account lockouts: ${accountLockouts}`,
        severity: 'medium'
      });
    }

    if (report.statistics.loginSuccessRate < 80) {
      report.alerts.push({
        type: 'low_success_rate',
        message: `Low login success rate: ${report.statistics.loginSuccessRate.toFixed(1)}%`,
        severity: 'medium'
      });
    }

    // Generate recommendations
    if (failedLogins > 100) {
      report.recommendations.push('Consider implementing additional rate limiting measures');
    }

    if (securityAlerts > 20) {
      report.recommendations.push('Review and strengthen security policies');
    }

    if (twoFactorActivities < 5) {
      report.recommendations.push('Encourage users to enable two-factor authentication');
    }

    return report;
  }

  // Clean up old patterns
  cleanupOldPatterns() {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    for (const [key, attempts] of this.suspiciousPatterns.entries()) {
      const recentAttempts = attempts.filter(attempt => attempt.timestamp > hourAgo);
      if (recentAttempts.length === 0) {
        this.suspiciousPatterns.delete(key);
      } else {
        this.suspiciousPatterns.set(key, recentAttempts);
      }
    }
  }

  // Start monitoring
  startMonitoring() {
    // Clean up old patterns every hour
    setInterval(() => {
      this.cleanupOldPatterns();
    }, 60 * 60 * 1000);
  }
}

module.exports = new SecurityMonitor(); 