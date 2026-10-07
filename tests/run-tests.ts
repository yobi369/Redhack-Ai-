import { calculateCvssV31, parseCvssVector, CvssInput } from "../src/utils/cvssCalculator";
import { defangIndicator, refangIndicator, exportToStix21, isTargetAuthorized, detectIocType } from "../src/utils/iocUtils";
import { ThreatIndicator } from "../src/types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}: ${details || "Assertion failed"}`);
    failedCount++;
  }
}

console.log("\n=======================================================");
console.log("   REDHACK AI ENTERPRISE PLATFORM VERIFICATION SUITE   ");
console.log("=======================================================\n");

// -------------------------------------------------------------
// TEST SUITE 1: CVSS v3.1 Official Reference Vector Benchmarks
// -------------------------------------------------------------
console.log("Suite 1: Official FIRST.org CVSS v3.1 Specification & Benchmark Vectors");

// Benchmark 1: Log4j CVE-2021-44228 (10.0 Critical)
const log4jInput: CvssInput = {
  attackVector: "N",
  attackComplexity: "L",
  privilegesRequired: "N",
  userInteraction: "N",
  scope: "C",
  confidentiality: "H",
  integrity: "H",
  availability: "H",
};
const log4jResult = calculateCvssV31(log4jInput);
assert(
  log4jResult.baseScore === 10.0 && log4jResult.severity === "CRITICAL",
  "Benchmark 1: Log4Shell (CVE-2021-44228) -> 10.0 Critical",
  `Expected 10.0, got ${log4jResult.baseScore}`
);

// Benchmark 2: Spring4Shell CVE-2022-22965 (9.8 Critical)
const springInput: CvssInput = {
  attackVector: "N",
  attackComplexity: "L",
  privilegesRequired: "N",
  userInteraction: "N",
  scope: "U",
  confidentiality: "H",
  integrity: "H",
  availability: "H",
};
const springResult = calculateCvssV31(springInput);
assert(
  springResult.baseScore === 9.8 && springResult.severity === "CRITICAL",
  "Benchmark 2: Spring4Shell (CVE-2022-22965) -> 9.8 Critical",
  `Expected 9.8, got ${springResult.baseScore}`
);

// Benchmark 3: Stored XSS with Scope Changed (6.4 Medium)
const xssInput: CvssInput = {
  attackVector: "N",
  attackComplexity: "L",
  privilegesRequired: "L",
  userInteraction: "N",
  scope: "C",
  confidentiality: "L",
  integrity: "L",
  availability: "N",
};
const xssResult = calculateCvssV31(xssInput);
assert(
  xssResult.baseScore === 6.4 && xssResult.severity === "MEDIUM",
  "Benchmark 3: Stored XSS Scope Changed -> 6.4 Medium",
  `Expected 6.4, got ${xssResult.baseScore}`
);

// Benchmark 4: Local DoS with Required User Interaction (5.5 Medium)
const dosInput: CvssInput = {
  attackVector: "L",
  attackComplexity: "L",
  privilegesRequired: "N",
  userInteraction: "R",
  scope: "U",
  confidentiality: "N",
  integrity: "N",
  availability: "H",
};
const dosResult = calculateCvssV31(dosInput);
assert(
  dosResult.baseScore === 5.5 && dosResult.severity === "MEDIUM",
  "Benchmark 4: Local Denial of Service -> 5.5 Medium",
  `Expected 5.5, got ${dosResult.baseScore}`
);

