// ROUTES: Định tuyến API cho phiếu khám của bác sĩ
const express = require("express");
const router = express.Router();
const controller = require("./controller");

// === BẮT ĐẦU SỬA LỖI ===
// 1. Import middleware
const verifyToken = require("../../middleware/auth");
const checkRole = require("../../middleware/checkRole");
const checkCapBac = require("../../middleware/checkCapBac");
const checkUyQuyen = require("../../middleware/checkUyQuyen");
const upload = require("../../middleware/upload");

// 2. Áp dụng middleware cho các route
// Bất kỳ ai đã đăng nhập (Admin, Bác sĩ, Nhân viên) đều có thể xem
router.get("/", verifyToken, controller.getAll);                     
router.get("/bacsi/:maBS", verifyToken, controller.getByBacSi);      

// Tạo phiếu khám: Bác sĩ sơ cấp trở lên HOẶC bác sĩ thực tập có quyền ủy quyền
// Bác sĩ thực tập có thể tạo phiếu khám nếu được bác sĩ điều trị cấp quyền
router.post("/", 
  verifyToken, 
  checkRole("BACSI"),
  checkUyQuyen("TAO_PHIEU_KHAM"), // Cho phép bác sĩ thực tập có quyền
  upload, 
  controller.create
);

// Các hàm Sửa/Xóa/Lấy chi tiết (đã bị vô hiệu hóa ở controller)
router.put("/:id", verifyToken, controller.update);
router.delete("/:id", verifyToken, controller.remove);
router.get("/:maPK", verifyToken, controller.getByPK); 
router.get("/by-month/:dotKhamBenh", verifyToken, controller.getByMonth);
// === KẾT THÚC SỬA LỖI ===

module.exports = router;