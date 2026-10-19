import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateEnvironment, getConfig } from "../../src/server/config";

describe("Server Environment Configuration & Validation", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should validate default development configuration successfully", () => {
    process.env.NODE_ENV = "development";
    process.env.PORT = "3000";
    const result = validateEnvironment();
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should fail validation when PORT is invalid", () => {
    process.env.PORT = "999999";
    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("PORT"))).toBe(true);
  });

  it("should enforce strong external JWT_SECRET in production mode", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("JWT_SECRET"))).toBe(true);
  });

  it("should reject known weak or placeholder JWT_SECRET in production mode", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "redhack-production-enterprise-secret-salt-2026";

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("JWT_SECRET"))).toBe(true);
  });

  it("should accept valid, cryptographically strong JWT_SECRET in production mode", () => {
    process.env.NODE_ENV = "production";
    process.env.PORT = "3000";
    process.env.JWT_SECRET = "a-very-secure-production-random-secret-key-32chars";
    process.env.DATABASE_URL = "postgresql://redhack:test@localhost:5432/redhack";

    const result = validateEnvironment();
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should require durable PostgreSQL storage in production", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "a-very-secure-production-random-secret-key-32chars";
    delete process.env.DATABASE_URL;

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("DATABASE_URL is required in production"))).toBe(true);
  });

  it("should return sanitized server configuration without leaking raw secrets", () => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "4000";
    process.env.JWT_SECRET = "secret-test-key-not-leaked";

    const config = getConfig();
    expect(config.port).toBe(4000);
    expect(config.nodeEnv).toBe("test");
    expect((config as any).jwtSecret).toBeUndefined();
  });
});
