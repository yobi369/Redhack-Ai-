import {
  IngestionAdapterStatus,
  TelemetryEvent,
  SocCase,
  AuthorizedAsset,
  AttackSurfaceScopeConfig,
  AttackPath,
  SimulationScenario,
  DetectionRuleArtifact,
  SoarPlaybook,
  SoarApprovalRequest,
  ThreatIndicator,
  ComplianceControlItem,
  SystemAuditLogEntry,
} from "../types";

export const INITIAL_INGESTION_ADAPTERS: IngestionAdapterStatus[] = [
  {
    sourceType: "aws_cloudtrail",
    displayName: "AWS CloudTrail & GuardDuty",
    status: "ONLINE",
    eps: 42.5,
    lastEventTime: "Just now",
    totalEventsProcessed: 142095,
    errorCount: 0,
  },
  {
    sourceType: "crowdstrike_falcon",
    displayName: "CrowdStrike Falcon EDR",
    status: "ONLINE",
    eps: 89.1,
    lastEventTime: "Just now",
    totalEventsProcessed: 320140,
    errorCount: 0,
  },
  {
    sourceType: "okta_idp",
    displayName: "Okta Identity Provider",
    status: "ONLINE",
    eps: 14.8,
    lastEventTime: "Just now",
    totalEventsProcessed: 59320,
    errorCount: 0,
  },
  {
    sourceType: "suricata_nids",
    displayName: "Suricata Network NIDS",
    status: "ONLINE",
    eps: 120.4,
    lastEventTime: "Just now",
    totalEventsProcessed: 890450,
    errorCount: 2,
  },
  {
    sourceType: "nginx_waf",
    displayName: "Cloud Armor & Nginx WAF",
    status: "ONLINE",
    eps: 65.0,
    lastEventTime: "Just now",
    totalEventsProcessed: 412030,
    errorCount: 0,
  },
  {
    sourceType: "sysmon",
    displayName: "Windows Sysmon EventLog",
    status: "SIMULATED",
    eps: 38.2,
    lastEventTime: "1 min ago",
    totalEventsProcessed: 182300,
    errorCount: 0,
  },
];

export const INITIAL_TELEMETRY_EVENTS: TelemetryEvent[] = [
  {
    id: "EVT-8091",
    timestamp: "10:14:22 UTC",
    sourceType: "suricata_nids",
    sourceName: "edge-nids-01",
    eventCategory: "Network",
    action: "ALERT_TRIGGERED",
    sourceIp: "185.220.101.5",
    destinationIp: "10.0.0.12",
    destinationPort: 22,
    riskScore: 88,
    normalized: true,
    rawPayload: `Suricata alert: [1:2001219:20] ET SCAN Potential Nmap SYN Scan Detected [TCP flags: SYN, seq=3920194, win=1024, mss=1460] SrcIP: 185.220.101.5`,
    mitreTechnique: "Network Service Discovery",
    mitreId: "T1046",
    matchedIocs: ["185.220.101.5"],
  },
  {
    id: "EVT-8092",
    timestamp: "10:14:45 UTC",
    sourceType: "nginx_waf",
    sourceName: "ingress-waf-prod",
    eventCategory: "Web App",
    action: "REQUEST_BLOCKED",
    sourceIp: "45.154.255.89",
    destinationIp: "10.0.0.45",
    destinationPort: 443,
    riskScore: 92,
    normalized: true,
    rawPayload: `POST /api/v1/auth/login HTTP/1.1 Payload: {"username": "admin' OR 1=1 UNION SELECT null,version(),user()--"} 400 Bad Request`,
    mitreTechnique: "Exploit Public-Facing Application",
    mitreId: "T1190",
    matchedIocs: ["45.154.255.89"],
  },
  {
    id: "EVT-8093",
    timestamp: "10:15:10 UTC",
    sourceType: "crowdstrike_falcon",
    sourceName: "host-win-ws04",
    eventCategory: "Endpoint",
    action: "SUSPICIOUS_PROCESS_SPAWN",
    sourceIp: "10.0.2.88",
    destinationIp: "194.26.29.112",
    user: "CORP\\sarah.connor",
    process: "powershell.exe",
    commandLine: "powershell.exe -nop -w hidden -EncodedCommand JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdw...",
    riskScore: 95,
    normalized: true,
    rawPayload: `Crowdstrike Falcon Event: ProcessCreate parent: WINWORD.EXE target: powershell.exe command: -EncodedCommand`,
    mitreTechnique: "Command and Scripting Interpreter: PowerShell",
    mitreId: "T1059.001",
    matchedIocs: ["194.26.29.112"],
  },
  {
    id: "EVT-8094",
    timestamp: "10:16:00 UTC",
    sourceType: "okta_idp",
    sourceName: "okta-production-tenant",
    eventCategory: "Identity",
    action: "MFA_FATIGUE_SUSPECTED",
    sourceIp: "194.26.29.42",
    destinationIp: "10.0.0.10",
    user: "alex.mercer@target-corp.com",
    riskScore: 84,
    normalized: true,
    rawPayload: `Okta Event: 12 Push Notifications denied within 3 minutes followed by single approval from unrecognized geolocation (Bucharest, RO).`,
    mitreTechnique: "Multi-Factor Authentication Request Generation (MFA Fatigue)",
    mitreId: "T1621",
    matchedIocs: ["194.26.29.42"],
  },
  {
    id: "EVT-8095",
    timestamp: "10:17:30 UTC",
    sourceType: "aws_cloudtrail",
    sourceName: "aws-prod-account",
    eventCategory: "Cloud",
    action: "IAM_POLICY_MODIFIED",
    sourceIp: "185.191.171.12",
    destinationIp: "10.0.0.1",
    user: "service-deployer-role",
    riskScore: 78,
    normalized: true,
    rawPayload: `CloudTrail Event: AttachRolePolicy to 'arn:aws:iam::123456789012:role/DataPipelineWorker' -> AdministratorAccess`,
    mitreTechnique: "Cloud Infrastructure Discovery & Privilege Escalation",
    mitreId: "T1078.004",
  },
];

