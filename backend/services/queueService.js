/**
 * Background Job Queue Service
 * Bull queue with Redis for background processing
 */

const Queue = require('bull');
const path = require('path');

// Redis configuration
const redisConfig = {
  redis: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || 'localhost',
  }
};

// Queue definitions
const queues = {
  // Email notification queue
  email: new Queue('email notifications', redisConfig),
  
  // AI processing queue
  ai: new Queue('ai processing', redisConfig),
  
  // Report generation queue
  reports: new Queue('report generation', redisConfig),
  
  // Data export queue
  exports: new Queue('data exports', redisConfig),
  
  // Reminder queue
  reminders: new Queue('reminders', redisConfig),
  
  // Audit log queue
  audit: new Queue('audit logs', redisConfig),
};

class QueueService {
  constructor() {
    this.queues = queues;
    this.setupProcessors();
    this.setupEventHandlers();
  }

  setupProcessors() {
    // Email processor
    this.queues.email.process(async (job) => {
      const { type, data } = job.data;
      console.log(`Processing email job ${job.id}: ${type}`);
      
      try {
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true, message: `Email ${type} sent` };
      } catch (error) {
        console.error('Email job failed:', error);
        throw error;
      }
    });

    // AI processor
    this.queues.ai.process(async (job) => {
      const { type, data } = job.data;
      console.log(`Processing AI job ${job.id}: ${type}`);
      
      try {
        const aiService = require('./aiService');
        
        switch (type) {
          case 'forecast':
            return await aiService.forecastDemand(data);
          case 'late_return_prediction':
            return await aiService.predictLateReturn(data);
          case 'usage_analysis':
            return await aiService.analyzeUsagePatterns(data);
          default:
            throw new Error(`Unknown AI job type: ${type}`);
        }
      } catch (error) {
        console.error('AI job failed:', error);
        throw error;
      }
    });

    // Report processor
    this.queues.reports.process(async (job) => {
      const { type, data } = job.data;
      console.log(`Processing report job ${job.id}: ${type}`);
      
      try {
        // Generate report logic here
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return { 
          success: true, 
          reportUrl: `/reports/${job.id}.pdf`,
          message: `Report ${type} generated` 
        };
      } catch (error) {
        console.error('Report job failed:', error);
        throw error;
      }
    });

    // Export processor
    this.queues.exports.process(async (job) => {
      const { format, data } = job.data;
      console.log(`Processing export job ${job.id}: ${format}`);
      
      try {
        // Generate export logic here
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return { 
          success: true, 
          downloadUrl: `/exports/${job.id}.${format}`,
          message: `Export ${format} completed` 
        };
      } catch (error) {
        console.error('Export job failed:', error);
        throw error;
      }
    });

    // Reminder processor
    this.queues.reminders.process(async (job) => {
      const { type, userId, data } = job.data;
      console.log(`Processing reminder job ${job.id}: ${type} for user ${userId}`);
      
      try {
        const notificationService = require('./notificationService');
        
        await notificationService.sendReminder(userId, type, data);
        
        return { success: true, message: `Reminder ${type} sent` };
      } catch (error) {
        console.error('Reminder job failed:', error);
        throw error;
      }
    });

    // Audit log processor
    this.queues.audit.process(async (job) => {
      const { action, userId, details } = job.data;
      
      try {
        const AuditLog = require('../models/AuditLog');
        
        await AuditLog.create({
          action,
          user: userId,
          details,
          timestamp: new Date()
        });
        
        return { success: true };
      } catch (error) {
        console.error('Audit log job failed:', error);
        throw error;
      }
    });
  }

  setupEventHandlers() {
    Object.values(this.queues).forEach(queue => {
      queue.on('completed', (job, result) => {
        console.log(`✅ Job ${job.id} completed:`, result);
      });

      queue.on('failed', (job, err) => {
        console.error(`❌ Job ${job.id} failed:`, err.message);
      });

      queue.on('stalled', (job) => {
        console.warn(`⚠️ Job ${job.id} stalled`);
      });
    });
  }

  // Job creation methods
  async addEmailJob(type, data, options = {}) {
    return this.queues.email.add({ type, data }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      ...options
    });
  }

  async addAIJob(type, data, options = {}) {
    return this.queues.ai.add({ type, data }, {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000
      },
      ...options
    });
  }

  async addReportJob(type, data, options = {}) {
    return this.queues.reports.add({ type, data }, {
      attempts: 2,
      ...options
    });
  }

  async addExportJob(format, data, options = {}) {
    return this.queues.exports.add({ format, data }, {
      attempts: 2,
      ...options
    });
  }

  async addReminderJob(type, userId, data, delay = 0) {
    return this.queues.reminders.add({ type, userId, data }, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000
      }
    });
  }

  async addAuditLog(action, userId, details) {
    return this.queues.audit.add({ action, userId, details }, {
      attempts: 5,
      backoff: {
        type: 'fixed',
        delay: 1000
      }
    });
  }

  // Queue management
  async getQueueStats() {
    const stats = {};
    
    for (const [name, queue] of Object.entries(this.queues)) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount()
      ]);
      
      stats[name] = { waiting, active, completed, failed };
    }
    
    return stats;
  }

  async cleanOldJobs(maxAge = 24 * 3600 * 1000) {
    for (const queue of Object.values(this.queues)) {
      await queue.clean(maxAge, 'completed');
      await queue.clean(maxAge, 'failed');
    }
    console.log('✅ Old jobs cleaned');
  }

  // Graceful shutdown
  async close() {
    console.log('Closing queue connections...');
    
    for (const queue of Object.values(this.queues)) {
      await queue.close();
    }
    
    console.log('✅ Queue connections closed');
  }
}

// Export singleton instance
const queueService = new QueueService();

module.exports = queueService;
