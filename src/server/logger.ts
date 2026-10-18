// ============================================================================
// REDHACK AI v2.1 - Structured Observability Logger (Pino + Security Redaction)
// ============================================================================

import pino from "pino";
import crypto from "crypto";

const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Pino structured logger configured with automatic PII / secret redaction.
 */
export const baseLogger = pino({
  level: isTest ? "silent" : isProduction ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "password",
      "token",
      "secret",
      "apiKey",
      "rawKey",
      "jwt",
      "*.password",
      "*.token",
      "*.secret",
      "*.apiKey",
      "*.rawKey",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "redhack-ai-core",
    version: "2.1.0",
    env: process.env.NODE_ENV || "development",
  },
});

export interface LogContext {
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  action?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: unknown;
}

export class AppLogger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  public child(childContext: LogContext): AppLogger {
    return new AppLogger({ ...this.context, ...childContext });
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    baseLogger.info({ ...this.context, ...meta }, message);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    baseLogger.warn({ ...this.context, ...meta }, message);
  }

  public error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errorDetails =
      error instanceof Error
        ? { errorMessage: error.message, errorName: error.name, stack: isProduction ? undefined : error.stack }
        : { rawError: String(error) };
    baseLogger.error({ ...this.context, ...errorDetails, ...meta }, message);
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    baseLogger.debug({ ...this.context, ...meta }, message);
  }
}

export const logger = new AppLogger();

/**
 * Generates an RFC 4122 v4 compliant correlation ID for tracing distributed SecOps requests.
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `corr-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
}
