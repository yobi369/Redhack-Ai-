// ============================================================================
// REDHACK AI v2 - TypeScript Models for PostgreSQL Data Schema
// ============================================================================

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type ConfidenceLevel = "CONFIRMED" | "HIGH" | "MEDIUM" | "LOW";

// Unified Finding Lifecycle:
// DISCOVERED -> TRIAGED -> VALIDATING -> CONFIRMED / DISMISSED -> REMEDIATION -> RETEST -> RESOLVED
export type FindingLifecycleStatus = 
  | "DISCOVERED"
  | "TRIAGED"
  | "VALIDATING"
  | "CONFIRMED"
  | "DISMISSED"
  | "REMEDIATION"
  | "RETEST"
  | "RESOLVED";

export type RemediationStatus = "OPEN" | "IN_PROGRESS" | "FIXED_AWAITING_RETEST" | "VERIFIED_FIXED" | "RISK_ACCEPTED";
export type ValidationStatus = "PENDING_VALIDATION" | "SAFE_SIMULATION_QUEUED" | "EXPLOITABILITY_CONFIRMED" | "NON_EXPLOITABLE" | "DISMISSED_OUT_OF_SCOPE";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  maxWorkspaces: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScopePolicy {
  authorizedSubnets: string[];
  authorizedDomains: string[];
  excludedAssets: string[];
  emergencyContact: string;
  emergencyPhone: string;
  killSwitchActive: boolean;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  environment: "production" | "staging" | "lab" | "isolated-sandbox";
  scopePolicy: ScopePolicy;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  roleId: string;
  roleName: string;
  defaultOrganizationId: string;
  defaultWorkspaceId: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  leadOwnerId: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export type AssetType = 
  | "server"
  | "database"
  | "cloud_workload"
  | "api_gateway"
  | "ai_model_service"
  | "mcp_server"
  | "endpoint"
  | "container";

export type ExposureLevel = "PUBLIC_INTERNET" | "INTERNAL" | "RESTRICTED_ISOLATED";
export type BusinessCriticality = "MISSION_CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Asset {
  id: string;
  workspaceId: string;
  projectId?: string;
  name: string;
  assetType: AssetType;
  ipAddress?: string;
  hostname?: string;
  cloudProvider?: "AWS" | "GCP" | "Azure" | "On-Premise";
  exposure: ExposureLevel;
  businessCriticality: BusinessCriticality;
  ownerTeam: string;
  tags: string[];
  isInTestingScope: boolean;
  securityScore: number;
  openFindingsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  description: string;
  cvssV31Vector: string;
  cvssScore: number;
  severity: SeverityLevel;
  epssScore?: number;
  cisaKev: boolean;
  remediationGuidance: string;
  publishedDate?: string;
}

export interface Threat {
  id: string;
  workspaceId: string;
  name: string;
  threatActor: string;
  category: string;
  mitreAttackId?: string;
  mitreTactic?: string;
  description: string;
  confidence: ConfidenceLevel;
  indicators: string[];
  stixBundle?: Record<string, any>;
  createdAt: string;
}

export interface FindingAuditEntry {
  timestamp: string;
  actor: string;
  previousStatus: FindingLifecycleStatus;
  newStatus: FindingLifecycleStatus;
  notes: string;
}

export interface Finding {
  id: string;
  workspaceId: string;
  assetId: string;
  assetName: string;
  assetExposure: ExposureLevel;
  vulnerabilityId?: string;
  cveId?: string;
  title: string;
  severity: SeverityLevel;
  confidence: ConfidenceLevel;
  lifecycleStatus: FindingLifecycleStatus;
  explanation: string;
  evidence: string;
  businessImpact: string;
  recommendedRemediation: string;
  assignedToUserId?: string;
  discoveredByAgent?: string;
  validationStatus: ValidationStatus;
  remediationStatus: RemediationStatus;
  verifiedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  auditTrail: FindingAuditEntry[];
}

export interface Alert {
  id: string;
  workspaceId: string;
  assetId?: string;
  title: string;
  category: "Network" | "Authentication" | "Web App" | "Endpoint" | "Cloud" | "AI/LLM" | "MCP";
  severity: SeverityLevel;
  status: "NEW" | "TRIAGED" | "ESCALATED_TO_INCIDENT" | "FALSE_POSITIVE" | "CLOSED";
  sourceType: string;
  sourceIp?: string;
  destinationIp?: string;
  targetPort?: number;
  userIdentity?: string;
  mitreTechniqueId?: string;
  rawPayload?: Record<string, any>;
  createdAt: string;
}

export interface IncidentContainmentAction {
  id: string;
  action: string;
  target: string;
  status: "PENDING_APPROVAL" | "EXECUTED" | "ROLLED_BACK" | "REJECTED";
  executedBy?: string;
  executedAt?: string;
  reversible: boolean;
}