export const INITIAL_SOC_CASES: SocCase[] = [
  {
    id: "CASE-2026-001",
    title: "High-Priority C2 Beaconing & Lateral PowerShell Injection",
    severity: "CRITICAL",
    status: "INVESTIGATION",
    priority: "P1",
    assignee: "SOC Level 2 Senior Analyst",
    createdAt: "10:15:30 UTC",
    updatedAt: "10:22:15 UTC",
    correlatedAlertIds: ["ALT-9043", "ALT-9045"],
    mitreTactics: ["Execution (T1059)", "Command and Control (T1071)", "Exfiltration (T1571)"],
    summary: "Suspicious Word macro spawned hidden PowerShell beacon connecting to external IP 194.26.29.112. DNS exfiltration queries detected from workstation WIN-FIN-WS04.",
    evidenceItems: [
      {
        id: "EV-1",
        type: "IP",
        value: "194.26.29.112",
        description: "Known Cobalt Strike C2 IP flagged in Threat Intel feed",
        addedAt: "10:16:00 UTC",
      },
      {
        id: "EV-2",
        type: "HASH",
        value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        description: "SHA256 of dropped invoice_document.vbs macro",
        addedAt: "10:18:20 UTC",
      },
      {
        id: "EV-3",
        type: "LOG",
        value: "Windows Sysmon EventID 4688 WINWORD -> powershell.exe",
        description: "Process lineage proof of execution",
        addedAt: "10:19:10 UTC",
      },
    ],
    timeline: [
      {
        timestamp: "10:15:10 UTC",
        actor: "CrowdStrike Adapter",
        event: "Correlated alert ALT-9043 triggered high severity case generation",
        type: "SYSTEM",
      },
      {
        timestamp: "10:17:40 UTC",
        actor: "SOC L1 Analyst",
        event: "Assigned case to L2 queue and tagged C2 infrastructure indicators",
        type: "ANALYST",
      },
      {
        timestamp: "10:20:00 UTC",
        actor: "SOAR Orchestrator",
        event: "Dispatched automated host isolation preview pending human approval",
        type: "CONTAINMENT",
      },
    ],
    analystNotes: [
      {
        id: "NOTE-1",
        author: "Marcus Vance (L2)",
        role: "L2_INVESTIGATOR",
        text: "Confirmed encoded PowerShell attempts memory injection. Network perimeter block requested via SOAR approval gate. User account sarah.connor flagged for immediate password reset.",
        timestamp: "10:21:00 UTC",
      },
    ],
  },
  {
    id: "CASE-2026-002",
    title: "Distributed Password Spraying & MFA Fatigue Probe",
    severity: "HIGH",
    status: "TRIAGE",
    priority: "P2",
    assignee: "SOC Level 1 Triage Analyst",
    createdAt: "10:14:30 UTC",
    updatedAt: "10:18:00 UTC",
    correlatedAlertIds: ["ALT-9041"],
    mitreTactics: ["Credential Access (T1110)", "Defense Evasion (T1621)"],
    summary: "Over 50 failed SSH authentication attempts from Tor exit node 185.220.101.5 targeting bastion host.",
    evidenceItems: [
      {
        id: "EV-4",
        type: "IP",
        value: "185.220.101.5",
        description: "Tor Exit Relay listed in AlienVault OTX",
        addedAt: "10:15:00 UTC",
      },
    ],
    timeline: [
      {
        timestamp: "10:14:30 UTC",
        actor: "Suricata NIDS",
        event: "Brute force threshold reached (50/min)",
        type: "SYSTEM",
      },
    ],
    analystNotes: [
      {
        id: "NOTE-2",
        author: "Elena Rostova (L1)",
        role: "L1_ANALYST",
        text: "Automated perimeter rule applied. Checking secondary hosts for matching source IP in last 24h.",
        timestamp: "10:16:30 UTC",
      },
    ],
  },
];

