import { describe, it, expect, beforeEach } from "vitest";
import { SlidingWindowRateLimiter } from "../../src/server/rateLimiter";

describe("Sliding Window Rate Limiter Engine", () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter();
  });

  it("should permit requests within rate limit threshold", () => {
    const ip = "192.168.1.100";
    const limit = 5;
    const windowMs = 1000;

    for (let i = 0; i < limit; i++) {
      const result = limiter.check(ip, limit, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(limit - 1 - i);
    }
  });

  it("should block requests exceeding the burst limit threshold", () => {
    const ip = "10.0.99.55";
    const limit = 3;
    const windowMs = 5000;

    // First 3 requests allowed
    for (let i = 0; i < limit; i++) {
      expect(limiter.check(ip, limit, windowMs).allowed).toBe(true);
    }

    // 4th request must be rejected
    const blocked = limiter.check(ip, limit, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("should track distinct clients independently without cross-ip interference", () => {
    const clientA = "172.16.1.10";
    const clientB = "172.16.1.20";
    const limit = 2;
    const windowMs = 5000;

    limiter.check(clientA, limit, windowMs);
    limiter.check(clientA, limit, windowMs);
    expect(limiter.check(clientA, limit, windowMs).allowed).toBe(false);

    // Client B should still have full quota
    expect(limiter.check(clientB, limit, windowMs).allowed).toBe(true);
    expect(limiter.check(clientB, limit, windowMs).allowed).toBe(true);
  });
});
