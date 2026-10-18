import { describe, it, expect, beforeEach } from "vitest";
import { checkDatabaseHealth, getPostgresPool } from "../../src/db/postgres";
import { enterpriseStore } from "../../src/db/store";

describe("Database Layer, Pooling & Store Isolation", () => {
  it("should safely report connection status and fallback to resilient store when DATABASE_URL unset", async () => {
    const health = await checkDatabaseHealth();
    expect(health).toBeDefined();
    expect(["postgres", "in-memory-fallback"]).toContain(health.driver);
  });

  it("should enforce multi-tenant workspace isolation", () => {
    const prodWorkspaceId = "ws-prod-defense";
    const sandboxWorkspaceId = "ws-isolated-sandbox";

    const prodAssets = enterpriseStore.getAssets(prodWorkspaceId);
    const sandboxAssets = enterpriseStore.getAssets(sandboxWorkspaceId);

    expect(prodAssets.length).toBeGreaterThan(0);
    expect(sandboxAssets.length).toBeGreaterThan(0);

    // Verify zero asset overlap across tenants
    const prodAssetIds = new Set(prodAssets.map((a) => a.id));
    const leakedAssets = sandboxAssets.filter((a) => prodAssetIds.has(a.id));
    expect(leakedAssets.length).toBe(0);
  });

  it("should enforce immutable audit logging for all critical operations", () => {
    const initialLogCount = enterpriseStore.getAuditEvents().length;

    enterpriseStore.logAuditEvent(
      "usr-secops-admin",
      "SYSTEM",
      "Database Health Verification",
      "HEALTH_CHECK_COMPLETED",
      "DATABASE",
      "pool-primary",
      { status: "SUCCESS" }
    );

    const afterLogCount = enterpriseStore.getAuditEvents().length;
    expect(afterLogCount).toBe(initialLogCount + 1);

    const latestLog = enterpriseStore.getAuditEvents()[0];
    expect(latestLog.actorId).toBe("usr-secops-admin");
    expect(latestLog.action).toBe("HEALTH_CHECK_COMPLETED");
  });

  it("should maintain finding lifecycle state transitions properly", () => {
    const findings = enterpriseStore.getFindings();
    expect(findings.length).toBeGreaterThan(0);

    const targetFinding = findings[0];
    const previousTrailLength = targetFinding.auditTrail.length;

    // Transition finding status
    const updated = enterpriseStore.transitionFindingStatus(
      targetFinding.id,
      "VALIDATING",
      "usr-analyst-1",
      "Automated remediation playbook triggered"
    );

    expect(updated).toBeDefined();
    expect(updated?.lifecycleStatus).toBe("VALIDATING");
    expect(updated?.auditTrail.length).toBe(previousTrailLength + 1);
  });
});
