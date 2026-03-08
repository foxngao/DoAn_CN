const db = require("../../models");
const { v4: uuidv4 } = require("uuid");
const blockchainService = require("../../services/blockchain.service"); // ✅ Import
const { ok, fail } = require("../../utils/apiResponse");
const BenhNhan = db.BenhNhan;
const BacSi = db.BacSi;
const YeuCauXetNghiem = db.YeuCauXetNghiem; // Vẫn dùng để đọc

// Lấy tất cả (Vẫn đọc từ bảng cũ vì NSYT cần xem)
exports.getAll = async (req, res) => {
  try {
    const result = await YeuCauXetNghiem.findAll({
      include: [{ model: BenhNhan }, { model: BacSi }],
      order: [["ngayYeuCau", "DESC"]],
    });
    return ok(res, {
      message: "Lấy danh sách yêu cầu xét nghiệm thành công",
      data: result,
    });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    return fail(res, {
      status: 500,
      message: "Lỗi truy xuất dữ liệu",
      errors: [{ code: "XN_LIST_ERROR", detail: err.message }],
    });
  }
};

// === SỬA HÀM CREATE (Ghi vào Blockchain) ===
exports.create = async (req, res) => {
  try {
    const { maBN, loaiYeuCau, trangThai } = req.body;
    
    // <--- BẮT ĐẦU SỬA --->
    // 1. Lấy maTK (chính là maBS) từ token đã xác thực
    const maTK_NguoiTao = req.user.maTK;
    if (!maTK_NguoiTao) {
      return fail(res, {
        status: 401,
        message: "Lỗi xác thực: không tìm thấy maTK người dùng.",
      });
    }
    // <--- KẾT THÚC SỬA --->

    // 1. Tìm maHSBA (lấy cái mới nhất)
     const hoSo = await db.HoSoBenhAn.findOne({ 
      where: { maBN },
      order: [['ngayLap', 'DESC']]
    });

    if (!hoSo) {
      return fail(res, {
        status: 404,
        message: "Không tìm thấy Hồ sơ bệnh án cho bệnh nhân này",
      });
    }
    const maHSBA = hoSo.maHSBA;

    // 2. Tạo dữ liệu khối
    const yeuCauData = {
      maYeuCau: uuidv4().slice(0, 8).toUpperCase(),
      maBN: maBN,
      maBS: maTK_NguoiTao, // <--- SỬA: Dùng maTK từ token thay vì req.body
      loaiYeuCau: loaiYeuCau,
      trangThai: trangThai || 'CHO_THUC_HIEN'
    };

    // 3. Thêm vào chuỗi khối
    await blockchainService.addBlock(
      maHSBA,
      'YEU_CAU_XET_NGHIEM', // Loại khối
      yeuCauData,
      maTK_NguoiTao // <--- THÊM: Truyền maTK người tạo để ký
    );
    
    // 4. (Tùy chọn) Vẫn tạo ở bảng cũ để NSYT thấy
    await YeuCauXetNghiem.create(yeuCauData);

    return ok(res, {
      status: 201,
      message: "Tạo yêu cầu xét nghiệm (block) thành công",
      data: yeuCauData,
    });
  } catch (err) {
    console.error("❌ Lỗi Sequelize:", err);
    return fail(res, {
      status: 500,
      message: "Lỗi tạo yêu cầu",
      errors: [{ code: "XN_CREATE_ERROR", detail: err.message }],
    });
  }
};

// === CHẶN UPDATE / REMOVE ===
exports.update = async (req, res) => {
  // Ngoại lệ: Cho phép NSYT cập nhật trạng thái ở bảng CŨ
  try {
    const { trangThai } = req.body;
    const [updated] = await YeuCauXetNghiem.update({ trangThai }, {
      where: { maYeuCau: req.params.id }
    });
    if (!updated) {
      return fail(res, {
        status: 404,
        message: "Không tìm thấy yêu cầu",
      });
    }
    return ok(res, { message: "Đã cập nhật trạng thái (bảng YeuCau)" });
  } catch (err) {
    return fail(res, {
      status: 500,
      message: "Lỗi cập nhật",
      errors: [{ code: "XN_UPDATE_ERROR", detail: err.message }],
    });
  }
};

exports.remove = async (req, res) => {
  return fail(res, {
    status: 403,
    message: "Hành vi bị cấm!",
    errors: [
      {
        code: "XN_DELETE_FORBIDDEN",
        detail: "Không thể XÓA (DELETE) một yêu cầu đã có trên Blockchain.",
      },
    ],
  });
};
