/**
 * Middleware kiểm tra quyền ủy quyền cho bác sĩ thực tập
 * Sử dụng: checkUyQuyen(loaiUyQuyen)
 */
const db = require('../models');
const { UyQuyen, BacSi, TaiKhoan } = db;
const { Op } = require('sequelize');

module.exports = (loaiUyQuyen) => {
  return async (req, res, next) => {
    try {
      const maTK = req.user?.maTK;
      
      if (!maTK) {
        return res.status(401).json({ 
          message: "Không tìm thấy thông tin người dùng" 
        });
      }

      // Lấy thông tin bác sĩ
      const bacSi = await BacSi.findOne({ 
        where: { maTK: maTK },
        attributes: ['maBS', 'hoTen', 'capBac']
      });

      if (!bacSi) {
        return res.status(403).json({ 
          message: "Không tìm thấy thông tin bác sĩ" 
        });
      }

      const capBac = bacSi.capBac || 'Bác sĩ điều trị';
      const capBacLevels = {
        "Bác sĩ thực tập": 1,
        "Bác sĩ sơ cấp": 2,
        "Bác sĩ điều trị": 3,
        "Bác sĩ chuyên khoa I": 4,
        "Bác sĩ chuyên khoa II": 5,
      };

      const level = capBacLevels[capBac] || 3;

      // Nếu là bác sĩ điều trị trở lên, không cần kiểm tra quyền
      if (level >= 3) {
        req.bacSi = bacSi;
        return next();
      }

      // Bác sĩ sơ cấp: có thể tự thực hiện một số thao tác
      if (level === 2) {
        req.bacSi = bacSi;
        return next();
      }

      // Nếu là bác sĩ thực tập, kiểm tra quyền ủy quyền
      if (level === 1) {
        // Tìm quyền ủy quyền còn hiệu lực
        const permission = await UyQuyen.findOne({
          where: {
            maNguoiDuocUyQuyen: maTK,
            loaiUyQuyen: loaiUyQuyen,
            thoiGianBatDau: { [Op.lte]: new Date() },
            thoiGianKetThuc: { [Op.gte]: new Date() }
          }
        });

        if (!permission) {
          return res.status(403).json({ 
            message: `Bác sĩ thực tập không có quyền "${loaiUyQuyen}". Bạn cần được bác sĩ điều trị cấp quyền.`,
            requiredPermission: loaiUyQuyen
          });
        }

        // Lấy thông tin bác sĩ ủy quyền
        const bacSiUyQuyen = await BacSi.findOne({ 
          where: { maTK: permission.maNguoiUyQuyen },
          attributes: ['maBS', 'hoTen', 'capBac']
        });

        // Lưu thông tin quyền vào request
        req.uyQuyen = permission;
        req.bacSi = bacSi;
        console.log(`✅ [checkUyQuyen] Bác sĩ thực tập ${bacSi.hoTen} có quyền ${loaiUyQuyen} từ ${bacSiUyQuyen?.hoTen || 'bác sĩ điều trị'}`);
        return next();
      }

      // Bác sĩ sơ cấp: cần quyền hoặc tự thực hiện
      if (level === 2) {
        // Có thể tự thực hiện hoặc cần quyền tùy vào loại quyền
        req.bacSi = bacSi;
        return next();
      }

      return next();
    } catch (error) {
      console.error("❌ Lỗi kiểm tra quyền ủy quyền:", error);
      return res.status(500).json({ 
        message: "Lỗi kiểm tra quyền truy cập", 
        error: error.message 
      });
    }
  };
};

