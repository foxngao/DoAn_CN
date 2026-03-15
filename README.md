# Hospital Management System (HMS)

This document is the canonical guide to **set up, run, test, operate, and harden** the HMS project based on the current codebase.

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Environment Requirements](#4-environment-requirements)
5. [Environment Variables](#5-environment-variables)
6. [Run Locally (without Docker)](#6-run-locally-without-docker)
7. [Run with Docker Compose (dev)](#7-run-with-docker-compose-dev)
8. [Run Production-like Locally](#8-run-production-like-locally)
9. [Migrations / Seed Data](#9-migrations--seed-data)
10. [Lint / Test / Build](#10-lint--test--build)
11. [CI (GitHub Actions)](#11-ci-github-actions)
12. [Session Auth, CSRF, CORS](#12-session-auth-csrf-cors)
13. [Realtime Chat (Socket.IO)](#13-realtime-chat-socketio)
14. [Database Backup / Restore](#14-database-backup--restore)
15. [Observability & Operations](#15-observability--operations)
16. [Security & Hardening](#16-security--hardening)
17. [Quick Troubleshooting](#17-quick-troubleshooting)
18. [Related Documentation](#18-related-documentation)

---

## 1) Overview

HMS has three main layers:

- **Backend**: Node.js + Express + Sequelize + Socket.IO
- **Frontend**: React + Vite
- **Database**: MySQL 8

The current direction of this codebase is: **runtime stability, regression prevention, and practical hardening for CI/operations**.

---

## 2) System Architecture

### Backend

- Entry point: `backend/src/server.js`
- App/middleware setup: `backend/src/app.js`
- Route registry: `backend/src/routes/index.js`
- ORM models: `backend/src/models/*`
- Business modules: `backend/src/modules/*`

### Frontend

- App routes: `frontend/src/routes/AppRoutes.jsx`
- Standard HTTP client: `frontend/src/api/axiosClient.js`
- Socket service: `frontend/src/services/chat/socketService.js`

### Infrastructure

- Dev compose: `docker-compose.yml`
- Production-like compose: `docker-compose.prod.yml`
- CI workflow: `.github/workflows/ci.yml`

---

## 3) Directory Structure

```text
.
├─ backend/
│  ├─ src/
│  ├─ migrations/
│  ├─ seeders/
│  └─ tests/
├─ frontend/
│  ├─ src/
│  └─ vite.config.js
├─ docs/
├─ scripts/
├─ docker-compose.yml
├─ docker-compose.prod.yml
├─ .env.example
└─ frontend/.env.example
```

---

## 4) Environment Requirements

### Required

- Node.js >= 20
- npm
- MySQL 8.x

### Recommended

- Docker + Docker Compose
- MySQL CLI tools (`mysql`, `mysqldump`) for backup/restore scripts

---

## 5) Environment Variables

### 5.1 Backend env (project root)

Create an env file from the template:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Main variable groups in `.env.example`:

- **DB core**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_TIMEZONE`
- **DB pool/retry**: `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_POOL_ACQUIRE_MS`, `DB_POOL_IDLE_MS`, `DB_POOL_EVICT_MS`, `DB_RETRY_MAX`, `DB_RETRY_BACKOFF_MS`, `DB_RETRY_BACKOFF_EXPONENT`
- **Auth & security**: `JWT_SECRET`, `DATA_ENCRYPTION_KEY`, `HASH_PEPPER`, `PRIVATE_KEY_ENCRYPTION_KEY`
- **Session/CORS/logging**: `SESSION_COOKIE_CROSS_SITE`, `SESSION_COOKIE_DOMAIN`, `FRONTEND_ORIGIN`, `ALLOWED_ORIGINS`, `LOG_LEVEL`, `SOCKET_SLOW_THRESHOLD_MS`
- **Chatbot**: `CHATBOT_API_URL`, `CHATBOT_API_KEY`, `CHATBOT_MODEL`
- **Email/OTP**: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `OTP_EXPIRES_IN_MINUTES`

### 5.2 Frontend env

```bash
cp frontend/.env.example frontend/.env
```

- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `VITE_API_ORIGIN`: optional API origin override (empty = auto map from current host)
- `VITE_UPLOAD_ORIGIN`: optional upload origin override (empty = follow API origin)
- `VITE_SOCKET_URL`: optional Socket.IO endpoint override (empty = follow API origin)
- `VITE_DEV_PROXY_TARGET`: optional Vite dev proxy target (default: `http://localhost:4000`)

> ⚠️ Never commit secret-bearing runtime files: `.env`, `backend/.env`, `frontend/.env`.

---

## 6) Run Locally (without Docker)

Run commands from the repository root.

### Step 1: Install dependencies

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

### Step 2: Prepare env files

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

If you run MySQL locally, you will usually set `DB_HOST=localhost` in `.env`.

### Step 3: Start backend

```bash
npm run dev --prefix backend
```

Default backend URL: `http://localhost:4000`

### Step 4: Start frontend

```bash
npm run dev --prefix frontend
```

Default frontend URL: `http://localhost:5173`

---

## 7) Run with Docker Compose (dev)

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Stop:

```bash
docker compose down
```

Main services:

- `mysql`
- `backend`
- `adminer` (DB UI at `http://localhost:8080`)

### Important behavior

- Backend healthcheck on `/api/health`
- MySQL healthcheck enabled
- Backend starts only after MySQL is healthy
- Dev backend command is migration-gated: `npm run db:migrate && npm run dev`

---

## 8) Run Production-like Locally

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Stop:

```bash
docker compose -f docker-compose.prod.yml down
```

Hardening points in this setup:

- Uses `:?` for required critical variables (fail-fast on missing values)
- Migration-before-start: `npm run db:migrate && npm start`
- Healthchecks for both `mysql` and `backend`

---

## 9) Migrations / Seed Data

```bash
npm run db:migrate --prefix backend
npm run db:migrate:undo --prefix backend
npm run db:seed --prefix backend
npm run db:seed:rerun-check --prefix backend
```

---

## 10) Lint / Test / Build

### Backend

```bash
npm run lint --prefix backend
npm run test --prefix backend
```

### Frontend

```bash
npm run lint --prefix frontend
npm run test --prefix frontend
npm run build --prefix frontend
npm run build:ci --prefix frontend
```

`build:ci` includes a bundle-budget gate to prevent bundle-size regressions.

### Security audit baseline tools

```bash
node scripts/security/capture-npm-audit.cjs --prefix backend --out backend-audit-baseline.json
node scripts/security/capture-npm-audit.cjs --prefix frontend --out frontend-audit-baseline.json
node scripts/security/validate-audit-policy.cjs --audit backend-audit-baseline.json --policy docs/security/ci-policy.md --scope backend --mode baseline
node scripts/security/validate-audit-policy.cjs --audit frontend-audit-baseline.json --policy docs/security/ci-policy.md --scope frontend --mode baseline
```

### Security regression spot checks (post-remediation)

```bash
npm run test:ci --prefix backend -- tests/security/xss-regression.test.js
npm run test:ci --prefix backend -- tests/auth/otp-disclosure.test.js
npm run test:ci --prefix backend -- tests/auth/register-benhnhan-regression.test.js
npm run test:ci --prefix backend -- tests/chat/socket-session-regression.test.js
npm run test:ci --prefix frontend -- src/pages/LoginPage.session.test.jsx
npm run test:ci --prefix frontend -- src/pages/benhnhan/tintuc/TinTucRegression.test.jsx
```

These focused suites protect critical fixes introduced in the audit batch (stored XSS sanitization, OTP non-disclosure, and cookie/session socket auth consistency).

---

## 11) CI (GitHub Actions)

Workflow file: `.github/workflows/ci.yml`

Three parallel jobs:

1. `backend-quality`: install deps + lint + test:ci
2. `frontend-quality`: install deps + lint + test:ci + build:ci
3. `security-audit`: capture npm audit JSON + validate policy in `enforce` mode (blocking for PR to `main`)

Blocking-gate contract check:

```bash
node scripts/security/assert-ci-blocking-gate.cjs --workflow .github/workflows/ci.yml --job security-audit --event pull_request --target-branches main --require-pr-blocking true
```

---

## 12) Session Auth, CSRF, CORS

- Backend issues `session_token` (HttpOnly cookie) and `csrf_token`
- Frontend `axiosClient` automatically sends `x-csrf-token` on `POST/PUT/PATCH/DELETE`
- `withCredentials: true` is enabled by default
- CORS allows only approved origins from `ALLOWED_ORIGINS` / `FRONTEND_ORIGIN`
- Localhost defaults are auto-allowed only for development/unspecified env; staging/production require explicit localhost allowlist
- Detailed policy and environment matrix: `docs/security/cors-policy.md`

---

## 13) Realtime Chat (Socket.IO)

- Backend Socket.IO server is in `backend/src/server.js`
- Frontend socket client is in `frontend/src/services/chat/socketService.js`
- Default socket endpoint is `window.location.origin`
- Optional override via `VITE_SOCKET_URL`
- Vite dev proxy includes `/socket.io` with websocket support

---

## 14) Database Backup / Restore

Scripts:

- `scripts/db-backup.js`
- `scripts/db-restore.js`

Backup dry-run:

```bash
node scripts/db-backup.js --dry-run
```

Backup execution:

```bash
node scripts/db-backup.js --output ./backups/backup.sql
```

Restore dry-run:

```bash
node scripts/db-restore.js --dry-run --file ./backup.sql
```

Restore execution (requires `--yes`):

```bash
node scripts/db-restore.js --file ./backup.sql --yes
```

---

## 15) Observability & Operations

- Logger: `backend/src/utils/logger.js`
- Correlation ID header: `x-request-id`
- Socket telemetry logs event duration/outcome
- Slow-event threshold controlled by `SOCKET_SLOW_THRESHOLD_MS`

Recommended runbooks before release/deployment:

- Security incident response (`docs/runbooks/security-incident-response.md`)
- Dependency hotfix (`docs/runbooks/dependency-hotfix.md`)
- Remediation rollout checklist (`docs/release/remediation-rollout-checklist.md`)

---

## 16) Security & Hardening

- Never place real secrets in templates (`.env.example`, compose defaults)
- Never commit runtime env files
- Rotate secrets immediately if exposure is suspected (`DB_PASSWORD`, `JWT_SECRET`, API keys, encryption keys)
- Policy contract: `docs/security/ci-policy.md`
- Secret defer/rotation checklist: `docs/security/secret-rotation-checklist.md`
- Validate compose files before running:

```bash
docker compose config
docker compose -f docker-compose.prod.yml config
```

---

## 17) Quick Troubleshooting

### Missing environment variables

- Typical error: `Missing required environment variables...`
- Compare `.env` against `.env.example`, fill missing values, restart service/container

### CORS issues

- Verify `FRONTEND_ORIGIN` / `ALLOWED_ORIGINS`

### CSRF 403

- Ensure mutating requests go through `axiosClient`
- Verify `csrf_token` cookie and `x-csrf-token` header

### Missing vars in prod compose

- Run `docker compose -f docker-compose.prod.yml config` to identify missing required vars enforced by `:?`

---

## 18) Related Documentation

- Security remediation baseline: `docs/security/remediation-baseline.md`
- Backend audit baseline: `docs/security/audit-baseline-backend.md`
- Frontend audit baseline: `docs/security/audit-baseline-frontend.md`
- CI security policy: `docs/security/ci-policy.md`
- Security incident response runbook: `docs/runbooks/security-incident-response.md`
- Dependency hotfix runbook: `docs/runbooks/dependency-hotfix.md`
- Chat auth troubleshooting runbook: `docs/runbooks/chat-auth-troubleshooting.md`
- Remediation rollout checklist: `docs/release/remediation-rollout-checklist.md`
- Observability guide: section `15) Observability & Operations` in this README
- Backup/restore guide: section `14) Database Backup / Restore` in this README

---

## Quick Release Gate (recommended before merge/deploy)

```bash
npm run lint --prefix backend && npm run test:ci --prefix backend
npm run lint --prefix frontend && npm run test:ci --prefix frontend && npm run build:ci --prefix frontend
node scripts/security/capture-npm-audit.cjs --prefix backend --out backend-audit-final.json
node scripts/security/validate-audit-policy.cjs --audit backend-audit-final.json --policy docs/security/ci-policy.md --scope backend --mode enforce
node scripts/security/capture-npm-audit.cjs --prefix frontend --out frontend-audit-final.json
node scripts/security/validate-audit-policy.cjs --audit frontend-audit-final.json --policy docs/security/ci-policy.md --scope frontend --mode enforce
node scripts/security/assert-ci-blocking-gate.cjs --workflow .github/workflows/ci.yml --job security-audit --event pull_request --target-branches main --require-pr-blocking true
```

Expected result: all commands exit `0`.
