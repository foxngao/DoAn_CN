const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const db = require("../../models");
const { UyQuyen, BacSi, TaiKhoan } = db;

// ✅ Lấy danh sách quyền đã cấp (bác sĩ điều trị xem quyền đã cấp)
exports.getByNguoiUyQuyen = async (req, res) => {
  try {
    const { maTK } = req.params; // maTK của bác sĩ điều trị
    const data = await UyQuyen.findAll({
      where: { maNguoiUyQuyen: maTK },
      order: [["thoiGianBatDau", "DESC"]]
    });

    // Lấy thông tin bác sĩ cho mỗi quyền
    const dataWithBacSi = await Promise.all(
      data.map(async (quyen) => {
        const taiKhoan = await TaiKhoan.findByPk(quyen.maNguoiDuocUyQuyen);
        const bacSi = taiKhoan ? await BacSi.findOne({ where: { maTK: taiKhoan.maTK } }) : null;
        return {
          ...quyen.toJSON(),
          NguoiDuocUyQuyen: {
            ...taiKhoan?.toJSON(),
            BacSi: bacSi?.toJSON()
          }
        };
      })
    );

    res.json({ message: "Lấy danh sách quyền đã cấp", data: dataWithBacSi });
  } catch (err) {
    console.error("❌ Lỗi:", err);
    res.status(500).json({ message: "Lỗi lấy danh sách quyền", error: err.message });
  }
};

// ✅ Lấy danh sách quyền đã nhận (bác sĩ thực tập xem quyền đã nhận)
exports.getByNguoiDuocUyQuyen = async (req, res) => {
  try {
    const { maTK } = req.params; // maTK của bác sĩ thực tập
    const data = await UyQuyen.findAll({
      where: { maNguoiDuocUyQuyen: maTK },
      order: [["thoiGianBatDau", "DESC"]]
    });

    // Lấy thông tin bác sĩ cho mỗi quyền
    const dataWithBacSi = await Promise.all(
      data.map(async (quyen) => {
        const taiKhoan = await TaiKhoan.findByPk(quyen.maNguoiUyQuyen);
        const bacSi = taiKhoan ? await BacSi.findOne({ where: { maTK: taiKhoan.maTK } }) : null;
        return {
          ...quyen.toJSON(),
          NguoiUyQuyen: {
            ...taiKhoan?.toJSON(),
            BacSi: bacSi?.toJSON()
          }
        };
      })
    );

    res.json({ message: "Lấy danh sách quyền đã nhận", data: dataWithBacSi });
  } catch (err) {
    console.error("❌ Lỗi:", err);
    res.status(500).json({ message: "Lỗi lấy danh sách quyền", error: err.message });
  }
};

// ✅ Cấp quyền cho bác sĩ thực tập
exports.create = async (req, res) => {
  try {
    const { maNguoiUyQuyen, maNguoiDuocUyQuyen, loaiUyQuyen, thoiGianBatDau, thoiGianKetThuc, moTa } = req.body;

    // Kiểm tra bác sĩ điều trị có đủ quyền không (phải là bác sĩ điều trị trở lên)
    const bacSiUyQuyen = await BacSi.findOne({ where: { maTK: maNguoiUyQuyen } });
    if (!bacSiUyQuyen) {
      return res.status(404).json({ message: "Không tìm thấy bác sĩ ủy quyền" });
    }

    const capBacLevels = {
      "Bác sĩ thực tập": 1,
      "Bác sĩ sơ cấp": 2,
      "Bác sĩ điều trị": 3,
      "Bác sĩ chuyên khoa I": 4,
      "Bác sĩ chuyên khoa II": 5,
    };

    const capBac = bacSiUyQuyen.capBac || "Bác sĩ điều trị";
    const level = capBacLevels[capBac] || 3;

    if (level < 3) {
      return res.status(403).json({ 
        message: `Cấp bậc "${capBac}" không có quyền cấp quyền cho bác sĩ khác. Yêu cầu: Bác sĩ điều trị trở lên` 
      });
    }

    // Kiểm tra bác sĩ nhận quyền có phải thực tập không
    const bacSiNhanQuyen = await BacSi.findOne({ where: { maTK: maNguoiDuocUyQuyen } });
    if (!bacSiNhanQuyen) {
      return res.status(404).json({ message: "Không tìm thấy bác sĩ nhận quyền" });
    }

    // Kiểm tra đã có quyền chưa (chưa hết hạn)
    const existing = await UyQuyen.findOne({
      where: {
        maNguoiUyQuyen,
        maNguoiDuocUyQuyen,
        loaiUyQuyen,
        [Op.and]: [
          { thoiGianBatDau: { [Op.lte]: new Date() } },
          { thoiGianKetThuc: { [Op.gte]: new Date() } }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Đã cấp quyền này cho bác sĩ này rồi" });
    }

    const maUyQuyen = uuidv4().slice(0, 8).toUpperCase();
    const newData = await UyQuyen.create({
      maUyQuyen,
      maNguoiUyQuyen,
      maNguoiDuocUyQuyen,
      loaiUyQuyen: loaiUyQuyen || "XEM_LICH_LAM_VIEC",
      thoiGianBatDau: thoiGianBatDau || new Date(),
      thoiGianKetThuc: thoiGianKetThuc || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Mặc định 30 ngày
      moTa: moTa || "Quyền xem và hỗ trợ lịch làm việc"
    });

    res.status(201).json({ message: "Cấp quyền thành công", data: newData });
  } catch (err) {
    console.error("❌ Lỗi:", err);
    res.status(500).json({ message: "Lỗi cấp quyền", error: err.message });
  }
};

// ✅ Thu hồi quyền
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UyQuyen.destroy({ where: { maUyQuyen: id } });

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy quyền để xóa" });
    }

    res.json({ message: "Thu hồi quyền thành công" });
  } catch (err) {
    console.error("❌ Lỗi:", err);
    res.status(500).json({ message: "Lỗi thu hồi quyền", error: err.message });
  }
};

// ✅ Kiểm tra quyền (dùng cho middleware)
exports.checkPermission = async (maNguoiUyQuyen, maNguoiDuocUyQuyen, loaiUyQuyen) => {
  try {
    const permission = await UyQuyen.findOne({
      where: {
        maNguoiUyQuyen,
        maNguoiDuocUyQuyen,
        loaiUyQuyen,
        thoiGianBatDau: { [Op.lte]: new Date() },
        thoiGianKetThuc: { [Op.gte]: new Date() }
      }
    });
    return !!permission;
  } catch (err) {
    console.error("❌ Lỗi kiểm tra quyền:", err);
    return false;
  }
};