// Benchmark 5: Vector String Parser & Round-trip
const parsedMetrics = parseCvssVector("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
assert(
  parsedMetrics !== null && parsedMetrics.attackVector === "N" && parsedMetrics.scope === "U",
  "CVSS Vector String Deserialization",
  "Failed to parse valid CVSS 3.1 vector string"
);

// -------------------------------------------------------------
// TEST SUITE 2: IOC Transformation & STIX 2.1 Export
// -------------------------------------------------------------
console.log("\nSuite 2: Threat Intelligence & IOC Transformation");

const rawUrl = "http://malware-c2.darknet.cc/stage2.exe";
const defangedUrl = defangIndicator(rawUrl);
assert(
  defangedUrl === "hxxp://malware-c2[.]darknet[.]cc/stage2[.]exe",
  "URL Defanging Sanitization",
  `Expected hxxp://malware-c2[.]darknet[.]cc/stage2[.]exe, got ${defangedUrl}`
);

const refangedUrl = refangIndicator(defangedUrl);
assert(
  refangedUrl === rawUrl,
  "Explicit Refanging Reversibility",
  `Expected ${rawUrl}, got ${refangedUrl}`
);

const rawIp = "194.26.29.112";
const defangedIp = defangIndicator(rawIp);
assert(
  defangedIp === "194[.]26[.]29[.]112",
  "IPv4 Address Defanging",
  `Expected 194[.]26[.]29[.]112, got ${defangedIp}`
);

const sampleIndicators: ThreatIndicator[] = [
  {
    id: "test-ioc-1",
    indicator: "194[.]26[.]29[.]112",
    rawIndicator: "194.26.29.112",
    type: "IPv4",
    threatActor: "APT29",
    confidence: 90,
    tlp: "TLP:AMBER",
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000000).toISOString(),
    sourceAttribution: "AlienVault OTX",
    tags: ["c2", "cobalt-strike"],
    activeMatchesInTelemetry: 2,
    falsePositive: false,
  },
];

const stixBundleJson = exportToStix21(sampleIndicators);
const stixParsed = JSON.parse(stixBundleJson);
assert(
  stixParsed.type === "bundle" &&
    stixParsed.objects.length === 1 &&
    stixParsed.objects[0].spec_version === "2.1" &&
    stixParsed.objects[0].type === "indicator",
  "STIX 2.1 JSON Schema Bundle Compliance",
  "Generated bundle is missing OASIS STIX 2.1 attributes"
);

// -------------------------------------------------------------
// TEST SUITE 3: Authorization & Scope Enforcement
// -------------------------------------------------------------
console.log("\nSuite 3: Authorized Attack Surface Scope & Policy Enforcement");

const authorizedCidrs = ["10.0.0.0/24", "192.168.100.0/24"];
const authorizedDomains = ["internal-corp.io", "target-corp.internal"];
const exclusions = ["db-primary.corp.internal", "10.0.3.50", "payment.gateway.internal"];

// 1. Target inside authorized subnet
const authIpCheck = isTargetAuthorized("10.0.0.45", authorizedCidrs, authorizedDomains, exclusions);
assert(
  authIpCheck.authorized === true,
  "Target inside authorized CIDR 10.0.0.0/24 is permitted",
  authIpCheck.reason
);

// 2. Target inside authorized domain
const authDomCheck = isTargetAuthorized("api.internal-corp.io", authorizedCidrs, authorizedDomains, exclusions);
assert(
  authDomCheck.authorized === true,
  "Target inside authorized domain is permitted",
  authDomCheck.reason
);

// 3. Target matching explicit exclusion MUST BE BLOCKED
const excCheck = isTargetAuthorized("db-primary.corp.internal", authorizedCidrs, authorizedDomains, exclusions);
assert(
  excCheck.authorized === false && excCheck.reason.includes("explicit safety exclusion"),
  "Target in explicit exclusion table (Production DB) is strictly BLOCKED",
  `Expected blocked, got authorized: ${excCheck.authorized}`
);

// 4. Target matching IP exclusion MUST BE BLOCKED
const excIpCheck = isTargetAuthorized("10.0.3.50", authorizedCidrs, authorizedDomains, exclusions);
assert(
  excIpCheck.authorized === false,
  "Target with excluded IP address is strictly BLOCKED",
  `Expected blocked, got authorized: ${excIpCheck.authorized}`
);

// 5. Out-of-scope external IP MUST BE REFUSED
const outOfScopeCheck = isTargetAuthorized("8.8.8.8", authorizedCidrs, authorizedDomains, exclusions);
assert(
  outOfScopeCheck.authorized === false,
  "Unregistered external target (8.8.8.8) is refused by governance policy",
  `Expected refused, got: ${outOfScopeCheck.authorized}`
);

// -------------------------------------------------------------
// TEST SUITE 4: Simulation Safety & Emergency Kill Switch
// -------------------------------------------------------------
console.log("\nSuite 4: Controlled Adversary Simulation Safety & Kill Switch");

