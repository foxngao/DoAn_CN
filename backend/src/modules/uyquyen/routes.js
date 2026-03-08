const express = require("express");
const router = express.Router();
const controller = require("./controller");
const verifyToken = require("../../middleware/auth");

// Lấy danh sách quyền đã cấp (bác sĩ điều trị)
router.get("/nguoiuyquyen/:maTK", verifyToken, controller.getByNguoiUyQuyen);

// Lấy danh sách quyền đã nhận (bác sĩ thực tập)
router.get("/nguoiduocuyquyen/:maTK", verifyToken, controller.getByNguoiDuocUyQuyen);

// Cấp quyền
router.post("/", verifyToken, controller.create);

// Thu hồi quyền
router.delete("/:id", verifyToken, controller.remove);

module.exports = router;

