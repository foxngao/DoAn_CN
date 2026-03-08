import React, { useEffect, useState } from "react";
import axios from "../../../api/axiosClient";
import dayjs from "dayjs";

const LichLamViecBacSiPage = () => {
  const [list, setList] = useState([]);
  const [caList, setCaList] = useState([]);
  const [bacSiList, setBacSiList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(dayjs().startOf('week').format('YYYY-MM-DD'));
  const [selectedBacSi, setSelectedBacSi] = useState("all"); // "all" hoặc maBS cụ thể

  // Tính toán các ngày trong tuần
  const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(dayjs(startDate).add(i, 'day'));
    }
    return days;
  };

  const weekDays = getWeekDays(selectedWeek);

  useEffect(() => {
    fetchData();
    fetchCaList();
    fetchBacSiList();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/lichlamviec");
      setList(res.data.data || []);
    } catch (err) {
      console.error("❌ Lỗi khi tải lịch làm việc:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaList = async () => {
    try {
      const res = await axios.get("/catruc");
      setCaList(res.data.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách ca:", err);
    }
  };

  const fetchBacSiList = async () => {
    try {
      const res = await axios.get("/bacsi");
      setBacSiList(res.data.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách bác sĩ:", err);
    }
  };

  // Lấy số lượng bệnh nhân đã đặt trong mỗi ca
  const getSoLuongBenhNhan = async (maBS, maCa, ngayLamViec) => {
    try {
      const res = await axios.get("/lichlamviec/soluong", {
        params: { maBS, maCa, ngayLamViec: dayjs(ngayLamViec).format('YYYY-MM-DD') }
      });
      return res.data.data || { soLuong: 0, toiDa: 10, conLai: 10 };
    } catch (err) {
      return { soLuong: 0, toiDa: 10, conLai: 10 };
    }
  };

  // Lọc lịch theo bác sĩ được chọn
  const filteredList = selectedBacSi === "all" 
    ? list 
    : list.filter(l => l.maBS === selectedBacSi || l.BacSi?.maBS === selectedBacSi);

  // Lấy danh sách bác sĩ có lịch trong tuần
  const bacSiInWeek = Array.from(
    new Set(
      filteredList
        .filter(l => {
          const lichDateStr = dayjs(l.ngayLamViec).format('YYYY-MM-DD');
          const weekStartStr = dayjs(selectedWeek).format('YYYY-MM-DD');
          const weekEndStr = dayjs(selectedWeek).add(7, 'day').format('YYYY-MM-DD');
          return lichDateStr >= weekStartStr && lichDateStr < weekEndStr;
        })
        .map(l => l.maBS || l.BacSi?.maBS)
        .filter(Boolean)
    )
  );

  // Lấy lịch làm việc cho một ngày và ca cụ thể
  const getLichForDayAndCa = (date, maCa) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return filteredList.filter(l => {
      const lichDate = dayjs(l.ngayLamViec).format('YYYY-MM-DD');
      const lichCa = l.maCa || l.CaKham?.maCa;
      return lichDate === dateStr && lichCa === maCa;
    });
  };

  // Component hiển thị số lượng bệnh nhân
  const SoLuongBadge = ({ maBS, maCa, ngayLamViec }) => {
    const [soLuong, setSoLuong] = useState({ soLuong: 0, toiDa: 10, conLai: 10 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const load = async () => {
        if (maBS) {
          const data = await getSoLuongBenhNhan(maBS, maCa, ngayLamViec);
          setSoLuong(data);
        }
        setLoading(false);
      };
      load();
    }, [maBS, maCa, ngayLamViec]);

    if (loading || !maBS) {
      return <span className="text-xs text-gray-400">...</span>;
    }

    const isFull = soLuong.soLuong >= soLuong.toiDa;
    return (
      <span className={`text-xs px-2 py-1 rounded ${
        isFull 
          ? 'bg-red-100 text-red-700 font-bold' 
          : soLuong.soLuong >= soLuong.toiDa * 0.8
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-green-100 text-green-700'
      }`}>
        {soLuong.soLuong}/{soLuong.toiDa}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">📅 Lịch Làm Việc Của Bác Sĩ</h2>
        <p className="text-gray-600">Xem lịch làm việc của tất cả bác sĩ - Mỗi ca tối đa 10 người</p>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Lọc theo bác sĩ:</label>
            <select
              value={selectedBacSi}
              onChange={(e) => setSelectedBacSi(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả bác sĩ</option>
              {bacSiList.map((bs) => (
                <option key={bs.maBS} value={bs.maBS}>
                  {bs.hoTen} ({bs.capBac || 'Bác sĩ điều trị'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Xem tuần:</label>
            <button
              onClick={() => setSelectedWeek(dayjs(selectedWeek).subtract(1, 'week').format('YYYY-MM-DD'))}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              ← Tuần trước
            </button>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(dayjs(e.target.value).startOf('week').format('YYYY-MM-DD'))}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setSelectedWeek(dayjs(selectedWeek).add(1, 'week').format('YYYY-MM-DD'))}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              Tuần sau →
            </button>
            <button
              onClick={() => setSelectedWeek(dayjs().startOf('week').format('YYYY-MM-DD'))}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
            >
              Tuần này
            </button>
          </div>
        </div>
      </div>

      {/* Thời khóa biểu */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Thời Khóa Biểu</h3>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-4">Đang tải lịch làm việc...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Ca / Ngày</th>
                  {weekDays.map((day, idx) => (
                    <th key={idx} className="border border-gray-300 px-4 py-3 text-center font-semibold min-w-[200px]">
                      <div>{day.format('dddd')}</div>
                      <div className="text-sm font-normal">{day.format('DD/MM/YYYY')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caList.map((ca) => (
                  <tr key={ca.maCa} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-semibold">
                      <div className="font-bold text-blue-700">{ca.tenCa}</div>
                      <div className="text-xs text-gray-600">{ca.thoiGianBatDau} - {ca.thoiGianKetThuc}</div>
                    </td>
                    {weekDays.map((day, dayIdx) => {
                      const lichList = getLichForDayAndCa(day, ca.maCa);
                      
                      return (
                        <td key={dayIdx} className="border border-gray-300 px-4 py-3 text-center align-top">
                          {lichList.length > 0 ? (
                            <div className="space-y-2">
                              {lichList.map((lich) => {
                                const bacSi = lich.BacSi || {};
                                const maBS = lich.maBS || bacSi.maBS;
                                return (
                                  <div key={lich.maLichLV} className="bg-green-100 border-2 border-green-400 rounded-lg p-3">
                                    <div className="text-sm font-semibold text-green-800 mb-1">
                                      ✅ {bacSi.hoTen || 'Bác sĩ'}
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1">
                                      {bacSi.capBac || 'Bác sĩ điều trị'}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">
                                      Mã: {lich.maLichLV}
                                    </div>
                                    {maBS && (
                                      <SoLuongBadge maBS={maBS} maCa={ca.maCa} ngayLamViec={day} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm py-4">
                              Chưa có lịch
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">Tổng số ca đã đăng ký</div>
          <div className="text-2xl font-bold text-blue-700">{filteredList.length}</div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 p-4 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">Ca trong tuần này</div>
          <div className="text-2xl font-bold text-green-700">
            {filteredList.filter(l => {
              const lichDateStr = dayjs(l.ngayLamViec).format('YYYY-MM-DD');
              const weekStartStr = dayjs(selectedWeek).format('YYYY-MM-DD');
              const weekEndStr = dayjs(selectedWeek).add(7, 'day').format('YYYY-MM-DD');
              return lichDateStr >= weekStartStr && lichDateStr < weekEndStr;
            }).length}
          </div>
        </div>
        <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">Số bác sĩ có lịch</div>
          <div className="text-2xl font-bold text-purple-700">{bacSiInWeek.length}</div>
        </div>
      </div>
    </div>
  );
};

export default LichLamViecBacSiPage;
