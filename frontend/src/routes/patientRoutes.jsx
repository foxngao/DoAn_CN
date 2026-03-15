import React from "react";
import { Route } from "react-router-dom";
import {
  PatientHome,
  LichHenKhamPage,
  KetQuaXetNghiemPage,
  HoSoBenhAnPage,
  GioHangThanhToanPage,
  ThongTinCaNhanPage,
  BaoMatTaiKhoanPage,
  LienHeYKienPage,
  TinTucPage,
} from "./lazyPages";

export function renderPatientRoutes() {
  return (
    <>
      <Route index element={<PatientHome />} />
      <Route path="lich" element={<LichHenKhamPage />} />
      <Route path="xetnghiem" element={<KetQuaXetNghiemPage />} />
      <Route path="hoso" element={<HoSoBenhAnPage />} />
      <Route path="hoadon" element={<GioHangThanhToanPage />} />
      <Route path="taikhoan" element={<ThongTinCaNhanPage />} />
      <Route path="taikhoan/bao-mat" element={<BaoMatTaiKhoanPage />} />
      <Route path="lienhe" element={<LienHeYKienPage />} />
      <Route path="tintuc" element={<TinTucPage />} />
    </>
  );
}
