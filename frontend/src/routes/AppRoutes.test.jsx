import React from "react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import AppRoutes from "./AppRoutes";

function simpleComponent(label) {
  return {
    default: function MockComponent() {
      return <div>{label}</div>;
    },
  };
}

vi.mock("../pages/HomePage", () => simpleComponent("HomePage"));
vi.mock("../pages/LoginPage", () => simpleComponent("LoginPage"));
vi.mock("../pages/RegisterPage", () => simpleComponent("RegisterPage"));
vi.mock("../pages/NotFoundPage", () => simpleComponent("NotFoundPage"));
vi.mock("../layouts/AdminLayout", () => simpleComponent("AdminLayout"));
vi.mock("../pages/AdminHome", () => simpleComponent("AdminHome"));
vi.mock("../pages/DoctorHome", () => simpleComponent("DoctorHome"));
vi.mock("../pages/PatientHome", () => simpleComponent("PatientHome"));
vi.mock("../layouts/DoctorLayout", () => simpleComponent("DoctorLayout"));
vi.mock("../layouts/PatientLayout", () => simpleComponent("PatientLayout"));
vi.mock("../layouts/YtaLayout", () => simpleComponent("YtaLayout"));
vi.mock("../layouts/XetNghiemLayout", () => simpleComponent("XetNghiemLayout"));
vi.mock("../layouts/TiepNhanLayout", () => simpleComponent("TiepNhanLayout"));
vi.mock("../pages/YTaHome", () => simpleComponent("YTaHome"));
vi.mock("../pages/TiepNhanHome", () => simpleComponent("TiepNhanHome"));
vi.mock("../pages/XetNghiemHome", () => simpleComponent("XetNghiemHome"));
vi.mock("../pages/ForgotPasswordPage.jsx", () => simpleComponent("ForgotPasswordPage"));
vi.mock("../pages/benhnhan/hoadon/PaymentResultPage", () => simpleComponent("PaymentResultPage"));
vi.mock("../auth/PrivateRoute", () => simpleComponent("PrivateRoute"));
vi.mock("../pages/admin/CreateUserForm", () => simpleComponent("CreateUserForm"));
vi.mock("../pages/admin/AdminUserList", () => simpleComponent("AdminUserList"));
vi.mock("../pages/admin/AssignRole", () => simpleComponent("AssignRole"));
vi.mock("../pages/admin/ManageKhoa", () => simpleComponent("ManageKhoa"));
vi.mock("../pages/admin/ManageBacSi", () => simpleComponent("ManageBacSi"));
vi.mock("../pages/admin/ManageNhanSu", () => simpleComponent("ManageNhanSu"));
vi.mock("../pages/admin/ManageBenhNhan", () => simpleComponent("ManageBenhNhan"));
vi.mock("../pages/admin/ManageLichKham", () => simpleComponent("ManageLichKham"));
vi.mock("../pages/admin/ManageXetNghiem", () => simpleComponent("ManageXetNghiem"));
vi.mock("../pages/admin/ManageLoaiXN", () => simpleComponent("ManageLoaiXN"));
vi.mock("../pages/admin/ManageHoSoBenhAn", () => simpleComponent("ManageHoSoBenhAn"));
vi.mock("../pages/admin/ChiTietHSBAPage", () => simpleComponent("ChiTietHSBAPage"));
vi.mock("../pages/admin/thuoc/QuanLyThuocPage", () => simpleComponent("QuanLyThuocPage"));
vi.mock("../pages/admin/thuoc/QuanLyNhomThuoc", () => simpleComponent("QuanLyNhomThuoc"));
vi.mock("../pages/admin/thuoc/QuanLyDonViTinh", () => simpleComponent("QuanLyDonViTinh"));
vi.mock("../pages/admin/nhansu/TroLyBacSiPage", () => simpleComponent("TroLyBacSiPage"));
vi.mock("../pages/admin/thongke/ThongKeHoaDonPage", () => simpleComponent("ThongKeHoaDonPage"));
vi.mock("../pages/admin/thongke/ThongKeLichLamViecPage", () => simpleComponent("ThongKeLichLamViecPage"));
vi.mock("../pages/admin/thongke/ThongKeLichKhamPage", () => simpleComponent("ThongKeLichKhamPage"));
vi.mock("../pages/benhnhan/lienhe/LienHeYKienPage", () => simpleComponent("LienHeYKienPage"));
vi.mock("../pages/benhnhan/tintuc/TinTucPage", () => simpleComponent("TinTucPage"));
vi.mock("../pages/admin/ManagePhanHoiPage", () => simpleComponent("ManagePhanHoiPage"));
vi.mock("../pages/admin/ManageTinTucPage", () => simpleComponent("ManageTinTucPage"));
vi.mock("../pages/bacsi/xetnghiem/QuanLyYeuCauXNPage", () => simpleComponent("QuanLyYeuCauXNPage"));
vi.mock("../pages/bacsi/lich/LichLamViecPage", () => simpleComponent("LichLamViecPage"));
vi.mock("../pages/admin/nhansu/QuanLyCaTrucPage", () => simpleComponent("QuanLyCaTrucPage"));
vi.mock("../pages/bacsi/kham/PhieuKhamPage", () => simpleComponent("PhieuKhamPage"));
vi.mock("../pages/bacsi/kham/KeDonThuocPage", () => simpleComponent("KeDonThuocPage"));
vi.mock("../pages/benhnhan/lich/LichHenKhamPage", () => simpleComponent("LichHenKhamPage"));
vi.mock("../pages/bacsi/lichhen/LichHenKhamPage_BS", () => simpleComponent("LichHenKhamPage_BS"));
vi.mock("../pages/bacsi/ThongTinCaNhanPage", () => simpleComponent("ThongTinCaNhanPage_BS"));
vi.mock("../pages/benhnhan/xetnghiem/KetQuaXetNghiemPage", () => simpleComponent("KetQuaXetNghiemPage"));
vi.mock("../pages/benhnhan/hoso/HoSoBenhAnPage", () => simpleComponent("HoSoBenhAnPage"));
vi.mock("../pages/benhnhan/hoadon/GioHangThanhToanPage", () => simpleComponent("GioHangThanhToanPage"));
vi.mock("../pages/benhnhan/taikhoan/ThongTinCaNhanPage", () => simpleComponent("ThongTinCaNhanPage"));
vi.mock("../pages/benhnhan/taikhoan/BaoMatTaiKhoanPage", () => simpleComponent("BaoMatTaiKhoanPage"));
vi.mock("../pages/nhansu/YTa/DangKyBenhNhanPage", () => simpleComponent("DangKyBenhNhanPage"));
vi.mock("../pages/nhansu/YTa/GhiNhanTinhTrangPage", () => simpleComponent("GhiNhanTinhTrangPage"));
vi.mock("../pages/nhansu/YTa/LichLamViecBacSiPage", () => simpleComponent("LichLamViecBacSiPage"));
vi.mock("../pages/nhansu/xetnghiem/YeuCauXNTruocPage", () => simpleComponent("YeuCauXNTruocPage"));
vi.mock("../pages/nhansu/xetnghiem/PhieuXetNghiem_NSPage", () => simpleComponent("PhieuXetNghiem_NSPage"));
vi.mock("../pages/nhansu/tiepnhan/DangKyKham_NSPage", () => simpleComponent("DangKyKham_NSPage"));
vi.mock("../pages/nhansu/tiepnhan/LichHenPage", () => simpleComponent("LichHenPage"));
vi.mock("../pages/nhansu/tiepnhan/TiepNhanHoSoPage", () => simpleComponent("TiepNhanHoSoPage"));

describe("AppRoutes smoke", () => {
  it("renders public home route", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("HomePage")).toBeInTheDocument();
  });

  it("renders not found route", async () => {
    render(
      <MemoryRouter initialEntries={["/khong-ton-tai"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("NotFoundPage")).toBeInTheDocument();
  });
});
