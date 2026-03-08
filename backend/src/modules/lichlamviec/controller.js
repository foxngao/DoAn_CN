const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const { LichLamViec } = require("./model");
const db = require("../../models");
const { LichKham, NhanSuYTe } = db;
const { CaKham } = require("../catruc/model");

// ✅ Lấy toàn bộ lịch làm việc (ADMIN/YTA) - Include thông tin bác sĩ
exports.getAll = async (req, res) => {
  try {
    const { BacSi, CaKham, NhanSuYTe } = db;
    const data = await LichLamViec.findAll({ 
      include: [
        { model: BacSi, attributes: ["maBS", "hoTen", "capBac", "chuyenMon"] },
        { model: CaKham, attributes: ["maCa", "tenCa", "thoiGianBatDau", "thoiGianKetThuc"] },
        { model: NhanSuYTe, attributes: ["maNS", "hoTen"] }
      ],
      order: [["ngayLamViec", "ASC"], ["maCa", "ASC"]] 
    });
    res.json({ message: "Lấy toàn bộ lịch làm việc", data });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    res.status(500).json({ message: "Lỗi lấy lịch làm việc", error: err.message });
  }
};

// ✅ Lấy lịch làm việc theo mã nhân sự
exports.getByNhanSu = async (req, res) => {
  try {
    const { maNS } = req.params;
    const data = await LichLamViec.findAll({
      where: { maNS },
      order: [["ngayLamViec", "DESC"]],
    });
    res.json({ message: "Lấy lịch làm việc theo nhân sự", data });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    res.status(500).json({ message: "Lỗi lấy lịch nhân sự", error: err.message });
  }
};

// ✅ Lấy lịch làm việc theo mã bác sĩ
exports.getByBacSi = async (req, res) => {
  try {
    const { maBS } = req.params;
    const data = await LichLamViec.findAll({
      where: { maBS },
      order: [["ngayLamViec", "DESC"]],
    });
    res.json({ message: "Lấy lịch làm việc theo bác sĩ", data });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    res.status(500).json({ message: "Lỗi lấy lịch bác sĩ", error: err.message });
  }
};

