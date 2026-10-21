import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { getPostgresPool, runDatabaseMigrations } from "../../src/db/postgres";
import {
  assertWorkspaceMembership, listAssets, createAsset, listIncidents,
  approveIncidentAction, executeIncidentAction, rollbackIncidentAction,
} from "../../src/db/repositories";

const enabled = Boolean(process.env.DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const suffix = randomUUID();
const organizationId = `it-org-${suffix}`;
const workspaceA = `it-ws-a-${suffix}`;
const workspaceB = `it-ws-b-${suffix}`;
const roleId = `it-role-${suffix}`;
const userA = `it-user-a-${suffix}`;
const userB = `it-user-b-${suffix}`;
let createdAssetId: string | undefined;
const incidentId = `it-incident-${suffix}`;

suite("PostgreSQL tenant-scoped domain repositories", () => {
  beforeAll(async () => {
    const migration = await runDatabaseMigrations();
    if (!migration.success) throw new Error(migration.message);
    const pool = getPostgresPool();
    if (!pool) throw new Error("DATABASE_URL unexpectedly unavailable");
          await pool.query("INSERT INTO organizations (id,name,slug,plan) VALUES ($1,'Integration Test Org',$2,'test')", [organizationId, `it-${suffix}`]);
      await pool.query("INSERT INTO workspaces (id,organization_id,name,environment) VALUES ($1,$2,'Workspace A','lab'),($3,$2,'Workspace B','lab')", [workspaceA, organizationId, workspaceB]);
      await pool.query("INSERT INTO roles (id,name,description,is_system_role) VALUES ($1,$2,'Integration test role',FALSE)", [roleId, `Integration ${suffix}`]);
      await pool.query(
        "INSERT INTO users (id,email,full_name,role_id,default_organization_id,default_workspace_id,is_active) VALUES ($1,$2,'User A',$3,$4,$5,TRUE),($6,$7,'User B',$3,$4,$5,TRUE)",
        [userA, `${userA}@example.test`, roleId, organizationId, workspaceA, userB, `${userB}@example.test`],
      );
      await pool.query("INSERT INTO user_workspace_memberships (user_id,workspace_id,role_id) VALUES ($1,$2,$3),($4,$2,$3),($4,$5,$3)", [userA, workspaceA, roleId, userB, workspaceB]);
      await pool.query(
        `INSERT INTO incidents (id,workspace_id,title,severity,status,containment_actions)
         VALUES ($1,$2,'Integration containment','HIGH','ACTIVE',$3::jsonb)`,
        [incidentId, workspaceA, JSON.stringify([{ id: "action-1", action: "ISOLATE_HOST", target: "lab-host", status: "PENDING_APPROVAL", reversible: true }])],
      );
  });

  afterAll(async () => {
    const pool = getPostgresPool();
    if (!pool) return;
    await pool.query("DELETE FROM users WHERE id = ANY($1::varchar[])", [[userA, userB]]);
    await pool.query("DELETE FROM roles WHERE id = $1", [roleId]);
    await pool.query("DELETE FROM organizations WHERE id = $1", [organizationId]);
    if (createdAssetId) await pool.query("DELETE FROM assets WHERE id = $1", [createdAssetId]);
    await pool.query("DELETE FROM incidents WHERE id = $1", [incidentId]);
  });

  it("requires active database membership in the requested organization and workspace", async () => {
    await expect(assertWorkspaceMembership(userA, organizationId, workspaceA)).resolves.toBe(true);
    await expect(assertWorkspaceMembership(userA, organizationId, workspaceB)).resolves.toBe(false);
    await expect(assertWorkspaceMembership(userA, `wrong-${organizationId}`, workspaceA)).resolves.toBe(false);
  });

  it("persists assets and never returns another workspace's records", async () => {
    const created = await createAsset({
      name: "Integration lab asset", assetType: "server",
      exposure: "INTERNAL", businessCriticality: "LOW", ownerTeam: "Test",
      tags: ["integration"], isInTestingScope: false, securityScore: 80,
    }, workspaceA);
    createdAssetId = created.id;
    expect(created.workspaceId).toBe(workspaceA);
    expect((await listAssets(workspaceA)).some((asset) => asset.id === created.id)).toBe(true);
    expect((await listAssets(workspaceB)).some((asset) => asset.id === created.id)).toBe(false);
  });

  it("persists approval/execution/rollback transitions atomically and separates operators", async () => {
    await expect(approveIncidentAction(incidentId, "action-1", workspaceA, userA)).resolves.toMatchObject({ success: true });
    await expect(executeIncidentAction(incidentId, "action-1", workspaceA, userA)).resolves.toMatchObject({ success: false });
    await expect(executeIncidentAction(incidentId, "action-1", workspaceA, userB)).resolves.toMatchObject({ success: true });
    await expect(listIncidents(workspaceA)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: incidentId, containmentActions: expect.arrayContaining([expect.objectContaining({ id: "action-1", status: "EXECUTED" })]) }),
    ]));
    await expect(rollbackIncidentAction(incidentId, "action-1", workspaceA, userA)).resolves.toMatchObject({ success: true });
    await expect(listIncidents(workspaceB)).resolves.toEqual([]);
  });
});
