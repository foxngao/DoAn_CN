import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../auth/PrivateRoute"; //  import route bảo vệ
import {
  HomePage,
  LoginPage,
  RegisterPage,
  NotFoundPage,
  AdminLayout,
  DoctorLayout,
  PatientLayout,
  YtaLayout,
  XetNghiemLayout,
  TiepNhanLayout,
  ForgotPasswordPage,
  PaymentResultPage,
} from "./lazyPages";
import { renderAdminRoutes } from "./adminRoutes";
import { renderPatientRoutes } from "./patientRoutes";
import {
  renderDoctorRoutes,
  renderYtaRoutes,
  renderXetNghiemRoutes,
  renderTiepNhanRoutes,
} from "./staffRoutes";
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
          {renderAdminRoutes()}
        </Route>
      </Route>

      <Route path="/doctor" element={<PrivateRoute />}>
          <Route element={<DoctorLayout />}>
            {renderDoctorRoutes()}
          </Route>
      </Route>

      {/* Các route layout khác  */}
    

      <Route path="/patient" element={<PrivateRoute />}>
        <Route element={<PatientLayout />}>
          {renderPatientRoutes()}
        </Route>
      </Route>

      <Route path="/yta" element={<PrivateRoute />}>
        <Route element={<YtaLayout />}>
          {renderYtaRoutes()}
        </Route>
      </Route>



      <Route path="/xetnghiem" element={<PrivateRoute />}>
        <Route element={<XetNghiemLayout />}>
          {renderXetNghiemRoutes()}
        </Route>
      </Route>


      <Route path="/tiepnhan" element={<PrivateRoute />}>
        <Route element={<TiepNhanLayout />}>
          {renderTiepNhanRoutes()}
        </Route>
      </Route>


      {/* Điều hướng mặc định và 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;
