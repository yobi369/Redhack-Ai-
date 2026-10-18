# Security Policy — RedHack AI

RedHack AI is an enterprise-grade Cyber Operations OS and multi-agent SecOps automation platform. We take security vulnerabilities within the RedHack AI platform seriously and are committed to responsible disclosure and prompt remediation.

---

## 1. Supported Versions

Security updates and patches are actively provided for the following releases:

| Version | Supported | Security Maintenance Status |
| :--- | :---: | :--- |
| **2.1.x** | **Yes** | Active Security & Maintenance Release |
| **2.0.x** | Limited | Critical Security Fixes Only |
| **< 2.0** | No | End of Life (Upgrade to v2.1+ recommended) |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or potential defect within RedHack AI, please report it privately:

- **Primary Security Email:** `security@redhack-ai.internal` / `bmutunga794@gmail.com`
- **PGP Key:** Available upon request for encrypted communication.
- **Reporting Information:**
  - Description of the vulnerability.
  - Proof of Concept (PoC) or reproduction steps.
  - Affected components (`src/server/`, `src/db/`, API routes, etc.).
  - Potential impact assessment (e.g., CVSS estimate).

**Please do not report security issues through public GitHub Issues or discussions.**

---

## 3. Vulnerability Response Timeline

- **Initial Acknowledgment:** Within **24 hours** of receiving the report.
- **Triage & Validation:** Within **48 hours** with severity scoring.
- **Remediation & Patching:** Critical vulnerabilities prioritized for release within **7 days**.
- **Public Disclosure:** Coordinated disclosure after fix validation and release.

---

## 4. Platform Security Principles & Controls

RedHack AI adheres to strict defensive engineering standards:

1. **Least Privilege & Role-Based Access Control (RBAC):** Server-side authorization enforced on all protected endpoints.
2. **Multi-Tenant Workspace Isolation:** Hard partition of assets, cases, telemetry, and evidence by tenant/workspace ID.
3. **Zero Secrets in Code or Logs:** JWT secrets validated at startup; secrets and auth tokens automatically redacted from all structured logs.
4. **Mandatory Human-in-the-Loop Approval Gates:** Consequential or destructive actions (host quarantine, firewall block, RoE scope modifications) cannot execute autonomously.
5. **SSRF Defense:** Hard link-local (169.254.x.x) and loopback protection against cloud metadata credential exfiltration.
6. **Prompt Injection Gateway:** Adversarial prompt shielding screening all agent input vectors before execution.
