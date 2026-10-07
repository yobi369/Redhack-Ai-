export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type CompanionMode = "red_team" | "blue_team" | "incident_response" | "vuln_analyst" | "general_secops";

export type UserRole = "L1_ANALYST" | "L2_INVESTIGATOR" | "PURPLE_TEAM_LEAD" | "CISO_AUDITOR";

// -------------------------------------------------------------
// 1. Enterprise Security Operations Center (SOC) & Telemetry
// -------------------------------------------------------------
export type TelemetrySourceType = 
  | "aws_cloudtrail"
  | "guardduty"
  | "crowdstrike_falcon"
  | "sysmon"
  | "okta_idp"
  | "suricata_nids"
  | "nginx_waf"
  | "splunk_hec";

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  sourceType: TelemetrySourceType;
  sourceName: string;
  eventCategory: "Network" | "Authentication" | "Web App" | "Endpoint" | "Identity" | "Cloud";
  action: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort?: number;
  destinationPort?: number;
  user?: string;
  process?: string;
  commandLine?: string;
  riskScore: number;
  normalized: boolean;
  rawPayload: string;
  matchedIocs?: string[];
  mitreTechnique?: string;
  mitreId?: string;
}

export interface IngestionAdapterStatus {
  sourceType: TelemetrySourceType;
  displayName: string;
  status: "ONLINE" | "DEGRADED" | "STANDBY" | "SIMULATED";
  eps: number; // Events per second
  lastEventTime: string;
  totalEventsProcessed: number;
  errorCount: number;
}

export interface ThreatAlert {
  id: string;
  timestamp: string;
  title: string;
  category: "Network" | "Authentication" | "Web App" | "Endpoint" | "Malware" | "Exfiltration" | "Cloud";
  severity: SeverityLevel;
  sourceIp: string;
  destinationIp: string;
  targetPort: number;
  protocol: "TCP" | "UDP" | "HTTP" | "HTTPS" | "DNS" | "SSH";
  mitreTechnique: string;
  mitreId: string;
  status: "ACTIVE" | "INVESTIGATING" | "CONTAINED" | "RESOLVED";
  rawLog: string;
  suggestedAction: string;
  containedAt?: string;
  containmentCommand?: string;
  correlatedAlertsCount?: number;
  caseId?: string;
  confidenceScore?: number;
}

export interface SocCase {
  id: string;
  title: string;
  severity: SeverityLevel;
  status: "NEW" | "TRIAGE" | "INVESTIGATION" | "CONTAINMENT" | "RESOLVED" | "CLOSED";
  priority: "P1" | "P2" | "P3" | "P4";
  assignee: string;
  createdAt: string;
  updatedAt: string;
  correlatedAlertIds: string[];
  mitreTactics: string[];
  summary: string;
  evidenceItems: {
    id: string;
    type: "IP" | "HASH" | "LOG" | "FILE" | "NETWORK";
    value: string;
    description: string;
    addedAt: string;
  }[];
  timeline: {
    timestamp: string;
    actor: string;
    event: string;
    type: "SYSTEM" | "ANALYST" | "CONTAINMENT" | "ESCALATION";
  }[];
  analystNotes: {
    id: string;
    author: string;
    role: UserRole;
    text: string;
    timestamp: string;
  }[];
}

// -------------------------------------------------------------
// 2. Authorized Attack Surface Management (EASM)
// -------------------------------------------------------------
export type AssetCriticality = "MISSION_CRITICAL" | "BUSINESS_CRITICAL" | "INTERNAL" | "LOW";

export interface AuthorizedAsset {
  id: string;
  name: string;
  assetType: "DOMAIN" | "IP_CIDR" | "CLOUD_SERVICE" | "ENDPOINT" | "API_GATEWAY";
  identifier: string; // e.g., 10.0.0.0/24, api.corp.internal
  owner: string;
  criticality: AssetCriticality;
  inScope: boolean;
  isExcluded: boolean; // Explicit exclusion override
  exclusionReason?: string;
  lastAssessed?: string;
  discoveredServices: {
    port: number;
    protocol: string;
    serviceName: string;
    version?: string;
    banner?: string;
  }[];
  activeVulnerabilitiesCount: number;
  highestSeverity: SeverityLevel;
  exposureScore: number; // 0 - 100
}

export interface AttackSurfaceScopeConfig {
  authorizedDomains: string[];
  authorizedCidrs: string[];
  explicitExclusions: {
    target: string;
    reason: string;
    addedBy: string;
  }[];
  rateLimitReqPerSec: number;
  allowedTestingWindows: {
    dayOfWeek: string;
    startHourUtc: number;
    endHourUtc: number;
  }[];
}