export const INITIAL_AUTHORIZED_ASSETS: AuthorizedAsset[] = [
  {
    id: "ASSET-01",
    name: "Production Ingress Gateway & WAF",
    assetType: "API_GATEWAY",
    identifier: "api.internal-corp.io",
    owner: "DevOps & Cloud Architecture",
    criticality: "MISSION_CRITICAL",
    inScope: true,
    isExcluded: false,
    lastAssessed: "Today at 08:30 UTC",
    discoveredServices: [
      { port: 80, protocol: "TCP", serviceName: "HTTP (Redirect to HTTPS)" },
      { port: 443, protocol: "TCP", serviceName: "HTTPS", version: "Nginx 1.24.0" },
    ],
    activeVulnerabilitiesCount: 2,
    highestSeverity: "HIGH",
    exposureScore: 68,
  },
  {
    id: "ASSET-02",
    name: "Internal Authentication & Identity Bastion",
    assetType: "ENDPOINT",
    identifier: "10.0.0.12",
    owner: "Enterprise IAM Team",
    criticality: "MISSION_CRITICAL",
    inScope: true,
    isExcluded: false,
    lastAssessed: "Yesterday",
    discoveredServices: [
      { port: 22, protocol: "TCP", serviceName: "OpenSSH", version: "8.9p1 Ubuntu" },
      { port: 636, protocol: "TCP", serviceName: "LDAPS", version: "FreeIPA" },
    ],
    activeVulnerabilitiesCount: 1,
    highestSeverity: "CRITICAL",
    exposureScore: 74,
  },
  {
    id: "ASSET-03",
    name: "Primary PostgreSQL Database Cluster",
    assetType: "CLOUD_SERVICE",
    identifier: "db-primary.corp.internal (10.0.3.50)",
    owner: "Data Engineering",
    criticality: "MISSION_CRITICAL",
    inScope: false,
    isExcluded: true,
    exclusionReason: "Explicit Policy Exclusion: Production Database Tier is strictly off-limits for live automated probes.",
    lastAssessed: "Audited manually Q1",
    discoveredServices: [
      { port: 5432, protocol: "TCP", serviceName: "PostgreSQL", version: "15.4" },
    ],
    activeVulnerabilitiesCount: 0,
    highestSeverity: "LOW",
    exposureScore: 12,
  },
  {
    id: "ASSET-04",
    name: "Corporate DMZ Subnet",
    assetType: "IP_CIDR",
    identifier: "10.0.0.0/24",
    owner: "Network Operations Center",
    criticality: "BUSINESS_CRITICAL",
    inScope: true,
    isExcluded: false,
    lastAssessed: "Today at 09:15 UTC",
    discoveredServices: [
      { port: 53, protocol: "UDP", serviceName: "CoreDNS" },
      { port: 443, protocol: "TCP", serviceName: "Web Services" },
    ],
    activeVulnerabilitiesCount: 3,
    highestSeverity: "HIGH",
    exposureScore: 55,
  },
];

