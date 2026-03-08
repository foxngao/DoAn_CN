# Hardening Checklist & Rollout Plan (Solo Dev)

Tài liệu này dùng để chốt đợt hardening trước release, tập trung vào tính thực thi cho 1 người vận hành.

## 1) Security hardening checks

- [ ] Không commit secret (`.env`, API key, DB password, JWT secret) vào git.
- [ ] Dùng `.env.example` làm template; secret thật chỉ đặt ở máy local/CI/CD secret store.
- [ ] Xác nhận `NODE_ENV` đúng theo môi trường (`development`/`production`).
- [ ] Xác nhận backend không chạy với config debug trong production.
- [ ] Rà soát log: không lộ token, cookie, password, PII (email/phone) ở log mức info/error.
- [ ] Xác nhận endpoint health không trả dữ liệu nhạy cảm.
- [ ] Xác nhận CORS/domain cho frontend ở môi trường production là tập domain hợp lệ.
- [ ] Rotate secret nếu có nghi ngờ lộ thông tin trong quá trình debug trước đó.

## 2) Data integrity checks

- [ ] Chạy backup DB thành công trước release (tham chiếu: `docs/runbooks/backup-restore.md`).
- [ ] Chạy dry-run restore plan để chắc chắn rollback dữ liệu khả thi.
- [ ] Xác nhận migration/seed idempotent hoặc có kế hoạch rollback rõ ràng.
- [ ] Kiểm tra bảng/record trọng yếu không có sai lệch bất thường sau migration.
- [ ] Kiểm tra timezone/định dạng ngày giờ nhất quán frontend-backend-DB.
- [ ] Xác nhận các flow ghi dữ liệu chính (create/update) trả mã lỗi rõ khi input sai.

## 3) Stability / API checks

- [ ] `GET /api/health` trả 200 ở môi trường target.
- [ ] Smoke test tối thiểu các API trọng yếu (auth, hồ sơ bệnh nhân, lịch khám, nghiệp vụ chính).
- [ ] Kiểm tra response contract không breaking với frontend hiện tại.
- [ ] Kiểm tra timeout/retry hợp lý ở các call phụ thuộc external API (nếu có).
- [ ] Rà soát log 5xx và error stack sau khi chạy smoke test.
- [ ] Xác nhận không có thay đổi business logic ngoài phạm vi hardening.

## 4) DevOps / Operations checks

- [ ] Validate compose production config:
  - [ ] `docker compose -f docker-compose.prod.yml config`
- [ ] Build frontend production thành công.
- [ ] Lint + test backend/frontend pass trên máy local hoặc CI.
- [ ] Xác nhận container healthcheck hoạt động (mysql + backend).
- [ ] Xác nhận volume DB (`mysql-data`) tồn tại và đủ dung lượng.
- [ ] Xác nhận log path/rotation đáp ứng vận hành tối thiểu.
- [ ] Xác nhận alert/quan sát tối thiểu theo `docs/observability.md`.

## 5) Rollback checklist

Khi release lỗi, ưu tiên rollback nhanh và an toàn theo thứ tự:

1. [ ] Đóng băng thay đổi mới (stop deploy/manual hotfix chưa kiểm chứng).
2. [ ] Thu thập mốc lỗi + request id + log liên quan.
3. [ ] Rollback app về image/commit ổn định gần nhất.
4. [ ] Nếu có rủi ro dữ liệu, backup hiện trạng rồi mới cân nhắc restore DB.
5. [ ] Nếu cần restore DB: follow runbook `docs/runbooks/backup-restore.md`.
6. [ ] Verify sau rollback: health endpoint + smoke test flow chính.
7. [ ] Theo dõi tối thiểu 30 phút và ghi incident note theo `docs/runbooks/incident-response.md`.

## 6) Pre-release verification checklist

### 6.1 Code quality & test

- [ ] `npm run lint --prefix backend && npm run test --prefix backend`
- [ ] `npm run lint --prefix frontend && npm run test --prefix frontend && npm run build --prefix frontend`

### 6.2 Runtime & deployment config

- [ ] `docker compose -f docker-compose.prod.yml config`
- [ ] Kiểm tra các biến môi trường bắt buộc đã có giá trị hợp lệ (không dùng placeholder).
- [ ] Xác nhận `.env` không nằm trong commit release.

### 6.3 Release decision gate

- [ ] Tất cả mục critical ở trên đều pass.
- [ ] Có phương án rollback rõ và backup mới nhất.
- [ ] Có thời điểm release + người thực thi (solo: chính bạn) + cửa sổ theo dõi sau release.

## 7) Post-release verification checklist

Trong 30-60 phút đầu sau release:

- [ ] Health endpoint ổn định (không flap).
- [ ] Error rate 5xx không tăng bất thường.
- [ ] Không có burst log lỗi DB connection/timeout.
- [ ] Kiểm tra 1-2 luồng nghiệp vụ chính trực tiếp từ UI.
- [ ] Kiểm tra dữ liệu mới ghi vào DB đúng format và đầy đủ.
- [ ] Nếu có issue, quyết định nhanh: hotfix nhỏ có kiểm chứng hoặc rollback ngay.

Sau 24h:

- [ ] Không có regression được báo cáo ở luồng chính.
- [ ] Cập nhật lại checklist/runbook nếu phát hiện lỗ hổng quy trình.
- [ ] Lưu release note ngắn: thay đổi, kết quả verify, sự cố phát sinh (nếu có).
