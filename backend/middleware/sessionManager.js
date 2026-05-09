const crypto = require('crypto');

/**
 * Session Management with Enhanced Security
 * Provides secure session handling as alternative to localStorage
 */

class SessionManager {
  constructor() {
    this.sessions = new Map(); // In production, use Redis or database
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Generate secure session token
   */
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create new session
   */
  createSession(userId, userData, req) {
    const sessionId = this.generateSessionToken();
    const sessionData = {
      userId,
      userData,
      createdAt: new Date(),
      lastAccessed: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      isActive: true
    };

    this.sessions.set(sessionId, sessionData);
    
    // Clean up old sessions
    this.cleanupExpiredSessions();

    return {
      sessionId,
      expiresAt: new Date(Date.now() + this.sessionTimeout)
    };
  }

  /**
   * Validate and get session
   */
  getSession(sessionId, req) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() - session.lastAccessed.getTime() > this.sessionTimeout) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last accessed time
    session.lastAccessed = new Date();
    
    // Optional: Check IP address consistency
    if (session.ipAddress !== req.ip) {
      // Log suspicious activity but allow for now (IPs can change)
      console.warn(`Session IP change detected for user ${session.userId}: ${session.ipAddress} -> ${req.ip}`);
    }

    return session;
  }

  /**
   * Destroy session
   */
  destroySession(sessionId) {
    this.sessions.delete(sessionId);
  }

  /**
   * Destroy all sessions for a user
   */
  destroyUserSessions(userId) {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get active sessions for user
   */
  getUserSessions(userId) {
    const userSessions = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId && session.isActive) {
        userSessions.push({
          sessionId,
          createdAt: session.createdAt,
          lastAccessed: session.lastAccessed,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent
        });
      }
    }
    return userSessions;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccessed.getTime() > this.sessionTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Set session cookie with security flags
   */
  setSessionCookie(res, sessionId) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('sessionId', sessionId, {
      httpOnly: true, // Prevent XSS
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: this.sessionTimeout,
      path: '/'
    });
  }

  /**
   * Clear session cookie
   */
  clearSessionCookie(res) {
    res.cookie('sessionId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/'
    });
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Middleware to handle sessions
const sessionMiddleware = (req, res, next) => {
  const sessionId = req.cookies?.sessionId;
  
  if (sessionId) {
    const session = sessionManager.getSession(sessionId, req);
    if (session) {
      req.session = session;
      req.user = session.userData;
    }
  }
  
  next();
};

module.exports = {
  SessionManager: sessionManager,
  sessionMiddleware
};
