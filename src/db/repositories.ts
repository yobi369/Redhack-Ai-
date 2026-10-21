import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { getPostgresPool, withPostgresTransaction } from "./postgres";
import type { Asset, EvidenceItem, Finding, Incident } from "./models";

type Row = Record<string, any>;

function requiredPool() {
  const pool = getPostgresPool();
  if (!pool) throw new Error("PostgreSQL persistence is required for this operation.");
  return pool;
}

function mapAsset(row: Row): Asset {
  return {
    id: row.id, workspaceId: row.workspace_id, projectId: row.project_id ?? undefined,
    name: row.name, assetType: row.asset_type, ipAddress: row.ip_address ?? undefined,
    hostname: row.hostname ?? undefined, cloudProvider: row.cloud_provider ?? undefined,
    exposure: row.exposure, businessCriticality: row.business_criticality,
    ownerTeam: row.owner_team ?? "", tags: row.tags ?? [], isInTestingScope: row.is_in_testing_scope,
    securityScore: Number(row.security_score ?? 0), createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapFinding(row: Row): Finding {
  return {
    id: row.id, workspaceId: row.workspace_id, assetId: row.asset_id,
    assetName: row.asset_name ?? row.asset_id ?? "Unknown asset", assetExposure: row.asset_exposure ?? "INTERNAL",
    vulnerabilityId: row.vulnerability_id ?? undefined, cveId: row.cve_id ?? undefined,
    title: row.title, severity: row.severity, confidence: row.confidence,
    lifecycleStatus: row.lifecycle_status, explanation: row.explanation,
    evidence: row.evidence ?? "", businessImpact: row.business_impact,
    recommendedRemediation: row.recommended_remediation,
    assignedToUserId: row.assigned_to_user_id ?? undefined, discoveredByAgent: row.discovered_by_agent ?? undefined,
    validationStatus: row.validation_status ?? "PENDING_VALIDATION",
    remediationStatus: row.remediation_status ?? "OPEN",
    verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
    auditTrail: row.audit_trail ?? [],
  };
}

function mapIncident(row: Row): Incident {
  return {
    id: row.id, workspaceId: row.workspace_id, title: row.title, severity: row.severity,
    status: row.status, assignedLeadId: row.assigned_lead_id ?? undefined,
    impactSummary: row.impact_summary ?? "", containmentActions: row.containment_actions ?? [],
    rootCause: row.root_cause ?? undefined, relatedAlertIds: row.related_alert_ids ?? [],
    affectedAssetIds: row.affected_asset_ids ?? [],
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapEvidence(row: Row): EvidenceItem {
  return {
    id: row.id, workspaceId: row.workspace_id, findingId: row.finding_id ?? undefined,
    investigationId: row.investigation_id ?? undefined, title: row.title, evidenceType: row.evidence_type,
    sha256Hash: row.sha256_hash, chainOfCustody: row.chain_of_custody ?? [], content: row.content,
    collectedBy: row.collected_by, createdAt: new Date(row.created_at).toISOString(),
  };
}

/** Checks membership against the database, not client headers or token claims alone. */
export async function assertWorkspaceMembership(userId: string, organizationId: string, workspaceId: string): Promise<boolean> {
  const pool = requiredPool();
  const result = await pool.query(
    `SELECT 1
       FROM users u
       JOIN user_workspace_memberships m ON m.user_id = u.id
       JOIN workspaces w ON w.id = m.workspace_id
      WHERE u.id = $1 AND u.is_active = TRUE AND m.workspace_id = $2
        AND w.organization_id = $3 AND w.is_active = TRUE`,
    [userId, workspaceId, organizationId],
  );
  return result.rowCount === 1;
}

export async function listAssets(workspaceId: string): Promise<Asset[]> {
  const result = await requiredPool().query(
    "SELECT * FROM assets WHERE workspace_id = $1 ORDER BY created_at DESC, id",
    [workspaceId],
  );
  return result.rows.map(mapAsset);
}

export async function createAsset(input: Partial<Asset>, workspaceId: string): Promise<Asset> {
  if (!input.name?.trim() || !input.assetType || !input.exposure || !input.businessCriticality) {
    throw new Error("name, assetType, exposure and businessCriticality are required");
  }
  const pool = requiredPool();
  if (input.projectId) {
    const project = await pool.query(
      "SELECT 1 FROM projects WHERE id = $1 AND workspace_id = $2",
      [input.projectId, workspaceId],
    );
    if (project.rowCount !== 1) throw new Error("Project not found in this workspace");
  }
  const id = randomUUID();
  const result = await pool.query(
    `INSERT INTO assets
      (id, workspace_id, project_id, name, asset_type, ip_address, hostname, cloud_provider,
       exposure, business_criticality, owner_team, tags, is_in_testing_scope, security_score)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [id, workspaceId, input.projectId ?? null, input.name.trim(), input.assetType,
      input.ipAddress ?? null, input.hostname ?? null, input.cloudProvider ?? null,
      input.exposure, input.businessCriticality, input.ownerTeam ?? "", input.tags ?? [],
      input.isInTestingScope ?? false, input.securityScore ?? 0],
  );
  return mapAsset(result.rows[0]);
}

export async function listFindings(workspaceId: string): Promise<Finding[]> {
  const result = await requiredPool().query(
    `SELECT f.*, v.cve_id, a.name AS asset_name, a.exposure AS asset_exposure
       FROM findings f
       LEFT JOIN vulnerabilities v ON v.id = f.vulnerability_id
       LEFT JOIN assets a ON a.id = f.asset_id AND a.workspace_id = f.workspace_id
      WHERE f.workspace_id = $1 ORDER BY f.created_at DESC, f.id`,
    [workspaceId],
  );
  return result.rows.map(mapFinding);
}

export async function listIncidents(workspaceId: string): Promise<Incident[]> {
  const result = await requiredPool().query(
    "SELECT * FROM incidents WHERE workspace_id = $1 ORDER BY created_at DESC, id",
    [workspaceId],
  );
  return result.rows.map(mapIncident);
}

export async function listEvidence(workspaceId: string): Promise<EvidenceItem[]> {
  const result = await requiredPool().query(
    "SELECT * FROM evidence WHERE workspace_id = $1 ORDER BY created_at DESC, id",
    [workspaceId],
  );
  return result.rows.map(mapEvidence);
}

export async function createEvidence(input: Omit<EvidenceItem, "id" | "createdAt" | "workspaceId">, workspaceId: string): Promise<EvidenceItem> {
  if (!input.title?.trim() || !input.sha256Hash || !/^[a-f0-9]{64}$/i.test(input.sha256Hash) || !input.collectedBy) {
    throw new Error("title, collectedBy and a valid SHA-256 hash are required");
  }
  return withPostgresTransaction(async (client: PoolClient) => {
    if (input.findingId) {
      const finding = await client.query("SELECT 1 FROM findings WHERE id = $1 AND workspace_id = $2", [input.findingId, workspaceId]);
      if (finding.rowCount !== 1) throw new Error("Finding not found in this workspace");
    }
    if (input.investigationId) {
      const investigation = await client.query("SELECT 1 FROM investigations WHERE id = $1 AND workspace_id = $2", [input.investigationId, workspaceId]);
      if (investigation.rowCount !== 1) throw new Error("Investigation not found in this workspace");
    }
    const result = await client.query(
      `INSERT INTO evidence
       (id, workspace_id, finding_id, investigation_id, title, evidence_type, sha256_hash, chain_of_custody, content, collected_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10) RETURNING *`,
      [randomUUID(), workspaceId, input.findingId ?? null, input.investigationId ?? null,
       input.title.trim(), input.evidenceType, input.sha256Hash.toLowerCase(),
       JSON.stringify(input.chainOfCustody ?? []), input.content, input.collectedBy],
    );
    return mapEvidence(result.rows[0]);
  });
}

async function updateIncidentAction(
  incidentId: string, actionId: string, workspaceId: string,
  transition: "approve" | "execute" | "rollback", actor: string,
): Promise<{ success: boolean; message: string; action?: any }> {
  return withPostgresTransaction(async (client: PoolClient) => {
    const selected = await client.query(
      "SELECT * FROM incidents WHERE id = $1 AND workspace_id = $2 FOR UPDATE",
      [incidentId, workspaceId],
    );
    if (!selected.rowCount) return { success: false, message: "Incident not found" };
    const incident = mapIncident(selected.rows[0]);
    const action = incident.containmentActions.find((item) => item.id === actionId);
    if (!action) return { success: false, message: "Containment action not found" };
    if (transition === "approve") {
      if (action.status !== "PENDING_APPROVAL") return { success: false, message: "Only pending actions can be approved" };
      action.status = "APPROVED";
      action.approvedBy = actor;
      action.approvedAt = new Date().toISOString();
    } else if (transition === "execute") {
      if (action.status !== "APPROVED") return { success: false, message: "Action must be approved before execution" };
      if (action.approvedBy === actor) return { success: false, message: "A different operator must execute an approved action" };
      action.status = "EXECUTED";
      action.executedBy = actor;
      action.executedAt = new Date().toISOString();
    } else {
      if (action.status !== "EXECUTED") return { success: false, message: "Only executed actions can be rolled back" };
      if (!action.reversible) return { success: false, message: "This action is not marked reversible" };
      action.status = "ROLLED_BACK";
      action.executedBy = actor;
      action.executedAt = new Date().toISOString();
    }
    await client.query(
      "UPDATE incidents SET containment_actions = $1::jsonb, updated_at = NOW() WHERE id = $2 AND workspace_id = $3",
      [JSON.stringify(incident.containmentActions), incidentId, workspaceId],
    );
    await client.query(
      `INSERT INTO audit_events (id, workspace_id, actor_id, actor_type, actor_name, action, target_type, target_id, details)
       VALUES ($1,$2,$3,'USER',$3,$4,'INCIDENT',$5,$6::jsonb)`,
      [randomUUID(), workspaceId, actor, `CONTAINMENT_ACTION_${transition.toUpperCase()}`, incidentId, JSON.stringify({ actionId, action: action.action, target: action.target })],
    );
    return { success: true, message: transition === "approve" ? "Action approved; execution is separate" : transition === "execute" ? "Execution state recorded; no external connector was invoked" : "Rollback state recorded; no external connector was invoked", action };
  });
}

export const approveIncidentAction = (incidentId: string, actionId: string, workspaceId: string, actor: string) =>
  updateIncidentAction(incidentId, actionId, workspaceId, "approve", actor);
export const executeIncidentAction = (incidentId: string, actionId: string, workspaceId: string, actor: string) =>
  updateIncidentAction(incidentId, actionId, workspaceId, "execute", actor);
export const rollbackIncidentAction = (incidentId: string, actionId: string, workspaceId: string, actor: string) =>
  updateIncidentAction(incidentId, actionId, workspaceId, "rollback", actor);
