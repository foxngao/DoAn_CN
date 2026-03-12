# Hospital Management System (HMS)

Tài liệu này là hướng dẫn chuẩn để **setup, chạy, kiểm thử, vận hành và hardening** dự án HMS theo trạng thái code hiện tại.

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Yêu cầu môi trường](#4-yêu-cầu-môi-trường)
5. [Biến môi trường](#5-biến-môi-trường)
6. [Chạy local (không Docker)](#6-chạy-local-không-docker)
7. [Chạy bằng Docker Compose (dev)](#7-chạy-bằng-docker-compose-dev)
8. [Chạy production-like local](#8-chạy-production-like-local)
9. [Migration / Seed dữ liệu](#9-migration--seed-dữ-liệu)
10. [Lint / Test / Build](#10-lint--test--build)
11. [CI (GitHub Actions)](#11-ci-github-actions)
12. [Xác thực session, CSRF, CORS](#12-xác-thực-session-csrf-cors)
13. [Realtime Chat (Socket.IO)](#13-realtime-chat-socketio)
14. [Backup / Restore DB](#14-backup--restore-db)
15. [Observability & vận hành](#15-observability--vận-hành)
16. [Bảo mật & hardening](#16-bảo-mật--hardening)
17. [Troubleshooting nhanh](#17-troubleshooting-nhanh)
18. [Tài liệu liên quan](#18-tài-liệu-liên-quan)

---

## 1) Tổng quan

HMS gồm 3 lớp chính:

- **Backend**: Node.js + Express + Sequelize + Socket.IO
- **Frontend**: React + Vite
- **Database**: MySQL 8

Mục tiêu hiện tại của codebase: **ổn định runtime, giảm regression, hardening vận hành và CI thực dụng**.

---

## 2) Kiến trúc hệ thống

### Backend

- Entry point: `backend/src/server.js`
- App/middleware: `backend/src/app.js`
- Route registry: `backend/src/routes/index.js`
- ORM models: `backend/src/models/*`
- Business modules: `backend/src/modules/*`

### Frontend

- App routes: `frontend/src/routes/AppRoutes.jsx`
- HTTP client chuẩn: `frontend/src/api/axiosClient.js`
- Socket service: `frontend/src/services/chat/socketService.js`

### Hạ tầng

- Dev compose: `docker-compose.yml`
- Prod-like compose: `docker-compose.prod.yml`
- CI: `.github/workflows/ci.yml`

---

## 3) Cấu trúc thư mục

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

## 4) Yêu cầu môi trường

### Bắt buộc

- Node.js >= 20
- npm
- MySQL 8.x

### Khuyến nghị

- Docker + Docker Compose
- MySQL CLI (`mysql`, `mysqldump`) để dùng script backup/restore

---

## 5) Biến môi trường

## 5.1 Backend env (root)

Tạo file env từ template:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Các nhóm biến quan trọng trong `.env.example`:

- **DB core**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_TIMEZONE`
- **DB pool/retry**: `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_POOL_ACQUIRE_MS`, `DB_POOL_IDLE_MS`, `DB_POOL_EVICT_MS`, `DB_RETRY_MAX`, `DB_RETRY_BACKOFF_MS`, `DB_RETRY_BACKOFF_EXPONENT`
- **Auth & security**: `JWT_SECRET`, `DATA_ENCRYPTION_KEY`, `HASH_PEPPER`, `PRIVATE_KEY_ENCRYPTION_KEY`
- **Session/CORS/Log**: `SESSION_COOKIE_CROSS_SITE`, `SESSION_COOKIE_DOMAIN`, `FRONTEND_ORIGIN`, `ALLOWED_ORIGINS`, `LOG_LEVEL`, `SOCKET_SLOW_THRESHOLD_MS`
- **Chatbot**: `CHATBOT_API_URL`, `CHATBOT_API_KEY`, `CHATBOT_MODEL`
- **Email/OTP**: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `OTP_EXPIRES_IN_MINUTES`

## 5.2 Frontend env

```bash
cp frontend/.env.example frontend/.env
```

- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `VITE_SOCKET_URL`: tùy chọn override endpoint Socket.IO (để trống sẽ dùng `window.location.origin`)

> ⚠️ Không commit file chứa secret: `.env`, `backend/.env`, `frontend/.env`.

---

## 6) Chạy local (không Docker)

Chạy từ root repo:

### Bước 1: cài dependency

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

### Bước 2: chuẩn bị env

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Nếu chạy MySQL local, thường cần đổi `DB_HOST=localhost` trong `.env`.

### Bước 3: chạy backend

```bash
npm run dev --prefix backend
```

Backend mặc định: `http://localhost:4000`

### Bước 4: chạy frontend

```bash
npm run dev --prefix frontend
```

Frontend mặc định: `http://localhost:5173`

---

## 7) Chạy bằng Docker Compose (dev)

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Tắt:

```bash
docker compose down
```

Service chính:

- `mysql`
- `backend`
- `adminer` (DB UI tại `http://localhost:8080`)

### Điểm quan trọng

- Backend có healthcheck `/api/health`
- MySQL có healthcheck
- Backend chỉ start sau khi MySQL healthy
- Backend command trong dev compose: `npm run db:migrate && npm run dev` (đảm bảo migration trước khi app chạy)

---

## 8) Chạy production-like local

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Tắt:

```bash
docker compose -f docker-compose.prod.yml down
```

Điểm hardening:

- Dùng cú pháp `:?` cho biến quan trọng (fail fast nếu thiếu)
- Migration-before-start: `npm run db:migrate && npm start`
- Healthcheck cho cả `mysql` và `backend`

---

## 9) Migration / Seed dữ liệu

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

`build:ci` có bundle budget gate để chặn regression kích thước bundle.

---

## 11) CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

Gồm 2 job chạy song song:

1. `backend-quality`: install deps + lint + test:ci
2. `frontend-quality`: install deps + lint + test:ci + build:ci

---

## 12) Xác thực session, CSRF, CORS

- Backend phát hành `session_token` (HttpOnly cookie) và `csrf_token`
- Frontend `axiosClient` tự thêm `x-csrf-token` cho `POST/PUT/PATCH/DELETE`
- `withCredentials: true` bật sẵn
- CORS chỉ cho origin hợp lệ từ `ALLOWED_ORIGINS` / `FRONTEND_ORIGIN`

---

## 13) Realtime Chat (Socket.IO)

- Backend socket nằm trong `backend/src/server.js`
- Frontend socket service: `frontend/src/services/chat/socketService.js`
- Endpoint socket mặc định theo `window.location.origin`, có thể override qua `VITE_SOCKET_URL`
- Vite dev proxy đã có `/socket.io` (ws enabled)

---

## 14) Backup / Restore DB

Script:

- `scripts/db-backup.js`
- `scripts/db-restore.js`

Backup dry-run:

```bash
node scripts/db-backup.js --dry-run
```

Backup thật:

```bash
node scripts/db-backup.js --output ./backups/backup.sql
```

Restore dry-run:

```bash
node scripts/db-restore.js --dry-run --file ./backup.sql
```

Restore thật (bắt buộc `--yes`):

```bash
node scripts/db-restore.js --file ./backup.sql --yes
```

---

## 15) Observability & vận hành

- Logger: `backend/src/utils/logger.js`
- Correlation ID: `x-request-id`
- Socket telemetry: log duration/outcome cho event realtime
- Slow socket threshold qua `SOCKET_SLOW_THRESHOLD_MS`

Khuyến nghị tham khảo runbook trước khi deploy:

- Incident response
- Backup/restore
- Hardening checklist

---

## 16) Bảo mật & hardening

- Không dùng secret thật trong template (`.env.example`, compose)
- Không commit file env runtime
- Rotate secret ngay khi nghi ngờ lộ lọt (`DB_PASSWORD`, `JWT_SECRET`, API keys, encryption keys)
- Validate compose trước khi chạy:

```bash
docker compose config
docker compose -f docker-compose.prod.yml config
```

---

## 17) Troubleshooting nhanh

### Thiếu biến môi trường

- Lỗi kiểu `Missing required environment variables...`
- So sánh `.env` với `.env.example`, bổ sung thiếu, restart service/container

### Lỗi CORS

- Kiểm tra `FRONTEND_ORIGIN` / `ALLOWED_ORIGINS`

### Lỗi CSRF 403

- Đảm bảo request đi qua `axiosClient`
- Kiểm tra cookie `csrf_token` và header `x-csrf-token`

### Prod compose báo thiếu biến

- Chạy `docker compose -f docker-compose.prod.yml config` để thấy biến thiếu do `:?`

---

## 18) Tài liệu liên quan

- Hardening checklist: `docs/hardening-checklist.md`
- Observability: `docs/observability.md`
- Incident response: `docs/runbooks/incident-response.md`
- Backup/restore runbook: `docs/runbooks/backup-restore.md`

---

## Quick Release Gate (khuyến nghị trước khi merge/deploy)

```bash
npm run lint --prefix backend && npm run test --prefix backend
npm run lint --prefix frontend && npm run test --prefix frontend && npm run build:ci --prefix frontend
docker compose config
docker compose -f docker-compose.prod.yml config
```