export interface AttackPathNode {
  id: string;
  title: string;
  type: "EXTERNAL" | "PERIMETER" | "INTERNAL_ASSET" | "DATABASE" | "IDENTITY";
  compromised: boolean;
  vulnerabilityRef?: string;
  description: string;
}

export interface AttackPath {
  id: string;
  name: string;
  targetAssetId: string;
  likelihood: "HIGH" | "MEDIUM" | "LOW";
  impact: "CRITICAL" | "HIGH" | "MEDIUM";
  nodes: AttackPathNode[];
  remediationRecommendation: string;
}

// -------------------------------------------------------------
// 3. Purple-Team & Adversary Simulation Engine
// -------------------------------------------------------------
export interface SimulationScenario {
  id: string;
  title: string;
  mitreTactic: "Initial Access" | "Execution" | "Persistence" | "Privilege Escalation" | "Defense Evasion" | "Credential Access" | "Discovery" | "Lateral Movement" | "Exfiltration";
  mitreId: string;
  description: string;
  safetyProfile: "SAFE_SYNTHETIC" | "ISOLATED_PROBE" | "BENIGN_AUDIT";
  targetScopeRequirement: string;
  timeoutSeconds: number;
  expectedDefensiveDetection: string;
  syntheticPayloadPreview: string;
  defensiveAssertion: string;
}

export interface SimulationExecutionRecord {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  mitreId: string;
  targetAsset: string;
  startedAt: string;
  completedAt?: string;
  status: "PREFLIGHT" | "RUNNING" | "STOPPED_BY_EMERGENCY" | "COMPLETED" | "BLOCKED_BY_SCOPE";
  scopeValidationResult: {
    authorized: boolean;
    reason: string;
  };
  telemetryGeneratedCount: number;
  detectionVerified: boolean;
  detectedAlertId?: string;
  coverageGapFound: boolean;
  executionLogs: string[];
  postureBefore: {
    detectionRate: number;
    riskScore: number;
  };
  postureAfter: {
    detectionRate: number;
    riskScore: number;
    gapRemediated: boolean;
  };
}

// -------------------------------------------------------------
// 4. AI Threat Detection & Hunting Studio
// -------------------------------------------------------------
export interface DetectionRuleArtifact {
  id: string;
  title: string;
  version: string;
  author: string;
  mitreId: string;
  mitreTactic: string;
  severity: SeverityLevel;
  status: "EXPERIMENTAL" | "VALIDATED" | "ACTIVE_PRODUCTION" | "DEPRECATED";
  sigmaYaml: string;
  yaraRule: string;
  splunkSpl: string;
  elasticKql: string;
  validationStatus: {
    sigmaValid: boolean;
    yaraValid: boolean;
    splValid: boolean;
    kqlValid: boolean;
    syntaxErrors: string[];
  };
  testTelemetryResult?: {
    totalEventsTested: number;
    truePositives: number;
    falsePositives: number;
    passedTest: boolean;
  };
  explainability: {
    evidenceSources: string[];
    underlyingAssumptions: string[];
    confidencePercentage: number;
    operationalLimitations: string[];
  };
}

// -------------------------------------------------------------
// 5. Automated Incident Response (SOAR) & Approval Gates
// -------------------------------------------------------------
export interface SoarPlaybook {
  id: string;
  name: string;
  category: "PHISHING" | "RANSOMWARE" | "CREDENTIAL_COMPROMISE" | "WEB_EXPLOITATION" | "MALWARE";
  triggerCondition: string;
  description: string;
  steps: {
    stepIndex: number;
    name: string;
    description: string;
    isHighConsequence: boolean; // If true, requires human approval gate
    automatedByDefault: boolean;
    actionType: "QUERY" | "ENRICH" | "ISOLATE_HOST" | "BLOCK_FIREWALL" | "DISABLE_USER" | "KILL_PROCESS" | "ROLLBACK";
    targetParameter: string;
    rollbackCommand?: string;
  }[];
}

export interface SoarApprovalRequest {
  id: string;
  caseId: string;
  alertId?: string;
  actionTitle: string;
  actionType: "ISOLATE_HOST" | "BLOCK_FIREWALL" | "DISABLE_USER" | "KILL_PROCESS";
  targetResource: string;
  commandPreview: string;
  riskAssessment: string;
  potentialDisruption: string;
  rollbackPlan: string;
  requestedAt: string;
  status: "PENDING_APPROVAL" | "APPROVED_EXECUTED" | "REJECTED" | "ROLLED_BACK";
  approvedBy?: string;
  approvedAt?: string;
  executedAt?: string;
  executionOutput?: string;
  rolledBackAt?: string;
}

