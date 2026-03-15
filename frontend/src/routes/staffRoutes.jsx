import React from "react";
import { Route } from "react-router-dom";
import {
  DoctorHome,
  QuanLyYeuCauXNPage,
  LichLamViecPage,
  PhieuKhamPage,
  KeDonThuocPage,
  LichHenKhamPage_BS,
  ThongTinCaNhanPage_BS,
  YTaHome,
  DangKyBenhNhanPage,
  GhiNhanTinhTrangPage,
  LichLamViecBacSiPage,
  XetNghiemHome,
  YeuCauXNTruocPage,
  PhieuXetNghiem_NSPage,
  TiepNhanHome,
  DangKyKham_NSPage,
  LichHenPage,
  TiepNhanHoSoPage,
} from "./lazyPages";

export function renderDoctorRoutes() {
  return (
    <>
      <Route index element={<DoctorHome />} />
      <Route path="xetnghiem" element={<QuanLyYeuCauXNPage />} />
      <Route path="lich" element={<LichLamViecPage />} />
      <Route path="kham" element={<PhieuKhamPage />} />
      <Route path="kham/donthuoc" element={<KeDonThuocPage />} />
      <Route path="lichhen" element={<LichHenKhamPage_BS />} />
      <Route path="taikhoan" element={<ThongTinCaNhanPage_BS />} />
    </>
  );
}

export function renderYtaRoutes() {
  return (
    <>
      <Route index element={<YTaHome />} />
      <Route path="benhnhan/dangky" element={<DangKyBenhNhanPage />} />
      <Route path="benhnhan/ghinhantinhtrang" element={<GhiNhanTinhTrangPage />} />
      <Route path="lichlamviec" element={<LichLamViecBacSiPage />} />
    </>
  );
}

export function renderXetNghiemRoutes() {
  return (
    <>
      <Route index element={<XetNghiemHome />} />
      <Route path="xetnghiem/yeucau" element={<YeuCauXNTruocPage />} />
      <Route path="xetnghiem/phieu" element={<PhieuXetNghiem_NSPage />} />
    </>
  );
}

export function renderTiepNhanRoutes() {
  return (
    <>
      <Route index element={<TiepNhanHome />} />
      <Route path="lichkham" element={<DangKyKham_NSPage />} />
      <Route path="lichHen" element={<LichHenPage />} />
      <Route path="hsba" element={<TiepNhanHoSoPage />} />
    </>
  );
}
