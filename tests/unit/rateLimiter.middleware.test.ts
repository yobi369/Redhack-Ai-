import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { SlidingWindowRateLimiter } from "../../src/server/rateLimiter";

describe("Rate limiter middleware", () => {
  afterEach(() => vi.restoreAllMocks());

  it("enforces middleware-specific limits instead of the constructor default", () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 100);
    const middleware = limiter.middleware(2, 60_000);
    const req = {
      ip: "203.0.113.10",
      socket: { remoteAddress: "203.0.113.10" },
      baseUrl: "",
      path: "/auth/login",
      route: { path: "/auth/login" },
      headers: { "x-forwarded-for": "198.51.100.77" },
    } as unknown as Request;

    const makeResponse = () => {
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      return res as unknown as Response & { status: ReturnType<typeof vi.fn> };
    };

    const next = vi.fn<NextFunction>();
    middleware(req, makeResponse(), next);
    middleware(req, makeResponse(), next);
    const blockedResponse = makeResponse();
    middleware(req, blockedResponse, next);

    expect(blockedResponse.status).toHaveBeenCalledWith(429);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