export const INITIAL_SCOPE_CONFIG: AttackSurfaceScopeConfig = {
  authorizedDomains: ["internal-corp.io", "target-corp.internal", "redhack-lab.test"],
  authorizedCidrs: ["10.0.0.0/24", "10.0.2.0/24", "192.168.100.0/24"],
  explicitExclusions: [
    {
      target: "db-primary.corp.internal",
      reason: "Live production relational database storage cluster",
      addedBy: "Lead Data Architect",
    },
    {
      target: "10.0.3.50",
      reason: "Core Database Host IP",
      addedBy: "Security Governance Board",
    },
    {
      target: "payment.gateway.internal",
      reason: "PCI-DSS Scope strict change freeze",
      addedBy: "PCI Compliance Auditor",
    },
  ],
  rateLimitReqPerSec: 50,
  allowedTestingWindows: [
    { dayOfWeek: "Monday-Friday", startHourUtc: 2, endHourUtc: 10 },
  ],
};

export const INITIAL_ATTACK_PATHS: AttackPath[] = [
  {
    id: "PATH-01",
    name: "Public API Gateway -> Workstation Shell -> DB Credential Exposure",
    targetAssetId: "ASSET-03",
    likelihood: "HIGH",
    impact: "CRITICAL",
    nodes: [
      {
        id: "NODE-1",
        title: "Internet Threat Actor (External)",
        type: "EXTERNAL",
        compromised: true,
        description: "Reconnaissance targeting public /api/v1/auth/login",
      },
      {
        id: "NODE-2",
        title: "Nginx Ingress Gateway",
        type: "PERIMETER",
        compromised: false,
        vulnerabilityRef: "SQL Injection Probe (T1190)",
        description: "WAF rule 942100 triggered, unauthenticated error leak",
      },
      {
        id: "NODE-3",
        title: "Internal Workstation WIN-FIN-WS04",
        type: "INTERNAL_ASSET",
        compromised: true,
        vulnerabilityRef: "Macro Execution (T1059.001)",
        description: "Compromised employee workstation beaconing to C2",
      },
      {
        id: "NODE-4",
        title: "Core PostgreSQL Production Database",
        type: "DATABASE",
        compromised: false,
        description: "High-value target. Stored application secrets in config files.",
      },
    ],
    remediationRecommendation: "Immediately isolate workstation WIN-FIN-WS04, rotate DB credentials in Kubernetes Secret Vault, and verify WAF SQLi block rules.",
  },
];

