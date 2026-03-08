# Hospital Management System

This document is a **detailed end-to-end guide** to run, develop, test, harden, and operate the project safely.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Technology Stack](#4-technology-stack)
5. [Environment Requirements](#5-environment-requirements)
6. [Environment Variables (.env)](#6-environment-variables-env)
7. [Install & Run Locally (without Docker)](#7-install--run-locally-without-docker)
8. [Install & Run with Docker (dev)](#8-install--run-with-docker-dev)
9. [Run Production-like Environment Locally](#9-run-production-like-environment-locally)
10. [Migrations / Seed Data](#10-migrations--seed-data)
11. [Lint / Test / Build](#11-lint--test--build)
12. [GitHub Actions CI](#12-github-actions-ci)
13. [API Response Contract](#13-api-response-contract)
14. [Session, Cookie, CSRF](#14-session-cookie-csrf)
15. [Realtime Chat with Socket.IO](#15-realtime-chat-with-socketio)
16. [Database Backup / Restore](#16-database-backup--restore)
17. [Observability & Operations](#17-observability--operations)
18. [Pre-release Hardening Checklist](#18-pre-release-hardening-checklist)
19. [Troubleshooting](#19-troubleshooting)
20. [Related Documentation](#20-related-documentation)

---

## 1) Project Overview

This hospital management project includes:

- **Backend**: REST API + business logic + Socket.IO realtime workflows.
- **Frontend**: React + Vite UI, organized by role (Admin/Doctor/Patient/Medical Staff).
- **Database**: MySQL.
- **DevOps baseline**: Docker Compose (dev/prod-like), GitHub Actions CI, health checks, backup/restore runbook, incident response runbook.

Current codebase priority: stability, hardening, and practical solo-dev operations.

---

## 2) High-Level Architecture

### 2.1 Backend

- Entry point: `backend/src/server.js`
- App configuration/middleware: `backend/src/app.js`
- Main route registry: `backend/src/routes/index.js`
- ORM: Sequelize + models in `backend/src/models`
- Business modules: `backend/src/modules/*`

### 2.2 Frontend

- App routing: `frontend/src/routes/AppRoutes.jsx`
- Standard HTTP client: `frontend/src/api/axiosClient.js`
- Session-protected route guard: `frontend/src/auth/PrivateRoute.jsx`
- Build tool: Vite (`frontend/vite.config.js`)

### 2.3 Infrastructure

- Dev compose: `docker-compose.yml`
- Production-like compose: `docker-compose.prod.yml`
- CI workflow: `.github/workflows/ci.yml`

---

## 3) Directory Structure

```text
.
├─ backend/                  # API server, business logic, tests
│  ├─ src/
│  │  ├─ app.js
│  │  ├─ server.js
│  │  ├─ routes/
│  │  ├─ models/
│  │  ├─ modules/
│  │  └─ utils/
│  ├─ migrations/
│  ├─ seeders/
│  ├─ tests/
│  └─ package.json
├─ frontend/                 # React + Vite
│  ├─ src/
│  ├─ vite.config.js
│  └─ package.json
├─ scripts/                  # DB operation scripts (backup/restore)
├─ docs/                     # Runbooks + operational checklists
├─ docker-compose.yml
├─ docker-compose.prod.yml
├─ .env.example
└─ README.md
```

---

## 4) Technology Stack

### Backend

- Node.js + Express
- Sequelize + MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- Socket.IO
- Winston logging
- Node built-in test runner (`node --test`)

### Frontend

- React 18
- React Router
- Axios
- Vite
- Vitest + Testing Library

---

## 5) Environment Requirements

### Required

- Node.js >= 20
- npm
- MySQL 8.x

### Recommended

- Docker + Docker Compose
- MySQL CLI tools (`mysql`, `mysqldump`) for backup/restore scripts

---

## 6) Environment Variables (.env)

Create your env file from the template:

```bash
cp .env.example .env
```

> On Windows PowerShell:
>
> ```powershell
> Copy-Item .env.example .env
> ```

### 6.1 Main environment variable list

| Variable | Required | Description |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | Yes (Docker) | Root password for MySQL container |
| `MYSQL_DATABASE` | Yes (Docker) | Initial database name |
| `DB_HOST` | Yes | Backend DB host |
| `DB_PORT` | Recommended | DB port (usually `3306`) |
| `DB_USER` | Yes | DB user |
| `DB_PASSWORD` | Yes | DB password |
| `DB_NAME` | Yes | Database name |
| `PORT` | Recommended | Backend port (default `4000`) |
| `JWT_SECRET` | Yes | Secret for JWT signing/verification |
| `DATA_ENCRYPTION_KEY` | Yes | Encryption key for blockchain payload data |
| `HASH_PEPPER` | Yes | Pepper used in blockchain hashing |
| `PRIVATE_KEY_ENCRYPTION_KEY` | Yes | Private-key encryption key (recommended: 64-char hex) |
| `SESSION_COOKIE_CROSS_SITE` | Recommended | `true/false` cross-site cookie policy |
| `SESSION_COOKIE_DOMAIN` | Optional | Cookie domain for multi-subdomain deployment |
| `FRONTEND_ORIGIN` | Recommended | Frontend origin for CORS |
| `ALLOWED_ORIGINS` | Recommended | Allowed origins list (comma-separated) |
| `CHATBOT_API_URL` | Yes | Chatbot endpoint |
| `CHATBOT_API_KEY` | Yes | Chatbot API key |
| `CHATBOT_MODEL` | Recommended | Chatbot model name |

### 6.2 Security notes

- **Do not commit**: `.env`, `backend/.env`, `frontend/.env`.
- Only commit `.env.example`.
- If secret exposure is suspected, rotate immediately: `DB_PASSWORD`, `JWT_SECRET`, API keys, encryption keys.

---

## 7) Install & Run Locally (without Docker)

> Run from the repository root.

### Step 1: Install dependencies

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

### Step 2: Prepare env

```bash
cp .env.example .env
```

Fill in real values in `.env`.

### Step 3: Prepare database

Create a MySQL database matching `DB_NAME` and ensure `DB_USER` has access.

### Step 4: Start backend

```bash
npm run dev --prefix backend
```

Default backend URL: `http://localhost:4000`

### Step 5: Start frontend

```bash
npm run dev --prefix frontend
```

Default frontend URL: `http://localhost:5173`

Vite proxies `/api` to `http://localhost:4000` (see `frontend/vite.config.js`).

---

## 8) Install & Run with Docker (dev)

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Stop:

```bash
docker compose down
```

### Main services in `docker-compose.yml`

- `mysql` (MySQL 8)
- `backend` (runs `npm run dev`)
- `adminer` (DB UI at `http://localhost:8080`)

---

## 9) Run Production-like Environment Locally

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

### Important hardening points in prod compose

- Uses `:?` syntax to **force** required env vars.
- `mysql` includes healthcheck.
- `backend` starts only after `mysql` is healthy.
- `backend` includes healthcheck (`GET /api/health`).

---

## 10) Migrations / Seed Data

Run from backend:

```bash
npm run db:migrate --prefix backend
npm run db:seed --prefix backend
```

Undo latest migration:

```bash
npm run db:migrate:undo --prefix backend
```

Check seed idempotency:

```bash
npm run db:seed:rerun-check --prefix backend
```

---

## 11) Lint / Test / Build

### Backend

```bash
npm run lint --prefix backend
npm run test --prefix backend
```

CI-style backend tests:

```bash
npm run test:ci --prefix backend
```

`test:ci` uses `node --test` to avoid glob path issues on Linux CI.

### Frontend

```bash
npm run lint --prefix frontend
npm run test --prefix frontend
npm run build --prefix frontend
```

---

## 12) GitHub Actions CI

Workflow file: `.github/workflows/ci.yml`

Current CI flow:

1. Setup Node 20
2. Install backend/frontend dependencies
3. Lint backend
4. Test backend
5. Lint frontend
6. Test frontend
7. Build frontend

The pipeline includes minimum backend test env vars (DB/JWT/encryption vars) so tests do not fail due to missing environment variables.

---

## 13) API Response Contract

Backend standardized helpers are in `backend/src/utils/apiResponse.js`:

- Success:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "errors": null
}
```

- Failure:

```json
{
  "success": false,
  "message": "...",
  "data": null,
  "errors": []
}
```

Health endpoint:

- `GET /api/health` → `200` when service is healthy.

---

## 14) Session, Cookie, CSRF

### 14.1 Core mechanism

- Backend issues `session_token` (HttpOnly cookie) after login.
- Backend issues `csrf_token` (cookie), and frontend sends it back via `x-csrf-token` for mutating requests.

### 14.2 Frontend axios client

File: `frontend/src/api/axiosClient.js`

- `withCredentials: true`
- Automatically adds `x-csrf-token` for `POST/PUT/PATCH/DELETE`
- Emits `auth:session-expired` event on `401/403`

### 14.3 CORS

File: `backend/src/config/cors.js`

- Allows only origins in `ALLOWED_ORIGINS` / `FRONTEND_ORIGIN`
- Does not allow wildcard `*` when `credentials: true`

---

## 15) Realtime Chat with Socket.IO

### Backend

- Initialized in `backend/src/server.js`
- Socket authentication via JWT handshake
- Supports request/accept/reject flows, room joining, history, notifications

### Frontend

- Service: `frontend/src/services/chat/socketService.js`
- Main functions include: `connectSocket`, `disconnectSocket`, `requestChat`, `acceptChat`, `rejectChat`, `sendMessage`, and event listener helpers

> Technical note: current chat socket handshake still reads token from localStorage. If you plan to fully standardize realtime auth to cookie-session, update this part accordingly.

---

## 16) Database Backup / Restore

Scripts:

- `scripts/db-backup.js`
- `scripts/db-restore.js`

### Backup

Dry-run:

```bash
node scripts/db-backup.js --dry-run
```

Execute:

```bash
node scripts/db-backup.js --output ./backups/backup.sql
```

### Restore

Dry-run:

```bash
node scripts/db-restore.js --dry-run --file ./backup.sql
```

Execute (requires `--yes`):

```bash
node scripts/db-restore.js --file ./backup.sql --yes
```

Detailed checklist: `docs/runbooks/backup-restore.md`.

---

## 17) Observability & Operations

### Logging

- Logger: `backend/src/utils/logger.js`
- Log level controlled by `LOG_LEVEL` / `NODE_ENV`
- Request correlation with `x-request-id` in `backend/src/app.js`

### Incident monitoring

- Incident response runbook: `docs/runbooks/incident-response.md`
- Minimum monitoring baseline: health endpoint, 5xx errors, timeouts, DB connection errors

---

## 18) Pre-release Hardening Checklist

Minimum commands to run:

```bash
npm run lint --prefix backend && npm run test --prefix backend
npm run lint --prefix frontend && npm run test --prefix frontend && npm run build --prefix frontend
docker compose -f docker-compose.prod.yml config
```

Then validate the full checklist:

- `docs/hardening-checklist.md`

---

## 19) Troubleshooting

### 19.1 CI cannot find backend tests

Current fix in scripts:

```json
"test:ci": "node --test"
```

If it happens again, re-check `backend/package.json`.

### 19.2 Missing env error when starting backend

Typical messages:

- `Missing required environment variables: ...`
- `Missing required environment variable: DATA_ENCRYPTION_KEY`

How to fix:

1. Compare `.env` against `.env.example`
2. Add all required variables
3. Restart backend/container

### 19.3 CORS error: `Origin is not allowed by CORS`

- Check `ALLOWED_ORIGINS` / `FRONTEND_ORIGIN`
- Ensure frontend is opened from an allowed origin

### 19.4 CSRF 403 error

- Ensure mutating requests go through `axiosClient`
- Verify `csrf_token` cookie exists
- Verify `x-csrf-token` header is sent

### 19.5 Production compose fails due to missing variables

`docker-compose.prod.yml` uses `:?` so missing vars fail fast.

Use:

```bash
docker compose -f docker-compose.prod.yml config
```

This command will show which variables are missing.

---

## 20) Related Documentation

- Hardening checklist: `docs/hardening-checklist.md`
- Observability: `docs/observability.md`
- Incident response: `docs/runbooks/incident-response.md`
- Backup/restore runbook: `docs/runbooks/backup-restore.md`

---

