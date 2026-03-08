// ROUTES: Định tuyến đơn thuốc và chi tiết đơn thuốc
const express = require("express");
const router = express.Router();
const controller = require("./controller");
const verifyToken = require("../../middleware/auth");
const checkRole = require("../../middleware/checkRole");
const checkCapBac = require("../../middleware/checkCapBac");
const upload = require("../../middleware/upload");

router.get("/", controller.getAll);

// Kê đơn thuốc: Chỉ Bác sĩ sơ cấp trở lên (KHÔNG cho Bác sĩ thực tập)
// Bác sĩ thực tập KHÔNG được kê đơn thuốc, kể cả có quyền ủy quyền
router.post("/", 
  verifyToken,
  checkRole("BACSI"),
  checkCapBac(
    "Bác sĩ sơ cấp",
    "Bác sĩ điều trị",
    "Bác sĩ chuyên khoa I",
    "Bác sĩ chuyên khoa II",
    "Thạc sĩ – Bác sĩ",
    "Tiến sĩ – Bác sĩ",
    "Phó giáo sư – Bác sĩ",
    "Giáo sư – Bác sĩ"
  ),
  upload,
  controller.create
);

// Xóa các route không còn dùng
// router.post("/chitiet", controller.addChiTiet);
// router.get("/chitiet/:maDT", controller.getChiTiet);

// donthuoc.js
router.get("/by-month/:dotKhamBenh", controller.getByMonth);


module.exports = router;