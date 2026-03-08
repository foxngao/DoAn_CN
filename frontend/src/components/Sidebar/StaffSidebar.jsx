import React from "react";
import { Link } from "react-router-dom";

const StaffSidebar = () => {
  return (
    <nav className="space-y-4">
      <h2 className="text-xl font-bold">Trang nhân viên y tế</h2>
      <ul className="space-y-2">
        <li><Link to="/staff/reception">📥 Tiếp nhận</Link></li>
        <li><Link to="/staff/nursing">🩺 Điều dưỡng</Link></li>
        <li><Link to="/staff/assistant">📋 Trợ lý bác sĩ</Link></li>
        <li><Link to="/staff/laboratory">🧪 Nhân viên xét nghiệm</Link></li>
        <li><Link to="/staff/administration">🏢 Hành chính</Link></li>
        <li><Link to="/staff/accounting">💰 Kế toán</Link></li>
      </ul>
    </nav>
  );
};

export default StaffSidebar;
