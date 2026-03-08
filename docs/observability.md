# Observability tối thiểu cho backend

Tài liệu này mô tả cấu hình logging và truy vết request cơ bản để vận hành thực tế.

## 1) Log level theo môi trường

`backend/src/utils/logger.js` hỗ trợ:

- `LOG_LEVEL` (ưu tiên cao nhất)
- fallback theo `NODE_ENV`:
  - `production` → `info`
  - `development` → `debug`
  - `test` → `warn`
  - mặc định cuối cùng → `info`

Ví dụ chạy nhanh:

```bash
LOG_LEVEL=debug npm run start --prefix backend
```

## 2) Transports

Logger có 2 transport:

- `Console` (log runtime trực tiếp cho Docker/systemd/terminal)
- `File` tại `logs/error.log` (chỉ nhận mức `error`)

Mỗi log có timestamp và format dễ đọc.

## 3) Request correlation (`x-request-id`)

Middleware trong `backend/src/app.js`:

- Nhận `x-request-id` từ request nếu client gửi lên.
- Nếu chưa có, server tự sinh id mới.
- Luôn trả lại header `x-request-id` trong response.
- Ghi log request completion với `requestId` để trace.

Các trường log tối thiểu cho HTTP request:

- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`
- `timestamp` (trong format logger)
- `level`

## 4) Truy vết theo request id

Khi cần debug một request cụ thể:

1. Lấy `x-request-id` từ response header phía client/API gateway.
2. Tìm các dòng log có `requestId` tương ứng.
3. Ghép chuỗi sự kiện theo timestamp để xác định lỗi/độ trễ.

## 5) Nguyên tắc không log dữ liệu nhạy cảm

Logger đã áp dụng mask `[REDACTED]` cho các key nhạy cảm phổ biến như:

- token / access_token / refresh_token
- authorization / cookie / set-cookie
- secret / password / private_key
- email / phone

Khi thêm log mới, chỉ log metadata cần thiết cho vận hành; tránh log payload chứa PII hoặc secret.
