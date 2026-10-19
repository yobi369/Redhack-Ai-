import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authenticate, hasPermission, requirePermission, PERMISSIONS } from "../../src/server/rbac";
import { signAuthToken } from "../../src/server/security";

const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

function responseMock() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe("Production authentication and authorization boundaries", () => {
  it("rejects unauthenticated production requests even when x-dev-role claims SUPER_ADMIN", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    const req = {
      path: "/v2/incidents",
      headers: { "x-dev-role": "SUPER_ADMIN", "x-workspace-id": "ws-prod-defense" },
      params: {},
      body: {},
      query: {},
    } as unknown as Request;
    const res = responseMock();
    const next = vi.fn<NextFunction>();

    authenticate(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "AUTH_REQUIRED" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("does not let token permission claims override the server role policy", () => {
    const req = {
      user: {
        userId: "analyst-1",
        email: "analyst@example.test",
        role: "L1_ANALYST",
        organizationId: "org-a",
        workspaceId: "ws-a",
        permissions: [PERMISSIONS.APPROVE_CONTAINMENT],
        exp: Math.floor(Date.now() / 1000) + 60,
        iat: Math.floor(Date.now() / 1000),
      },
    } as any;
    const res = responseMock();
    const next = vi.fn<NextFunction>();

    requirePermission(PERMISSIONS.APPROVE_CONTAINMENT)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(hasPermission("L1_ANALYST", PERMISSIONS.APPROVE_CONTAINMENT)).toBe(false);
  });

  it("rejects a caller-supplied workspace that differs from the signed token context", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "test-only-jwt-secret-with-more-than-32-characters";
    const token = signAuthToken({
      userId: "analyst-1",
      email: "analyst@example.test",
      role: "L1_ANALYST",
      organizationId: "org-a",
      workspaceId: "ws-a",
      permissions: [],
    });
    const req = {
      path: "/v2/assets",
      headers: {
        authorization: `Bearer ${token}`,
        "x-workspace-id": "ws-other-tenant",
      },
      params: {},
      body: {},
      query: {},
    } as unknown as Request;
    const res = responseMock();
    const next = vi.fn<NextFunction>();

    authenticate(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TENANT_CONTEXT_MISMATCH" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("keeps liveness and login endpoints reachable without a bearer token", () => {
    process.env.NODE_ENV = "production";
    const next = vi.fn<NextFunction>();
    const res = responseMock();

    authenticate({
      path: "/healthz",
      headers: {},
      params: {},
      body: {},
      query: {},
    } as unknown as Request as any, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
