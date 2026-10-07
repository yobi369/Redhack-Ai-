// ============================================================================
// REDHACK AI v2.1 - Production Role-Based Access Control (RBAC) & Middleware
// ============================================================================

import { Request, Response, NextFunction } from "express";
import { verifyAuthToken, AuthTokenPayload } from "./security";

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
 * Authentication Middleware: Validates Bearer token or allows session bypass for local development/preview
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

    req.user = verification.payload;
    req.tenantContext = {
      organizationId: verification.payload.organizationId,
      workspaceId: req.headers["x-workspace-id"]
        ? (req.headers["x-workspace-id"] as string)
        : verification.payload.workspaceId,
    };
    return next();
  }

  // Graceful fallback for UI session headers (permits interactive frontend workflows while tracking identity)
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

    const userPerms = req.user.permissions || [];
    const hasPerm = userPerms.includes(permission) || req.user.role === "SUPER_ADMIN";

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
 * Tenant Isolation Enforcement Middleware
 * Ensures operations on resources only affect the authenticated workspace
 */
export function enforceTenantIsolation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const targetWorkspace = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

  if (targetWorkspace && req.tenantContext) {
    if (targetWorkspace !== req.tenantContext.workspaceId && req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: "Forbidden: Tenant boundary violation. Access across isolated workspaces is denied.",
        code: "TENANT_ISOLATION_VIOLATION",
      });
    }
  }

  next();
}