export const INITIAL_SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: "SIM-01",
    title: "Safe Recon: Nmap Stealth SYN Port Sweep Emulation",
    mitreTactic: "Discovery",
    mitreId: "T1046",
    description: "Generates controlled, benign SYN packets toward authorized subnet to validate NIDS detection latency.",
    safetyProfile: "SAFE_SYNTHETIC",
    targetScopeRequirement: "Authorized CIDR (e.g. 10.0.0.0/24)",
    timeoutSeconds: 30,
    expectedDefensiveDetection: "Suricata ET SCAN Nmap SYN Sweep (Priority 2)",
    syntheticPayloadPreview: "SYN packets to ports [21,22,80,443,8080] with 50ms jitter delay (Non-destructive).",
    defensiveAssertion: "Perimeter NIDS must fire alert within 5 seconds and log source IP.",
  },
  {
    id: "SIM-02",
    title: "Safe Web: SQL Injection Syntactic Probe",
    mitreTactic: "Initial Access",
    mitreId: "T1190",
    description: "Submits safe, non-mutating SQL syntax probe (' OR 1=1 --) to verify WAF detection and request drop.",
    safetyProfile: "SAFE_SYNTHETIC",
    targetScopeRequirement: "Authorized Domain / URL endpoint",
    timeoutSeconds: 15,
    expectedDefensiveDetection: "ModSecurity / Cloud Armor Rule 942100 (SQLi Blocked)",
    syntheticPayloadPreview: "POST /api/test-echo HTTP/1.1 { 'probe': 'UNION SELECT 1,2,3--' }",
    defensiveAssertion: "WAF returns HTTP 403 / 400 and increments SIEM Web Attack counter.",
  },
  {
    id: "SIM-03",
    title: "Safe Endpoint: Benign PowerShell Execution Canary",
    mitreTactic: "Execution",
    mitreId: "T1059.001",
    description: "Executes benign PowerShell command that prints hostname and timestamp via base64 encoded parameter.",
    safetyProfile: "BENIGN_AUDIT",
    targetScopeRequirement: "Authorized Endpoint Test Host",
    timeoutSeconds: 20,
    expectedDefensiveDetection: "Sysmon EventID 4688 / CrowdStrike EncodedCommand Rule",
    syntheticPayloadPreview: "powershell.exe -EncodedCommand WwBTAG8AZgB0AHcAYQByAGUAXQAgAEgAZQBsAGwAbwA=",
    defensiveAssertion: "EDR must record process ancestry and tag MITRE T1059.001.",
  },
  {
    id: "SIM-04",
    title: "Safe Identity: Simulated MFA Push Frequency Spike",
    mitreTactic: "Credential Access",
    mitreId: "T1621",
    description: "Simulates synthetic multiple authentication failures within a test sandbox directory.",
    safetyProfile: "SAFE_SYNTHETIC",
    targetScopeRequirement: "Authorized Identity Sandbox",
    timeoutSeconds: 45,
    expectedDefensiveDetection: "Okta / Entra ID MFA Fatigue Risk Rule (High Risk)",
    syntheticPayloadPreview: "5 consecutive simulated failed Auth tickets with random device headers.",
    defensiveAssertion: "Identity Provider locks test tenant and triggers Case creation.",
  },
];

export const INITIAL_DETECTION_RULES: DetectionRuleArtifact[] = [
  {
    id: "RULE-01",
    title: "Detect Encoded PowerShell Execution via Office Documents",
    version: "1.2.0",
    author: "REDHACK AI Detection Lab",
    mitreId: "T1059.001",
    mitreTactic: "Execution",
    severity: "HIGH",
    status: "VALIDATED",
    sigmaYaml: `title: Suspicious Encoded PowerShell Spawned by Office
id: 5f9e2b10-8912-4a0b-9f12-9281928a01f9
status: production
description: Detects Microsoft Word, Excel or Outlook spawning PowerShell with hidden or encoded flags
references:
  - https://attack.mitre.org/techniques/T1059/001/
author: REDHACK AI Detection Studio
date: 2026-10-01
tags:
  - attack.execution
  - attack.t1059.001
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    ParentImage|endswith:
      - '\\winword.exe'
      - '\\excel.exe'
      - '\\powerpnt.exe'
    Image|endswith: '\\powershell.exe'
    CommandLine|contains:
      - '-enc'
      - '-EncodedCommand'
      - '-w hidden'
  condition: selection
falsepositives:
  - Rare legacy administrative automation macros (should be digitally signed)
level: high`,
    yaraRule: `rule Office_Spawn_Encoded_PowerShell {
    meta:
        author = "REDHACK AI"
        description = "Identifies memory indicators for Office process spawning PowerShell"
        reference = "MITRE ATT&CK T1059.001"
        version = "1.2.0"
    strings:
        $p1 = "powershell.exe" nocase ascii wide
        $p2 = "-EncodedCommand" nocase ascii wide
        $p3 = "WINWORD.EXE" nocase ascii wide
    condition:
        all of ($p*)
}`,
    splunkSpl: `index=endpoint (parent_process_name="winword.exe" OR parent_process_name="excel.exe") process_name="powershell.exe" (command_line="*-enc*" OR command_line="*-EncodedCommand*")
| stats count min(_time) as first_seen max(_time) as last_seen by host, user, parent_process_name, command_line
| eval risk_level="CRITICAL"`,
    elasticKql: `process.parent.name : ("winword.exe" or "excel.exe") and process.name : "powershell.exe" and process.command_line : ("*-enc*" or "*-EncodedCommand*")`,
    validationStatus: {
      sigmaValid: true,
      yaraValid: true,
      splValid: true,
      kqlValid: true,
      syntaxErrors: [],
    },
    testTelemetryResult: {
      totalEventsTested: 1500,
      truePositives: 4,
      falsePositives: 0,
      passedTest: true,
    },
    explainability: {
      evidenceSources: ["Sysmon EventID 4688", "CrowdStrike Falcon Process Tree"],
      underlyingAssumptions: ["Standard end users do not execute PowerShell directly from Microsoft Office macros"],
      confidencePercentage: 96,
      operationalLimitations: ["Will not trigger if process hollowing is performed prior to argument logging"],
    },
  },
];

