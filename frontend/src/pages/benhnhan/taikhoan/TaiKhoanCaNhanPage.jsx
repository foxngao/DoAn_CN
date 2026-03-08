import React, { useEffect, useState } from "react";
import axios from "../../../api/axiosClient"; // Đảm bảo đường dẫn đúng
import toast from "react-hot-toast";

const TaiKhoanCaNhanPage = () => {
  const maTK = localStorage.getItem("maTK");
  const [loading, setLoading] = useState(false);

  // State cho thông tin cá nhân
  const [profile, setProfile] = useState({
    hoTen: "",
    gioiTinh: "Nam",
    ngaySinh: "",
    diaChi: "",
    soDienThoai: "",
    bhyt: "",
    email: "" // Email từ bảng TaiKhoan
  });

  // State cho đổi mật khẩu
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Gọi API lấy thông tin chi tiết (bao gồm cả thông tin từ bảng TaiKhoan và BenhNhan)
      const res = await axios.get("/auth/me"); 
      const data = res.data;
      
      // Format ngày sinh cho input date
      let formattedDate = "";
      if (data.ngaySinh) {
        formattedDate = new Date(data.ngaySinh).toISOString().split("T")[0];
      }

      setProfile({
        hoTen: data.hoTen || "",
        gioiTinh: data.gioiTinh || "Nam",
        ngaySinh: formattedDate,
        diaChi: data.diaChi || "",
        soDienThoai: data.soDienThoai || "",
        bhyt: data.bhyt || "",
        email: data.email || ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải thông tin cá nhân");
    }
  };

  // --- Xử lý cập nhật thông tin ---
  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // Cập nhật bảng BenhNhan
      await axios.put(`/benhnhan/${localStorage.getItem('maBN')}`, {
        hoTen: profile.hoTen,
        gioiTinh: profile.gioiTinh,
        ngaySinh: profile.ngaySinh,
        diaChi: profile.diaChi,
        soDienThoai: profile.soDienThoai,
        bhyt: profile.bhyt
      });
      toast.success("✅ Cập nhật thông tin thành công!");
    } catch (err) {
      toast.error("❌ Cập nhật thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Xử lý đổi mật khẩu ---
  const handlePassChange = (e) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error("❌ Mật khẩu xác nhận không khớp!");
      return;
    }
    
    if (passForm.newPassword.length < 6) {
      toast.error("❌ Mật khẩu mới phải từ 6 ký tự trở lên.");
      return;
    }

    try {
      setLoading(true);
      
      // SỬA LỖI TẠI ĐÂY:
      // 1. Đổi đường dẫn từ "/auth/doiMatKhau" thành "/auth/doi-mat-khau" (khớp với routes.js backend)
      // 2. Giữ nguyên các trường dữ liệu (maTK, matKhauCu, matKhauMoi) vì đã khớp với controller.js backend
      await axios.post("/auth/doi-mat-khau", {
        maTK: maTK,
        matKhauCu: passForm.oldPassword,
        matKhauMoi: passForm.newPassword
      });

      toast.success("✅ Đổi mật khẩu thành công!");
      setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Lỗi đổi mật khẩu:", err);
      toast.error("❌ " + (err.response?.data?.message || "Đổi mật khẩu thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-blue-800">👤 Quản lý tài khoản</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CỘT 1: THÔNG TIN CÁ NHÂN */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📝 Thông tin cá nhân
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <input name="hoTen" value={profile.hoTen} onChange={handleProfileChange} className="input mt-1" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                    <input type="date" name="ngaySinh" value={profile.ngaySinh} onChange={handleProfileChange} className="input mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                    <select name="gioiTinh" value={profile.gioiTinh} onChange={handleProfileChange} className="input mt-1">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input name="soDienThoai" value={profile.soDienThoai} onChange={handleProfileChange} className="input mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
              <input name="diaChi" value={profile.diaChi} onChange={handleProfileChange} className="input mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">BHYT</label>
              <input name="bhyt" value={profile.bhyt} onChange={handleProfileChange} className="input mt-1" />
            </div>
            
            {/* Email hiển thị readonly vì đổi email cần quy trình riêng */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (Đăng nhập)</label>
              <input value={profile.email} disabled className="input mt-1 bg-gray-100 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-500 mt-1">*Để đổi email, vui lòng liên hệ bộ phận hỗ trợ.</p>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition">
              Lưu thông tin
            </button>
          </form>
        </div>

        {/* CỘT 2: BẢO MẬT & MẬT KHẨU */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🔐 Bảo mật & Mật khẩu
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
              <input 
                type="password" 
                name="oldPassword" 
                value={passForm.oldPassword} 
                onChange={handlePassChange} 
                className="input mt-1" 
                placeholder="••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
              <input 
                type="password" 
                name="newPassword" 
                value={passForm.newPassword} 
                onChange={handlePassChange} 
                className="input mt-1" 
                placeholder="Ít nhất 6 ký tự"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
              <input 
                type="password" 
                name="confirmPassword" 
                value={passForm.confirmPassword} 
                onChange={handlePassChange} 
                className="input mt-1" 
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-2 rounded-lg font-semibold transition text-white ${loading ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </form>
            
          {/* Phần hiển thị trạng thái tài khoản */}
          <div className="mt-8 pt-4 border-t border-gray-200">
             <h3 className="text-sm font-bold text-gray-700 mb-2">Trạng thái tài khoản</h3>
             <div className="flex items-center gap-2 text-sm">
                 <span className="w-3 h-3 rounded-full bg-green-500"></span>
                 <span className="text-green-700 font-medium">Đang hoạt động</span>
             </div>
             <p className="text-xs text-gray-500 mt-1">Mã tài khoản: {maTK}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaiKhoanCaNhanPage;