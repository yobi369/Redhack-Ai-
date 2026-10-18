# Contributing to RedHack AI

Thank you for your interest in contributing to **RedHack AI** — the open, extensible Cyber Operations OS for security engineers, SOC analysts, and threat researchers.

---

## 1. Development Principles

1. **Security First:** Never weaken security controls, authorization gates, or tenant isolation for convenience.
2. **Deterministic Quality:** Every pull request must pass the automated CI quality gate (`npm run lint`, `npm test`, `npm run build`).
3. **No Mock Data as Primary:** Production paths must interface with real typed models, valid database queries, and resilient fallbacks.
4. **Mandatory Testing:** All new features and bug fixes must include unit or integration tests in `tests/`.

---

## 2. Setting Up Your Development Environment

### Prerequisites
- **Node.js:** `^20.x` or `^22.x` (LTS recommended)
- **Package Manager:** `npm` (`npm ci` required for clean install)
- **PostgreSQL (Optional):** Version 14+ if testing live SQL persistence.

### Setup Commands
```bash
# 1. Clone repository
git clone https://github.com/yobi369/Redhack-Ai-.git
cd Redhack-Ai-

# 2. Install dependencies cleanly from lockfile
npm ci

# 3. Configure environment
cp .env.example .env
# Edit .env and supply your local JWT_SECRET and GEMINI_API_KEY if desired

# 4. Run database migrations (optional if PostgreSQL is running)
npm run db:migrate

# 5. Start development server
npm run dev
```

---

## 3. Testing & Code Quality Workflow

All contributions must pass local checks before opening a pull request:

```bash
# Run Vitest test suite with code coverage enforcement
npm run test:coverage

# Run full legacy & hardening test suites
npm run test:legacy

# Run all test suites together (109 tests)
npm test

# Run ESLint static analysis & TypeScript typecheck
npm run lint

# Verify Prettier code style
npm run format:check

# Auto-format codebase
npm run format

# Run full production build
npm run build
```

---

## 4. Test Architecture Standards

Tests reside under `tests/` and are organized by layer:
- `tests/unit/`: Pure functions, cryptographic utilities, rate limiting, and RBAC policies.
- `tests/integration/`: API routes, server middleware, database stores, and agent runners.
- `tests/security/`: Security regression tests for discovered and repaired defects.

Every bug fix MUST be accompanied by a regression test verifying that the issue cannot recur.

---

## 5. Pull Request Guidelines

1. **Branch Naming:**
   - `feat/feature-name`
   - `fix/security-issue-name`
   - `docs/documentation-update`
2. **Commit Messages:** Follow Conventional Commits format (e.g., `feat(secops): add snort rule generator`, `fix(security): sanitize bearer token logging`).
3. **Pull Request Description:** Include a summary of changes, motivation, test commands executed, and verification output.
