import { describe, it, expect } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS_MAP, hasPermission, requirePermission } from "../../src/server/rbac";

describe("Role-Based Access Control (RBAC) Architecture", () => {
  it("should grant SUPER_ADMIN all platform permissions", () => {
    const allPermissions = Object.values(PERMISSIONS);
    const superAdminPerms = ROLE_PERMISSIONS_MAP.SUPER_ADMIN;

    expect(superAdminPerms.length).toBe(allPermissions.length);
    allPermissions.forEach((perm) => {
      expect(hasPermission("SUPER_ADMIN", perm)).toBe(true);
    });
  });

  it("should allow SOC_LEAD to approve containment and execute rollback", () => {
    expect(hasPermission("SOC_LEAD", PERMISSIONS.APPROVE_CONTAINMENT)).toBe(true);
    expect(hasPermission("SOC_LEAD", PERMISSIONS.EXECUTE_ROLLBACK)).toBe(true);
    expect(hasPermission("SOC_LEAD", PERMISSIONS.MODIFY_ROE_SCOPE)).toBe(true);
  });

  it("should restrict L1_ANALYST from approving containment or modifying RoE scope", () => {
    expect(hasPermission("L1_ANALYST", PERMISSIONS.APPROVE_CONTAINMENT)).toBe(false);
    expect(hasPermission("L1_ANALYST", PERMISSIONS.EXECUTE_HOST_ISOLATION)).toBe(false);
    expect(hasPermission("L1_ANALYST", PERMISSIONS.MODIFY_ROE_SCOPE)).toBe(false);
    expect(hasPermission("L1_ANALYST", PERMISSIONS.MANAGE_WORKSPACES)).toBe(false);
  });

  it("should allow L1_ANALYST read and triage operations", () => {
    expect(hasPermission("L1_ANALYST", PERMISSIONS.VIEW_DASHBOARD)).toBe(true);
    expect(hasPermission("L1_ANALYST", PERMISSIONS.VIEW_TELEMETRY)).toBe(true);
    expect(hasPermission("L1_ANALYST", PERMISSIONS.TRIAGE_ALERT)).toBe(true);
    expect(hasPermission("L1_ANALYST", PERMISSIONS.RUN_AGENT_SCOPED)).toBe(true);
  });

  it("should restrict SECURITY_AUDITOR to read-only views and audit logging", () => {
    expect(hasPermission("SECURITY_AUDITOR", PERMISSIONS.VIEW_AUDIT_LOGS)).toBe(true);
    expect(hasPermission("SECURITY_AUDITOR", PERMISSIONS.VIEW_FINDINGS)).toBe(true);
    expect(hasPermission("SECURITY_AUDITOR", PERMISSIONS.TRIAGE_ALERT)).toBe(false);
    expect(hasPermission("SECURITY_AUDITOR", PERMISSIONS.RUN_AGENT_SCOPED)).toBe(false);
    expect(hasPermission("SECURITY_AUDITOR", PERMISSIONS.APPROVE_CONTAINMENT)).toBe(false);
  });

  it("should fail gracefully when an unknown role is evaluated", () => {
    expect(hasPermission("UNKNOWN_HACKER_ROLE", PERMISSIONS.VIEW_DASHBOARD)).toBe(false);
    expect(hasPermission("", PERMISSIONS.VIEW_DASHBOARD)).toBe(false);
  });

  it("should enforce middleware-level rejection for unauthorized roles", () => {
    const middleware = requirePermission(PERMISSIONS.MODIFY_ROE_SCOPE);
    let statusSent = 0;
    let jsonSent: any = null;

    const mockReq: any = {
      user: {
        role: "L1_ANALYST",
        userId: "usr-l1",
      },
    };
    const mockRes: any = {
      status: (s: number) => {
        statusSent = s;
        return {
          json: (j: any) => {
            jsonSent = j;
          },
        };
      },
    };
    let nextCalled = false;
    const mockNext = () => {
      nextCalled = true;
    };

    middleware(mockReq, mockRes, mockNext);

    expect(nextCalled).toBe(false);
    expect(statusSent).toBe(403);
    expect(jsonSent.code).toBe("PERMISSION_DENIED");
  });
});
