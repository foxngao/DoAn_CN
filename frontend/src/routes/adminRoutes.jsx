import React from "react";
import { Route } from "react-router-dom";
import {
  AdminHome,
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
  ManagePhanHoiPage,
  ManageTinTucPage,
  QuanLyCaTrucPage,
} from "./lazyPages";

export function renderAdminRoutes() {
  return (
    <>
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
    </>
  );
}
