import React from "react";
import { Link } from "react-router-dom";

const DoctorSidebar = () => {
  return (
    <nav className="space-y-4">
      <h2 className="text-xl font-bold">Trang bác sĩ</h2>
      <ul className="space-y-2">
        <li><Link to="/doctor">🏠 Trang chủ</Link></li>
        <li><Link to="/doctor/schedule">📅 Lịch làm việc</Link></li>
        <li><Link to="/doctor/appointments">📋 Lịch hẹn</Link></li>
        <li><Link to="/doctor/examination">🩺 Khám bệnh</Link></li>
        <li><Link to="/doctor/records">📁 Hồ sơ bệnh án</Link></li>
        <li><Link to="/doctor/prescriptions">💊 Kê đơn thuốc</Link></li>
        <li><Link to="/doctor/tests">🧪 Yêu cầu xét nghiệm</Link></li>
        <li><Link to="/doctor/test-results">📄 Kết quả xét nghiệm</Link></li>
        <li><Link to="/doctor/patient-info">👨‍⚕️ Thông tin bệnh nhân</Link></li>
      </ul>
    </nav>
  );
};

export default DoctorSidebar;
