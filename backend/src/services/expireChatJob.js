const { Op } = require("sequelize");
const db = require("../models");
const { ChatRooms } = db;

/**
 * Job tự động ngưng chat sau 15 phút
 * Chạy mỗi 1 phút để kiểm tra và cập nhật trạng thái
 */
const expireChatSessions = async () => {
  try {
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000);

    // Bulk update: chỉ đụng các phòng ACTIVE đã hết hạn
    const [expiredCount] = await ChatRooms.update(
      { trangThai: "EXPIRED" },
      {
        where: {
          trangThai: "ACTIVE",
          thoiGianBatDauChat: {
            [Op.lte]: cutoffTime,
          },
        },
      }
    );

    if (expiredCount > 0) {
      console.log(`✅ Đã ngưng ${expiredCount} cuộc chat hết hạn`);
    }
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra chat hết hạn:", error);
  }
};

const startExpireChatJob = () => {
  console.log("✅ Đã khởi động job ngưng chat hết hạn (chạy mỗi 1 phút)");
  expireChatSessions(); // Chạy ngay lần đầu
  setInterval(expireChatSessions, 60 * 1000); // Chạy mỗi 1 phút
};

module.exports = { startExpireChatJob, expireChatSessions };

