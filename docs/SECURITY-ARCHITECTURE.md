# Security Architecture and Verification Plan

## Purpose and trust boundaries

RedHack AI is a security-operations and validation workbench. It must distinguish simulated findings from observations produced by a real connector or an authorized scan. A UI label, agent narrative, seeded record, or successful HTTP response is not proof that a control executed or a vulnerability exists.

### Trust boundaries

1. **Identity and tenant boundary:** authenticate the caller, derive organization/workspace membership from trusted server-side state, then authorize every operation against that state. Never treat request headers, prompt text, or agent output as identity or permission.
2. **Agent boundary:** model output is untrusted input. Agents may propose actions and findings, but cannot grant themselves tools, expand scope, suppress audit events, or approve their own consequential actions.
3. **Network boundary:** URL preflight is not enough to prevent SSRF. The network execution layer must resolve DNS, reject private/special-use results, pin the validated address for the connection, re-check redirects, cap response size/time, and block access to metadata endpoints at the egress layer.
4. **Persistence boundary:** in-memory/demo data is not durable tenant storage. Do not use demo fallback data for real customer operations. Production readiness requires reachable PostgreSQL and the domain data paths to use tenant-scoped persistent repositories.
5. **Evidence boundary:** every actionable finding should retain source, timestamp, scope, method, raw-evidence reference or digest, confidence, and validation status. Redact secrets and personal data from logs and exports.

## SSRF preflight behavior

`validateSafeUrl` rejects non-HTTP(S) schemes, embedded URL credentials, local/internal hostnames, non-public/special-use IPv4 literals, and IPv6 literal targets unless explicitly allowlisted. This is a conservative preflight check, not a complete SSRF defense. Domain names can resolve to internal addresses, DNS can change between validation and connection, and redirects can cross trust boundaries. Any code that performs network I/O must enforce the network-boundary requirements above. Allowlisting a hostname is not a substitute for validating the resolved destination.

## Consequential-action approval state

The incident action API enforces distinct states: `PENDING_APPROVAL → APPROVED → EXECUTED → ROLLED_BACK`. The approval and execution endpoints use separate server-side permission rules, audit identity comes from the authenticated session rather than caller-supplied display names, and the same identity cannot approve and execute the same action. Execution is rejected unless approval is recorded; rollback is rejected unless the action is recorded as executed.

The legacy SOAR demo endpoint records workflow state only. It does not prove that a real EDR, firewall, or cloud connector performed the external action. The current store is in-memory, so these decisions are not durable across process restarts; production deployment requires persistent storage, transaction-safe state transitions, immutable or tamper-evident audit retention, and connector-specific execution evidence.

## Evidence-to-remediation verification loop

Use this workflow for security findings:

1. **Discover:** record the declared authorized scope and the source of each observation.
2. **Verify:** reproduce safely or corroborate with a second signal; classify unverified AI hypotheses separately.
3. **Prioritize:** capture severity rationale, confidence, affected asset, and operational impact.
4. **Propose:** generate a bounded remediation plan with a diff or configuration change; do not execute by default.
5. **Approve:** require an authorized human approval for changes with material impact.
6. **Apply in isolation:** use a disposable branch, container, or test environment where feasible.
7. **Retest:** rerun the same check and relevant regression tests; preserve before/after evidence.
8. **Close honestly:** close only when verification criteria pass. Otherwise retain the finding as open, mitigated, or inconclusive.

## Release gate checklist

- [ ] `npm ci`, formatting, lint, type-check, unit/integration/regression tests, coverage, and production build pass on the candidate commit.
- [ ] Cross-tenant access tests exercise API routes with conflicting path, query, body, and authenticated workspace selectors.
- [ ] Network integrations test private IPv4/IPv6, DNS rebinding, redirects, timeouts, response-size limits, and cloud metadata egress blocking.
- [ ] High-impact actions require server-side approval tied to the exact action, scope, requester, and expiry.
- [ ] Audit events include actor, tenant, action, target, outcome, timestamp, correlation ID, and evidence reference; logs contain no credentials.
- [ ] PostgreSQL integration tests prove tenant scoping and migration/restore behavior with a real database.
- [ ] Findings distinguish simulated/demo data, AI-generated hypotheses, and verified observations.
- [ ] Deployment has documented secrets, backup/restore, health/readiness checks, and rollback steps.

## Honest status reporting

Do not claim "production-ready", "immutable", "fully secure", or a test count/coverage percentage based only on documentation. Report the exact commit, commands, CI run, environment, skipped tests, and known limitations. A passing CI run proves only the checks that workflow actually executes.