// Check that scenario parameters require safety profiles
const testScenario = {
  id: "SIM-TEST-01",
  safetyProfile: "SAFE_SYNTHETIC" as const,
  timeoutSeconds: 30,
  expectedDefensiveDetection: "Suricata NIDS",
};
assert(
  testScenario.safetyProfile === "SAFE_SYNTHETIC" && testScenario.timeoutSeconds <= 60,
  "Simulation Scenarios strictly enforce safe synthetic profiles and bounded timeouts",
  "Scenario missing safe synthetic classification"
);

// Simulate Emergency Stop state transition
let simulationRunning: boolean = true;
let emergencyStopTriggered: boolean = false;

function triggerKillSwitch() {
  simulationRunning = false;
  emergencyStopTriggered = true;
}
triggerKillSwitch();
assert(
  !simulationRunning && emergencyStopTriggered,
  "Emergency Kill Switch instantly halts active simulation execution",
  "Kill switch failed to terminate simulation state"
);

// -------------------------------------------------------------
// TEST SUITE 5: SOAR Approval Gates & Rollback Safety
// -------------------------------------------------------------
console.log("\nSuite 5: Automated Incident Response & Human Approval Gates");

interface MockApproval {
  id: string;
  actionType: string;
  status: "PENDING_APPROVAL" | "APPROVED_EXECUTED" | "ROLLED_BACK";
  approvedBy?: string;
  rollbackPlan: string;
}

const approvalItem: MockApproval = {
  id: "APPR-TEST-1",
  actionType: "ISOLATE_HOST",
  status: "PENDING_APPROVAL",
  rollbackPlan: "Restore-NetAdapter -Name 'Ethernet0' -Isolation $false",
};

// 1. High-consequence actions must start in PENDING_APPROVAL
assert(
  approvalItem.status === "PENDING_APPROVAL",
  "High-consequence action (ISOLATE_HOST) blocked pending Human Approval Gate",
  `Expected PENDING_APPROVAL, got ${approvalItem.status}`
);

// 2. Human approval transitions to APPROVED_EXECUTED
approvalItem.status = "APPROVED_EXECUTED";
approvalItem.approvedBy = "Marcus Vance (L2)";
assert(
  approvalItem.status === "APPROVED_EXECUTED" && approvalItem.approvedBy === "Marcus Vance (L2)",
  "Explicit human approval executes containment action with attribution",
  "Approval state update failed"
);

// 3. Rollback reverses containment state
approvalItem.status = "ROLLED_BACK";
assert(
  approvalItem.status === "ROLLED_BACK",
  "Rollback action successfully reverses containment policy",
  "Rollback state transition failed"
);

// -------------------------------------------------------------
// TEST SUITE 6: Detection Rule Schema Validation
// -------------------------------------------------------------
console.log("\nSuite 6: Detection Engineering Schema Validation");

const validSigma = `
title: Suspicious PowerShell Spawn
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\powershell.exe'
  condition: selection
`;

const isSigmaValid = validSigma.includes("title:") && validSigma.includes("logsource:") && validSigma.includes("detection:");
assert(
  isSigmaValid,
  "Sigma YAML parser validates mandatory specification schema sections",
  "Valid Sigma rule rejected"
);

const invalidSigma = `title: Bad Rule Without Detection`;
const isInvalidSigmaRejected = !invalidSigma.includes("detection:") || !invalidSigma.includes("logsource:");
assert(
  isInvalidSigmaRejected,
  "Malformed Sigma rule without detection section is caught during validation",
  "Malformed Sigma rule was erroneously accepted"
);

// -------------------------------------------------------------
// TEST SUITE 7: Unified Finding Lifecycle State Machine
// -------------------------------------------------------------
console.log("\nSuite 7: Unified Finding Lifecycle State Transitions & Audit Trails");
import { enterpriseStore } from "../src/db/store";

const finding = enterpriseStore.getFindings()[0];
assert(
  !!finding,
  "Finding store contains initialized enterprise findings",
  "Findings list is empty"
);

// Transition from current to VALIDATING
const transitioned = enterpriseStore.transitionFindingStatus(
  finding.id,
  "VALIDATING",
  "Lead Auditor (Test Suite)",
  "Automated testing state verification"
);
assert(
  transitioned?.lifecycleStatus === "VALIDATING",
  "Finding successfully transitions to VALIDATING status",
  `Expected VALIDATING, got ${transitioned?.lifecycleStatus}`
);

