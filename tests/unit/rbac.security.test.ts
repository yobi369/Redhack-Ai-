import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  authenticate,
  authorizeApiRequest,
  enforceTenantIsolation,
  hasPermission,
  requirePermission,
  PERMISSIONS,
} from "../../src/server/rbac";
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
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
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
    const next = vi.fn() as unknown as NextFunction;

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
    const next = vi.fn() as unknown as NextFunction;

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
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TENANT_CONTEXT_MISMATCH" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects explicit cross-workspace targets on authenticated requests", () => {
    const req = {
      params: {},
      body: { workspaceId: "ws-other-tenant" },
      query: {},
      tenantContext: { organizationId: "org-a", workspaceId: "ws-a" },
      user: { role: "L1_ANALYST" },
    } as any;
    const res = responseMock();
    const next = vi.fn() as unknown as NextFunction;

    enforceTenantIsolation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TENANT_ISOLATION_VIOLATION" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a conflicting query workspace even when the body workspace matches", () => {
    const req = {
      params: {},
      body: { workspaceId: "ws-a" },
      query: { workspaceId: "ws-other-tenant" },
      tenantContext: { organizationId: "org-a", workspaceId: "ws-a" },
      user: { role: "L1_ANALYST" },
    } as any;
    const res = responseMock();
    const next = vi.fn() as unknown as NextFunction;

    enforceTenantIsolation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TENANT_ISOLATION_VIOLATION" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("fails closed when a workspace is requested without authenticated tenant context", () => {
    const req = {
      params: { workspaceId: "ws-a" },
      body: {},
      query: {},
      user: { role: "L1_ANALYST" },
    } as any;
    const res = responseMock();
    const next = vi.fn() as unknown as NextFunction;

    enforceTenantIsolation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TENANT_ISOLATION_VIOLATION" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("allows matching workspace context and leaves the request unchanged", () => {
    const req = {
      params: {},
      body: { workspaceId: "ws-a" },
      query: {},
      tenantContext: { organizationId: "org-a", workspaceId: "ws-a" },
      user: { role: "L1_ANALYST" },
    } as any;
    const res = responseMock();
    const next = vi.fn() as unknown as NextFunction;

    enforceTenantIsolation(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("fails closed when a mutating API route has no explicit permission rule", () => {
    const req = {
      path: "/v2/unreviewed-action",
      method: "POST",
      headers: {},
      params: {},
      body: {},
      query: {},
    } as unknown as Request;
    const res = responseMock();
    const next = vi.fn() as unknown as NextFunction;

    authorizeApiRequest(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "ROUTE_PERMISSION_UNMAPPED" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks every mutation from the read-only production demo identity", () => {
    const req = {
      path: "/v2/reports",
      method: "POST",
      user: {
        userId: "readonly-demo",
        email: "readonly-demo@localhost",
        role: "SECURITY_AUDITOR",
        organizationId: "org-defense-corp",
        workspaceId: "ws-prod-defense",
        permissions: [],
      },
      headers: {},
      params: {},
      body: {},
      query: {},
    } as any;
    const res = responseMock();
    const next = vi.fn() as unknown as NextFunction;

    authorizeApiRequest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "READ_ONLY_DEMO" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("keeps liveness and login endpoints reachable without a bearer token", () => {
    process.env.NODE_ENV = "production";
    const next = vi.fn() as unknown as NextFunction;
    const res = responseMock();

    const req = {
      path: "/healthz",
      headers: {},
      params: {},
      body: {},
      query: {},
    } as unknown as Request;

    authenticate(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
