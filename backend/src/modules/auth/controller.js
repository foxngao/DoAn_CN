const { TaiKhoan, BacSi, NhomQuyen, HoSoBenhAn, BenhNhan } = require("../../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const crypto = require('crypto');
const nodemailer = require("nodemailer");
const otpService = require("../../OTP/otp.service");
const blockchainService = require("../../services/blockchain.service");
const { ok, fail } = require("../../utils/apiResponse");
const env = require("../../config/env");
const logger = require("../../utils/logger");

const SESSION_COOKIE_NAME = "session_token";
const CSRF_COOKIE_NAME = "csrf_token";

function generateBlockchainKeyPair() {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
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

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function isCrossSiteCookieEnabled() {
  return process.env.SESSION_COOKIE_CROSS_SITE === "true";
}

function resolveSameSitePolicy() {
  if (!isProduction()) {
    return "lax";
  }

  if (isCrossSiteCookieEnabled()) {
    return "none";
  }

  return "strict";
}

function resolveCookieDomain() {
  const domain = process.env.SESSION_COOKIE_DOMAIN;
  if (typeof domain !== "string") {
    return undefined;
  }

  const normalized = domain.trim();
  return normalized || undefined;
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: resolveSameSitePolicy(),
    path: "/",
    domain: resolveCookieDomain(),
    maxAge: 24 * 60 * 60 * 1000,
  };
}

function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    secure: isProduction(),
    sameSite: resolveSameSitePolicy(),
    path: "/",
    domain: resolveCookieDomain(),
    maxAge: 24 * 60 * 60 * 1000,
  };
}

function clearAuthCookies(res) {
  const domain = resolveCookieDomain();
  const clearOptions = {
    path: "/",
    ...(domain ? { domain } : {}),
  };

  res.clearCookie(SESSION_COOKIE_NAME, clearOptions);
  res.clearCookie(CSRF_COOKIE_NAME, clearOptions);
}

function buildAuthResponsePayload(user, nhomQuyen, extras = {}) {
  return {
    user: {
      maTK: user.maTK,
      tenDangNhap: user.tenDangNhap,
      email: user.email,
      maNhom: user.maNhom,
      tenNhom: nhomQuyen?.tenNhom || "Không xác định",
      ...extras,
    },
  };
}

// === HÀM TẠO TÀI KHOẢN ===
/*
 [POST] /auth/register
*/
exports.register = async (req, res) => {


  const { tenDangNhap, matKhau, email, maNhom, otpCode } = req.body;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
  if (!passwordRegex.test(matKhau)) {
    logger.warn("Weak password registration rejected", { tenDangNhap, email, maNhom });
    return fail(res, {
      message: "Mật khẩu KHÔNG ĐẠT YÊU CẦU: Phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.",
      status: 422,
    });
  }

  try {
    const isOtpValid = await otpService.verifyOtp(email, otpCode, 'REGISTER_PATIENT');
    if (!isOtpValid) {
      return fail(res, { message: "Mã OTP không hợp lệ hoặc đã hết hạn", status: 422 });
    }

    const existingUser = await TaiKhoan.findOne({ where: { tenDangNhap } });
    if (existingUser)
      return fail(res, { message: "Tên đăng nhập đã tồn tại", status: 422 });

    const hashedPassword = await bcrypt.hash(matKhau, 10);
    const maTK = uuidv4().slice(0, 8).toUpperCase();

    const { publicKey, privateKey } = await generateBlockchainKeyPair();

    const newUser = await TaiKhoan.create({
      maTK, tenDangNhap, matKhau: hashedPassword, email, maNhom, trangThai: true, publicKey, privateKey
    });

    if (maNhom === "BENHNHAN") {
      await BenhNhan.create({
        maBN: maTK, maTK, hoTen: tenDangNhap, email,
      });

      const hoso = await HoSoBenhAn.create({
        maHSBA: maTK, maBN: maTK, ngayLap: new Date(), dotKhamBenh: new Date(), lichSuBenh: null, ghiChu: null
      });
      
      const genesisData = { maBN: maTK, ngayLap: hoso.ngayLap, hoTen: tenDangNhap };
      // Giả định blockchainService.addBlock đã được import
      if (typeof blockchainService !== 'undefined' && blockchainService.addBlock) {
          await blockchainService.addBlock(hoso.maHSBA, 'TAO_MOI', genesisData, maTK);
      }
    }

    return ok(res, {
      message: "Đăng ký thành công! Vui lòng đăng nhập.",
      data: {
        user: { maTK: newUser.maTK, tenDangNhap: newUser.tenDangNhap, email: newUser.email, maNhom: newUser.maNhom },
      },
      status: 201,
    });
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký:", error);
    return fail(res, { message: "Lỗi khi đăng ký", errors: error.message, status: 500 });
  }
};