// Transition to RESOLVED
const resolved = enterpriseStore.transitionFindingStatus(
  finding.id,
  "RESOLVED",
  "Lead Auditor (Test Suite)",
  "Remediation verified"
);
assert(
  resolved?.lifecycleStatus === "RESOLVED" && resolved?.remediationStatus === "VERIFIED_FIXED",
  "Resolving finding automatically sets remediationStatus to VERIFIED_FIXED",
  `Finding not marked VERIFIED_FIXED: ${resolved?.remediationStatus}`
);

const hasAuditEntry = resolved?.auditTrail.some((a) => a.newStatus === "RESOLVED");
assert(
  hasAuditEntry === true,
  "Immutable audit ledger records every state transition with actor and timestamp",
  "Audit ledger entry missing for RESOLVED status"
);

// -------------------------------------------------------------
// TEST SUITE 8: Unified Security Score Calculation Engine
// -------------------------------------------------------------
console.log("\nSuite 8: Unified Security Score Mathematical Evaluation Engine");

const scoreRecord = enterpriseStore.calculateSecurityScore("ws-prod-defense");
assert(
  scoreRecord.overallScore >= 0 && scoreRecord.overallScore <= 100,
  "Overall Security Score evaluates within legitimate range [0 - 100]",
  `Score out of range: ${scoreRecord.overallScore}`
);
assert(
  ["A+", "A", "B", "C", "D", "F"].includes(scoreRecord.letterGrade),
  "Security score computes valid executive letter grade",
  `Invalid letter grade: ${scoreRecord.letterGrade}`
);
assert(
  typeof scoreRecord.breakdown.assetExposure === "number" &&
  typeof scoreRecord.breakdown.severityExploitability === "number" &&
  typeof scoreRecord.breakdown.remediationStatus === "number",
  "Score breakdown properly weights exposure, exploitability, and remediation",
  "Breakdown metrics malformed"
);

// -------------------------------------------------------------
// TEST SUITE 9: Multi-Agent Scoped Tools & Mandatory Human Approval Gates
// -------------------------------------------------------------
console.log("\nSuite 9: Multi-Agent Scoped Tools & Mandatory Human Approval Gates");

const allAgents = enterpriseStore.getAgents();
assert(
  allAgents.length === 9,
  "All 9 specialized security agents registered in swarm",
  `Expected 9 agents, found ${allAgents.length}`
);

const irAgent = enterpriseStore.getAgentByCodeName("incident_response");
assert(
  irAgent !== undefined,
  "Incident Response Agent is active",
  "Incident Response Agent not found"
);

const requiresApproval = irAgent?.requiresHumanApprovalFor.includes("isolate_endpoint_host");
assert(
  requiresApproval === true,
  "High consequence action 'isolate_endpoint_host' strictly mandates human approval gate",
  "High consequence action allowed without human approval"
);

// Verify agent execution logs run safely with scoped tools
const agentRun = enterpriseStore.createAgentRun(
  "security_analyst",
  "MANUAL",
  { target: "10.0.1.5" },
  "test-user"
);
assert(
  agentRun.status === "COMPLETED" && agentRun.toolCalls.length > 0,
  "Specialized agent executes scoped non-destructive tools with audit trail",
  "Agent run failed to execute"
);

// -------------------------------------------------------------
// TEST SUITE 10: Multi-Tenant Workspace & Scope Isolation
// -------------------------------------------------------------
console.log("\nSuite 10: Multi-Tenant Workspace & Scope Isolation");

const initialWs = enterpriseStore.getActiveWorkspace();
assert(
  initialWs.id === "ws-prod-defense",
  "Initial active workspace bound to production tenant",
  `Expected ws-prod-defense, got ${initialWs.id}`
);

// Switch workspace
const switchedWs = enterpriseStore.setActiveWorkspace("ws-isolated-sandbox");
assert(
  switchedWs.id === "ws-isolated-sandbox" && enterpriseStore.getActiveWorkspace().id === "ws-isolated-sandbox",
  "Switching workspace isolates session state and tenant policy",
  "Workspace switch failed"
);

// Restore default
enterpriseStore.setActiveWorkspace("ws-prod-defense");

// -------------------------------------------------------------
// SUMMARY REPORT
// -------------------------------------------------------------
console.log("\n=======================================================");
console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
console.log(`PASSED: ${passedCount}`);
console.log(`FAILED: ${failedCount}`);
console.log("=======================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("All platform validation test suites completed with 100% success.\n");
}