// ✅ Tạo mới lịch làm việc - Hỗ trợ tạo theo tuần
exports.create = async (req, res) => {
  try {
    const { maNS, maCa, ngayLamViec, maBS, createForWeek } = req.body;

    // Lấy nhân viên mặc định nếu không có maNS
    let finalMaNS = maNS && maNS !== 'undefined' && maNS !== '' ? maNS : null;
    if (!finalMaNS) {
      // Lấy nhân viên đầu tiên trong database làm mặc định
      const defaultNS = await NhanSuYTe.findOne({ limit: 1 });
      if (!defaultNS) {
        return res.status(400).json({ 
          message: "Không tìm thấy nhân viên mặc định. Vui lòng chọn nhân viên phụ trách." 
        });
      }
      finalMaNS = defaultNS.maNS;
    }

    // Đảm bảo maBS không null (bắt buộc)
    if (!maBS || maBS === 'undefined') {
      return res.status(400).json({ message: "Mã bác sĩ là bắt buộc" });
    }

    // Nếu createForWeek = true, tạo lịch cho cả tuần (7 ngày)
    if (createForWeek && ngayLamViec) {
      const startDate = new Date(ngayLamViec);
      const createdSchedules = [];

      // Tạo lịch cho 7 ngày trong tuần
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Kiểm tra xem đã có lịch cho ngày này chưa
        const existing = await LichLamViec.findOne({
          where: {
            maBS,
            maCa,
            ngayLamViec: dateStr
          }
        });

        if (!existing) {
          const maLichLV = uuidv4().slice(0, 8).toUpperCase();
          const newData = await LichLamViec.create({
            maLichLV,
            maCa,
            ngayLamViec: dateStr,
            maNS: finalMaNS,
            maBS: maBS
          });
          createdSchedules.push(newData);
        }
      }

      return res.status(201).json({ 
        message: `Tạo lịch làm việc cho tuần thành công (${createdSchedules.length} ngày)`, 
        data: createdSchedules 
      });
    }

    // Tạo lịch cho 1 ngày (logic cũ)
    const maLichLV = uuidv4().slice(0, 8).toUpperCase();

    // Kiểm tra xem đã có lịch cho ngày này chưa
    const existing = await LichLamViec.findOne({
      where: {
        maBS,
        maCa,
        ngayLamViec
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Đã có lịch làm việc cho ca này vào ngày này" });
    }

    const newData = await LichLamViec.create({
      maLichLV,
      maCa,
      ngayLamViec,
      maNS: finalMaNS,
      maBS: maBS
    });

    res.status(201).json({ message: "Tạo lịch làm việc thành công", data: newData });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    res.status(500).json({ message: "Lỗi tạo lịch làm việc", error: err.message });
  }
};

// ✅ Cập nhật lịch làm việc (Fix lỗi FK maBS undefined)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { maCa, ngayLamViec, maNS, maBS } = req.body;

    // Lấy nhân viên mặc định nếu không có maNS
    let finalMaNS = maNS && maNS !== 'undefined' && maNS !== '' ? maNS : null;
    if (!finalMaNS) {
      const defaultNS = await NhanSuYTe.findOne({ limit: 1 });
      if (!defaultNS) {
        return res.status(400).json({ 
          message: "Không tìm thấy nhân viên mặc định. Vui lòng chọn nhân viên phụ trách." 
        });
      }
      finalMaNS = defaultNS.maNS;
    }

    const [updated] = await LichLamViec.update(
      {
        maCa,
        ngayLamViec,
        maNS: finalMaNS,
        maBS: maBS && maBS !== 'undefined' ? maBS : null
      },
      { where: { maLichLV: id } }
    );

    if (!updated) return res.status(404).json({ message: "Không tìm thấy lịch để cập nhật" });

    res.json({ message: "Cập nhật lịch làm việc thành công" });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    res.status(500).json({ message: "Lỗi cập nhật lịch làm việc", error: err.message });
  }
};

// ✅ Xoá lịch làm việc
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LichLamViec.destroy({ where: { maLichLV: id } });

    if (!deleted) return res.status(404).json({ message: "Không tìm thấy lịch để xoá" });

    res.json({ message: "Xoá lịch làm việc thành công" });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    res.status(500).json({ message: "Lỗi xoá lịch làm việc", error: err.message });
  }
};

// ✅ Lấy số lượng bệnh nhân đã đặt trong mỗi ca (để kiểm tra giới hạn 10 người)
exports.getSoLuongBenhNhan = async (req, res) => {
  try {
    const { maBS, maCa, ngayLamViec } = req.query;

    if (!maBS || !maCa || !ngayLamViec) {
      return res.status(400).json({ message: "Thiếu thông tin: maBS, maCa, ngayLamViec" });
    }

    // Lấy thông tin ca khám
    const caKham = await CaKham.findByPk(maCa);
    if (!caKham) {
      return res.status(404).json({ message: "Không tìm thấy ca khám" });
    }

    // Tính khoảng thời gian của ca
    const [startHour, startMinute] = (caKham.thoiGianBatDau || "07:00").split(":").map(Number);
    const [endHour, endMinute] = (caKham.thoiGianKetThuc || "11:00").split(":").map(Number);
    const startTimeStr = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
    const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;

    // Đếm số lượng lịch khám đã có trong ca này
    const count = await LichKham.count({
      where: {
        maBS,
        ngayKham: ngayLamViec,
        gioKham: {
          [Op.between]: [startTimeStr, endTimeStr]
        },
        trangThai: {
          [Op.notIn]: ['DA_HUY'] // Không tính các lịch đã hủy
        }
      }
    });

    res.json({ 
      message: "Lấy số lượng bệnh nhân thành công", 
      data: { 
        soLuong: count,
        toiDa: 10,
        conLai: Math.max(0, 10 - count)
      } 
    });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    res.status(500).json({ message: "Lỗi lấy số lượng bệnh nhân", error: err.message });
  }
};
