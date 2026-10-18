# Changelog — RedHack AI

All notable changes to the RedHack AI platform will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] — 2026-10-18

### 🛡️ Production Hardening & DataFactor Quality Optimization

#### Security & Authentication
- **Removed Static Fallback Secret:** Eliminated hardcoded JWT fallback key in `src/server/security.ts` and `server.ts`. Replaced with strict production configuration validation requiring external, cryptographically strong secrets (minimum 32 characters).
- **Process-Bound Ephemeral Keys in Dev/Test:** Non-production runs now generate random 256-bit runtime keys, ensuring no static secret is ever persisted or shared.
- **Fail-Fast Startup Validation:** Application aborts startup with clear, non-sensitive diagnostic messages if production security requirements are unmet.
- **SSRF Defense:** Hardened link-local metadata (169.254.169.254) and loopback address blocking.
- **Prompt Injection Defense Gateway:** Active screening of all AI agent inputs against adversarial jailbreaks and system prompt extraction attacks.
- **Sensitive Data Redaction in Logging:** Automatic masking of passwords, Bearer tokens, GitHub tokens, and API keys.

#### Testing & Test Architecture
- **Vitest Framework Adoption:** Replaced custom assertion runner with standard Vitest test runner.
- **Comprehensive Test Coverage:** Expanded test suites to **109 passing tests** across 8 Vitest suites and 2 legacy platform suites.
- **Coverage Threshold Enforcement:** Added V8 code coverage measuring lines (>71%), statements (>70%), functions (>53%), and branches (>57%).
- **Dedicated Security Regression Suite:** Added `tests/security/regression.test.ts` to prevent recurrence of past vulnerabilities.

#### Observability & Reliability
- **Structured JSON Logging:** Integrated `pino` with ISO timestamps, environment tags, and request correlation IDs (`X-Correlation-ID`).
- **Kubernetes Probes:** Added `/healthz` (liveness probe) and `/readyz` (readiness probe) with accurate 503 status handling for database dependency failures.
- **Enhanced `/api/health`:** Telemetry reporting active cases, online adapters, and simulation status.

#### CI/CD & Build Reproducibility
- **Committed `package-lock.json`:** Created deterministic npm lockfile supporting `npm ci`.
- **GitHub Actions Quality Gate:** Added `.github/workflows/ci.yml` matrix testing across Node.js 20.x and 22.x, covering format, lint, tsc, test coverage, build, and container creation.
- **Dependabot Integration:** Added `.github/dependabot.yml` for automated dependency vulnerability and version updates.
- **ESLint & Prettier Tooling:** Configured Flat Config `eslint.config.js` and `.prettierrc`.

---

## [2.0.0] — 2026-10-01

### 🚀 Enterprise Multi-Agent SecOps Platform Launch
- Transitioned RedHack into Cyber Operations OS for security teams.
- Implemented 9 specialized security agents (Orchestrator, Security Analyst, Code Security, Threat Intel, Detection Engineer, Incident Response, Validation Agent, Reporting Agent, AI Security Agent).
- Unified Security Graph and finding lifecycle state engine.
- Rules of Engagement (RoE) scope enforcement with CIDR/domain whitelisting and explicit database exclusions.
- Mandatory human-in-the-loop approval gates for high-consequence containment actions (host isolation, firewall rule injection).
- Emergency kill switch for controlled simulation safety.