export const INITIAL_SOAR_PLAYBOOKS: SoarPlaybook[] = [
  {
    id: "PB-01",
    name: "Active Host C2 Isolation & Containment Playbook",
    category: "RANSOMWARE",
    triggerCondition: "Endpoint alert with severity CRITICAL matching C2 Beaconing (T1071)",
    description: "Orchestrates instant network isolation of compromised host, kills rogue PID, preserves memory dump, and resets user Kerberos credentials.",
    steps: [
      {
        stepIndex: 1,
        name: "Enrich Source IP & Check Reputation",
        description: "Queries Threat Intel indicator database for C2 IP classification",
        isHighConsequence: false,
        automatedByDefault: true,
        actionType: "ENRICH",
        targetParameter: "sourceIp",
      },
      {
        stepIndex: 2,
        name: "Capture Ephemeral Forensic Memory Dump",
        description: "Signals EDR agent to capture Volatility-compatible memory snapshot",
        isHighConsequence: false,
        automatedByDefault: true,
        actionType: "QUERY",
        targetParameter: "targetHost",
      },
      {
        stepIndex: 3,
        name: "Apply Perimeter Border Firewall Drop",
        description: "Applies immediate drop rule on border ingress gateway for remote C2 host",
        isHighConsequence: true, // Gate
        automatedByDefault: false,
        actionType: "BLOCK_FIREWALL",
        targetParameter: "194.26.29.112",
        rollbackCommand: "sudo iptables -D INPUT -s 194.26.29.112 -j DROP",
      },
      {
        stepIndex: 4,
        name: "Isolate Endpoint from Internal Corporate VLAN",
        description: "Restricts all host traffic except EDR management tunnel to prevent lateral movement",
        isHighConsequence: true, // Gate
        automatedByDefault: false,
        actionType: "ISOLATE_HOST",
        targetParameter: "WIN-FIN-WS04",
        rollbackCommand: "Restore-NetAdapter -Name 'Ethernet0' -Isolation $false",
      },
      {
        stepIndex: 5,
        name: "Disable Targeted Domain User Account",
        description: "Revokes active session tokens and disables active directory user login",
        isHighConsequence: true, // Gate
        automatedByDefault: false,
        actionType: "DISABLE_USER",
        targetParameter: "sarah.connor",
        rollbackCommand: "Enable-ADAccount -Identity 'sarah.connor'",
      },
    ],
  },
];

export const INITIAL_SOAR_APPROVALS: SoarApprovalRequest[] = [
  {
    id: "APPR-901",
    caseId: "CASE-2026-001",
    alertId: "ALT-9043",
    actionTitle: "Quarantine Workstation WIN-FIN-WS04 (Network Isolation)",
    actionType: "ISOLATE_HOST",
    targetResource: "WIN-FIN-WS04 (10.0.2.88)",
    commandPreview: "CrowdStrike.IsolateHost(agent_id='490a-11bc-99', isolation_type='STRICT')",
    riskAssessment: "High Consequence: The user will lose connection to all internal networks, file shares, and ERP tools.",
    potentialDisruption: "User's active financial reporting session will terminate abruptly.",
    rollbackPlan: "One-click 'Undo Isolation' button restores full network adapter access in < 15 seconds.",
    requestedAt: "10:20:00 UTC",
    status: "PENDING_APPROVAL",
  },
  {
    id: "APPR-902",
    caseId: "CASE-2026-001",
    alertId: "ALT-9043",
    actionTitle: "Border Firewall Drop on Malicious C2 IP 194.26.29.112",
    actionType: "BLOCK_FIREWALL",
    targetResource: "Edge Ingress Gateway (iptables / Cloud Armor)",
    commandPreview: "sudo iptables -I INPUT 1 -s 194.26.29.112 -j DROP && sudo iptables -I FORWARD 1 -d 194.26.29.112 -j DROP",
    riskAssessment: "Low risk to internal users. Eliminates outbound connection to malicious IP.",
    potentialDisruption: "None unless 194.26.29.112 is a shared multi-tenant CDN.",
    rollbackPlan: "sudo iptables -D INPUT -s 194.26.29.112 -j DROP",
    requestedAt: "10:20:30 UTC",
    status: "APPROVED_EXECUTED",
    approvedBy: "Marcus Vance (L2 SecOps Lead)",
    approvedAt: "10:21:15 UTC",
    executedAt: "10:21:18 UTC",
    executionOutput: "[SUCCESS] Perimeter firewall rules updated on cluster nodes edge-01, edge-02.",
  },
];

