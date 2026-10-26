// ============================================================================
// REDHACK AI v2.1 - Production Role-Based Access Control (RBAC) & Middleware
// ============================================================================

import { Request, Response, NextFunction } from "express";
import { verifyAuthToken, AuthTokenPayload, isProductionRuntime } from "./security";

// Extend Express Request with Authenticated Context
export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
  tenantContext?: {
    organizationId: string;
    workspaceId: string;
  };
}

export const PERMISSIONS = {
  // Read permissions
  VIEW_DASHBOARD: "view:dashboard",
  VIEW_TELEMETRY: "view:telemetry",
  VIEW_ALERTS: "view:alerts",
  VIEW_ASSETS: "view:assets",
  VIEW_FINDINGS: "view:findings",
  VIEW_INTEL: "view:intel",
  VIEW_EVIDENCE: "view:evidence",
  VIEW_AUDIT_LOGS: "view:audit_logs",

  // Operational permissions
  TRIAGE_ALERT: "triage:alert",
  CREATE_FINDING: "create:finding",
  TRANSITION_FINDING: "transition:finding",
  RUN_AGENT_SCOPED: "run:agent_scoped",
  RUN_PURPLE_SIMULATION: "run:purple_simulation",
  INGEST_EVIDENCE: "ingest:evidence",
  GENERATE_REPORTS: "generate:reports",

  // High-Privilege & Consequential actions (Mandatory Approval / Lead only)
  APPROVE_CONTAINMENT: "approve:containment",
  EXECUTE_HOST_ISOLATION: "execute:host_isolation",
  EXECUTE_ROLLBACK: "execute:rollback",
  MODIFY_ROE_SCOPE: "modify:roe_scope",
  MANAGE_INTEGRATIONS: "manage:integrations",
  MANAGE_WORKSPACES: "manage:workspaces",
  MANAGE_USERS_ROLES: "manage:users_roles",
  EMERGENCY_KILL_SWITCH: "emergency:kill_switch",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS_MAP: Record<string, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  SOC_LEAD: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TELEMETRY,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.VIEW_FINDINGS,
    PERMISSIONS.VIEW_INTEL,
    PERMISSIONS.VIEW_EVIDENCE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.TRIAGE_ALERT,
    PERMISSIONS.CREATE_FINDING,
    PERMISSIONS.TRANSITION_FINDING,
    PERMISSIONS.RUN_AGENT_SCOPED,
    PERMISSIONS.RUN_PURPLE_SIMULATION,
    PERMISSIONS.INGEST_EVIDENCE,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.APPROVE_CONTAINMENT,
    PERMISSIONS.EXECUTE_HOST_ISOLATION,
    PERMISSIONS.EXECUTE_ROLLBACK,
    PERMISSIONS.MODIFY_ROE_SCOPE,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.EMERGENCY_KILL_SWITCH,
  ],
  L2_ANALYST: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TELEMETRY,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.VIEW_FINDINGS,
    PERMISSIONS.VIEW_INTEL,
    PERMISSIONS.VIEW_EVIDENCE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.TRIAGE_ALERT,
    PERMISSIONS.CREATE_FINDING,
    PERMISSIONS.TRANSITION_FINDING,
    PERMISSIONS.RUN_AGENT_SCOPED,
    PERMISSIONS.INGEST_EVIDENCE,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.APPROVE_CONTAINMENT, // Can approve standard containment
    PERMISSIONS.EMERGENCY_KILL_SWITCH,
  ],
  L1_ANALYST: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TELEMETRY,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.VIEW_FINDINGS,
    PERMISSIONS.VIEW_INTEL,
    PERMISSIONS.VIEW_EVIDENCE,
    PERMISSIONS.TRIAGE_ALERT,
    PERMISSIONS.CREATE_FINDING,
    PERMISSIONS.RUN_AGENT_SCOPED,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EMERGENCY_KILL_SWITCH,
  ],
  SECURITY_AUDITOR: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TELEMETRY,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.VIEW_FINDINGS,
    PERMISSIONS.VIEW_INTEL,
    PERMISSIONS.VIEW_EVIDENCE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.GENERATE_REPORTS,
  ],
  THREAT_RESEARCHER: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_ASSETS,
    PERMISSIONS.VIEW_FINDINGS,
    PERMISSIONS.VIEW_INTEL,
    PERMISSIONS.RUN_AGENT_SCOPED,
    PERMISSIONS.RUN_PURPLE_SIMULATION,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EMERGENCY_KILL_SWITCH,
  ],
};

