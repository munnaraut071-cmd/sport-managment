const AuditLog = require('../models/AuditLog');

/**
 * Audit Logger - Tracks all critical actions for security & compliance
 */

const AUDIT_ACTIONS = {
  // Auth actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  
  // Kit actions
  KIT_ISSUE: 'KIT_ISSUE',
  KIT_RETURN: 'KIT_RETURN',
  KIT_CREATE: 'KIT_CREATE',
  KIT_UPDATE: 'KIT_UPDATE',
  KIT_DELETE: 'KIT_DELETE',
  
  // User actions
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_SUSPEND: 'USER_SUSPEND',
  
  // Admin actions
  SETTINGS_CHANGE: 'SETTINGS_CHANGE',
  BULK_OPERATION: 'BULK_OPERATION',
  DATA_EXPORT: 'DATA_EXPORT',
  
  // AI/Security
  ANOMALY_DETECTED: 'ANOMALY_DETECTED',
  RISK_ALERT: 'RISK_ALERT',
  MAINTENANCE_PERFORMED: 'MAINTENANCE_PERFORMED'
};

/**
 * Log an audit event
 */
const logAudit = async ({
  action,
  userId,
  userEmail,
  userRole,
  targetId,
  targetType,
  details,
  ipAddress,
  userAgent,
  severity = 'info',
  metadata = {}
}) => {
  try {
    const auditEntry = new AuditLog({
      action,
      userId,
      userEmail,
      userRole,
      targetId,
      targetType,
      details,
      ipAddress,
      userAgent,
      severity,
      metadata,
      timestamp: new Date()
    });
    
    await auditEntry.save();
    
    // Log to console for real-time monitoring
    console.log(`[AUDIT] ${action} | ${userEmail} | ${severity} | ${new Date().toISOString()}`);
    
    return auditEntry;
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit logging should not break the app
    return null;
  }
};

/**
 * Middleware to automatically log requests
 */
const auditMiddleware = (action, options = {}) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to capture response
    res.json = function(data) {
      // Restore original method
      res.json = originalJson;
      
      // Log after response is sent
      const logData = {
        action,
        userId: req.user?._id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        details: {
          method: req.method,
          path: req.path,
          body: options.logBody ? req.body : undefined,
          query: req.query,
          statusCode: res.statusCode,
          response: options.logResponse ? data : undefined
        },
        severity: res.statusCode >= 400 ? 'warning' : 'info',
        metadata: {
          requestId: req.requestId,
          duration: Date.now() - (req.startTime || Date.now())
        }
      };
      
      // Add target info if available
      if (req.params.id) {
        logData.targetId = req.params.id;
        logData.targetType = options.targetType || 'unknown';
      }
      
      // Log asynchronously
      logAudit(logData).catch(console.error);
      
      // Call original json
      return originalJson.call(res, data);
    };
    
    next();
  };
};

/**
 * Get audit statistics
 */
const getAuditStats = async (days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  const stats = await AuditLog.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        severityCounts: {
          $push: '$severity'
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  // Get failed login attempts
  const failedLogins = await AuditLog.countDocuments({
    action: AUDIT_ACTIONS.LOGIN_FAILED,
    timestamp: { $gte: since }
  });
  
  // Get unique users
  const uniqueUsers = await AuditLog.distinct('userId', {
    timestamp: { $gte: since }
  });
  
  return {
    totalEvents: stats.reduce((sum, s) => sum + s.count, 0),
    actionBreakdown: stats,
    failedLoginAttempts: failedLogins,
    uniqueActiveUsers: uniqueUsers.length,
    period: days
  };
};

/**
 * Detect suspicious patterns from audit logs
 */
const detectSuspiciousPatterns = async () => {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Check for multiple failed logins
  const failedLogins = await AuditLog.aggregate([
    {
      $match: {
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        timestamp: { $gte: last24Hours }
      }
    },
    {
      $group: {
        _id: '$ipAddress',
        attempts: { $sum: 1 },
        lastAttempt: { $max: '$timestamp' }
      }
    },
    { $match: { attempts: { $gte: 5 } } }
  ]);
  
  // Check for unusual admin activity
  const adminActivity = await AuditLog.aggregate([
    {
      $match: {
        userRole: 'admin',
        timestamp: { $gte: last24Hours }
      }
    },
    {
      $group: {
        _id: '$userId',
        actions: { $sum: 1 },
        uniqueIps: { $addToSet: '$ipAddress' }
      }
    },
    { $match: { actions: { $gte: 50 } } }
  ]);
  
  // Check for after-hours access
  const afterHours = await AuditLog.countDocuments({
    timestamp: { $gte: last24Hours },
    $expr: {
      $or: [
        { $lt: [{ $hour: '$timestamp' }, 6] },
        { $gt: [{ $hour: '$timestamp' }, 22] }
      ]
    }
  });
  
  return {
    bruteForceAttempts: failedLogins.map(f => ({
      ipAddress: f._id,
      failedAttempts: f.attempts,
      lastAttempt: f.lastAttempt,
      risk: f.attempts > 10 ? 'HIGH' : 'MEDIUM'
    })),
    excessiveAdminActivity: adminActivity.map(a => ({
      userId: a._id,
      actionCount: a.actions,
      uniqueIps: a.uniqueIps.length,
      risk: a.uniqueIps.length > 3 ? 'HIGH' : 'MEDIUM'
    })),
    afterHoursActivity: afterHours,
    timestamp: new Date()
  };
};

module.exports = {
  AUDIT_ACTIONS,
  logAudit,
  auditMiddleware,
  getAuditStats,
  detectSuspiciousPatterns
};
