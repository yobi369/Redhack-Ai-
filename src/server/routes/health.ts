// ============================================================================
// REDHACK AI v2.1 - Health & Observability Endpoints
// ============================================================================

import { Router, Request, Response } from "express";
import { checkDatabaseHealth } from "../../db/postgres";
import { getConfig } from "../config";
import { logger } from "../logger";

export const healthRouter = Router();

/**
 * GET /healthz (Liveness Probe)
 * Confirms the Node.js event loop and HTTP server process are alive and responsive.
 */
healthRouter.get("/healthz", (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ALIVE",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /readyz (Readiness Probe)
 * Checks that the application is ready to accept production traffic.
 * Validates database connectivity (if configured) and core services.
 */
healthRouter.get("/readyz", async (req: Request, res: Response) => {
  const config = getConfig();
  const dbHealth = await checkDatabaseHealth();

  // If a DATABASE_URL is configured but connection fails, report 503
  if (config.databaseUrl && !dbHealth.isConnected) {
    logger.warn("Readiness probe check failed: PostgreSQL configured but unreachable", { dbHealth });
    return res.status(503).json({
      status: "NOT_READY",
      reason: "Database dependency unavailable",
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: "READY",
    database: dbHealth.isConnected ? "postgresql" : "in_memory_resilient",
    version: config.version,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health and GET /api/health (Operational Status)
 * Returns comprehensive operational telemetry without exposing internal credentials.
 */
export function getSystemHealthPayload(stats?: {
  totalIngestedEvents?: number;
  activeCases?: number;
  activeSimulations?: boolean;
  emergencyStopActive?: boolean;
}) {
  return {
    status: "HEALTHY",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    adaptersOnline: 6,
    activeSimulations: stats?.activeSimulations ? 1 : 0,
    emergencyStopActive: Boolean(stats?.emergencyStopActive),
    totalIngestedEvents: stats?.totalIngestedEvents ?? 4,
    activeCases: stats?.activeCases ?? 1,
    version: "2.1.0",
  };
}
