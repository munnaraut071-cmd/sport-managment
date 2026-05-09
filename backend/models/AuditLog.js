const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'REGISTER', 'PASSWORD_CHANGE',
      'KIT_ISSUE', 'KIT_RETURN', 'KIT_CREATE', 'KIT_UPDATE', 'KIT_DELETE',
      'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_SUSPEND',
      'SETTINGS_CHANGE', 'BULK_OPERATION', 'DATA_EXPORT',
      'ANOMALY_DETECTED', 'RISK_ALERT', 'MAINTENANCE_PERFORMED'
    ],
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  userEmail: String,
  userRole: String,
  
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  targetType: String,
  
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  ipAddress: String,
  userAgent: String,
  
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Indexes for efficient querying
auditLogSchema.index({ timestamp: -1, action: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

// Auto-expire old logs after 1 year
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
