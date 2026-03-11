const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
// ✅ 1. IMPORT BLOCKCHAIN SERVICE
const blockchainService = require("../../services/blockchain.service");

const {
  TaiKhoan,
  BacSi,
  NhanSuYTe,
  BenhNhan,
  KhoaPhong,
  HoSoBenhAn,
  LichKham,
  YeuCauXetNghiem,
  HoaDon,
  GioHang,
  PhanHoi,
  PhieuXetNghiem,
  LichLamViec,
  PhieuKham,
  DonThuoc,
  TinTuc,
  TroLyBacSi,
  ChiTietDonThuoc,
  ChiTietHoaDon,
  ChiTietGioHang,
  // ✅ 2. IMPORT BẢNG BLOCKCHAIN (để dùng trong hàm Xóa)
  HoSoAnChuoiKham 
} = require("../../models");

function generateBlockchainKeyPair() {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "spki",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
        },
      },
      (error, publicKey, privateKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({ publicKey, privateKey });
      }
    );
  });
}

exports.generateBlockchainKeyPair = generateBlockchainKeyPair;

// Tạo mới tài khoản
exports.register = async (req, res) => {
  
  let {
    tenDangNhap,
    matKhau,
    email,
    maNhom,
    maKhoa,
    hoTen,
    chucVu,
    trinhDo,
    chuyenMon,
    loaiNS,
    capBac,
    ngaySinh,
    gioiTinh,
    diaChi,
    soDienThoai,
    bhyt
  } = req.body;

  maNhom = maNhom.toUpperCase().trim();
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
  if (!passwordRegex.test(matKhau)) {
    return res.status(400).json({ 
      success: false,
      message: "Mật khẩu YẾU: Phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số." 
    });
  }

  try {
    const existed = await TaiKhoan.findOne({ where: { tenDangNhap } });
    if (existed)
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });

    const hashed = await bcrypt.hash(matKhau, 10);
    const maTK = uuidv4().slice(0, 8).toUpperCase(); 
    const { publicKey, privateKey } = await generateBlockchainKeyPair();
    const newTK = await TaiKhoan.create({
      maTK,
      tenDangNhap,
      matKhau: hashed,
      email,
      maNhom,
      trangThai: true,
      publicKey: publicKey, // <--- LƯU KEY
      privateKey: privateKey // <--- LƯU KEY (Cảnh báo bảo mật!)
    });

    if (maNhom === "BACSI") {
      await BacSi.create({ maBS: maTK, maTK, hoTen, chucVu, trinhDo, chuyenMon, maKhoa });
    } else if (maNhom === "NHANSU") {
      await NhanSuYTe.create({ maNS: maTK, maTK, hoTen, loaiNS, capBac, chuyenMon, maKhoa });
    } else if (maNhom === "BENHNHAN") {
      
      // === BẮT ĐẦU SỬA LỖI ===
      const ngaySinhDate = new Date(ngaySinh);
      if (isNaN(ngaySinhDate.getTime())) {
        // Nếu ngày sinh không hợp lệ, trả về lỗi
        return res.status(400).json({ message: "Ngày sinh không hợp lệ. Vui lòng kiểm tra lại." });
      }
      
      await BenhNhan.create({ 
        maBN: maTK, 
        maTK, 
        hoTen, 
        ngaySinh: ngaySinhDate, // <--- Dùng biến đã xử lý
        gioiTinh, 
        diaChi, 
        soDienThoai, 
        bhyt 
      });

      // Tạo Hồ sơ bệnh án
      const hoso = await HoSoBenhAn.create({
        maHSBA: maTK, // Dùng maTK làm maHSBA
        maBN: maTK,   // Dùng maTK làm maBN
        ngayLap: new Date(),
        dotKhamBenh: new Date(), 
        lichSuBenh: null, // Sửa 1: Đặt là null (vì form admin không có)
        ghiChu: null      // Sửa 1: Đặt là null
      });
      
      // ✅ 3. TẠO KHỐI KHỞI TẠO (GENESIS BLOCK)
      const genesisData = { 
          maBN: maTK, 
          ngayLap: hoso.ngayLap, 
          hoTen: hoTen,
          lichSuBenh: null, // Sửa 2: Đặt là null
          ghiChu: null      // Sửa 2: Đặt là null
      };
      
      // Sửa 3: Thêm maTK (của chính bệnh nhân) làm người ký cho khối khởi tạo
      await blockchainService.addBlock(hoso.maHSBA, 'TAO_MOI', genesisData, maTK);
      // === KẾT THÚC SỬA LỖI ===

    }

    res.status(201).json({ message: "Tạo tài khoản thành công", data: newTK });
  } catch (error) {
    console.error("❌ Lỗi tạo tài khoản:", error.errors?.[0]?.message || error.message);
    res.status(500).json({
      message: "Lỗi tạo tài khoản",
      error: error.errors?.[0]?.message || error.message
    });
  }
};

