const express = require("express");
const router = express.Router();
const controller = require("./controller");
const verifyToken = require("../../middleware/auth");
const checkUyQuyen = require("../../middleware/checkUyQuyen");

router.get("/", controller.getAll);
// Cho phép bác sĩ thực tập có quyền ủy quyền được gửi yêu cầu xét nghiệm
router.post("/", verifyToken, checkUyQuyen("GUI_YEU_CAU_XET_NGHIEM"), controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;