import React from "react";
import { Link } from "react-router-dom";

const PatientSidebar = () => {
  return (
    <nav className="space-y-4">
      <h2 className="text-xl font-bold">Trang bệnh nhân</h2>
      <ul className="space-y-2">
        <li><Link to="/patient">🏠 Trang chủ</Link></li>
        <li><Link to="/patient/book">📅 Đặt lịch khám</Link></li>
        <li><Link to="/patient/history">📜 Lịch sử khám</Link></li>
        <li><Link to="/patient/medical-records">📁 Hồ sơ bệnh án</Link></li>
        <li><Link to="/patient/prescriptions">💊 Đơn thuốc</Link></li>
        <li><Link to="/patient/test-results">🧪 Kết quả xét nghiệm</Link></li>
        <li><Link to="/patient/profile">👤 Thông tin cá nhân</Link></li>
        <li><Link to="/patient/payment">💵 Thanh toán</Link></li>
        <li><Link to="/patient/cart">🛒 Dịch vụ</Link></li>
      </ul>
    </nav>
  );
};

export default PatientSidebar;