/**
 * Checks if a specific role possesses a permission
 */
export function hasPermission(role: string, permission: PermissionKey): boolean {
  if (!role) return false;
  const normRole = role.toUpperCase();
  if (normRole === "SUPER_ADMIN") return true;
  const perms = ROLE_PERMISSIONS_MAP[normRole] || [];
  return perms.includes(permission);
}

/**
 * Authentication Middleware: Validates Bearer token or allows session bypass for local development/preview
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // These endpoints must remain reachable by platform health checks and unauthenticated
  // clients establishing a session. All other production API routes fail closed.
  const publicPaths = new Set(["/healthz", "/readyz", "/v2/auth/login"]);
  if (publicPaths.has(req.path)) return next();

  const authHeader = req.headers.authorization;
  const devRoleHeader = (req.headers["x-dev-role"] as string) || "L1_ANALYST";
  const devWorkspaceHeader = (req.headers["x-workspace-id"] as string) || "ws-prod-defense";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const verification = verifyAuthToken(token);

    if (!verification.valid || !verification.payload) {
      return res.status(401).json({
        error: "Unauthorized: Invalid or expired token",
        code: "AUTH_TOKEN_INVALID",
        details: verification.error,
      });
    }

    const requestedWorkspace = req.headers["x-workspace-id"] as string | undefined;
    if (requestedWorkspace && requestedWorkspace !== verification.payload.workspaceId) {
      return res.status(403).json({
        error: "Forbidden: workspace context must match the authenticated token",
        code: "TENANT_CONTEXT_MISMATCH",
      });
    }

    req.user = verification.payload;
    req.tenantContext = {
      organizationId: verification.payload.organizationId,
      workspaceId: verification.payload.workspaceId,
    };
    return next();
  }

  // Production must fail closed: no synthetic/demo identity is allowed.
  if (isProductionRuntime()) {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: "Production authentication is unavailable because PostgreSQL is not configured",
        code: "PRODUCTION_STORAGE_NOT_CONFIGURED",
      });
    }
    return res.status(401).json({
      error: "Unauthorized: a valid bearer token is required",
      code: "AUTH_REQUIRED",
    });
  }

  // Explicitly development/test-only compatibility for the demo UI.
  const role = devRoleHeader.toUpperCase();
  const permissions = ROLE_PERMISSIONS_MAP[role] || ROLE_PERMISSIONS_MAP.L1_ANALYST;

  req.user = {
    userId: "usr-session-operator",
    email: "operator@apex-cyber.internal",
    role: role,
    organizationId: "org-defense-corp",
    workspaceId: devWorkspaceHeader,
    permissions: permissions,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };

  req.tenantContext = {
    organizationId: "org-defense-corp",
    workspaceId: devWorkspaceHeader,
  };

  next();
}

/**
 * Permission Enforcement Middleware
 */
