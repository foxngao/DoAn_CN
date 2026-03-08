import { lazy } from "react";

export const HomePage = lazy(() => import("../pages/HomePage"));
export const LoginPage = lazy(() => import("../pages/LoginPage"));
export const RegisterPage = lazy(() => import("../pages/RegisterPage"));
export const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
export const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage.jsx"));
export const PaymentResultPage = lazy(() =>
  import("../pages/benhnhan/hoadon/PaymentResultPage")
);

export const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
export const DoctorLayout = lazy(() => import("../layouts/DoctorLayout"));
export const PatientLayout = lazy(() => import("../layouts/PatientLayout"));
export const YtaLayout = lazy(() => import("../layouts/YtaLayout"));
export const XetNghiemLayout = lazy(() => import("../layouts/XetNghiemLayout"));
export const TiepNhanLayout = lazy(() => import("../layouts/TiepNhanLayout"));

export const AdminHome = lazy(() => import("../pages/AdminHome"));
export const DoctorHome = lazy(() => import("../pages/DoctorHome"));
export const PatientHome = lazy(() => import("../pages/PatientHome"));
export const YTaHome = lazy(() => import("../pages/YTaHome"));
export const TiepNhanHome = lazy(() => import("../pages/TiepNhanHome"));
export const XetNghiemHome = lazy(() => import("../pages/XetNghiemHome"));

export const CreateUserForm = lazy(() => import("../pages/admin/CreateUserForm"));
export const AdminUserList = lazy(() => import("../pages/admin/AdminUserList"));
export const AssignRole = lazy(() => import("../pages/admin/AssignRole"));
export const ManageKhoa = lazy(() => import("../pages/admin/ManageKhoa"));
export const ManageBacSi = lazy(() => import("../pages/admin/ManageBacSi"));
export const ManageNhanSu = lazy(() => import("../pages/admin/ManageNhanSu"));
export const ManageBenhNhan = lazy(() => import("../pages/admin/ManageBenhNhan"));
export const ManageLichKham = lazy(() => import("../pages/admin/ManageLichKham"));
export const ManageXetNghiem = lazy(() => import("../pages/admin/ManageXetNghiem"));
export const ManageLoaiXN = lazy(() => import("../pages/admin/ManageLoaiXN"));
export const ManageHoSoBenhAn = lazy(() => import("../pages/admin/ManageHoSoBenhAn"));
export const ChiTietHSBAPage = lazy(() => import("../pages/admin/ChiTietHSBAPage"));
export const QuanLyThuocPage = lazy(() => import("../pages/admin/thuoc/QuanLyThuocPage"));
export const QuanLyNhomThuoc = lazy(() => import("../pages/admin/thuoc/QuanLyNhomThuoc"));
export const QuanLyDonViTinh = lazy(() => import("../pages/admin/thuoc/QuanLyDonViTinh"));
export const TroLyBacSiPage = lazy(() => import("../pages/admin/nhansu/TroLyBacSiPage"));
export const ThongKeHoaDonPage = lazy(() =>
  import("../pages/admin/thongke/ThongKeHoaDonPage")
);
export const ThongKeLichLamViecPage = lazy(() =>
  import("../pages/admin/thongke/ThongKeLichLamViecPage")
);
export const ThongKeLichKhamPage = lazy(() =>
  import("../pages/admin/thongke/ThongKeLichKhamPage")
);
export const ManagePhanHoiPage = lazy(() => import("../pages/admin/ManagePhanHoiPage"));
export const ManageTinTucPage = lazy(() => import("../pages/admin/ManageTinTucPage"));
export const QuanLyYeuCauXNPage = lazy(() =>
  import("../pages/bacsi/xetnghiem/QuanLyYeuCauXNPage")
);
export const LichLamViecPage = lazy(() => import("../pages/bacsi/lich/LichLamViecPage"));
export const QuanLyCaTrucPage = lazy(() => import("../pages/admin/nhansu/QuanLyCaTrucPage"));
export const PhieuKhamPage = lazy(() => import("../pages/bacsi/kham/PhieuKhamPage"));
export const KeDonThuocPage = lazy(() => import("../pages/bacsi/kham/KeDonThuocPage"));
export const LichHenKhamPage = lazy(() => import("../pages/benhnhan/lich/LichHenKhamPage"));
export const LichHenKhamPage_BS = lazy(() =>
  import("../pages/bacsi/lichhen/LichHenKhamPage_BS")
);
export const ThongTinCaNhanPage_BS = lazy(() => import("../pages/bacsi/ThongTinCaNhanPage"));
export const LienHeYKienPage = lazy(() => import("../pages/benhnhan/lienhe/LienHeYKienPage"));
export const TinTucPage = lazy(() => import("../pages/benhnhan/tintuc/TinTucPage"));
export const KetQuaXetNghiemPage = lazy(() =>
  import("../pages/benhnhan/xetnghiem/KetQuaXetNghiemPage")
);
export const HoSoBenhAnPage = lazy(() => import("../pages/benhnhan/hoso/HoSoBenhAnPage"));
export const GioHangThanhToanPage = lazy(() =>
  import("../pages/benhnhan/hoadon/GioHangThanhToanPage")
);
export const ThongTinCaNhanPage = lazy(() =>
  import("../pages/benhnhan/taikhoan/ThongTinCaNhanPage")
);
export const BaoMatTaiKhoanPage = lazy(() =>
  import("../pages/benhnhan/taikhoan/BaoMatTaiKhoanPage")
);
export const DangKyBenhNhanPage = lazy(() =>
  import("../pages/nhansu/YTa/DangKyBenhNhanPage")
);
export const GhiNhanTinhTrangPage = lazy(() =>
  import("../pages/nhansu/YTa/GhiNhanTinhTrangPage")
);
export const LichLamViecBacSiPage = lazy(() =>
  import("../pages/nhansu/YTa/LichLamViecBacSiPage")
);
export const YeuCauXNTruocPage = lazy(() =>
  import("../pages/nhansu/xetnghiem/YeuCauXNTruocPage")
);
export const PhieuXetNghiem_NSPage = lazy(() =>
  import("../pages/nhansu/xetnghiem/PhieuXetNghiem_NSPage")
);
export const DangKyKham_NSPage = lazy(() =>
  import("../pages/nhansu/tiepnhan/DangKyKham_NSPage")
);
export const LichHenPage = lazy(() => import("../pages/nhansu/tiepnhan/LichHenPage"));
export const TiepNhanHoSoPage = lazy(() =>
  import("../pages/nhansu/tiepnhan/TiepNhanHoSoPage")
);
