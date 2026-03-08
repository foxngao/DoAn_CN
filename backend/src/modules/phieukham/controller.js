// CONTROLLER: Ghi nhận phiếu khám bệnh từ bác sĩ
const { v4: uuidv4 } = require("uuid");
const blockchainService = require("../../services/blockchain.service"); // ✅
const db = require("../../models");
const fs = require("fs");
const { ok, fail } = require("../../utils/apiResponse");
// Lấy tất cả phiếu khám (ADMIN hoặc BÁC SĨ)
// Sửa: Đọc từ blockchain
exports.getAll = async (req, res) => {
  try {
    const blocks = await db.HoSoAnChuoiKham.findAll({
      where: { block_type: 'PHIEU_KHAM' },
      order: [["timestamp", "DESC"]]
    });
    
    // Giải mã và parse dữ liệu
    const data = [];
    for (const block of blocks) {
      try {
        const decryptedJson = blockchainService.decryptData(block.data_json);
        const blockData = JSON.parse(decryptedJson);
        data.push({
          ...blockData,
          maHSBA: block.maHSBA,
          ngayKham: block.timestamp 
        });
      } catch (parseErr) {
        console.error(`❌ Lỗi giải mã/parse block ${block.id}:`, parseErr.message);
        // Bỏ qua block lỗi
      }
    }

    return ok(res, {
      message: "Lấy danh sách phiếu khám (từ chuỗi khối)",
      data,
      status: 200,
    });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    return fail(res, { message: "Lỗi lấy phiếu khám", errors: err.message, status: 500 });
  }
};

// === SỬA HÀM NÀY ĐỂ ĐỌC TỪ BLOCKCHAIN ===
exports.getByBacSi = async (req, res) => {
  try {
    const { maBS } = req.params;
    
    // 1. Lấy TẤT CẢ các khối (block) loại PHIEU_KHAM (vì data_json đã mã hóa, không thể tìm kiếm trực tiếp)
    const blocks = await db.HoSoAnChuoiKham.findAll({
      where: {
        block_type: 'PHIEU_KHAM'
      },
      order: [["timestamp", "DESC"]] // Sắp xếp theo timestamp (ngày khám)
    });
    
    // 2. Giải mã và lọc theo maBS
    const data = [];
    for (const block of blocks) {
      try {
        // Giải mã dữ liệu
        const decryptedJson = blockchainService.decryptData(block.data_json);
        const blockData = JSON.parse(decryptedJson);
        
        // Lọc theo maBS
        if (blockData.maBS === maBS) {
          data.push({
            ...blockData, // Gồm maPK, maBN, maBS, trieuChung, chuanDoan...
            maHSBA: block.maHSBA, // Lấy maHSBA từ cột của block
            ngayKham: block.timestamp // Dùng timestamp của block làm ngayKham
          });
        }
      } catch (parseErr) {
        console.error(`❌ Lỗi giải mã/parse block ${block.id}:`, parseErr.message);
        // Bỏ qua block lỗi, tiếp tục với block khác
      }
    }

    return ok(res, {
      message: "Lấy phiếu khám (từ chuỗi khối) theo bác sĩ",
      data,
      status: 200,
    });

  } catch (err) {
    console.error("❌ Lỗi Sequelize (getByBacSi - Blockchain):", err);
    return fail(res, { message: "Lỗi lấy phiếu theo bác sĩ", errors: err.message, status: 500 });
  }
};
// === KẾT THÚC SỬA ===