// Cập nhật tài khoản
exports.update = async (req, res) => {
  try {
    const maTK = req.params.id;
    const {
      tenDangNhap, email, maNhom, trangThai,
      maKhoa, chucVu, trinhDo, chuyenMon, loaiNS, capBac,
      hoTen, ngaySinh, gioiTinh, diaChi, soDienThoai, bhyt
    } = req.body;

    const tk = await TaiKhoan.findOne({ where: { maTK } });
    if (!tk) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

    await TaiKhoan.update({ tenDangNhap, email, maNhom, trangThai }, { where: { maTK } });

    if (maNhom === "BACSI") {
      await BacSi.update({ maKhoa, hoTen, chucVu, trinhDo, chuyenMon }, { where: { maTK } });
    } else if (maNhom === "NHANSU") {
      await NhanSuYTe.update({ maKhoa, hoTen, loaiNS, capBac, chuyenMon }, { where: { maTK } });
    } else if (maNhom === "BENHNHAN") {
      await BenhNhan.update({ hoTen, ngaySinh, gioiTinh, diaChi, soDienThoai, bhyt }, { where: { maTK } });
    }

    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("❌ Lỗi cập nhật:", error.message);
    res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
  }
};

// Xoá tài khoản
const { Op } = require("sequelize");

exports.remove = async (req, res) => {
  try {
    const maTK = req.params.id;
    const acc = await TaiKhoan.findOne({ where: { maTK } });

    if (!acc) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

    const maNhom = acc.maNhom.toUpperCase();

    // 🧑‍⚕️ BÁC SĨ
    if (maNhom === "BACSI") {
      const maBS = maTK;
      await TroLyBacSi.destroy({ where: { maBacSi: maBS } });
      await LichLamViec.destroy({ where: { maBS } });
      await PhieuKham.destroy({ where: { maBS } });
      await YeuCauXetNghiem.destroy({ where: { maBS } });
      await LichKham.destroy({ where: { maBS } });
      // (Lưu ý: Logic DonThuoc có thể cần xem lại nếu đã chuyển sang maPK)
      const donThuocList = await DonThuoc.findAll({ where: { maBS } });
      const maDTList = donThuocList.map((dt) => dt.maDT);
      if (maDTList.length > 0) {
        await ChiTietDonThuoc.destroy({ where: { maDT: { [Op.in]: maDTList } } });
        await DonThuoc.destroy({ where: { maDT: { [Op.in]: maDTList } } });
      }
      await BacSi.destroy({ where: { maTK: maBS } });
    }

    // 🧑‍💼 NHÂN SỰ Y TẾ
    else if (maNhom === "NHANSU") {
      const maNS = maTK;
      await TinTuc.destroy({ where: { maNS } });
      await LichLamViec.destroy({ where: { maNS } });
      await PhieuXetNghiem.destroy({ where: { maNS } });
      await TroLyBacSi.destroy({ where: { maNS } });
      const hoaDonList = await HoaDon.findAll({ where: { maNS } });
      const maHDList = hoaDonList.map((hd) => hd.maHD);
      if (maHDList.length > 0) {
        await ChiTietHoaDon.destroy({ where: { maHD: { [Op.in]: maHDList } } });
        await HoaDon.destroy({ where: { maHD: { [Op.in]: maHDList } } });
      }
      await NhanSuYTe.destroy({ where: { maTK: maNS } });
    }

    // 🧑‍🦱 BỆNH NHÂN
    else if (maNhom === "BENHNHAN") {
      
      // === BẮT ĐẦU SỬA: Giữ lại Hồ sơ Bệnh án ===
      const maBN = maTK;
      
      // 1. Tìm hồ sơ bệnh nhân tương ứng
      const benhNhan = await BenhNhan.findOne({ where: { maTK: maBN } });

      if (benhNhan) {
        // 2. Ngắt kết nối tài khoản khỏi hồ sơ bệnh nhân
        // Bằng cách set maTK = null
        benhNhan.maTK = null;
        await benhNhan.save();
      }
      
      // 3. Xóa các dữ liệu "phi y tế" liên quan đến tài khoản
      // (Các dữ liệu y tế như HoSoBenhAn, PhieuKham, DonThuoc... sẽ được giữ lại)
      const gioHangList = await GioHang.findAll({ where: { maBN } });
      const maGHList = gioHangList.map((gh) => gh.maGH);
      if (maGHList.length > 0) {
        await ChiTietGioHang.destroy({ where: { maGH: { [Op.in]: maGHList } } });
        await GioHang.destroy({ where: { maGH: { [Op.in]: maGHList } } });
      }
      await PhanHoi.destroy({ where: { maBN } });

      // Lưu ý: Chúng ta KHÔNG xóa HoSoAnChuoiKham, HoSoBenhAn, PhieuKham, DonThuoc...
      // === KẾT THÚC SỬA ===
    }

    // ✅ Cuối cùng xoá tài khoản
    await TaiKhoan.destroy({ where: { maTK } });

    res.json({ message: `✅ Đã xoá tài khoản ${maTK}. Dữ liệu y tế (nếu có) đã được giữ lại.` });
  } catch (error) {
    console.error("❌ Lỗi khi xoá:", error.message);
    res.status(500).json({
      message: "Lỗi khi xoá tài khoản (có thể còn dữ liệu ràng buộc chưa xử lý).",
      error: error.message
    });
  }
};

