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
│  PostgreSQL 14+ Connection Pool (pg.Pool) ──▶ Resilient In-Memory Transactional Store Fallback     │
│  - Assets Store             - Vulnerabilities & CVEs    - Normalized Telemetry Events              │
│  - Finding Lifecycle Engine - Immutable Audit Ledger    - Multi-Tenant Workspaces & RoE Scope      │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Security Boundaries & Guardrails

### 2.1 Rules of Engagement (RoE) Scope Verification
Every security evaluation, port probe, or purple-team adversary simulation must pass the server-side scope policy:
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
The SSRF validation gateway intercepts all external target URLs before outbound network requests:
- Link-local IP `169.254.169.254` (AWS, GCP, Azure metadata services) is strictly blocked.
- Loopback interfaces (`127.0.0.1`, `localhost`, `::1`) are forbidden.
- Non-HTTP/HTTPS protocols (`file://`, `gopher://`, `dict://`) are rejected.

---

## 3. Multi-Tenant Workspace Architecture

Data isolation is guaranteed across organizational boundaries:
- **Tenant Context:** Injected into `req.tenantContext` by authentication middleware.
- **Data Partitioning:** All database queries for assets, telemetry, findings, and cases filter strictly on `workspaceId`.
- **Cross-Tenant Access Refusal:** Attempting to query or mutate an asset from another workspace triggers an immediate `403 Forbidden` (`TENANT_ISOLATION_VIOLATION`).

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
- **Resilience Strategy:** If `DATABASE_URL` is omitted (e.g. during standalone testing or demo evaluation), the platform seamlessly falls back to the in-memory transactional store with seed datasets.
- **Migrations:** Managed via `scripts/migrate.ts` executing idempotent DDL statements in `src/db/schema.sql`.
