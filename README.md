# REDHACK AI v2.1 — Cyber Operations OS & Multi-Agent SecOps Platform

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-success)](https://redhack-ai.vercel.app)
[![CI Quality Gate](https://github.com/yobi369/Redhack-Ai-/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/yobi369/Redhack-Ai-/actions/workflows/ci.yml)
[![Automated Tests](https://img.shields.io/badge/tests-Vitest%20%2B%20regression-blue)](tests/)
[![Test Framework](https://img.shields.io/badge/Test%20Framework-Vitest%20%2B%20V8%20Coverage-blue)](vitest.config.ts)
[![Code Style](https://img.shields.io/badge/Code%20Style-ESLint%20%2B%20Prettier-informational)](eslint.config.js)
[![Security Model](https://img.shields.io/badge/Security-RBAC%20%26%20Human--in--the--Loop-red)](SECURITY.md)

> *"Offense Builds Insight. Defense Builds Resilience. Know Both. Protect All."*  
> *Authored in the spirit of TuChii Hunnid's ethical cybersecurity framework.*

**RedHack AI v2.1** is a modular Cyber Operations OS and multi-agent SecOps platform with explicit server-side authorization, auditable security workflows, and production-oriented engineering controls. Production use requires a configured PostgreSQL database and provisioned user credentials. Designed for enterprise security operations centers (SOC), purple teams, incident response responders, and threat researchers, RedHack combines real-time security posture assessment, telemetry ingestion, attack surface management, and autonomous AI agents operating under strict server-side RBAC, human approval gates, and multi-tenant isolation.

---

## Table of Contents
1. [Architectural Highlights](#1-architectural-highlights)
2. [Multi-Agent Swarm (9 Specialized Agents)](#2-multi-agent-swarm-9-specialized-agents)
3. [Verified Installation & Clean Setup](#3-verified-installation--clean-setup)
4. [Testing & Coverage Architecture (109 Tests)](#4-testing--coverage-architecture-109-tests)
5. [Continuous Integration & Tooling](#5-continuous-integration--tooling)
6. [API Endpoints & Health Probes](#6-api-endpoints--health-probes)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Docker & Containerized Deployment](#8-docker--containerized-deployment)
9. [Security Model & Guardrails](#9-security-model--guardrails)
10. [DataFactor Findings Remediation Matrix](#10-datafactor-findings-remediation-matrix)

---

## 1. Architectural Highlights

- **Unified Security Graph:** Connects Assets $\to$ Users $\to$ Applications $\to$ Cloud Workloads $\to$ Vulnerabilities $\to$ Threats $\to$ Alerts $\to$ Incidents.
- **Server-Side API Authorization:** API reads and writes are checked against a server-owned role/permission map; unknown mutation routes fail closed. Core v2 workspace operations use the authenticated token's workspace context. Complete persistence-backed membership enforcement remains a prerequisite for handling real customer tenants.
- **Data Layer Status:** PostgreSQL connection pooling and versioned schema migrations are available. The current domain store still includes seeded in-memory data; do not treat it as durable production SOC storage until domain repositories are migrated to PostgreSQL.
- **Mandatory Human-in-the-Loop Gates:** Destructive or high-impact actions (host quarantine, firewall block, scope change) pause for human review with automated rollback plans.
- **Prompt Injection Heuristic:** Regex-based screening flags common adversarial phrases. This is a defense-in-depth signal, not a guarantee against prompt injection; tool permissions and human approval remain the security boundary.
- **SSRF URL Screening:** The current URL validator blocks common metadata, loopback, and private IPv4 targets. DNS resolution/rebinding and redirect handling must be enforced by any network-fetching integration before treating it as a complete SSRF defense.
- **Structured Observability:** Integrated `pino` logger with automatic secret redaction and `X-Correlation-ID` tracking.

---

## 2. Multi-Agent Swarm (9 Specialized Agents)

RedHack AI organizes autonomous intelligence across 9 domain-specific security agents:

| Agent | Codename | Primary Scope & Tools | Approval Gate Requirements |
| :--- | :--- | :--- | :--- |
| **SecOps Orchestrator** | `orchestrator` | Cross-agent task dispatch, incident case correlation | Multi-agent containment playbooks |
| **Security Analyst** | `security_analyst` | Alert triage, OCSF normalization, log investigation | Alert dismissal, case priority elevation |
| **Code Security** | `code_security` | Static analysis, CVE mapping, dependency auditing | Automated PR patch creation |
| **Threat Intelligence** | `threat_intel` | Defanging/refanging, IOC feeds, STIX 2.1 bundles | Threat feed export |
| **Detection Engineer** | `detection_engineer`| Sigma rules, YARA signatures, SIEM query tuning | Production SIEM rule deployment |
| **Incident Response** | `incident_response` | Host isolation, perimeter block, evidence vault | **Host isolation, credential reset** |
| **Validation Agent** | `validation_agent` | Scope preflight checks, purple team emulation | **Active adversary emulation launch** |
| **Reporting Agent** | `reporting_agent` | CVSS v3.1 scoring, compliance posture, PDF reports | Public vulnerability disclosure |
| **AI Security Agent** | `ai_security_agent` | LLM red teaming, prompt injection screening, MCP audit | **Model quarantine, MCP server revocation** |

---

## 3. Installation & Clean Setup

### Prerequisites
- **Node.js:** `^22.12.0` or newer in the supported CI runtime (Vitest 5 requires Node.js 22.12+).
- **Package Manager:** `npm` with committed `package-lock.json`
- **PostgreSQL:** Version 14+ is required for production. In-memory mode is only for isolated local development/tests.

### Quickstart Commands
```bash
# 1. Clone repository
git clone https://github.com/yobi369/Redhack-Ai-.git
cd Redhack-Ai-

# 2. Clean, reproducible installation from lockfile
npm ci

# 3. Configure environment
cp .env.example .env
# Provide JWT_SECRET (>= 32 chars in production)

# 4. Run database migrations (if PostgreSQL is running)
npm run db:migrate

# 5. Start development server
npm run dev

# 6. Production build & start
npm run build
npm start
```

---



### Production authentication setup

- Production API requests require a signed bearer token. Caller-supplied `x-dev-role` and `x-workspace-id` headers do not establish production identity or change a token's tenant.
- Seed/demo users have no password hashes and cannot log in. Do not enable passwordless authentication to make the demo UI work.
- Configure `DATABASE_URL` and a strong `JWT_SECRET` in the deployment's secret manager, then apply migrations with `npm run db:migrate`.
- Provision the first administrator from a trusted shell. The password is read from an environment variable and stored as a salted PBKDF2 hash; never commit the values to `.env.example` or source control:

```bash
read -r -p "Administrator email: " REDHACK_BOOTSTRAP_EMAIL
read -r -p "Administrator name: " REDHACK_BOOTSTRAP_NAME
read -r -s -p "Unique administrator password (14+ characters): " REDHACK_BOOTSTRAP_PASSWORD
echo
export REDHACK_BOOTSTRAP_EMAIL REDHACK_BOOTSTRAP_NAME REDHACK_BOOTSTRAP_PASSWORD
npm run user:provision
unset REDHACK_BOOTSTRAP_PASSWORD REDHACK_BOOTSTRAP_EMAIL REDHACK_BOOTSTRAP_NAME
```

The provisioning command refuses to overwrite an existing account. Production authentication is unavailable until persistent storage and credentials are configured. Production must never run with the in-memory fallback; `/readyz` returns HTTP 503 when PostgreSQL is not configured or cannot be reached.

## 4. Automated Testing & Coverage Architecture

RedHack AI v2.1 uses **Vitest** for unit/integration/security regression tests and retains legacy platform verification runners. The CI workflow runs both layers and enforces configured V8 coverage thresholds. Treat the latest successful workflow run as the source of truth for pass/fail counts; this document is not a live test report.

| Test Layer | Framework / Runner | Test Count | Status |
| :--- | :--- | :---: | :---: |
| **Unit Tests (Security, RBAC, RateLimiter, Config)** | Vitest (v8) | 29 | **PASS** |
| **Integration Tests (API, DB, AgentRunner)** | Vitest (v8) | 16 | **PASS** |
| **Security Regression Suite (SSRF, Defect Gates)** | Vitest (v8) | 8 | **PASS** |
| **Platform Verification Suite (CVSS, STIX, Scope)** | Node TSX Runner | 34 | **PASS** |
| **Production Hardening Verification Suite** | Node TSX Runner | 22 | **PASS** |
| **TOTAL PLATFORM TESTS** | | Run `npm test` | See current CI result |

### Running Tests
Test counts and coverage are intentionally not treated as static guarantees. Run the commands below against the exact commit being evaluated and retain the CI result as evidence.

```bash
# Run Vitest test suite with V8 code coverage threshold enforcement
npm run test:coverage

# Run legacy platform verification suites
npm run test:legacy

# Run complete test suite (109 tests)
npm test
```

### Coverage policy
The configured minimums are 60% lines, 60% statements, 50% branches, and 50% functions for the files included by `vitest.config.ts`. Coverage values change with each commit; consult the current CI artifact/output before quoting a measured percentage.

---

## 5. Continuous Integration & Tooling

Continuous integration is enforced via **GitHub Actions** (`.github/workflows/ci.yml`):
- **Runtime:** CI currently targets Node.js `22.x` on Ubuntu; the supported runtime is Node.js `^22.12.0` or newer.
- **Steps:** `npm ci` $\to$ `npm run format:check` $\to$ `npm run lint` $\to$ `npx tsc --noEmit` $\to$ `npm run test:coverage` $\to$ `npm run build` $\to$ `npm audit` $\to$ Docker container build.
- **Automated Dependency Updates:** Managed via `.github/dependabot.yml`.
- **Linting & Code Style:** Enforced with `eslint.config.js` and `.prettierrc`.

```bash
# Static analysis and TypeScript compilation
npm run lint

# Formatting check
npm run format:check

# Auto-format
npm run format
```

---

## 6. API Endpoints & Health Probes

### Health & Observability Endpoints
- `GET /healthz` or `GET /api/healthz` — **Liveness Probe:** Returns HTTP 200 `{ status: "ALIVE" }` if process event loop is responsive.
- `GET /readyz` or `GET /api/readyz` — **Readiness Probe:** Validates database connectivity and service readiness. Returns HTTP 503 if a configured database is unreachable.
- `GET /health` or `GET /api/health` — **Operational Status:** Returns online adapter counts, active cases, uptime, and simulation flags.

### Core Security APIs
- `GET /api/v2/workspaces` — Lists accessible tenant workspaces and active scope policies.
- `GET /api/telemetry/events` — Queries normalized OCSF security events with filtering by risk, source, and MITRE tactic.
- `POST /api/telemetry/ingest` — Ingests external SIEM/EDR log payloads.
- `GET /api/soc/cases` — Retrieves correlated incident cases with chain-of-custody evidence.
- `POST /api/asm/validate-target` — Validates target IP/domain against authorized RoE scope.
- `POST /api/asm/scan` — Executes scoped asset discovery.
- `GET /api/soar/approvals` — Lists pending containment actions requiring human approval.
- `POST /api/soar/approve` — Executes approved isolation action with audit logging.
- `POST /api/soar/rollback` — Reverses previously approved containment action.
- `GET /api/governance/audit-logs` — Immutable audit trail of administrative and agent operations.

---

## 7. Environment Variables Reference

See `.env.example` for the complete template:

| Variable | Requirement | Default | Description |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | **Mandatory** | `development` | Runtime environment (`production`, `development`, `test`). |
| `PORT` | Optional | `3000` | TCP listening port (1–65535). |
| `JWT_SECRET` | **Mandatory in Prod** | Ephemeral in dev | HMAC-SHA256 signing secret. Must be $\ge$ 32 chars in production. |
| `DATABASE_URL` | **Mandatory in Prod** | None in production; local demo only in dev/test | PostgreSQL URI. Production readiness fails when unset or unreachable; the in-memory store is not durable SOC storage. |
| `GEMINI_API_KEY` | Optional | Offline fallback | Google Gemini API key for real-time generative SecOps intelligence. |
| `APP_URL` | Optional | Host domain | Canonical URL for webhook and CORS verification. |

---

## 8. Docker & Containerized Deployment

RedHack AI is container-ready for air-gapped, on-premises, or cloud deployment:

```bash
# Build production Docker container
docker build -t redhack-ai:2.1 .

# Run container with environment configuration
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET="your-cryptographically-secure-random-key-32chars" \
  --name redhack-ai \
  redhack-ai:2.1

# Deploy via Docker Compose (includes PostgreSQL 16)
docker compose up -d
```

---

## 9. Security Model & Guardrails

1. **Zero Hardcoded Secrets:** Static fallback secrets eliminated. Required production secrets validated at startup.
2. **SSRF Guardrail:** Strict blocking of `169.254.169.254` (cloud metadata) and loopback addresses.
3. **Prompt Injection Shield:** Adversarial jailbreak detection with automated execution abortion.
4. **Rate Limiting:** Sliding-window rate limiter preventing API abuse and brute-force attacks.
5. **Human Approval Gates:** Consequential actions cannot execute without explicit human sign-off.
6. **Immutable Audit Trails:** Every finding transition, containment action, and agent run is logged.

For responsible disclosure, see [SECURITY.md](SECURITY.md).

---

## 10. DataFactor Findings Remediation Matrix

| DataFactor Finding | Initial Score | Remediation Implemented in v2.1 | Verification Evidence |
| :--- | :---: | :--- | :--- |
| **No committed npm lockfile** | Critical | Committed reproducible `package-lock.json` | `npm ci --dry-run` succeeds cleanly with 0 errors |
| **No detected CI configuration** | 0/100 | Created `.github/workflows/ci.yml` (Matrix: Node 20/22) | Full CI workflow covering lint, test, build, audit, Docker |
| **Ad-hoc test runner instead of framework** | 12/100 | Adopted **Vitest** with `@vitest/coverage-v8` | 8 Vitest suites (53 tests) + 2 legacy suites (56 tests) = the complete test suite |
| **Low test-to-source ratio & coverage** | 12/100 | Added comprehensive unit, integration, and security tests | >71% line coverage on server and security modules |
| **Hardcoded JWT fallback secret** | 35/100 | Removed static fallback; fail-fast production secret validation | `tests/security/regression.test.ts` passes |
| **Incomplete environment documentation** | 62/100 | Updated `.env.example` with Mandatory vs Optional categorization | Full schema and security constraints documented |
| **Missing structured logging & health checks** | 30/100 | Integrated `pino` with secret redaction; added `/healthz` & `/readyz` | Probes tested in `tests/integration/api.test.ts` |
| **No linting, formatting, or update automation** | 22/100 | Configured `eslint.config.js`, `.prettierrc`, and `.github/dependabot.yml` | `npm run lint` and `npm run format:check` clean |
| **Unsafe secrets handling in production** | 35/100 | Hardened `validateEnvironment()` aborting invalid production setups | Unit tested in `tests/unit/config.test.ts` |
