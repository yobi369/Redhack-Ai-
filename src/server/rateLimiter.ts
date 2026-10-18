// ============================================================================
// REDHACK AI v2.1 - Sliding-Window Rate Limiter
// ============================================================================

import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Background cleanup of stale IP records every 2 minutes
    setInterval(() => this.cleanup(), 120000).unref();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }

  public check(
    key: string,
    limitOverride?: number,
    windowOverride?: number
  ): { allowed: boolean; remaining: number; resetTime: number; retryAfterSeconds: number } {
    const now = Date.now();
    const effectiveLimit = limitOverride ?? this.maxRequests;
    const effectiveWindow = windowOverride ?? this.windowMs;

    let record = this.records.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Keep only timestamps within current sliding window
    record.timestamps = record.timestamps.filter((t) => now - t < effectiveWindow);

    if (record.timestamps.length >= effectiveLimit) {
      const oldest = record.timestamps[0];
      const resetTime = Math.ceil((oldest + effectiveWindow - now) / 1000);
      const waitSec = Math.max(1, resetTime);
      return { allowed: false, remaining: 0, resetTime: waitSec, retryAfterSeconds: waitSec };
    }

    record.timestamps.push(now);
    const remaining = Math.max(0, effectiveLimit - record.timestamps.length);
    const defaultReset = Math.ceil(effectiveWindow / 1000);
    return { allowed: true, remaining, resetTime: defaultReset, retryAfterSeconds: defaultReset };
  }

  public middleware(limit?: number, windowMs?: number) {
    const activeMax = limit || this.maxRequests;
    const activeWindow = windowMs || this.windowMs;

    return (req: Request, res: Response, next: NextFunction) => {
      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "127.0.0.1";

      const key = `${clientIp}:${req.path}`;
      const result = this.check(key);

      res.setHeader("X-RateLimit-Limit", activeMax);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset", result.resetTime);

      if (!result.allowed) {
        res.setHeader("Retry-After", result.resetTime);
        return res.status(429).json({
          error: "Too Many Requests: Rate limit threshold exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfterSeconds: result.resetTime,
        });
      }

      next();
    };
  }
}

export const generalRateLimiter = new SlidingWindowRateLimiter(60000, 120); // 120 req / min
export const aiExecutionRateLimiter = new SlidingWindowRateLimiter(60000, 30); // 30 AI ops / min
export const authRateLimiter = new SlidingWindowRateLimiter(60000, 15); // 15 auth attempts / min