export function requirePermission(permission: PermissionKey) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Authentication required", code: "AUTH_REQUIRED" });
    }

    // Permission claims are informational only. Recompute authorization from the
    // server-owned role policy so a token's permissions array cannot grant extra access.
    const hasPerm = hasPermission(req.user.role, permission);

    if (!hasPerm) {
      return res.status(403).json({
        error: `Forbidden: Missing required permission [${permission}]`,
        code: "PERMISSION_DENIED",
        requiredPermission: permission,
        userRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * API-wide authorization gate. Read routes require dashboard access; writes must
 * match an explicit route-to-permission rule. Unknown mutation routes fail closed.
 */
export function authorizeApiRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const publicPaths = new Set(["/healthz", "/readyz", "/v2/auth/login"]);
  if (publicPaths.has(req.path) || req.method === "OPTIONS") return next();

  if (req.user?.userId === "readonly-demo" && req.method !== "GET" && req.method !== "HEAD") {
    return res.status(403).json({
      error: "Read-only demo sessions cannot modify platform state",
      code: "READ_ONLY_DEMO",
    });
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return requirePermission(PERMISSIONS.VIEW_DASHBOARD)(req, res, next);
  }

  const writeRules: Array<[RegExp, PermissionKey]> = [
    [/^\/telemetry\/ingest$/, PERMISSIONS.INGEST_EVIDENCE],
    [/^\/soc\/cases\/[^/]+\/(notes|status)$/, PERMISSIONS.TRIAGE_ALERT],
    [/^\/asm\/validate-target$/, PERMISSIONS.VIEW_ASSETS],
    [/^\/asm\/scan$/, PERMISSIONS.RUN_PURPLE_SIMULATION],
    [/^\/simulation\/run$/, PERMISSIONS.RUN_PURPLE_SIMULATION],
    [/^\/simulation\/stop$/, PERMISSIONS.EMERGENCY_KILL_SWITCH],
    [/^\/detection\/validate-rule$/, PERMISSIONS.RUN_AGENT_SCOPED],
    [/^\/soar\/approve$/, PERMISSIONS.APPROVE_CONTAINMENT],
    [/^\/soar\/execute$/, PERMISSIONS.EXECUTE_HOST_ISOLATION],
    [/^\/soar\/rollback$/, PERMISSIONS.EXECUTE_ROLLBACK],
    [/^\/(chat|analyze-log)$/, PERMISSIONS.RUN_AGENT_SCOPED],
    [/^\/generate-report$/, PERMISSIONS.GENERATE_REPORTS],
    [/^\/triage-alert$/, PERMISSIONS.TRIAGE_ALERT],
    [/^\/generate-sigma-yara$/, PERMISSIONS.RUN_AGENT_SCOPED],
    [/^\/v2\/workspaces\/switch$/, PERMISSIONS.MANAGE_WORKSPACES],
    [/^\/v2\/scope\/policy$/, PERMISSIONS.MODIFY_ROE_SCOPE],
    [/^\/v2\/assets$/, PERMISSIONS.MANAGE_WORKSPACES],
    [/^\/v2\/findings\/[^/]+\/transition$/, PERMISSIONS.TRANSITION_FINDING],
    [/^\/v2\/incidents\/[^/]+\/actions\/[^/]+\/approve$/, PERMISSIONS.APPROVE_CONTAINMENT],
    [/^\/v2\/incidents\/[^/]+\/actions\/[^/]+\/execute$/, PERMISSIONS.EXECUTE_HOST_ISOLATION],
    [/^\/v2\/incidents\/[^/]+\/actions\/[^/]+\/rollback$/, PERMISSIONS.EXECUTE_ROLLBACK],
    [/^\/v2\/agents\/run$/, PERMISSIONS.RUN_AGENT_SCOPED],
    [/^\/v2\/evidence$/, PERMISSIONS.INGEST_EVIDENCE],
    [/^\/v2\/reports$/, PERMISSIONS.GENERATE_REPORTS],
    [/^\/v2\/ai-security\/audit$/, PERMISSIONS.RUN_AGENT_SCOPED],
    [/^\/v2\/database\/migrate$/, PERMISSIONS.MANAGE_USERS_ROLES],
    [/^\/v2\/integrations\/[^/]+\/(test|sync)$/, PERMISSIONS.MANAGE_INTEGRATIONS],
  ];

  const match = writeRules.find(([pattern]) => pattern.test(req.path));
  if (!match) {
    return res.status(403).json({
      error: "Forbidden: no authorization policy is configured for this API operation",
      code: "ROUTE_PERMISSION_UNMAPPED",
    });
  }

  return requirePermission(match[1])(req, res, next);
}

/**
 * Tenant Isolation Enforcement Middleware
 * Ensures operations on resources only affect the authenticated workspace
 */
export function enforceTenantIsolation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Validate every supplied selector, not just the first truthy value. Otherwise a matching
  // body value could mask a conflicting query or path value consumed by a route handler.
  const workspaceCandidates: unknown[] = [];
  for (const value of [req.params?.workspaceId, req.body?.workspaceId, req.query?.workspaceId]) {
    const candidates = Array.isArray(value) ? value : [value];
    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null && candidate !== "") {
        workspaceCandidates.push(candidate);
      }
    }
  }

  if (workspaceCandidates.length > 0 && req.user?.role !== "SUPER_ADMIN") {
    for (const workspaceId of workspaceCandidates) {
      if (typeof workspaceId !== "string" || !req.tenantContext || workspaceId !== req.tenantContext.workspaceId) {
        return res.status(403).json({
          error: "Forbidden: Tenant boundary violation. Access across isolated workspaces is denied.",
          code: "TENANT_ISOLATION_VIOLATION",
        });
      }
    }
  }

  next();
}
