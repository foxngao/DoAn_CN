import React, { useEffect, useState } from "react";
import {
  getTroLyList,
  createTroLy,
  updateTroLy,
  deleteTroLy,
} from "../../../services/troly/trolyService";

const TroLyBacSiPage = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({});
  const [isEdit, setIsEdit] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.maNhom === "ADMIN";

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    try {
      const res = await getTroLyList();
      const raw = res.data?.data?.items || [];
      setList(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách trợ lý:", err);
      alert("Lỗi tải danh sách trợ lý");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (item) => {
    setForm(item);
    setIsEdit(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá trợ lý này?")) return;
    await deleteTroLy(id);
    fetchList();
  };

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        await updateTroLy(form.maTroLy, form);
      } else {
        await createTroLy(form);
      }
      setForm({});
      setIsEdit(false);
      fetchList();
    } catch (err) {
      alert("Lỗi xử lý: " + (err?.response?.data?.message || "Server error"));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-blue-700">👩‍⚕️ Quản lý trợ lý bác sĩ</h2>

      {/* Table */}
      <div className="overflow-x-auto rounded shadow">
        <table className="min-w-full text-sm bg-white border border-gray-200">
          <thead className="bg-blue-100 text-gray-800">
            <tr>
              <th className="px-3 py-2 text-left">Mã trợ lý</th>
              <th className="px-3 py-2 text-left">Mã nhân sự</th>
              <th className="px-3 py-2 text-left">Mã bác sĩ</th>
              <th className="px-3 py-2 text-left">Phạm vi uỷ quyền</th>
              {isAdmin && <th className="px-3 py-2 text-left">Hành động</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.maTroLy} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{t.maTroLy}</td>
                <td className="px-3 py-2">{t.maNS}</td>
                <td className="px-3 py-2">{t.maBacSi}</td>
                <td className="px-3 py-2">{t.phamViUyQuyen}</td>
                {isAdmin && (
                  <td className="px-3 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="text-blue-600 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(t.maTroLy)}
                      className="text-red-600 hover:underline"
                    >
                      Xoá
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form */}
      {isAdmin && (
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h3 className="text-lg font-semibold text-blue-700">
            {isEdit ? "✏️ Cập nhật trợ lý" : "➕ Thêm mới trợ lý"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="maNS"
              value={form.maNS || ""}
              onChange={handleChange}
              placeholder="Mã nhân sự"
              className="border rounded px-3 py-2 w-full"
            />
            <input
              name="maBacSi"
              value={form.maBacSi || ""}
              onChange={handleChange}
              placeholder="Mã bác sĩ"
              className="border rounded px-3 py-2 w-full"
            />
            <textarea
              name="phamViUyQuyen"
              value={form.phamViUyQuyen || ""}
              onChange={handleChange}
              placeholder="Phạm vi uỷ quyền"
              rows={3}
              className="border rounded px-3 py-2 col-span-1 md:col-span-2"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          >
            {isEdit ? "💾 Cập nhật" : "➕ Thêm trợ lý"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TroLyBacSiPage;