// -------------------------------------------------------------
// 6. Threat Intelligence & IOC Management
// -------------------------------------------------------------
export type IocType = "IPv4" | "IPv6" | "Domain" | "URL" | "SHA256" | "MD5" | "CVE";

export interface ThreatIndicator {
  id: string;
  indicator: string; // Defanged for safe storage
  rawIndicator: string; // Explicit refanged
  type: IocType;
  threatActor?: string;
  threatGroup?: string;
  malwareFamily?: string;
  confidence: number; // 0 - 100
  tlp: "TLP:CLEAR" | "TLP:GREEN" | "TLP:AMBER" | "TLP:RED";
  firstSeen: string;
  lastSeen: string;
  expiresAt: string;
  sourceAttribution: string;
  tags: string[];
  activeMatchesInTelemetry: number;
  falsePositive: boolean;
}

// -------------------------------------------------------------
// 7. CVSS v3.1 & Vulnerability Management
// -------------------------------------------------------------
export interface CvssMetrics {
  attackVector: "N" | "A" | "L" | "P"; // Network, Adjacent, Local, Physical
  attackComplexity: "L" | "H"; // Low, High
  privilegesRequired: "N" | "L" | "H"; // None, Low, High
  userInteraction: "N" | "R"; // None, Required
  scope: "U" | "C"; // Unchanged, Changed
  confidentiality: "H" | "L" | "N"; // High, Low, None
  integrity: "H" | "L" | "N"; // High, Low, None
  availability: "H" | "L" | "N"; // High, Low, None
  baseScore: number;
  vectorString: string;
  severity: SeverityLevel;
}

export interface VulnerabilityFinding {
  id: string;
  title: string;
  severity: SeverityLevel;
  cvss: number;
  cvssVector?: string;
  cwe: string;
  asset: string;
  assetCriticality?: AssetCriticality;
  description: string;
  proofOfConcept?: string;
  impact: string;
  remediation: string;
  remediationScript?: string;
  verified: boolean;
  status?: "OPEN" | "IN_PROGRESS" | "PATCH_VERIFIED" | "ACCEPTED_RISK";
  slaDeadline?: string;
  assignee?: string;
  retestedAt?: string;
  retestEvidence?: string;
}

export interface VulnerabilityReport {
  id: string;
  title: string;
  targetName: string;
  assessmentType: string;
  scope: string;
  assessor: string;
  date: string;
  overallRiskScore: number;
  executiveSummary: string;
  findings: VulnerabilityFinding[];
  remediationChecklist: string[];
  markdownContent?: string;
}

// -------------------------------------------------------------
// 8. Governance, RoE & Compliance Controls
// -------------------------------------------------------------
export interface RulesOfEngagementConfig {
  organizationName: string;
  assessorName: string;
  assessmentType: string;
  startDate: string;
  endDate: string;
  testingHours: string;
  authorizedCidrs: string;
  outOfScopeAssets: string;
  emergencyContact: string;
  emergencyPhone: string;
  emergencyStopProcedure: string;
  nonDestructiveOnly: boolean;
  authorizedBy: string;
  signedDate: string;
  approvalToken?: string;
}

export interface ComplianceControlItem {
  id: string;
  standard: "NIST CSF 2.0" | "ISO 27001:2022" | "SOC 2 Type II" | "MITRE ATT&CK";
  controlCode: string;
  title: string;
  status: "IMPLEMENTED" | "IN_PROGRESS" | "PLANNED";
  implementationEvidence: string;
  mappedFeature: string;
}

export interface SystemAuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  resource: string;
  status: "SUCCESS" | "BLOCKED" | "EMERGENCY_STOP";
  details: string;
}

// -------------------------------------------------------------
// Chat & Presentation Playbooks
// -------------------------------------------------------------
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  mode?: CompanionMode;
  metadata?: {
    attackType?: string;
    mitreId?: string;
    containmentScript?: string;
    iocs?: {
      ips?: string[];
      domains?: string[];
    };
  };
}

export interface WorkflowStep {
  step: number;
  title: string;
  category: "offensive" | "defensive" | "reporting";
  iconName: string;
  description: string;
  actions: string[];
  keyTools: string[];
  mitrePhase: string;
  exampleCommand: string;
  defenseEquivalent: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  targetRole: "SOC Analyst" | "Pentester / Red Team" | "CISO / Lead Auditor";
  description: string;
  durationMinutes: number;
  steps: {
    title: string;
    actionDescription: string;
    tabTarget: "monitor" | "soc" | "easm" | "purple" | "hunting" | "soar" | "reports" | "tools" | "governance";
    codeSnippet?: string;
    preloadedAlert?: Partial<ThreatAlert>;
  }[];
}
