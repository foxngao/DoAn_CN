import React, { useState } from "react";
import { getGioHang, isCartNotFoundError } from "../../services/hoadon_BN/hoadonService";

const GioHangBenhNhan = () => {
  const [maBN, setMaBN] = useState("");
  const [gioHang, setGioHang] = useState([]);

  const fetchGioHang = async () => {
    try {
      const res = await getGioHang(maBN);
      setGioHang(res.data.data?.chiTiet || []);
    } catch (err) {
      if (isCartNotFoundError(err)) {
        setGioHang([]);
        return;
      }

      console.error("❌ Không tìm thấy giỏ hàng:", err);
      alert("❌ Bệnh nhân chưa có giỏ hàng.");
      setGioHang([]);
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="font-semibold text-blue-700 text-lg">🛒 Giỏ hàng bệnh nhân</h3>
      <div className="flex gap-2 mb-2">
        <input
          value={maBN}
          onChange={(e) => setMaBN(e.target.value)}
          placeholder="Mã BN"
          className="border px-2 py-1 rounded w-64"
        />
        <button
          onClick={fetchGioHang}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          🔍 Tìm
        </button>
      </div>
      <table className="min-w-full text-sm border bg-white shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Loại DV</th>
            <th>Mã DV</th>
            <th>Giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {gioHang.map((g, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{g.loaiDichVu}</td>
              <td>{g.maDichVu}</td>
              <td>{g.donGia}</td>
              <td>{g.thanhTien}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default GioHangBenhNhan;
