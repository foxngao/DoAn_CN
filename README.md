# Hospital

Hướng dẫn thực dụng cho solo dev để chạy, verify và release an toàn.

## 1) Setup môi trường an toàn

1. Tạo file env từ template:

```bash
cp .env.example .env
```

2. Cập nhật giá trị thật cho các biến trong `.env` (DB/JWT/API key).
3. Không commit secret:
   - Không đẩy `.env`, `backend/.env`, `frontend/.env` lên git.
   - Chỉ commit `.env.example`.
4. Khi nghi lộ secret, rotate ngay (DB password, JWT secret, API key).

## 2) Lệnh dev chính

### Backend

```bash
npm install --prefix backend
npm run dev --prefix backend
```

### Frontend

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

## 3) Lệnh verify chính (trước release)

### Backend

```bash
npm run lint --prefix backend && npm run test --prefix backend
```

### Frontend

```bash
npm run lint --prefix frontend && npm run test --prefix frontend && npm run build --prefix frontend
```

### Docker compose production config

```bash
docker compose -f docker-compose.prod.yml config
```

## 4) Docker commands cơ bản

### Dev

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
docker compose down
```

### Production-like local run

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml down
```

## 5) Runbooks & checklist

- Hardening checklist + rollout plan: `docs/hardening-checklist.md`
- Observability tối thiểu: `docs/observability.md`
- Incident response runbook: `docs/runbooks/incident-response.md`
- Backup/restore runbook: `docs/runbooks/backup-restore.md`