// === HÀM LẤY OTP ĐĂNG KÝ ===
/*
 Gửi OTP đăng ký
*/
exports.requestRegisterOtp = async (req, res) => {
  
  const { email, tenDangNhap } = req.body;

  try {
    const emailExists = await TaiKhoan.findOne({ where: { email } });
    if (emailExists) {
      return fail(res, { message: "Email đã được sử dụng", status: 422 });
    }
    const userExists = await TaiKhoan.findOne({ where: { tenDangNhap } });
    if (userExists) {
      return fail(res, { message: "Tên đăng nhập đã tồn tại", status: 422 });
    }

    // Giả định otpService.createAndSendOtp đã được import
    if (typeof otpService !== 'undefined' && otpService.createAndSendOtp) {
        await otpService.createAndSendOtp(email, 'REGISTER_PATIENT');
    }
    
    return ok(res, { message: "Mã OTP đã được gửi đến email của bạn.", data: null, status: 200 });

  } catch (error) {
    console.error("❌ Lỗi khi gửi OTP:", error);
    return fail(res, { message: "Lỗi hệ thống khi gửi OTP", errors: error.message, status: 500 });
  }
};

// === HÀM ĐĂNG NHẬP (ĐÃ CHUYỂN SANG EXPORTS) ===
exports.login = async (req, res) => {

  const { tenDangNhap, matKhau } = req.body;

  try {
    const user = await TaiKhoan.findOne({ where: { tenDangNhap } });
    if (!user) return fail(res, { message: "Tài khoản không tồn tại", status: 404 });
    if (!user.trangThai) return fail(res, { message: "Tài khoản đang bị khóa", status: 403 });

    const match = await bcrypt.compare(matKhau, user.matKhau);
    if (!match) return fail(res, { message: "Mật khẩu không đúng", status: 401 });

    // ... (logic tạo token, lấy thông tin user)
    const token = jwt.sign(
        { maTK: user.maTK, tenDangNhap: user.tenDangNhap, maNhom: user.maNhom },
        env.JWT_SECRET,
        { expiresIn: "1d" }
    );
    const nhomQuyen = await NhomQuyen.findOne({ where: { maNhom: user.maNhom } });
    let maBN = null, maBS = null, loaiNS = null;
    if (user.maNhom === "BENHNHAN") {
      const benhNhan = await BenhNhan.findOne({ where: { maTK: user.maTK } });
      maBN = benhNhan?.maBN || null;
    } else if (user.maNhom === "BACSI") {
      const bacSi = await BacSi.findOne({ where: { maTK: user.maTK } });
      maBS = bacSi?.maBS || null;
    } else if (user.maNhom === "NHANSU") {
      const { NhanSuYTe } = require("../../models");
      const ns = await NhanSuYTe.findOne({ where: { maTK: user.maTK } });
      loaiNS = ns?.loaiNS || null;
    }
    // ... (kết thúc logic)

    const csrfToken = crypto.randomBytes(32).toString("hex");
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

    const authPayload = buildAuthResponsePayload(user, nhomQuyen, { loaiNS, maBN, maBS });

    return ok(res, {
      message: "Đăng nhập thành công",
      data: {
        ...authPayload,
        csrfToken,
      },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Lỗi khi đăng nhập:", error);
    return fail(res, { message: "Lỗi khi đăng nhập", errors: error.message, status: 500 });
  }
};

// === HÀM ĐĂNG NHẬP GOOGLE (ĐÃ CHUYỂN SANG EXPORTS) ===
exports.googleLogin = async (req, res) => {
  try {
    const { tenDangNhap, email, maNhom } = req.body;

    if (!email) return fail(res, { message: "Thiếu email Google", status: 422 });

    let user = await TaiKhoan.findOne({ where: { email } });

    // --- TẠO MỚI TÀI KHOẢN (Nếu chưa tồn tại) ---
    if (!user) {
      const maTK = uuidv4().slice(0, 8).toUpperCase();
      const fakePass = uuidv4();
      const hashed = await bcrypt.hash(fakePass, 10);

      // TẠO KEY PAIR CHO BLOCKCHAIN
      const { publicKey, privateKey } = await generateBlockchainKeyPair();

      user = await TaiKhoan.create({
        maTK, tenDangNhap: tenDangNhap || email.split("@")[0], email, matKhau: hashed, maNhom: maNhom || "BENHNHAN", trangThai: true, publicKey, privateKey
      });

      if (user.maNhom === "BENHNHAN") {
        await BenhNhan.create({
          maBN: user.maTK, maTK: user.maTK, hoTen: user.tenDangNhap, email: user.email,
        });
        
        const hoso = await HoSoBenhAn.create({
          maHSBA: user.maTK, maBN: user.maTK, ngayLap: new Date(), dotKhamBenh: new Date(), lichSuBenh: null, ghiChu: null
        });
        
        // TẠO KHỐI KHỞI TẠO (GENESIS BLOCK)
        const genesisData = { maBN: user.maTK, ngayLap: hoso.ngayLap, hoTen: user.tenDangNhap };
        if (typeof blockchainService !== 'undefined' && blockchainService.addBlock) {
             await blockchainService.addBlock(hoso.maHSBA, 'TAO_MOI', genesisData, user.maTK);
        }
      }
    }

    const token = jwt.sign(
      { maTK: user.maTK, email: user.email, maNhom: user.maNhom },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const csrfToken = crypto.randomBytes(32).toString("hex");
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

    return ok(res, {
      message: "Đăng nhập Google thành công",
      data: {
        csrfToken,
        user: {
          maTK: user.maTK,
          tenDangNhap: user.tenDangNhap,
          email: user.email,
          maNhom: user.maNhom,
        },
      },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Lỗi khi đăng nhập Google:", error);
    return fail(res, { message: "Lỗi server", errors: error.message, status: 500 });
  }
};

exports.logout = (req, res) => {
  clearAuthCookies(res);
  return ok(res, { message: "Đăng xuất thành công", data: null, status: 200 });
};

// === HÀM LẤY USER HIỆN TẠI (ĐÃ CHUYỂN SANG EXPORTS) ===
exports.getCurrentUser = async (req, res) => {
  try {
    const { maTK } = req.user;
    const user = await TaiKhoan.findByPk(maTK);
    if (!user) return fail(res, { message: "Không tìm thấy người dùng", status: 404 });

    return ok(res, {
      message: "Lấy thông tin người dùng thành công",
      data: {
        maTK: user.maTK,
        tenDangNhap: user.tenDangNhap,
        email: user.email,
        maNhom: user.maNhom,
      },
      status: 200,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy thông tin user:", err);
    return fail(res, { message: "Lỗi server", errors: err.message, status: 500 });
  }
};

// === HÀM ĐỔI MẬT KHẨU (ĐÃ CHUYỂN SANG EXPORTS) ===
exports.doiMatKhau = async (req, res) => {
  const { maTK, matKhauCu, matKhauMoi } = req.body;
  try {
    const taiKhoan = await TaiKhoan.findByPk(maTK);
    if (!taiKhoan)
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });

    const match = await bcrypt.compare(matKhauCu, taiKhoan.matKhau);
    if (!match)
      return res.status(400).json({ success: false, message: "Mật khẩu cũ không đúng" });

    if (matKhauMoi === matKhauCu)
      return res.status(400).json({ success: false, message: "Mật khẩu mới không được trùng mật khẩu cũ" });

    const hashedNew = await bcrypt.hash(matKhauMoi, 10);
    taiKhoan.matKhau = hashedNew;
    await taiKhoan.save();

    return res.json({ success: true, message: "✅ Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("❌ Lỗi đổi mật khẩu:", err);
    return res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// === HÀM QUÊN MẬT KHẨU MỚI ===
/*
[POST] /auth/forgot-password - Yêu cầu gửi OTP
*/
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email" });
    }

    const user = await TaiKhoan.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });
    }

    if (typeof otpService !== 'undefined' && otpService.createAndSendOtp) {
        await otpService.createAndSendOtp(email, 'RESET_PASSWORD');
        logger.info("Forgot-password OTP issued", { email });
    } else {
        console.error("❌ otpService.createAndSendOtp không khả dụng.");
        return res.status(500).json({ message: "Dịch vụ OTP không khả dụng" });
    }
    

    return res.json({ 
      success: true, 
      message: "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra (cả mục Spam)." 
    });

  } catch (err) {
    console.error("Lỗi quên mật khẩu:", err);
    const friendlyError = err.message.includes('Authentication') 
      ? "Lỗi cấu hình mail server. Vui lòng liên hệ quản trị viên." 
      : err.message;
    return res.status(500).json({ message: friendlyError });
  }
};

/*
Xác thực OTP và Đặt lại mật khẩu
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }
    
    // Giả định otpService.verifyOtp đã được import
    let isValid = false;
    if (typeof otpService !== 'undefined' && otpService.verifyOtp) {
        isValid = await otpService.verifyOtp(email, otpCode, 'RESET_PASSWORD');
    } else {
        console.error("❌ otpService.verifyOtp không khả dụng.");
        return res.status(500).json({ message: "Dịch vụ OTP không khả dụng" });
    }
    
    if (!isValid) {
      return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }

    const user = await TaiKhoan.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.matKhau = hashedPassword;
    await user.save();

    return res.json({ success: true, message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay." });

  } catch (err) {
    console.error("Lỗi đặt lại mật khẩu:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports.getSessionCookieOptions = getSessionCookieOptions;
module.exports.getCsrfCookieOptions = getCsrfCookieOptions;
module.exports.clearAuthCookies = clearAuthCookies;
module.exports.generateBlockchainKeyPair = generateBlockchainKeyPair;
