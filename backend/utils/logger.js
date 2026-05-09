const winston = require('winston');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'sportkits-api' },
  transports: [
    // Write all logs with importance level of 'error' or less to 'error.log'
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with importance level of 'info' or less to 'combined.log'
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// If we're not in production, log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Security event logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'sportkits-security' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  securityLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Log security events
const logSecurityEvent = (eventType, details, userId = null, ip = null) => {
  securityLogger.info({
    eventType,
    userId,
    ip,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Log authentication events
const logAuthEvent = (action, userId, email, ip, success, details = {}) => {
  securityLogger.info({
    event: 'AUTHENTICATION',
    action,
    userId,
    email,
    ip,
    success,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Log API access
const logApiAccess = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user ? req.user._id : null
  };

  if (res.statusCode >= 400) {
    logger.warn('API Access Error', logData);
  } else {
    logger.info('API Access', logData);
  }
};

module.exports = {
  logger,
  securityLogger,
  logSecurityEvent,
  logAuthEvent,
  logApiAccess
};
