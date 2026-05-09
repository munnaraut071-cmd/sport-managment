/**
 * Redis Cache Service
 * Enterprise-grade caching with Redis
 */

const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        console.log('✅ Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis client error:', err);
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    if (!this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern) {
    if (!this.isConnected) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected) return false;
    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  async getOrSet(key, factory, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    if (value !== null && value !== undefined) {
      await this.set(key, value, ttl);
    }
    return value;
  }

  generateKey(prefix, params) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    return `${prefix}:${paramString}`;
  }

  // Cache decorators
  async cacheKitStats() {
    return this.getOrSet('kit:stats', async () => {
      const Kit = require('../models/Kit');
      const stats = await Kit.aggregate([
        {
          $group: {
            _id: null,
            totalKits: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            totalAvailable: { $sum: '$available' },
            lowStock: {
              $sum: { $cond: [{ $lte: ['$available', 5] }, 1, 0] }
            }
          }
        }
      ]);
      return stats[0] || {};
    }, 300);
  }

  async cacheDashboardStats() {
    return this.getOrSet('dashboard:stats', async () => {
      const Kit = require('../models/Kit');
      const User = require('../models/User');
      const Transaction = require('../models/Transaction');

      const [kitStats, userStats, transactionStats] = await Promise.all([
        Kit.countDocuments(),
        User.countDocuments(),
        Transaction.countDocuments({ status: 'active' })
      ]);

      return {
        totalKits: kitStats,
        totalUsers: userStats,
        activeTransactions: transactionStats
      };
    }, 60);
  }

  async invalidateKitCache() {
    await this.deletePattern('kit:*');
    await this.deletePattern('dashboard:*');
  }

  async invalidateTransactionCache() {
    await this.deletePattern('transaction:*');
    await this.deletePattern('dashboard:*');
  }
}

// Export singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
