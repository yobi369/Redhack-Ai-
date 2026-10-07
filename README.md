# REDHACK AI v2 — Enterprise Cybersecurity & Threat Operations Platform

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-success)](https://redhack-ai.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen)](tests/run-tests.ts)
[![Security Model](https://img.shields.io/badge/Security-RBAC%20%26%20Human--in--the--Loop-red)](#security-model--guardrails)

> *"Offense Builds Insight. Defense Builds Resilience. Know Both. Protect All."*  
> *Authored in the spirit of TuChii Hunnid's ethical cybersecurity framework.*

**RedHack AI v2** is a modular, production-grade cybersecurity operations, threat intelligence, and adversary simulation platform. It bridges SOC Tier 1/2 investigation, automated incident containment, purple team validation, and autonomous multi-agent security swarms under strict tenant isolation and human approval gates.

---

## Table of Contents
1. [Core Capabilities & Modules](#core-capabilities--modules)
2. [Multi-Agent Swarm Architecture](#multi-agent-swarm-architecture)
3. [PostgreSQL Data Model](#postgresql-data-model)
4. [Unified Finding Lifecycle](#unified-finding-lifecycle)
5. [Unified Security Score Engine](#unified-security-score-engine)
6. [Security Model & Guardrails](#security-model--guardrails)
7. [Installation & Quickstart](#installation--quickstart)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Deployment](#deployment)
10. [Automated Testing](#automated-testing)
11. [Authorized Use Policy](#authorized-use-policy)

---

## 1. Core Capabilities & Modules

- **Executive Security Dashboard:** Real-time visibility into the organization's Unified Security Score (0–100), active intrusions, asset exposure, and compliance posture.
- **SOC Command Center (L1/L2):** Normalized telemetry ingestion (AWS CloudTrail, CrowdStrike Falcon, Okta, Sysmon, Suricata) with OCSF schema correlation and incident case files.
- **Asset Inventory & Exposure Graph:** Real-time inventory spanning Cloud workloads, K8s ingress API gateways, databases, endpoints, and Model Context Protocol (MCP) tool servers.
- **Unified Finding Lifecycle:** Enforces the full lifecycle: `DISCOVERED` $\to$ `TRIAGED` $\to$ `VALIDATING` $\to$ `CONFIRMED` $\to$ `REMEDIATION` $\to$ `RETEST` $\to$ `RESOLVED`.
- **AI & MCP Agent Security:** Specialized auditing for LLM applications, MCP tool servers, excessive tool permissions, and indirect prompt injection resistance.
- **Security Knowledge Graph:** Interactive visual graph mapping attack paths across Assets, Vulnerabilities, Threats, Alerts, and Identity entities.
- **Digital Forensics & Evidence Vault:** Cryptographic SHA-256 verification and legal chain-of-custody logging for PCAPs, raw logs, and terminal recordings.
- **Authorized Purple Team Simulation:** Non-destructive emulation lab verifying SIEM/EDR detection coverage strictly inside authorized scope subnets.
- **SOAR Orchestrator:** Playbook execution with mandatory human approval gates for high-consequence containment actions (host isolation, IP blocking) and one-click rollback.
- **Multi-Tenancy & RBAC:** Complete tenant workspace isolation with role-based access control (Admin, SOC Lead, Tier 1/2 Analyst, Auditor).

---

## 2. Multi-Agent Swarm Architecture

RedHack AI v2 organizes autonomous intelligence across **9 specialized security agents**. Modern cybersecurity operations demand strict principle of least privilege—no agent possesses unrestricted shell or destructive execution rights.

| Agent | Code Name | Scoped Tools | Mandatory Human Approval Gates |
| :--- | :--- | :--- | :--- |
| **SecOps Orchestrator** | `orchestrator` | `delegate_task`, `aggregate_intelligence` | Policy reassignments, governance overrides |
| **Security Analyst** | `security_analyst` | `triage_alert`, `query_telemetry` | Critical alert dismissal |
| **Code Security** | `code_security` | `scan_codebase`, `audit_dependencies` | Auto-patch commits to production branch |
| **Threat Intelligence** | `threat_intel` | `enrich_ioc`, `defang_indicators`, `export_stix` | Exporting classified threat feeds |
| **Detection Engineer** | `detection_engineer`| `generate_sigma`, `validate_yara`, `splunk_spl` | Production SIEM rule deployment |
| **Incident Response** | `incident_response` | `propose_host_isolation`, `block_c2_ip`, `rollback` | **Host isolation, credential revocation** |
| **Validation Agent** | `validation_agent` | `preflight_scope_check`, `execute_safe_emulation` | **Adversary emulation launch, credential probes** |
| **Reporting Agent** | `reporting_agent` | `build_executive_report`, `export_markdown_pdf` | External disclosure publications |
| **AI Security Agent** | `ai_security_agent` | `inspect_mcp_tools`, `test_prompt_injection` | **Disabling MCP servers, quarantining models** |

---

## 3. PostgreSQL Data Model

The PostgreSQL data model is defined in `src/db/schema.sql` and includes the following 21 entities:
- `organizations` & `workspaces` (Tenant isolation & scope policies)
- `roles`, `permissions`, and `role_permissions` (RBAC)
- `users` & `user_workspace_memberships`
- `projects` & `assets` (Perimeter exposure ratings and criticality)
- `vulnerabilities` & `threats` (CVSS v3.1, EPSS, CISA KEV)
- `findings` (Unified lifecycle state machine with immutable audit trail)
- `alerts`, `incidents`, and `investigations`
- `evidence` (Cryptographic SHA-256 digests and chain of custody)
- `simulations` (Authorized Purple Team execution logs and scores)
- `agents` & `agent_runs` (Scoped tools and approval-pending actions)
- `security_scores` (Dynamic mathematical evaluation)
- `reports` & `integrations`
- `audit_events` (Immutable ledger of all platform and human decisions)

To apply the schema on any PostgreSQL instance (Neon, Supabase, Cloud SQL):
```bash
psql "$DATABASE_URL" -f src/db/schema.sql
```

---

## 4. Unified Finding Lifecycle

Every security finding follows an audited state transition pipeline:

```
[DISCOVERED] ──> [TRIAGED] ──> [VALIDATING] ──> [CONFIRMED]
                                     │                │
                                     ▼                ▼
                                [DISMISSED]     [REMEDIATION]
                                                      │
                                                      ▼
                                                  [RETEST]
                                                      │
                                                      ▼
                                                 [RESOLVED]
```

Every finding record includes:
- `title`, `severity` (CRITICAL, HIGH, MEDIUM, LOW, INFO)
- `confidence` (CONFIRMED, HIGH, MEDIUM, LOW)
- `affected asset` and `exposure`
- `evidence` artifact link and cryptographic digest
- `explanation` and `business impact`
- `recommended remediation`
- `validation status` and `remediation status`
- `auditTrail` recording the actor, timestamp, previous status, and notes.

---

## 5. Unified Security Score Engine

The platform calculates a dynamic 0–100 score with executive grades (`A+`, `A`, `B`, `C`, `D`, `F`) using six weighted pillars:

$$\text{Score} = 0.15 E + 0.30 S + 0.10 C + 0.15 D + 0.15 R + 0.15 B$$

- **$E$ (Asset Exposure):** Proportion of protected internal vs public-facing workloads.
- **$S$ (Severity & Exploitability):** Active presence of CISA KEV catalog vulnerabilities and CVSS vectors.
- **$C$ (Confidence Accuracy):** Verification fidelity of detected indicators.
- **$D$ (Detection Coverage):** Telemetry sensor presence (EDR, CloudTrail, Sysmon).
- **$R$ (Remediation Status):** Ratio of verified fixed findings versus open vulnerabilities.
- **$B$ (Business Impact):** Crown jewel protection level for customer databases and financial endpoints.

---

## 6. Security Model & Guardrails

1. **Scoped AI Tools:** AI agents operate strictly via registered JSON Schema tools with parameter validation. Unrestricted shell or container access is blocked.
2. **Human Approval Gates:** Irreversible actions (network isolation, IP blocks, account termination) are paused in state `WAITING_FOR_HUMAN_APPROVAL` until an authenticated human analyst approves.
3. **Emergency Kill Switch:** A hardware-style stop button halts all active adversary simulations instantly.
4. **Tenant Isolation:** Workspace switching re-binds all queries and prevents cross-tenant data leakage.
5. **Zero Secret UI Leakage:** Server-side API proxies prevent exposing credentials to client browsers.

---

## 7. Installation & Quickstart

### Prerequisites
- Node.js 18+ or Bun
- npm or bun

### Local Development
```bash
# 1. Clone repository
git clone https://github.com/yobi369/Redhack-Ai-.git
cd Redhack-Ai-

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional)
cp .env.example .env

# 4. Start local development server (port 3000)
npm run dev
```

The application will be live at `http://localhost:3000`.

---

## 8. API Endpoints Reference

### Workspaces & Tenant Governance
- `GET /api/v2/workspaces` — List tenant workspaces.
- `GET /api/v2/workspaces/active` — Get active workspace.
- `POST /api/v2/workspaces/switch` — Switch active workspace context.
- `GET /api/v2/scope/policy` — Get authorized subnets & exclusions.
- `PUT /api/v2/scope/policy` — Update Rules of Engagement scope policy.

### Findings & Security Score
- `GET /api/v2/findings` — List all findings.
- `POST /api/v2/findings/:id/transition` — Transition finding lifecycle state.
- `GET /api/v2/security-score` — Compute dynamic 6-pillar security score.

### Multi-Agent Operations
- `GET /api/v2/agents` — List 9 specialized agents with scoped permissions.
- `POST /api/v2/agents/run` — Invoke agent execution with input context.
- `POST /api/v2/ai-security/audit` — Audit MCP tools and prompt injection safety.

### Incident Response & Containment
- `GET /api/v2/incidents` — List active incident case files.
- `POST /api/v2/incidents/:id/actions/:actionId/execute` — Approve & execute containment.
- `POST /api/v2/incidents/:id/actions/:actionId/rollback` — Roll back containment action.

### Forensics & Audit
- `GET /api/v2/evidence` — List cryptographic evidence items.
- `POST /api/v2/evidence` — Ingest new artifact with SHA-256 verification.
- `GET /api/v2/audit-events` — Immutable audit log stream.

---

## 9. Deployment

### Vercel Serverless Deployment
RedHack AI v2 is production-configured for Vercel:
- Frontend compiled to `dist` via Vite.
- Backend bundled into standalone serverless function `api/index.js` via esbuild.
- Single command deployment:
```bash
npx vercel --prod
```

### Containerized Deployment (Docker Compose)
RedHack AI v2.1 can be launched with full PostgreSQL persistence via Docker Compose:
```bash
docker-compose up --build -d
```
This spins up:
- `redhack-postgres`: PostgreSQL 16 Alpine with initialized schema and persistent volume.
- `redhack-app`: Multi-stage hardened Node.js 22 runtime running on port 3000 with built-in healthcheck.

### Database Migrations
Run migrations against any PostgreSQL database:
```bash
npm run db:migrate
```

### Production Node.js Server
```bash
npm run build
npm start
```

---

## 10. Automated Testing

Run the entire platform verification and production hardening test suite (56 total tests):
```bash
npm test
```

Test suites verify:
1. **CVSS v3.1 benchmark vector calculations** (Log4j, Spring4Shell, Heartbleed).
2. **IoC Defanging & Refanging standards** (`hxxp[:]//`, `1[.]1[.]1[.]1`).
3. **STIX 2.1 JSON Schema validation**.
4. **Rules of Engagement scope enforcement & database exclusions**.
5. **SOAR human approval gates & one-click rollback safety**.
6. **Detection engineering rule syntax** (Sigma YAML & YARA).
7. **Unified Finding Lifecycle state transitions & audit trail persistence**.
8. **Unified Security Score mathematical evaluation engine**.
9. **Multi-Agent scoped tool permissions and approval gates**.
10. **Multi-Tenant workspace and scope policy isolation**.
11. **PBKDF2 Cryptographic Hashing & Verification**.
12. **Tamper-Proof HMAC-SHA256 Token Signing & Expiry Checks**.
13. **Server-Side RBAC Permission Matrix & Least Privilege Rules**.
14. **Sliding-Window Rate Limiting Engine** (120 req/min, burst defense).
15. **SSRF Defense & Metadata Blocking** (169.254.169.254, loopback, private ranges).
16. **Prompt Injection & Adversarial Jailbreak Screening**.
17. **Real Integration Connectors & Truthful State Reporting**.
18. **Multi-Agent Background Worker with Evidence Provenance**.
19. **PostgreSQL Connection Pool & Graceful In-Memory Fallback**.

---

## 11. Authorized Use Policy

RedHack AI v2 is engineered strictly for **authorized defensive security operations, purple team resilience validation, and ethical vulnerability remediation**.
- Adversary simulation techniques may only be executed against IP ranges and assets explicitly documented within the tenant's **Rules of Engagement Scope Policy**.
- Destructive attacks, unauthorized persistence, data theft, and denial-of-service emulations are explicitly blocked by system guardrails.
- All testing activities generate an immutable cryptographic audit record.