export interface Incident {
  id: string;
  workspaceId: string;
  title: string;
  severity: SeverityLevel;
  status: "ACTIVE" | "CONTAINED" | "ERADICATED" | "POST_MORTEM" | "CLOSED";
  assignedLeadId?: string;
  assignedLeadName?: string;
  impactSummary: string;
  containmentActions: IncidentContainmentAction[];
  rootCause?: string;
  relatedAlertIds: string[];
  affectedAssetIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationTimelineItem {
  timestamp: string;
  actor: string;
  event: string;
  type: "TELEMETRY" | "AGENT_ACTION" | "HUMAN_DECISION" | "ARTIFACT_ADDED";
}

export interface Investigation {
  id: string;
  workspaceId: string;
  incidentId: string;
  title: string;
  hypothesis: string;
  findingsSummary: string;
  timeline: InvestigationTimelineItem[];
  leadInvestigatorId?: string;
  leadInvestigatorName?: string;
  status: "IN_PROGRESS" | "CONCLUDED" | "AWAITING_EVIDENCE";
  createdAt: string;
  updatedAt: string;
}

export interface ChainOfCustodyEntry {
  timestamp: string;
  actor: string;
  action: string;
  verificationHash: string;
}

export interface EvidenceItem {
  id: string;
  workspaceId: string;
  findingId?: string;
  investigationId?: string;
  title: string;
  evidenceType: "pcap_snippet" | "raw_log" | "terminal_session" | "screenshot" | "config_dump" | "memory_hex" | "prompt_injection_trace";
  sha256Hash: string;
  chainOfCustody: ChainOfCustodyEntry[];
  content: string;
  collectedBy: string;
  createdAt: string;
}

export interface SimulationExecutionLogEntry {
  timestamp: string;
  phase: "PRE_FLIGHT_SCOPE_CHECK" | "ATTACK_EMULATION" | "SIEM_DETECTION_CHECK" | "EDR_RESPONSE_CHECK" | "SUMMARY";
  status: "SUCCESS" | "BLOCKED_BY_GUARDRAIL" | "DETECTED" | "MISSED";
  details: string;
}

export interface Simulation {
  id: string;
  workspaceId: string;
  scenarioId: string;
  title: string;
  targetAssetId?: string;
  targetAssetScope: string;
  authorizedByUserId?: string;
  status: "READY" | "VALIDATING_SCOPE" | "EXECUTING" | "COMPLETED" | "HALTED_BY_OPERATOR" | "ABORTED_OUT_OF_SCOPE";
  preventionScore: number;
  detectionScore: number;
  responseScore: number;
  executionLog: SimulationExecutionLogEntry[];
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

// ============================================================================
// Multi-Agent Architecture
// ============================================================================
export type AgentCodeName = 
  | "orchestrator"
  | "security_analyst"
  | "code_security"
  | "threat_intel"
  | "detection_engineer"
  | "incident_response"
  | "validation_agent"
  | "reporting_agent"
  | "ai_security_agent";

export interface AgentToolDefinition {
  name: string;
  description: string;
  isDestructiveOrConsequential: boolean;
  requiredPermission: string;
}

export interface SpecializedAgent {
  id: string;
  codeName: AgentCodeName;
  displayName: string;
  roleDescription: string;
  permissionScope: string[];
  availableTools: AgentToolDefinition[];
  requiresHumanApprovalFor: string[];
  isActive: boolean;
}

export interface AgentRunPendingApproval {
  actionName: string;
  target: string;
  impactLevel: "HIGH" | "CRITICAL";
  justification: string;
  reversible: boolean;
}

export interface AgentRun {
  id: string;
  workspaceId: string;
  agentCodeName: AgentCodeName;
  agentDisplayName: string;
  invokedByUserId: string;
  triggerType: "MANUAL" | "ALERT_PIPELINE" | "SOAR_ORCHESTRATION" | "SCHEDULED_SCAN";
  status: "RUNNING" | "WAITING_FOR_HUMAN_APPROVAL" | "COMPLETED" | "FAILED" | "REVOKED";
  inputContext: Record<string, any>;
  outputResult?: Record<string, any>;
  approvalPendingAction?: AgentRunPendingApproval;
  toolCalls: Array<{
    toolName: string;
    params: any;
    result: any;
    timestamp: string;
    approvedByHuman?: boolean;
  }>;
  startedAt: string;
  completedAt?: string;
}

// ============================================================================
// Unified Security Score
// ============================================================================
export interface SecurityScoreBreakdown {
  assetExposure: number;         // 0-100 (higher is better protected)
  severityExploitability: number;// 0-100 (higher means fewer severe exploitables)
  confidenceAccuracy: number;    // 0-100 (higher confidence in findings)
  detectionCoverage: number;     // 0-100 (EDR, SIEM, CloudTrail coverage)
  remediationStatus: number;     // 0-100 (percentage of findings remediated)
  businessImpactRisk: number;    // 0-100 (lower risk = higher score)
}

export interface SecurityScoreRecord {
  id: string;
  workspaceId: string;
  overallScore: number;          // 0-100
  letterGrade: "A+" | "A" | "B" | "C" | "D" | "F";
  breakdown: SecurityScoreBreakdown;
  calculatedAt: string;
}

export interface ReportItem {
  id: string;
  workspaceId: string;
  title: string;
  reportType: "EXECUTIVE_SUMMARY" | "PENTEST_ASSESSMENT" | "INCIDENT_POSTMORTEM" | "COMPLIANCE_AUDIT" | "SOC_OPERATIONS" | "AI_MCP_SECURITY";
  format: "MARKDOWN" | "JSON" | "HTML" | "CSV" | "PDF";
  generatedByUserId?: string;
  generatedByAgent?: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface IntegrationConfig {
  id: string;
  workspaceId: string;
  serviceName: string;
  category: "SIEM" | "EDR" | "CLOUD" | "TICKETING" | "NOTIFICATION" | "AI_MCP";
  config: Record<string, any>;
  status: "ACTIVE" | "PAUSED" | "ERROR";
  lastSyncAt?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  actorId: string;
  actorType: "USER" | "AGENT" | "SYSTEM";
  actorName: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}