// === HÀM CREATE (ĐÃ CẬP NHẬT THÊM BẮT LỖI TỪ BLOCKCHAIN SERVICE) ===
exports.create = async (req, res) => {
  let uploadedFilePath = null;
  try {
    console.log("📝 [PhieuKham.create] Bắt đầu tạo phiếu khám:", {
      user: req.user?.maTK,
      body: req.body,
      file: req.file?.filename
    });

    const { maHSBA, maBN, maBS: maBSFromBody, trieuChung, chuanDoan, loiDan } = req.body;

    const maTK_NguoiTao = req.user?.maTK;
    const maNhom = req.user?.maNhom;

    if (!maTK_NguoiTao) {
      if (uploadedFilePath) fs.unlinkSync(uploadedFilePath);
      return fail(res, { message: "Lỗi xác thực: không tìm thấy maTK người dùng.", status: 401 });
    }

    if (maNhom !== "BACSI") {
      if (uploadedFilePath) fs.unlinkSync(uploadedFilePath);
      return fail(res, { message: "Bạn không có quyền tạo phiếu khám.", status: 403 });
    }

    let maBS_XacThuc = req.bacSi?.maBS || null;
    if (!maBS_XacThuc) {
      const bacSi = await db.BacSi.findOne({
        where: { maTK: maTK_NguoiTao },
        attributes: ["maBS"],
      });
      maBS_XacThuc = bacSi?.maBS || null;
    }

    if (!maBS_XacThuc) {
      if (uploadedFilePath) fs.unlinkSync(uploadedFilePath);
      return fail(res, { message: "Bạn không có quyền tạo phiếu khám.", status: 403 });
    }

    if (maBSFromBody && maBSFromBody !== maBS_XacThuc) {
      if (uploadedFilePath) fs.unlinkSync(uploadedFilePath);
      return fail(res, { message: "maBS không hợp lệ với người dùng đăng nhập.", status: 403 });
    }
    
    // Validate dữ liệu đầu vào
    if (!maHSBA || !maBN || !trieuChung || !chuanDoan) {
      console.error("❌ [PhieuKham.create] Thiếu dữ liệu bắt buộc");
      return fail(res, {
        message: "Thiếu thông tin bắt buộc: maHSBA, maBN, trieuChung, chuanDoan",
        status: 422,
      });
    } 
    
    // 1. XỬ LÝ FILE PATH (Nếu Multer đã upload thành công)
    if (req.file) {
      uploadedFilePath = req.file.path; // Đường dẫn vật lý
    }
    const filePathUrl = uploadedFilePath ? `/uploads/${req.file.filename}` : null; // Đường dẫn công khai

    const phieuKhamData = {
      maPK: uuidv4().slice(0, 8).toUpperCase(), 
      maBN,
      maBS: maBS_XacThuc,
      trieuChung,
      chuanDoan,
      loiDan,
      trangThai: req.body.trangThai || 'DA_KHAM',
      file: filePathUrl, // <-- LƯU PATH URL
    };

    console.log("🔗 [PhieuKham.create] Đang thêm block vào blockchain...");
    const newBlock = await blockchainService.addBlock(maHSBA, 'PHIEU_KHAM', phieuKhamData, maTK_NguoiTao);
    
    console.log("✅ [PhieuKham.create] Tạo phiếu khám thành công:", {
      maPK: phieuKhamData.maPK,
      blockId: newBlock?.id,
      maHSBA
    });

    return ok(res, {
      message: "Tạo phiếu khám (block) thành công",
      data: {
        ...phieuKhamData,
        blockId: newBlock?.id,
        timestamp: newBlock?.timestamp,
      },
      status: 201,
    });
  
  } catch (err) {
    console.error("❌ Lỗi tạo khối phiếu khám:", err);
    
    // Xóa file nếu có lỗi DB
    if (uploadedFilePath) fs.unlinkSync(uploadedFilePath);
    
    const friendlyError = err.message.includes("Private Key") 
        ? "Lỗi bảo mật: Tài khoản Bác sĩ chưa có khóa riêng tư (Private Key) để ký khối. Vui lòng kiểm tra lại quá trình tạo tài khoản."
        : err.message.includes("Không thể ký")
            ? "Lỗi ký khối: Không thể thực hiện chữ ký số. Vui lòng kiểm tra trạng thái tài khoản."
            : err.message;

    return fail(res, { message: "Lỗi tạo phiếu khám", errors: friendlyError, status: 500 });
  }
};

// === CÁC HÀM CHẶN SỬA/XÓA (ĐÃ ĐÚNG) ===
exports.update = async (req, res) => {
  return fail(res, {
    message: "Hành vi bị cấm!",
    errors: "Không thể SỬA (UPDATE) một khối đã có trên Blockchain. Hãy tạo một phiếu đính chính mới.",
    status: 403,
  });
};

exports.remove = async (req, res) => {
  return fail(res, {
    message: "Hành vi bị cấm!",
    errors: "Không thể XÓA (DELETE) một khối đã có trên Blockchain. Dữ liệu là bất biến.",
    status: 403,
  });
};

// === HÀM LẤY CHI TIẾT (SỬA ĐỂ ĐỌC TỪ BLOCK) ===
exports.getByPK = async (req, res) => {
  try {
    const { maPK } = req.params;
    // Lấy tất cả block PHIEU_KHAM và tìm theo maPK sau khi giải mã
    const blocks = await db.HoSoAnChuoiKham.findAll({ 
      where: {
        block_type: 'PHIEU_KHAM'
      }
    });

    for (const block of blocks) {
      try {
        const decryptedJson = blockchainService.decryptData(block.data_json);
        const blockData = JSON.parse(decryptedJson);
        if (blockData.maPK === maPK) {
          return ok(res, { message: "Thông tin phiếu khám", data: blockData, status: 200 });
        }
      } catch (parseErr) {
        console.error(`❌ Lỗi giải mã/parse block ${block.id}:`, parseErr.message);
      }
    }

    return fail(res, { message: "Không tìm thấy phiếu khám trong chuỗi", status: 404 });
  } catch (err) {
    console.error("❌ Lỗi getByPK:", err);
    return fail(res, { message: "Lỗi server", errors: err.message, status: 500 });
  }
};

// Hàm này có thể giữ nguyên
exports.getByMonth = async (req, res) => {
  const dot = req.params.dotKhamBenh; 
  try {
    const result = await db.HoSoAnChuoiKham.findAll({ // Sửa: Đọc từ HoSoAnChuoiKham
      where: {
        block_type: 'PHIEU_KHAM',
        timestamp: { // Sửa: Lọc theo timestamp
          [db.Sequelize.Op.startsWith]: dot
        }
      }
    });
    return ok(res, { message: "Lấy phiếu khám theo tháng thành công", data: result, status: 200 });
  } catch (err) {
    return fail(res, { message: "Lỗi truy xuất phiếu khám", errors: err.message, status: 500 });
  }
};
