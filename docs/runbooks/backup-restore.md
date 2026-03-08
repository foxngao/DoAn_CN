# Runbook: Backup/Restore Database

Tài liệu này ưu tiên user solo, thao tác nhanh, ít rủi ro.

## 1) Chuẩn bị

- Có Node.js và CLI MySQL (`mysqldump`, `mysql`) trên máy local.
- Điền biến môi trường DB:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`

Ví dụ local (PowerShell):

```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_USER="hospital_app"
$env:DB_PASSWORD="***"
$env:DB_NAME="Hospital5"
```

## 2) Backup (local)

Dry-run để kiểm tra kế hoạch:

```bash
node scripts/db-backup.js --dry-run
```

Thực thi backup:

```bash
node scripts/db-backup.js --output ./backups/backup-$(date +%Y%m%d-%H%M%S).sql
```

Nếu không truyền `--output`, script tự tạo file trong thư mục `./backups`.

## 3) Backup (docker option)

Nếu app chạy bằng docker-compose và DB ở service `mysql`:

1. Lấy env DB giống container.
2. Chạy script từ host (vẫn dùng biến env trỏ vào container MySQL):

```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
node scripts/db-backup.js --dry-run
node scripts/db-backup.js
```

Nếu port DB không publish ra host, dùng cách backup bằng container mysql trực tiếp (ngoài scope script) rồi copy file ra host.

## 4) Restore (local)

Dry-run:

```bash
node scripts/db-restore.js --dry-run --file ./backup.sql
```

Thực thi restore (bắt buộc xác nhận bằng `--yes`):

```bash
node scripts/db-restore.js --file ./backup.sql --yes
```

## 5) Restore (docker option)

- Đảm bảo DB target đúng container/môi trường.
- Export biến env trỏ đúng DB trước khi chạy script.
- Luôn chạy dry-run trước, sau đó mới chạy `--yes`.

## 6) Checklist trước restore

- [ ] Xác nhận môi trường đích (dev/staging/prod).
- [ ] Xác nhận `DB_NAME` đích đúng và đã được team/user đồng ý.
- [ ] Có backup mới nhất trước khi restore.
- [ ] Kiểm tra file restore đúng phiên bản/cỡ file không bất thường.
- [ ] Tạm dừng ghi dữ liệu mới vào hệ thống (nếu có thể).
- [ ] Đã chạy dry-run thành công.

## 7) Checklist sau restore

- [ ] Kiểm tra kết nối DB và các bảng chính tồn tại.
- [ ] Chạy smoke test API chính (login, danh sách bệnh nhân, lịch khám).
- [ ] Kiểm tra số lượng bản ghi quan trọng không lệch bất thường.
- [ ] Kiểm tra log backend không có lỗi SQL bất thường.
- [ ] Ghi lại thời điểm restore + file đã dùng.

## 8) Rollback notes

- Không có rollback "1 click" cho restore nhầm.
- Cách rollback an toàn nhất:
  1. Dừng ghi dữ liệu mới.
  2. Dùng backup trước thời điểm sự cố để restore lại.
  3. Re-run smoke tests và xác nhận user flow chính.
- Luôn giữ ít nhất 2 bản backup gần nhất (N và N-1) để giảm downtime khi bản gần nhất lỗi.
