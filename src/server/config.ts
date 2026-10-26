// ============================================================================
// REDHACK AI v2.1 - Production Environment Configuration & Validation
// ============================================================================

import { getJwtSecret, isProductionRuntime } from "./security";

export interface ServerConfig {
  nodeEnv: "production" | "development" | "test";
  port: number;
  databaseUrl?: string;
  hasGeminiKey: boolean;
  isProduction: boolean;
  isTest: boolean;
  version: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: Record<string, string | number | boolean>;
}

/**
 * Validates runtime environment configuration without disclosing secrets.
 * Enforces production readiness rules:
 * - In production: JWT_SECRET must be externally supplied, cryptographically strong (>= 32 chars).
 * - Port must be a valid TCP port (1 - 65535).
 * - Production requires DATABASE_URL; the in-memory fallback is never production-ready.
 * - Database URL must start with postgresql:// or postgres:// when provided.
 */
export function validateEnvironment(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rawEnv = (isProductionRuntime() ? "production" : (process.env.NODE_ENV || "development").toLowerCase());
  const isProduction = isProductionRuntime();
  const isTest = rawEnv === "test";

  // 1. Port validation
  const port = parseInt(process.env.PORT || "3000", 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`PORT must be a valid integer between 1 and 65535. Received: "${process.env.PORT}"`);
  }

  // 2. JWT Secret validation
  try {
    getJwtSecret();
  } catch (err: any) {
    errors.push(err.message || "JWT_SECRET validation failed.");
  }

  // 3. Database URL validation (if provided)
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl) {
    if (!dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://")) {
      errors.push("DATABASE_URL must be a PostgreSQL URI (postgresql:// or postgres://).");
    }
  } else if (isProduction) {
    errors.push("DATABASE_URL is required in production; in-memory storage is not durable.");
  }

  // 4. Gemini API Key check
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const hasGeminiKey = Boolean(geminiKey && geminiKey !== "MY_GEMINI_API_KEY");
  if (!hasGeminiKey && isProduction) {
    warnings.push(
      "GEMINI_API_KEY is not configured. Real-time AI agent inference will operate in deterministic local simulation mode."
    );
  }

  const summary = {
    nodeEnv: rawEnv,
    port: isNaN(port) ? 3000 : port,
    hasDatabaseUrl: Boolean(dbUrl),
    hasGeminiKey,
    isProduction,
    isTest,
    version: "2.1.0",
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

export function getConfig(): ServerConfig {
  const rawEnv = (isProductionRuntime() ? "production" : (process.env.NODE_ENV || "development").toLowerCase());
  const nodeEnv = (
    rawEnv === "production" ? "production" : rawEnv === "test" ? "test" : "development"
  ) as ServerConfig["nodeEnv"];
  const port = parseInt(process.env.PORT || "3000", 10);
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  return {
    nodeEnv,
    port: isNaN(port) ? 3000 : port,
    databaseUrl: process.env.DATABASE_URL?.trim(),
    hasGeminiKey: Boolean(geminiKey && geminiKey !== "MY_GEMINI_API_KEY"),
    isProduction: nodeEnv === "production",
    isTest: nodeEnv === "test",
    version: "2.1.0",
  };
}