export const INITIAL_THREAT_INDICATORS: ThreatIndicator[] = [
  {
    id: "ind-01",
    indicator: "194[.]26[.]29[.]112",
    rawIndicator: "194.26.29.112",
    type: "IPv4",
    threatActor: "APT29 / Cozy Bear",
    threatGroup: "State-Sponsored",
    malwareFamily: "Cobalt Strike Beacon",
    confidence: 94,
    tlp: "TLP:AMBER",
    firstSeen: "2026-09-15T04:00:00Z",
    lastSeen: "Today at 09:30 UTC",
    expiresAt: "2026-12-31T23:59:59Z",
    sourceAttribution: "AlienVault OTX & RedHack Threat Intelligence",
    tags: ["c2", "cobalt-strike", "apt29", "lateral-movement"],
    activeMatchesInTelemetry: 3,
    falsePositive: false,
  },
  {
    id: "ind-02",
    indicator: "185[.]220[.]101[.]5",
    rawIndicator: "185.220.101.5",
    type: "IPv4",
    threatActor: "Unknown Brute-Force Botnet",
    confidence: 88,
    tlp: "TLP:GREEN",
    firstSeen: "2026-10-01T12:00:00Z",
    lastSeen: "Today at 10:14 UTC",
    expiresAt: "2026-11-01T00:00:00Z",
    sourceAttribution: "Tor Exit Relay Directory",
    tags: ["tor-relay", "password-spray", "ssh-scanner"],
    activeMatchesInTelemetry: 52,
    falsePositive: false,
  },
  {
    id: "ind-03",
    indicator: "hxxp://c2-beacon[.]darknet[.]cc:8080/stage2",
    rawIndicator: "http://c2-beacon.darknet.cc:8080/stage2",
    type: "URL",
    threatActor: "FIN7 Cybercrime Syndicate",
    malwareFamily: "Carbanak",
    confidence: 91,
    tlp: "TLP:RED",
    firstSeen: "2026-09-28T18:22:00Z",
    lastSeen: "Yesterday",
    expiresAt: "2026-11-15T00:00:00Z",
    sourceAttribution: "Mandiant Advantage Feed",
    tags: ["fin7", "payload-delivery", "banking-trojan"],
    activeMatchesInTelemetry: 0,
    falsePositive: false,
  },
  {
    id: "ind-04",
    indicator: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    rawIndicator: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    type: "SHA256",
    threatActor: "QakBot Campaign",
    malwareFamily: "Qbot Dropper",
    confidence: 97,
    tlp: "TLP:AMBER",
    firstSeen: "2026-10-02T08:00:00Z",
    lastSeen: "Today at 07:15 UTC",
    expiresAt: "2027-01-01T00:00:00Z",
    sourceAttribution: "VirusTotal Community",
    tags: ["qbot", "malicious-macro", "sha256"],
    activeMatchesInTelemetry: 1,
    falsePositive: false,
  },
];

