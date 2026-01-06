import NodeCache from 'node-cache';
import { createClient, RedisClientType } from 'redis';
import { logger } from './logger.js';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  checkPeriod: number; // Check for expired keys every N seconds
  useRedis?: boolean;
  redisUrl?: string;
  redisPassword?: string;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private nodeCache: NodeCache;
  private redisClient: RedisClientType | null = null;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.nodeCache = new NodeCache({
      stdTTL: config.ttl,
      checkperiod: config.checkPeriod,
    });

    if (config.useRedis) {
      this.initializeRedis();
    }
  }

  private async initializeRedis() {
    try {
      this.redisClient = createClient({
        url: this.config.redisUrl,
        password: this.config.redisPassword,
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis Cache Error:', err);
        this.redisClient = null;
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis cache connected');
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.warn('Failed to initialize Redis cache, using in-memory cache:', error);
      this.redisClient = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first if available
      if (this.redisClient) {
        const data = await this.redisClient.get(key);
        if (data) {
          const entry: CacheEntry<T> = JSON.parse(data);
          
          // Check if entry has expired
          if (Date.now() - entry.timestamp < entry.ttl * 1000) {
            logger.debug(`Cache hit (Redis): ${key}`);
            return entry.value;
          } else {
            // Entry expired, remove it
            await this.redisClient.del(key);
          }
        }
      }

      // Fallback to NodeCache
      const value = this.nodeCache.get<T>(key);
      if (value !== undefined) {
        logger.debug(`Cache hit (NodeCache): ${key}`);
        return value;
      }

      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const cacheTtl = ttl || this.config.ttl;
    
    try {
      // Store in Redis if available
      if (this.redisClient) {
        const entry: CacheEntry<T> = {
          value,
          timestamp: Date.now(),
          ttl: cacheTtl,
        };
        
        await this.redisClient.setEx(key, cacheTtl, JSON.stringify(entry));
        logger.debug(`Cache set (Redis): ${key}, TTL: ${cacheTtl}s`);
      }

      // Also store in NodeCache as fallback
      this.nodeCache.set(key, value, cacheTtl);
      logger.debug(`Cache set (NodeCache): ${key}, TTL: ${cacheTtl}s`);
    } catch (error) {
      logger.error('Cache set error:', error);
      // Still store in NodeCache if Redis fails
      this.nodeCache.set(key, value, cacheTtl);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.del(key);
      }
      this.nodeCache.del(key);
      logger.debug(`Cache delete: ${key}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.flushDb();
      }
      this.nodeCache.flushAll();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  async mset<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  getStats() {
    const nodeStats = this.nodeCache.getStats();
    
    return {
      nodeCache: nodeStats,
      redis: {
        connected: !!this.redisClient,
      },
      keys: this.nodeCache.keys().length,
    };
  }

  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    this.nodeCache.close();
  }
}

// Cache decorators for method caching
export function cached(ttl: number = 300, keyPrefix?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new Map<string, { value: any; timestamp: number }>();

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${keyPrefix || target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      const now = Date.now();
      
      // Check cache
      const cached = cache.get(cacheKey);
      if (cached && (now - cached.timestamp) < ttl * 1000) {
        logger.debug(`Method cache hit: ${cacheKey}`);
        return cached.value;
      }

      // Execute method and cache result
      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, { value: result, timestamp: now });
      
      // Cleanup old entries periodically
      if (cache.size > 100) {
        for (const [key, entry] of cache.entries()) {
          if (now - entry.timestamp > ttl * 1000) {
            cache.delete(key);
          }
        }
      }

      logger.debug(`Method cache set: ${cacheKey}`);
      return result;
    };

    return descriptor;
  };
}

// Cache invalidation decorator
export function invalidateCache(cacheKey: string | ((args: any[]) => string)) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Invalidate cache
      // if (this.cache && this.cache instanceof CacheManager) {
      //   const key = typeof cacheKey === 'function' ? cacheKey(args) : cacheKey;
      //   await this.cache.del(key);
      //   logger.debug(`Cache invalidated: ${key}`);
      // }

      return result;
    };

    return descriptor;
  };
}

// Create shared cache instances
export const tonCache = new CacheManager({
  ttl: 30, // 30 seconds for blockchain data
  checkPeriod: 60,
  useRedis: process.env.REDIS_URL ? true : false,
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,
});

export const jiraCache = new CacheManager({
  ttl: 300, // 5 minutes for JIRA data
  checkPeriod: 120,
  useRedis: process.env.REDIS_URL ? true : false,
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,
});

export const conversationCache = new CacheManager({
  ttl: 1800, // 30 minutes for conversations
  checkPeriod: 300,
  useRedis: true, // Always use Redis for conversations
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,
});