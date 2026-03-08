import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axiosClient";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";


function RegisterPage() {
  const navigate = useNavigate();

  const getUserFromAuthResponse = (response) =>
    response?.data?.data?.user || response?.data?.user || null;

  // === STATE DỮ LIỆU ===
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
  const [email, setEmail] = useState("");

  // === STATE TRẠNG THÁI ===
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // Object chứa lỗi hiển thị inline
  
  // === STATE OTP ===
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false); 
  const [otpLoading, setOtpLoading] = useState(false); 

  // --- Helper: Hiển thị lỗi đỏ ---
  const ErrorText = ({ err }) => (
    err ? <p style={{ color: "#E74C3C", fontSize: "12px", marginTop: "4px", fontStyle: "italic", display: "flex", alignItems: "center", gap: "4px" }}>⚠️ {err}</p> : null
  );

  // --- Helper: Xóa lỗi khi người dùng nhập lại ---
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // --- Helper: Style input động (Viền đỏ khi lỗi) ---
  const inputStyle = (field) => ({
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: errors[field] ? "1px solid #E74C3C" : "1px solid #BDC3C7",
    outline: "none",
    transition: "0.3s",
    backgroundColor: (field === 'tenDangNhap' || field === 'email') && otpSent ? "#F4F6F7" : "white",
    color: (field === 'tenDangNhap' || field === 'email') && otpSent ? "#7F8C8D" : "#2C3E50"
  });

  // === 1. GỬI YÊU CẦU OTP (ĐÃ CẬP NHẬT VALIDATE PASSWORD) ===
  const handleRequestOtp = async () => {
    const newErrors = {};

    // 1. Validate Tên đăng nhập
    if (!tenDangNhap.trim()) newErrors.tenDangNhap = "Vui lòng nhập tên đăng nhập";

    // 2. Validate Email
    if (!email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email không đúng định dạng";

    // 3. Validate Mật khẩu (KIỂM TRA TRƯỚC KHI GỬI OTP)
    const strongPassRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!matKhau) {
       newErrors.matKhau = "Vui lòng nhập mật khẩu";
    } else if (!strongPassRegex.test(matKhau)) {
       newErrors.matKhau = "Mật khẩu yếu: Cần tối thiểu 8 ký tự, bao gồm chữ Hoa, chữ Thường và Số.";
    }

    // 4. Validate Xác nhận mật khẩu
    if (xacNhanMatKhau !== matKhau) {
        newErrors.xacNhanMatKhau = "Mật khẩu xác nhận không khớp";
    }

    // Nếu có lỗi -> Dừng lại, hiện lỗi đỏ
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Vui lòng kiểm tra lại thông tin nhập vào");
      return;
    }

    setOtpLoading(true);
    try {
      // Gọi endpoint gửi OTP
      await axios.post("/auth/request-otp", { tenDangNhap, email });
      toast.success("Mã OTP đã được gửi đến email của bạn!");
      setOtpSent(true); 
      setErrors({}); // Xóa hết lỗi cũ nếu thành công
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi khi gửi OTP";
      toast.error(msg);

      // Xử lý lỗi từ Backend trả về (validation middleware)
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach(e => {
          serverErrors[e.truong] = e.thongDiep; 
        });
        setErrors(serverErrors);
      }
    } finally {
      setOtpLoading(false);
    }
  };
 
  // === 2. ĐĂNG KÝ TÀI KHOẢN ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra lại lần nữa để chắc chắn (phòng trường hợp user sửa HTML)
    if (matKhau !== xacNhanMatKhau) {
        setErrors(prev => ({ ...prev, xacNhanMatKhau: "Mật khẩu xác nhận không khớp" }));
        return;
    }
    
    const strongPassRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!strongPassRegex.test(matKhau)) {
      setErrors(prev => ({ ...prev, matKhau: "Mật khẩu yếu: Cần 8+ ký tự, chữ Hoa, Thường, Số" }));
      return;
    }

    if (!otpSent) {
      toast.error("Vui lòng nhấn 'Gửi mã OTP' trước khi đăng ký");
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
       toast.error("Mã OTP phải có 6 chữ số");
       return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/auth/register", {
        tenDangNhap,
        matKhau,
        email,
        maNhom: "BENHNHAN",
        otpCode,
      });

      if (res.data && res.data.success) {
        toast.success("✅ Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      } else {
        toast.error(res.data.message || "Đăng ký thất bại!");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Đăng ký thất bại!";
      toast.error(`❌ ${errorMsg}`);

      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
          const serverErrors = {};
          err.response.data.errors.forEach(e => {
              serverErrors[e.truong] = e.thongDiep;
          });
          setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  // === 3. GOOGLE LOGIN ===
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const res = await axios.post("/auth/google-login", {
        tenDangNhap: decoded.email.split("@")[0],
        email: decoded.email,
        maNhom: "BENHNHAN",
        matKhau: decoded.sub, 
      });

      const user = getUserFromAuthResponse(res);
      if (user) {
        toast.success("✅ Đăng nhập bằng Google thành công!");
        localStorage.removeItem("token");
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("maTK", user.maTK);
        localStorage.setItem("role", user.maNhom);
        localStorage.setItem("loaiNS", user.loaiNS || ""); 
        if (user.maNhom === "BENHNHAN") localStorage.setItem("maBN", user.maTK);
        navigate("/patient"); 
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Đăng nhập Google thất bại!");
    }
  };

  const handleGoogleError = () => toast.error("Đăng nhập Google thất bại!");

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#D6EAF8", fontFamily: "Segoe UI, sans-serif" }}>
      <div style={{ backgroundColor: "#F8FAFC", padding: "2rem", borderRadius: "1.5rem", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#2C3E50", textAlign: "center", marginBottom: "20px" }}>
          🔐 Đăng ký tài khoản
        </h1>

        <form onSubmit={handleSubmit}>
          
          {/* Tên đăng nhập */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#34495E", marginBottom: "6px" }}>Tên đăng nhập</label>
            <input
              type="text"
              value={tenDangNhap}
              onChange={(e) => { setTenDangNhap(e.target.value); clearError("tenDangNhap"); }}
              disabled={otpSent} 
              style={inputStyle("tenDangNhap")}
            />
            <ErrorText err={errors.tenDangNhap} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#34495E", marginBottom: "6px" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
              disabled={otpSent} 
              style={inputStyle("email")}
            />
            <ErrorText err={errors.email} />
          </div>

          {/* Mật khẩu */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#34495E", marginBottom: "6px" }}>Mật khẩu</label>
            <input
              type="password"
              value={matKhau}
              onChange={(e) => { setMatKhau(e.target.value); clearError("matKhau"); }}
              placeholder="Tối thiểu 8 ký tự, có chữ hoa, thường, số"
              style={inputStyle("matKhau")}
            />
             <ErrorText err={errors.matKhau} />
             {/* Chỉ hiện gợi ý khi không có lỗi */}
             {!errors.matKhau && <p style={{fontSize: '11px', color: '#7f8c8d', marginTop: '4px'}}>* Yêu cầu: 8+ ký tự, Hoa, Thường, Số</p>}
          </div>

          {/* Xác nhận mật khẩu */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#34495E", marginBottom: "6px" }}>Xác nhận mật khẩu</label>
            <input
              type="password"
              value={xacNhanMatKhau}
              onChange={(e) => { setXacNhanMatKhau(e.target.value); clearError("xacNhanMatKhau"); }}
              style={{ 
                  ...inputStyle("xacNhanMatKhau"),
                  boxShadow: xacNhanMatKhau && matKhau !== xacNhanMatKhau ? "0 0 0 2px rgba(231,76,60,0.4)" : "none"
              }}
            />
            <ErrorText err={errors.xacNhanMatKhau} />
          </div>

          {/* Ô nhập OTP */}
          {otpSent && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontWeight: "600", color: "#34495E", marginBottom: "6px" }}>
                Mã OTP (Đã gửi tới {email})
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                maxLength={6}
                placeholder="Nhập 6 số OTP"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #3498DB", outline: "none", textAlign: "center", letterSpacing: "2px", fontSize: "18px", fontWeight: "bold" }}
              />
            </div>
          )}

          {/* Buttons */}
          {!otpSent ? (
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={otpLoading}
              style={{ width: "100%", padding: "10px", fontSize: "16px", fontWeight: "600", borderRadius: "8px", backgroundColor: otpLoading ? "#95A5A6" : "#3498DB", color: "white", border: "none", cursor: otpLoading ? "not-allowed" : "pointer", transition: "0.2s" }}
            >
              {otpLoading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "10px", fontSize: "16px", fontWeight: "600", borderRadius: "8px", backgroundColor: loading ? "#95A5A6" : "#27AE60", color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "0.2s" }}
            >
              {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </button>
          )}
        </form>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "20px 0" }}>
            <hr style={{ width: "25%", border: "0.5px solid #D5DBDB" }} />
            <span style={{ margin: "0 10px", color: "#7F8C8D", fontSize: "14px" }}>hoặc</span>
            <hr style={{ width: "25%", border: "0.5px solid #D5DBDB" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

        <p style={{ textAlign: "center", marginTop: "15px" }}>
            <Link to="/login" style={{ color: "#3498DB", textDecoration: "none", fontWeight: "500" }}>
                Đã có tài khoản? Đăng nhập
            </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
