"use strict";

const CORE_SEED_SQL = [
  `INSERT INTO NhomQuyen (maNhom, tenNhom, moTa) VALUES
    ('ADMIN', 'Quản trị viên', 'Có toàn quyền quản lý hệ thống'),
    ('BACSI', 'Bác sĩ', 'Quản lý khám chữa bệnh'),
    ('NHANSU', 'Nhân sự y tế', 'Quản lý nhân viên y tế'),
    ('BENHNHAN', 'Bệnh nhân', 'Đặt lịch hẹn và xem hồ sơ bệnh án')
  ON DUPLICATE KEY UPDATE
    tenNhom = VALUES(tenNhom),
    moTa = VALUES(moTa);`,

  `INSERT INTO KhoaPhong (maKhoa, tenKhoa, moTa) VALUES
    ('K001', 'Khoa Nội', 'Chuyên điều trị bệnh nội khoa'),
    ('K002', 'Khoa Ngoại', 'Chuyên phẫu thuật và điều trị ngoại khoa'),
    ('K003', 'Khoa Xét nghiệm', 'Chuyên thực hiện các xét nghiệm y học'),
    ('K004', 'Khoa Dược', 'Quản lý thuốc và cấp phát thuốc')
  ON DUPLICATE KEY UPDATE
    tenKhoa = VALUES(tenKhoa),
    moTa = VALUES(moTa);`,

  `INSERT INTO NhomThuoc (maNhom, tenNhom, moTa) VALUES
    ('NH001', 'Thuốc giảm đau', 'Các loại thuốc giảm đau, hạ sốt'),
    ('NH002', 'Thuốc kháng sinh', 'Các loại thuốc kháng sinh'),
    ('NH003', 'Thuốc tim mạch', 'Các loại thuốc điều trị bệnh tim mạch')
  ON DUPLICATE KEY UPDATE
    tenNhom = VALUES(tenNhom),
    moTa = VALUES(moTa);`,

  `INSERT INTO CaKham (maCa, tenCa, thoiGianBatDau, thoiGianKetThuc) VALUES
    ('CA001', 'Ca Sáng', '08:00:00', '12:00:00'),
    ('CA002', 'Ca Chiều', '13:00:00', '17:00:00')
  ON DUPLICATE KEY UPDATE
    tenCa = VALUES(tenCa),
    thoiGianBatDau = VALUES(thoiGianBatDau),
    thoiGianKetThuc = VALUES(thoiGianKetThuc);`,

  `INSERT INTO DonViTinh (maDVT, tenDVT, moTa) VALUES
    ('DVT001', 'Viên', 'Đơn vị tính theo viên'),
    ('DVT002', 'Vỉ', 'Đơn vị tính theo vỉ (10 viên/vỉ)'),
    ('DVT003', 'Chai', 'Đơn vị tính theo chai')
  ON DUPLICATE KEY UPDATE
    tenDVT = VALUES(tenDVT),
    moTa = VALUES(moTa);`,

  `INSERT INTO LoaiXetNghiem (maLoaiXN, tenLoai, moTa) VALUES
    ('LXN001', 'Xét nghiệm máu', 'Các xét nghiệm liên quan đến máu'),
    ('LXN002', 'Xét nghiệm nước tiểu', 'Các xét nghiệm liên quan đến nước tiểu'),
    ('LXN003', 'Xét nghiệm sinh hóa', 'Các xét nghiệm sinh hóa cơ bản')
  ON DUPLICATE KEY UPDATE
    tenLoai = VALUES(tenLoai),
    moTa = VALUES(moTa);`,

  `INSERT INTO TaiKhoan (maTK, tenDangNhap, matKhau, maNhom) VALUES
    ('SYSNS001', 'system_nhansu', '123456', 'NHANSU')
  ON DUPLICATE KEY UPDATE
    tenDangNhap = VALUES(tenDangNhap),
    matKhau = VALUES(matKhau),
    maNhom = VALUES(maNhom);`,

  `INSERT INTO NhanSuYTe (maNS, maTK, hoTen, loaiNS) VALUES
    ('SYSTEM', 'SYSNS001', 'Tự động hệ thống', 'HT')
  ON DUPLICATE KEY UPDATE
    maTK = VALUES(maTK),
    hoTen = VALUES(hoTen),
    loaiNS = VALUES(loaiNS);`,

  `INSERT INTO Thuoc (maThuoc, tenThuoc, tenHoatChat, hamLuong, maDVT, maNhom, soDangKy, nuocSanXuat, hangSanXuat, giaNhap, giaBanLe, giaBanBuon, tonKhoToiThieu, tonKhoHienTai, hanSuDung, trangThai) VALUES
    ('TH001', 'Paracetamol', 'Paracetamol', '500mg', 'DVT001', 'NH001', 'SDK001', 'Việt Nam', 'Dược phẩm Hà Nội', 10000, 12000, 11500, 10, 50, '2025-12-31', 1),
    ('TH002', 'Amoxicillin', 'Amoxicillin', '500mg', 'DVT001', 'NH002', 'SDK002', 'Việt Nam', 'Dược phẩm Sài Gòn', 15000, 18000, 17000, 5, 30, '2025-11-30', 1),
    ('TH003', 'Atorvastatin', 'Atorvastatin', '20mg', 'DVT001', 'NH003', 'SDK003', 'Thụy Sĩ', 'Pfizer', 25000, 30000, 28000, 5, 20, '2025-10-15', 1)
  ON DUPLICATE KEY UPDATE
    tenThuoc = VALUES(tenThuoc),
    tenHoatChat = VALUES(tenHoatChat),
    hamLuong = VALUES(hamLuong),
    maDVT = VALUES(maDVT),
    maNhom = VALUES(maNhom),
    soDangKy = VALUES(soDangKy),
    nuocSanXuat = VALUES(nuocSanXuat),
    hangSanXuat = VALUES(hangSanXuat),
    giaNhap = VALUES(giaNhap),
    giaBanLe = VALUES(giaBanLe),
    giaBanBuon = VALUES(giaBanBuon),
    tonKhoToiThieu = VALUES(tonKhoToiThieu),
    tonKhoHienTai = VALUES(tonKhoHienTai),
    hanSuDung = VALUES(hanSuDung),
    trangThai = VALUES(trangThai);`,

  `INSERT INTO XetNghiem (maXN, maLoaiXN, tenXN, chiPhi, thoiGianTraKetQua) VALUES
    ('XN001', 'LXN001', 'Tổng phân tích tế bào máu', 120000, '2 giờ'),
    ('XN002', 'LXN001', 'Đường huyết', 50000, '1 giờ'),
    ('XN003', 'LXN002', 'Tổng phân tích nước tiểu', 80000, '1.5 giờ'),
    ('XN004', 'LXN003', 'Chức năng gan', 150000, '3 giờ')
  ON DUPLICATE KEY UPDATE
    maLoaiXN = VALUES(maLoaiXN),
    tenXN = VALUES(tenXN),
    chiPhi = VALUES(chiPhi),
    thoiGianTraKetQua = VALUES(thoiGianTraKetQua);`,
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      for (const sql of CORE_SEED_SQL) {
        await queryInterface.sequelize.query(sql, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DELETE FROM XetNghiem WHERE maXN IN ('XN001', 'XN002', 'XN003', 'XN004');"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM Thuoc WHERE maThuoc IN ('TH001', 'TH002', 'TH003');"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM NhanSuYTe WHERE maNS = 'SYSTEM';"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM TaiKhoan WHERE maTK = 'SYSNS001';"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM LoaiXetNghiem WHERE maLoaiXN IN ('LXN001', 'LXN002', 'LXN003');"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM DonViTinh WHERE maDVT IN ('DVT001', 'DVT002', 'DVT003');"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM CaKham WHERE maCa IN ('CA001', 'CA002');"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM NhomThuoc WHERE maNhom IN ('NH001', 'NH002', 'NH003');"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM KhoaPhong WHERE maKhoa IN ('K001', 'K002', 'K003', 'K004');"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM NhomQuyen WHERE maNhom IN ('ADMIN', 'BACSI', 'NHANSU', 'BENHNHAN');"
    );
  },
};
