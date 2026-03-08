import React from "react";
import { Link } from "react-router-dom";

const AdminSidebar = () => {
  return (
    <nav className="space-y-4">
      <h2 className="text-xl font-bold">Quản trị hệ thống</h2>
      <ul className="space-y-2">
        <li><Link to="/admin">🏠 Trang chủ</Link></li>
        <li><Link to="/admin/accounts">👤 Quản lý tài khoản</Link></li>
        <li><Link to="/admin/permissions">🔐 Phân quyền</Link></li>
        <li><Link to="/admin/departments">🏥 Phòng ban - Khoa</Link></li>
        <li><Link to="/admin/staff">👨‍⚕️ Nhân sự y tế</Link></li>
        <li><Link to="/admin/medicines">💊 Thuốc & Đơn vị tính</Link></li>
        <li><Link to="/admin/tests">🧪 Xét nghiệm</Link></li>
        <li><Link to="/admin/invoices">📄 Hóa đơn</Link></li>
        <li><Link to="/admin/reports">📊 Báo cáo</Link></li>
      </ul>
    </nav>
  );
};

export default AdminSidebar;
