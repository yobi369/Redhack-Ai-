import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import app from "../../server";

describe("API Routes & Security Middleware Integration", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Start ephemeral server on dynamic port
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  describe("Health & Liveness Probes", () => {
    it("should respond with HTTP 200 on /healthz liveness probe", async () => {
      const res = await fetch(`${baseUrl}/healthz`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ALIVE");
      expect(typeof data.uptimeSeconds).toBe("number");
    });

    it("should respond with HTTP 200 on /readyz readiness probe in test mode", async () => {
      const res = await fetch(`${baseUrl}/readyz`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("READY");
      expect(data.database).toBeDefined();
    });

    it("should fail production readiness when durable storage is not configured", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalDatabaseUrl = process.env.DATABASE_URL;
      process.env.NODE_ENV = "production";
      delete process.env.DATABASE_URL;

      try {
        const res = await fetch(`${baseUrl}/readyz`);
        expect(res.status).toBe(503);
        const data = await res.json();
        expect(data.status).toBe("NOT_READY");
        expect(data.reason).toContain("PostgreSQL persistence");
      } finally {
        if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalNodeEnv;
        if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
        else process.env.DATABASE_URL = originalDatabaseUrl;
      }
    });

    it("should respond with operational stats on /api/health", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("HEALTHY");
      expect(data.adaptersOnline).toBeGreaterThan(0);
      expect(data.version).toBe("2.1.0");
    });
  });

  describe("Security Headers & Correlation IDs", () => {
    it("should return security headers and X-Correlation-ID on API responses", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.headers.get("x-correlation-id")).toBeDefined();
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    });
  });

  describe("Multi-Tenant Workspaces API", () => {
    it("should return isolated workspaces on GET /api/v2/workspaces", async () => {
      const res = await fetch(`${baseUrl}/api/v2/workspaces`);
      expect(res.status).toBe(200);
      const workspaces = await res.json();
      expect(Array.isArray(workspaces)).toBe(true);
      expect(workspaces.length).toBeGreaterThan(0);
      expect(workspaces[0].scopePolicy).toBeDefined();
    });
  });

  describe("Attack Surface Management Scope API", () => {
    it("should return authorized scope policy on GET /api/asm/scope", async () => {
      const res = await fetch(`${baseUrl}/api/asm/scope`);
      expect(res.status).toBe(200);
      const scope = await res.json();
      expect(scope.authorizedDomains).toBeDefined();
      expect(scope.explicitExclusions.length).toBeGreaterThan(0);
    });

    it("should strictly reject out-of-scope targets on POST /api/asm/validate-target", async () => {
      const res = await fetch(`${baseUrl}/api/asm/validate-target`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "unauthorized-external-attacker.com" }),
      });
      const data = await res.json();
      expect(data.authorized).toBe(false);
    });

    it("should strictly reject excluded targets (Production DB) on POST /api/asm/validate-target", async () => {
      const res = await fetch(`${baseUrl}/api/asm/validate-target`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "db-primary.corp.internal" }),
      });
      const data = await res.json();
      expect(data.authorized).toBe(false);
      expect(data.reason).toContain("explicit safety exclusion");
    });
  });
});