// Lấy danh sách tài khoản
exports.getAll = async (req, res) => {

  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await TaiKhoan.findAndCountAll({
      include: [
        {
          model: BacSi,
          attributes: ["maBS", "maKhoa", "chuyenMon", "chucVu", "trinhDo", "hoTen"],
          include: [{ model: KhoaPhong, attributes: ["tenKhoa"] }]
        },
        {
          model: NhanSuYTe,
          attributes: ["maNS", "maKhoa", "loaiNS", "chuyenMon", "capBac", "hoTen"],
          include: [{ model: KhoaPhong, attributes: ["tenKhoa"] }]
        },
        {
          model: BenhNhan,
          attributes: ["maBN", "hoTen", "gioiTinh", "ngaySinh", "soDienThoai", "bhyt", "diaChi"]
        }
      ],
      order: [["tenDangNhap", "ASC"]],
      limit,
      offset,
      distinct: true
    });

    const ketQua = rows.map((tk) => ({
      maTK: tk.maTK,
      tenDangNhap: tk.tenDangNhap,
      email: tk.email,
      maNhom: tk.maNhom,
      trangThai: tk.trangThai,
      maBS: tk.BacSi?.maBS || null,
      maNS: tk.NhanSuYTe?.maNS || null,
      maBN: tk.BenhNhan?.maBN || null,
      tenKhoa: tk.BacSi?.KhoaPhong?.tenKhoa || tk.NhanSuYTe?.KhoaPhong?.tenKhoa || null,
      chuyenMon: tk.BacSi?.chuyenMon || tk.NhanSuYTe?.chuyenMon || null,
      chucVu: tk.BacSi?.chucVu || null,
      trinhDo: tk.BacSi?.trinhDo || null,
      loaiNS: tk.NhanSuYTe?.loaiNS || null,
      capBac: tk.NhanSuYTe?.capBac || null,
      hoTen: tk.BenhNhan?.hoTen || tk.BacSi?.hoTen || tk.NhanSuYTe?.hoTen || null,
      gioiTinh: tk.BenhNhan?.gioiTinh || null,
      ngaySinh: tk.BenhNhan?.ngaySinh || null,
      diaChi: tk.BenhNhan?.diaChi || null,
      soDienThoai: tk.BenhNhan?.soDienThoai || null,
      bhyt: tk.BenhNhan?.bhyt || null
    }));

    res.json({
      message: "Lấy danh sách tài khoản thành công",
      data: ketQua,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("❌ Lỗi chính trong TaiKhoan.findAll:", error.message);
    res.status(500).json({ message: "Lỗi lấy danh sách tài khoản", error: error.message });
  }
};

exports.getById = async (req, res) => {

  try {
    const acc = await TaiKhoan.findByPk(req.params.id);
    if (!acc) return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    res.json(acc);
  } catch (error) {
    console.error("❌ Lỗi getById:", error.message);
    res.status(500).json({ message: "Lỗi lấy tài khoản", error: error.message });
  }
};

/*
Nhân viên y tế đăng ký hộ bệnh nhân (gọi từ YTá)
*/
exports.dangKyBenhNhan = async (req, res) => {
  try {
    const {
      tenDangNhap, matKhau, email,
      hoTen, ngaySinh, gioiTinh,
      diaChi, soDienThoai, bhyt,
    } = req.body;

    const existing = await TaiKhoan.findOne({ where: { tenDangNhap } });
    if (existing)
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });

    const maTK = uuidv4().slice(0, 8).toUpperCase();
    const hashedPassword = await bcrypt.hash(matKhau, 10);
    
    // === BẮT ĐẦU SỬA ===
    // (Thêm logic tạo key pair)
    const { publicKey, privateKey } = await generateBlockchainKeyPair();

    const taiKhoan = await TaiKhoan.create({
      maTK,
      tenDangNhap,
      matKhau: hashedPassword,
      email,
      maNhom: "BENHNHAN",
      trangThai: true,
      publicKey: publicKey, // <--- LƯU KEY
      privateKey: privateKey // <--- LƯU KEY
    });

    // (Thêm logic xử lý ngaySinh)
    const ngaySinhDate = new Date(ngaySinh);
    if (isNaN(ngaySinhDate.getTime())) {
      return res.status(400).json({ message: "Ngày sinh không hợp lệ." });
    }

    const benhNhan = await BenhNhan.create({
      maBN: maTK,
      hoTen,
      ngaySinh: ngaySinhDate, // <--- Dùng biến đã xử lý
      gioiTinh,
      diaChi,
      soDienThoai,
      email, 
      bhyt,
      maTK,
    });
    
    const hoso = await HoSoBenhAn.create({
      maHSBA: maTK,
      maBN: maTK,
      ngayLap: new Date(),
      dotKhamBenh: new Date(),
      lichSuBenh: null,
      ghiChu: null
    });
    
    // ✅ 5. TẠO KHỐI KHỞI TẠO (GENESIS BLOCK)
    const genesisData = { 
        maBN: maTK, 
        ngayLap: hoso.ngayLap, 
        hoTen: hoTen 
    };
    
    // Sửa: Thêm maTK của bệnh nhân làm người ký
    await blockchainService.addBlock(hoso.maHSBA, 'TAO_MOI', genesisData, maTK); 
    // === KẾT THÚC SỬA ===
    
    res.status(201).json({ message: "Tạo bệnh nhân thành công", data: { taiKhoan, benhNhan } });
  } catch (err) {
    console.error("❌ Lỗi đăng ký bệnh nhân:", err);
    res.status(500).json({ message: "Lỗi đăng ký", error: err.message });
  }
};
