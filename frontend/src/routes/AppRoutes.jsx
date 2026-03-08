import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../auth/PrivateRoute"; //  import route bảo vệ
import {
  HomePage,
  LoginPage,
  RegisterPage,
  NotFoundPage,
  AdminLayout,
  AdminHome,
  DoctorHome,
  PatientHome,
  DoctorLayout,
  PatientLayout,
  YtaLayout,
  XetNghiemLayout,
  TiepNhanLayout,
  YTaHome,
  TiepNhanHome,
  XetNghiemHome,
  ForgotPasswordPage,
  PaymentResultPage,
  CreateUserForm,
  AdminUserList,
  AssignRole,
  ManageKhoa,
  ManageBacSi,
  ManageNhanSu,
  ManageBenhNhan,
  ManageLichKham,
  ManageXetNghiem,
  ManageLoaiXN,
  ManageHoSoBenhAn,
  ChiTietHSBAPage,
  QuanLyThuocPage,
  QuanLyNhomThuoc,
  QuanLyDonViTinh,
  TroLyBacSiPage,
  ThongKeHoaDonPage,
  ThongKeLichLamViecPage,
  ThongKeLichKhamPage,
  LienHeYKienPage,
  TinTucPage,
  ManagePhanHoiPage,
  ManageTinTucPage,
  QuanLyYeuCauXNPage,
  LichLamViecPage,
  QuanLyCaTrucPage,
  PhieuKhamPage,
  KeDonThuocPage,
  LichHenKhamPage,
  LichHenKhamPage_BS,
  ThongTinCaNhanPage_BS,
  KetQuaXetNghiemPage,
  HoSoBenhAnPage,
  GioHangThanhToanPage,
  ThongTinCaNhanPage,
  BaoMatTaiKhoanPage,
  DangKyBenhNhanPage,
  GhiNhanTinhTrangPage,
  LichLamViecBacSiPage,
  YeuCauXNTruocPage,
  PhieuXetNghiem_NSPage,
  DangKyKham_NSPage,
  LichHenPage,
  TiepNhanHoSoPage,
} from "./lazyPages";





function AppRoutes() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
    <Routes>
      {/* Trang công khai */}
      <Route path="/" element={<HomePage />} /> 
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="payment-result" element={<PaymentResultPage />} />
      {/*  Route cần đăng nhập */}
      <Route path="/admin" element={<PrivateRoute />}>
        <Route element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
          <Route path="taikhoan" element={<AdminUserList />} />
          <Route path="taikhoan/tao-moi" element={<CreateUserForm />} />
          <Route path="taikhoan/sua/:id" element={<CreateUserForm />} />
          <Route path="taikhoan/phan-quyen" element={<AssignRole />} />
          <Route path="khoa" element={<ManageKhoa />} />
          <Route path="bacsi" element={<ManageBacSi />} />
          <Route path="nhansu" element={<ManageNhanSu />} />
          <Route path="benhnhan" element={<ManageBenhNhan />} />
          <Route path="lichkham" element={<ManageLichKham />} />
          <Route path="xetnghiem" element={<ManageXetNghiem />} />
          <Route path="loaixetnghiem" element={<ManageLoaiXN />} />
          <Route path="hosobenhan" element={<ManageHoSoBenhAn />} />
          <Route path="hosobenhan/:maHSBA" element={<ChiTietHSBAPage />} /> 
          <Route path="thuoc" element={<QuanLyThuocPage />} />
           <Route path="nhomthuoc" element={<QuanLyNhomThuoc />} />
          <Route path="donvitinh" element={<QuanLyDonViTinh />} />
          <Route path="thongke" element={<ThongKeHoaDonPage />} />
          <Route path="nhansu/troly" element={<TroLyBacSiPage />} />
          <Route path="nhansu/catruc" element={<QuanLyCaTrucPage />} />
          <Route path="thongke/lichlamviec" element={<ThongKeLichLamViecPage />} />
          <Route path="thongke/lickham" element={<ThongKeLichKhamPage />} />
          <Route path="phanhoi" element={<ManagePhanHoiPage />} />
          <Route path="tintuc" element={<ManageTinTucPage />} />


          {/* Thêm các route khác nếu cần */}         
        </Route>
      </Route>

      <Route path="/doctor" element={<PrivateRoute />}>
          <Route element={<DoctorLayout />}>
            <Route index element={<DoctorHome />} />
            <Route path="xetnghiem" element={<QuanLyYeuCauXNPage />} />   
            <Route path="lich" element={<LichLamViecPage />} />
            <Route path="kham" element={<PhieuKhamPage />} />
            <Route path="kham/donthuoc" element={<KeDonThuocPage />} />
            <Route path="lichhen" element={<LichHenKhamPage_BS />} />
            <Route path="taikhoan" element={<ThongTinCaNhanPage_BS />} />
          </Route>
      </Route>

      {/* Các route layout khác  */}
    

      <Route path="/patient" element={<PrivateRoute />}>
        <Route element={<PatientLayout />}>
          <Route index element={<PatientHome />} />
          <Route path="lich" element={<LichHenKhamPage />} />
          <Route path="xetnghiem" element={<KetQuaXetNghiemPage />} />
          <Route path="hoso" element={<HoSoBenhAnPage />} />
          <Route path="hoadon" element={<GioHangThanhToanPage />} />
          <Route path="taikhoan" element={<ThongTinCaNhanPage />} />
          <Route path="taikhoan/bao-mat" element={<BaoMatTaiKhoanPage />} />
          <Route path="lienhe" element={<LienHeYKienPage />} />
          <Route path="tintuc" element={<TinTucPage />} />
          


          {/* Các route khác của bệnh nhân */}
        </Route>
      </Route>

      <Route path="/yta" element={<PrivateRoute />}>
        <Route element={<YtaLayout />}>
          <Route index element={<YTaHome />} />
          <Route path="benhnhan/dangky" element={<DangKyBenhNhanPage />} />
          <Route path="benhnhan/ghinhantinhtrang" element={<GhiNhanTinhTrangPage />} />
          <Route path="lichlamviec" element={<LichLamViecBacSiPage />} />
          

        </Route>
      </Route>



      <Route path="/xetnghiem" element={<PrivateRoute />}>
        <Route element={<XetNghiemLayout />}>
          <Route index element={<XetNghiemHome />} />
          <Route path="xetnghiem/yeucau" element={<YeuCauXNTruocPage />} />
          <Route path="xetnghiem/phieu" element={<PhieuXetNghiem_NSPage />} />



        </Route>
      </Route>


      <Route path="/tiepnhan" element={<PrivateRoute />}>
        <Route element={<TiepNhanLayout />}>
          <Route index element={<TiepNhanHome />} />
          <Route path="lichkham" element={<DangKyKham_NSPage />} />
          <Route path="lichHen" element={<LichHenPage />} />
          <Route path="hsba" element={<TiepNhanHoSoPage />} />

          {/* Các route khác của nhân viên tiếp nhận */}

        </Route>
      </Route>


      {/* Điều hướng mặc định và 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;