export const INITIAL_COMPLIANCE_CONTROLS: ComplianceControlItem[] = [
  {
    id: "NIST-DE.CM-1",
    standard: "NIST CSF 2.0",
    controlCode: "DE.CM-01",
    title: "Networks and environments are monitored to detect potential cybersecurity events",
    status: "IMPLEMENTED",
    implementationEvidence: "Centralized telemetry ingestion adapters for Suricata NIDS, AWS CloudTrail, and CrowdStrike EDR.",
    mappedFeature: "Enterprise SOC & Telemetry Store",
  },
  {
    id: "NIST-RS.CO-3",
    standard: "NIST CSF 2.0",
    controlCode: "RS.CO-03",
    title: "Information is shared with designated internal and external parties",
    status: "IMPLEMENTED",
    implementationEvidence: "STIX 2.1 / TAXII export format and sanitized IOC defanger built into platform.",
    mappedFeature: "Threat Intelligence Hub",
  },
  {
    id: "NIST-RS.MI-1",
    standard: "NIST CSF 2.0",
    controlCode: "RS.MI-01",
    title: "Incidents are contained to mitigate impact",
    status: "IMPLEMENTED",
    implementationEvidence: "SOAR playbooks with mandatory human approval gates for high-consequence containment actions.",
    mappedFeature: "SOAR Orchestration Engine",
  },
  {
    id: "ISO-A.8.16",
    standard: "ISO 27001:2022",
    controlCode: "A.8.16",
    title: "Monitoring activities (Networks, systems and applications monitored for anomalous behavior)",
    status: "IMPLEMENTED",
    implementationEvidence: "Continuous correlation engine maps events to MITRE ATT&CK techniques.",
    mappedFeature: "SOC Level 1 / Level 2 Workspaces",
  },
  {
    id: "ISO-A.8.8",
    standard: "ISO 27001:2022",
    controlCode: "A.8.8",
    title: "Management of technical vulnerabilities",
    status: "IMPLEMENTED",
    implementationEvidence: "CVSS v3.1 calculation validated against official FIRST.org reference vectors with SLA tracking.",
    mappedFeature: "Vulnerability & Remediation Management",
  },
  {
    id: "SOC2-CC7.2",
    standard: "SOC 2 Type II",
    controlCode: "CC7.2",
    title: "Security event detection and alert triage",
    status: "IMPLEMENTED",
    implementationEvidence: "Real-time alert deduplication, severity prioritization, and full case audit timeline.",
    mappedFeature: "Case Management & Incident Workspaces",
  },
  {
    id: "SOC2-CC7.4",
    standard: "SOC 2 Type II",
    controlCode: "CC7.4",
    title: "Incident response containment and communication",
    status: "IMPLEMENTED",
    implementationEvidence: "Reversible containment commands with rollback verification and emergency stop kill switch.",
    mappedFeature: "SOAR Engine & Kill-Switch Safeguards",
  },
  {
    id: "ATTACK-T1059",
    standard: "MITRE ATT&CK",
    controlCode: "T1059",
    title: "Command and Scripting Interpreter Coverage",
    status: "IMPLEMENTED",
    implementationEvidence: "Validated Sigma & YARA rules with synthetic lab verification testing.",
    mappedFeature: "Detection Engineering & Purple Team Lab",
  },
];

export const INITIAL_AUDIT_LOGS: SystemAuditLogEntry[] = [
  {
    id: "AUDIT-001",
    timestamp: "10:21:18 UTC",
    actor: "Marcus Vance (L2)",
    role: "L2_INVESTIGATOR",
    action: "SOAR_ACTION_APPROVED",
    resource: "Edge Firewall Rule -> DROP 194.26.29.112",
    status: "SUCCESS",
    details: "Authorized containment action for CASE-2026-001 under approved RoE policy.",
  },
  {
    id: "AUDIT-002",
    timestamp: "10:18:05 UTC",
    actor: "Purple Team Engine",
    role: "PURPLE_TEAM_LEAD",
    action: "SIMULATION_PREFLIGHT_CHECK",
    resource: "Scenario SIM-01 against 10.0.0.0/24",
    status: "SUCCESS",
    details: "Scope validation passed: Target is inside authorized CIDR list and outside exclusion boundaries.",
  },
  {
    id: "AUDIT-003",
    timestamp: "10:12:44 UTC",
    actor: "SecOps Autonomous Scanner",
    role: "L1_ANALYST",
    action: "SCOPE_ENFORCEMENT_BLOCK",
    resource: "Target: db-primary.corp.internal (10.0.3.50)",
    status: "BLOCKED",
    details: "Safety Policy Intercept: Target belongs to explicit exclusion list. Assessment aborted safely.",
  },
];
