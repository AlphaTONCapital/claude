import { config } from '../config/index.js';

interface RateLimitEntry {
  requests: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests?: number, windowMs?: number) {
    this.maxRequests = maxRequests || config.rateLimit.maxRequests;
    this.windowMs = windowMs || config.rateLimit.windowMs;
  }

  checkLimit(userId: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(userId);

    if (!entry) {
      this.limits.set(userId, {
        requests: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (now > entry.resetTime) {
      this.limits.set(userId, {
        requests: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.requests >= this.maxRequests) {
      return false;
    }

    entry.requests++;
    return true;
  }

  reset(userId: string) {
    this.limits.delete(userId);
  }

  resetAll() {
    this.limits.clear();
  }

  getRemainingRequests(userId: string): number {
    const entry = this.limits.get(userId);
    if (!entry) return this.maxRequests;
    
    if (Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    
    return Math.max(0, this.maxRequests - entry.requests);
  }

  getResetTime(userId: string): number | null {
    const entry = this.limits.get(userId);
    if (!entry) return null;
    
    if (Date.now() > entry.resetTime) {
      return null;
    }
    
    return entry.resetTime;
  }
}