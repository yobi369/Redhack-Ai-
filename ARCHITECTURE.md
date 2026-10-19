# RedHack AI — Platform Architecture & Engineering Design

## 1. System Overview

RedHack AI is designed as an extensible, AI-native **Cyber Operations Operating System (OS)** for security teams, SOC analysts, and security researchers.

```
                              ┌──────────────────────────────────────────────┐
                              │            CLIENT WORKSPACES                 │
                              │  SOC Analyst | PenTester | CISO | Auditor    │
                              └──────────────────────┬───────────────────────┘
                                                     │ HTTPS / JSON API
                                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    REDHACK AI BACKEND PLATFORM                                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ SECURITY GATEWAY & OBSERVABILITY ]                                                             │
│  Helmet Security Headers │ Rate Limiting (Sliding Window) │ X-Correlation-ID │ Pino Structured Log │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ AUTHENTICATION & ACCESS CONTROL ]                                                              │
│  HMAC-SHA256 Signed Tokens │ Server-Side RBAC │ Multi-Tenant Workspace Boundary Enforcement        │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ MULTI-AGENT SWARM ORCHESTRATION ENGINE ]                                                        │
│  - SecOps Orchestrator        - Security Analyst          - Code Security Auditor                  │
│  - Threat Intelligence        - Detection Engineer        - Incident Response Containment          │
│  - Adversary Validation       - Executive Reporting       - AI & LLM Security Assessor             │
│                                                                                                    │
│  [ HUMAN APPROVAL GATE ] ──▶ Required for Consequential Actions (Host Isolation / RoE Scope)       │
│  [ PROMPT INJECTION SHIELD ] ──▶ Scans all agent inputs before inference dispatch                  │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ DATA PERSISTENCE & POOLING ]                                                                    │
│  PostgreSQL Connection Pool + Versioned Schema Migrations; seeded domain store remains in memory     │
│  - Assets Store             - Vulnerabilities & CVEs    - Normalized Telemetry Events              │
│  - Finding Lifecycle Engine - Immutable Audit Ledger    - Multi-Tenant Workspaces & RoE Scope      │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Security Boundaries & Guardrails

### 2.1 Rules of Engagement (RoE) Scope Verification
Scope validation is exposed as a server-side API and scan workflows must call it before any outbound activity. The current application still contains simulated/legacy flows, so every connector must be independently verified to enforce scope before real network activity:
- **Authorized Subnets & Domains:** Must belong to explicitly registered CIDR blocks or domain suffixes.
- **Explicit Exclusions:** Core production databases (e.g. `db-primary.corp.internal`, `10.0.3.50`) and PCI-DSS environments are hard-blocked by policy.
- **Zero Automatic Shell Execution:** RedHack AI never performs unvetted remote code execution or unauthorized exploitation.

### 2.2 Mandatory Human Approval Gates
Actions flagged with `isDestructiveOrConsequential: true` (e.g. `isolate_endpoint_host`, network firewall rule insertion, or terminating critical processes) cannot be executed automatically by agents:
1. Agent creates an approval request record with risk assessment, impact analysis, and an automated rollback plan.
2. The agent run enters `WAITING_FOR_HUMAN_APPROVAL` status.
3. An authorized human with `SOC_LEAD` or `SUPER_ADMIN` role reviews the command preview and explicitly approves or declines.
4. Every state transition is appended to the tamper-evident audit ledger with actor attribution and timestamps.

### 2.3 SSRF & Metadata Protection
The URL-screening utility blocks several common unsafe targets:
- Link-local IP `169.254.169.254` (AWS, GCP, Azure metadata services) is strictly blocked.
- Loopback interfaces (`127.0.0.1`, `localhost`, `::1`) are forbidden.
- Non-HTTP/HTTPS protocols (`file://`, `gopher://`, `dict://`) are rejected.

---

## 3. Multi-Tenant Workspace Architecture

Current implementation status:
- **Token Context:** Authenticated requests receive a workspace and organization context from the signed token; client headers cannot replace the token's workspace.
- **API Authorization:** Reads require dashboard access; writes map to explicit server-owned permissions. Unmapped mutation routes fail closed.
- **Core v2 Workspace Operations:** Workspace lists are organization-filtered, and core asset/finding/incident/evidence/report store calls receive the token workspace ID.
- **Important limitation:** The domain store still uses seeded in-memory data, and persistent workspace membership is not fully wired into all legacy routes. Do not use this version to store real multi-customer SOC data until the remaining legacy routes and domain repositories are migrated and tested.

---

## 4. Multi-Agent Swarm Specifications

| Agent Name | Codename | Core Responsibilities | Consequential Actions (Human Approval) |
| :--- | :--- | :--- | :--- |
| **SecOps Orchestrator** | `orchestrator` | Task delegation, workflow planning, cross-agent coordination | Triggering multi-agent active response |
| **Security Analyst** | `security_analyst` | Alert correlation, root-cause investigation, case timeline | Modifying alert priority or closing cases |
| **Code Security Auditor** | `code_security` | Static code review, dependency vulnerability analysis | Generating automated PR remediation |
| **Threat Intelligence** | `threat_intel` | IOC extraction, defanging/refanging, STIX 2.1 generation | External intelligence sync |
| **Detection Engineer** | `detection_engineer` | Sigma & YARA rule generation, SIEM query tuning | Pushing rules to production SIEM |
| **Incident Response** | `incident_response` | Containment playbooks, evidence preservation | Host isolation, perimeter firewall drop |
| **Adversary Validation** | `validation_agent` | Safe purple-team simulation, detection coverage validation | Running active test scenarios |
| **Executive Reporting** | `reporting_agent` | CVSS v3.1 scoring, compliance metrics, executive briefs | Publishing signed audit reports |
| **AI Security Assessor** | `ai_security_agent` | LLM red teaming, prompt injection screening, MCP tool audit | Revoking compromised tool tokens |

---

## 5. Persistence & Connection Pool Architecture

- **Driver:** PostgreSQL via native `pg` client library.
- **Connection Pool:** Configured for up to 20 concurrent connections with automatic idle cleanup (30s) and 5s connection timeouts.
- **Current persistence boundary:** PostgreSQL is used for versioned schema migrations and production authentication credentials. Most SOC domain records are still held in a seeded in-memory store; they are not durable across restarts.
- **Migrations:** `scripts/migrate.ts` applies the baseline schema and incremental migrations. The credential migration adds password-hash/salt columns to existing databases.
- **Initial administrator:** After migrations, use `npm run user:provision` from a trusted shell. It requires `DATABASE_URL`, `REDHACK_BOOTSTRAP_EMAIL`, and `REDHACK_BOOTSTRAP_PASSWORD`; passwords are stored as salted PBKDF2 hashes. The command refuses to overwrite an existing email.

## 6. Production Readiness Gate

Before enabling authenticated production use:

1. Configure a PostgreSQL instance and set `DATABASE_URL` in the deployment secret manager.
2. Set a unique `JWT_SECRET` of at least 32 characters; rotate any previously exposed secret.
3. Run `npm run db:migrate` and provision the first administrator with `npm run user:provision`.
4. Verify login, expiry, permission denial, workspace boundaries, database failure handling, and audit records in the deployed environment.
5. Migrate remaining domain CRUD operations from the in-memory seed store to workspace-scoped PostgreSQL repositories before storing real customer security data.

If persistent authentication is not configured, the production UI offers a read-only demo mode. Mutations are rejected; the demo must not be mistaken for a fully deployed production SOC.
