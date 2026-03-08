# Runbook: Incident Response (Solo-friendly)

## 1) Mục tiêu

- Phát hiện nhanh.
- Cô lập rủi ro sớm.
- Khôi phục dịch vụ tối thiểu.
- Ghi nhận sự cố ngắn gọn, đủ dữ liệu để hậu kiểm.

## 2) Triage nhanh (5-10 phút đầu)

1. Xác nhận phạm vi ảnh hưởng:
   - API nào lỗi?
   - Toàn hệ thống hay 1 module?
2. Kiểm tra tín hiệu chính:
   - HTTP 5xx tăng đột biến
   - timeout tăng
   - DB connection lỗi
3. Chụp lại mốc thời gian bắt đầu (timestamp).
4. Khóa thay đổi mới (tạm dừng deploy/manual changes).

## 3) Severity

- **SEV-1 (Critical)**
  - Hệ thống down hoàn toàn, lỗi bảo mật nghiêm trọng, mất dữ liệu đang diễn ra.
  - Hành động: ưu tiên cô lập ngay, safe mode, rollback nhanh.

- **SEV-2 (High)**
  - Chức năng chính lỗi nặng (đăng nhập, đặt lịch, thanh toán), nhiều user bị ảnh hưởng.
  - Hành động: giới hạn tác động + workaround tạm.

- **SEV-3 (Medium/Low)**
  - Lỗi cục bộ, có workaround, không ảnh hưởng diện rộng.
  - Hành động: theo dõi + fix trong chu kỳ gần nhất.

## 4) Liên hệ và dữ liệu cần thu thập

Với user solo, "liên hệ" là các đầu mối nội bộ tối thiểu:

- Owner dự án (chính bạn)
- Nếu có hạ tầng ngoài: nhà cung cấp VPS/DB managed support

Thu thập tối thiểu:

- Khoảng thời gian sự cố (bắt đầu/kết thúc tạm thời)
- `x-request-id` hoặc request mẫu thất bại
- Log backend liên quan (error + stack)
- Trạng thái DB (kết nối, lock, dung lượng)
- Commit/deploy gần nhất trước sự cố

## 5) Cô lập / Safe mode tối thiểu

1. Bật chế độ giảm tải:
   - Tạm disable job nền không thiết yếu.
   - Tạm khóa endpoint ghi dữ liệu rủi ro cao nếu nghi ngờ corruption.
2. Nếu nghi lỗi deploy mới:
   - Rollback về phiên bản gần nhất ổn định.
3. Nếu nghi DB:
   - Chụp backup hiện trạng trước thao tác sửa chữa.
   - Tránh chạy migration/restore khi chưa xác nhận phạm vi.
4. Nếu nghi bảo mật:
   - Rotate secret có nguy cơ lộ.
   - Thu hẹp quyền truy cập tạm thời.

## 6) Khôi phục dịch vụ

1. Chọn hướng khôi phục nhanh nhất, rủi ro thấp nhất:
   - rollback app
   - restore DB từ backup gần nhất (theo runbook backup/restore)
2. Verify tối thiểu sau khôi phục:
   - health endpoint
   - login
   - 1-2 luồng nghiệp vụ chính
3. Tiếp tục theo dõi log/error-rate ít nhất 30 phút.

## 7) Mẫu ghi nhận sự cố (ngắn gọn)

```md
## Incident Report

- Incident ID: INC-YYYYMMDD-HHMM
- Severity: SEV-1 | SEV-2 | SEV-3
- Start time:
- Detected by:
- Impact summary:

### Timeline
- HH:MM - phát hiện lỗi
- HH:MM - cô lập/safe mode
- HH:MM - rollback/restore
- HH:MM - xác nhận dịch vụ ổn định

### Root cause (initial)
-

### Actions taken
-

### Evidence
- log snippets / request id / dashboard screenshot

### Follow-ups
- [ ] Viết regression test
- [ ] Cập nhật monitor/alert
- [ ] Cập nhật runbook nếu thiếu
```
