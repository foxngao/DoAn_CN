const db = require("../../models"); // Import toàn bộ models object (bao gồm sequelize instance)
const { LichKham, BacSi, BenhNhan, LichLamViec, CaKham, HoaDon, ChiTietHoaDon } = db; // Destructuring models cần thiết
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize"); // Import Op
const { ok, fail } = require("../../utils/apiResponse");

//  Lấy toàn bộ lịch khám
exports.getAll = async (req, res) => {
  try {
    const data = await LichKham.findAll({
      include: [
        { model: BacSi, attributes: ["hoTen"] },
        { model: BenhNhan, attributes: ["hoTen"] }
      ]
    });
    return ok(res, { message: "Lấy danh sách lịch khám", data, status: 200 });
  } catch (err) {
    return fail(res, { message: "Lỗi lấy lịch khám", errors: err.message, status: 500 });
  }
};

//  Tạo lịch khám mới (ĐÃ HOÀN THIỆN LOGIC TỰ ĐỘNG SẮP XẾP VÀ KIỂM TRA CA LÀM VIỆC)
exports.create = async (req, res) => {
  try {
    let { maBN, maBS, ngayKham, gioKham, tenKhoa, phong, ghiChu } = req.body;
    let maBacSi = maBS; 

    const today = new Date();
    const inputDate = new Date(ngayKham);

    // ⚠️ 1-4. Kiểm tra ràng buộc Ngày/Giờ
    if (inputDate < today.setHours(0, 0, 0, 0)) {
      return fail(res, { message: "❌ Không được chọn ngày trong quá khứ", status: 422 });
    }
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (inputDate > maxDate) {
      return fail(res, { message: "❌ Chỉ được đặt lịch trong vòng 30 ngày tới", status: 422 });
    }
    const ngayKhamObj = new Date(ngayKham); // Re-create Date object after modifying 'today'
    if (ngayKhamObj.getDay() === 0) {
      return fail(res, { message: "❌ Không thể đặt lịch vào Chủ nhật", status: 422 });
    }
    const gioInt = parseInt(gioKham.split(":")[0], 10);
    if (gioInt < 7 || gioInt > 17) {
      return fail(res, { message: "❌ Chỉ được đặt lịch trong giờ hành chính (7h-17h)", status: 422 });
    }
    
    // ✅ KIỂM TRA BẮT BUỘC KHOA 
    if (!tenKhoa || tenKhoa === 'undefined') {
        return fail(res, { message: "❌ Vui lòng chọn một Khoa khám bệnh hợp lệ.", status: 422 });
    }
    
    // --- LOGIC XÁC ĐỊNH BÁC SĨ (Ưu tiên lựa chọn/mã GT) ---
    
    // 1. Kiểm tra Mã giới thiệu trong Ghi chú
    const maGioiThieuMatch = ghiChu ? ghiChu.match(/(BS\d{3,})/) : null;
    const maGioiThieu = maGioiThieuMatch ? maGioiThieuMatch[0].trim() : null;
    
    if (maGioiThieu) {
      // 1a. Có mã giới thiệu: Ép buộc maBS phải khớp
      if (maGioiThieu !== maBS) {
        return fail(res, { message: `❌ Mã giới thiệu ${maGioiThieu} không khớp với Bác sĩ đã chọn (${maBS}). Vui lòng chọn đúng bác sĩ được giới thiệu.`, status: 422 });
      }
      maBacSi = maGioiThieu; // Xác nhận maBS từ mã giới thiệu
      
    } else if (!maBS) {
      // 1b. KHÔNG có mã giới thiệu VÀ không chọn bác sĩ -> Tự động sắp xếp
        
        // Xác định CaKham dựa trên gioKham
        let tenCaKham = (gioInt < 12) ? 'Ca Sáng' : 'Ca Chiều';

        const caKham = await CaKham.findOne({
            where: { tenCa: tenCaKham }
        });

        if (!caKham) {
            return fail(res, { message: `Không tìm thấy Ca Khám với tên "${tenCaKham}". Vui lòng kiểm tra dữ liệu CaKham.`, status: 422 });
        }

        // 2. Tìm tất cả Bác sĩ thuộc Khoa và có lịch làm việc trong CaKham đó
        const availableDoctors = await LichLamViec.findAll({
            attributes: ['maBS'],
            where: {
                ngayLamViec: ngayKham,
                maCa: caKham.maCa,
                maBS: { [Op.not]: null } 
            },
            include: [{
                model: BacSi,
                required: true,
                attributes: ['maBS'],
                where: {
                    maKhoa: tenKhoa, // Lọc theo maKhoa
                }
            }],
            raw: true,
            nest: true
        });

        if (availableDoctors.length === 0) {
            return fail(res, { message: `Không có bác sĩ nào thuộc khoa "${tenKhoa}" có lịch làm việc trong ca ${tenCaKham} ngày ${ngayKham}.`, status: 422 });
        }

        const doctorList = availableDoctors.map(doc => doc.maBS); 

        // 3. Tính số slot tối đa trong ca này (mỗi slot 15 phút)
        let maxSlotsPerCa = 16; // Giá trị mặc định nếu không parse được thời gian
        if (caKham.thoiGianBatDau && caKham.thoiGianKetThuc) {
            const [startH, startM] = caKham.thoiGianBatDau.split(":").map(Number);
            const [endH, endM] = caKham.thoiGianKetThuc.split(":").map(Number);
            const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
            if (durationMinutes > 0) {
                maxSlotsPerCa = Math.floor(durationMinutes / 15); // 1 slot = 15p
            }
        }

        // 4. Đếm số lượng lịch khám đã có của từng bác sĩ TRONG CA LÀM VIỆC (tính theo khoảng giờ của ca)
        const [startHour, startMinute] = (caKham.thoiGianBatDau || "07:00").split(":").map(Number);
        const [endHour, endMinute] = (caKham.thoiGianKetThuc || "11:00").split(":").map(Number);
        const startTimeStr = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
        const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;

        const existingAppointments = await LichKham.findAll({
            attributes: ['maBS', [db.sequelize.fn('COUNT', db.sequelize.col('maLich')), 'count']],
            where: {
                ngayKham: ngayKham,
                maBS: { [Op.in]: doctorList },
                gioKham: {
                    [Op.between]: [startTimeStr, endTimeStr]
                }
            },
            group: ['maBS'],
            raw: true
        });

        // 5. Tìm bác sĩ có số lượng lịch khám ít nhất (và CHƯA FULL slot trong ca)
        const appointmentMap = {};
        doctorList.forEach(id => appointmentMap[id] = 0);
        existingAppointments.forEach(item => { appointmentMap[item.maBS] = parseInt(item.count, 10); });

        let minAppointments = Infinity;
        let bestDoctor = null;

        for (const docId of doctorList) {
            const count = appointmentMap[docId];
            if (count < maxSlotsPerCa) { 
                if (count < minAppointments) {
                    minAppointments = count;
                    bestDoctor = docId;
                }
            }
        }

        if (!bestDoctor) {
            return fail(res, { message: `Không thể sắp xếp bác sĩ tự động. Tất cả bác sĩ trong ca đã đủ ${maxSlotsPerCa} lượt khám.`, status: 422 });
        }
        
        maBacSi = bestDoctor;
        ghiChu = (ghiChu ? ghiChu + ' ' : '') + `[HT: Tự sắp xếp BS ${maBacSi} - ${tenCaKham}]`; 
      
    } else {
        maBacSi = maBS; // Bác sĩ đã được chọn (hoặc từ mã GT)
    }
    
    // ===============================================
    // ✅ KIỂM TRA BÁC SĨ ĐÃ CHỌN CÓ LỊCH LÀM VIỆC KHÔNG
    // ===============================================
    if (maBacSi) {
        const gioIntCheck = parseInt(gioKham.split(":")[0], 10);
        const tenCaKhamCheck = (gioIntCheck < 12) ? 'Ca Sáng' : 'Ca Chiều';
        
        const caKhamCheck = await CaKham.findOne({ where: { tenCa: tenCaKhamCheck } });
        if (!caKhamCheck) {
             return fail(res, { message: "❌ Lỗi hệ thống: Không tìm thấy định nghĩa Ca làm việc.", status: 422 });
        }

        // Tìm LichLamViec cho bác sĩ này vào ngày này và ca này
        const lichLamViecCheck = await LichLamViec.findOne({
            where: {
                maBS: maBacSi,
                ngayLamViec: ngayKham,
                maCa: caKhamCheck.maCa
            }
        });

        if (!lichLamViecCheck) {
             return fail(res, { message: `❌ Bác sĩ ${maBacSi} không có ca làm việc vào ngày ${ngayKham} trong ${tenCaKhamCheck}. Vui lòng chọn bác sĩ khác hoặc khung giờ khác.`, status: 422 });
        }

        // 🔢 TÍNH SỐ SLOT TỐI ĐA TRONG CA (1 SLOT = 15 PHÚT)
        let maxSlotsPerCaCheck = 16;
        if (caKhamCheck.thoiGianBatDau && caKhamCheck.thoiGianKetThuc) {
            const [startH, startM] = caKhamCheck.thoiGianBatDau.split(":").map(Number);
            const [endH, endM] = caKhamCheck.thoiGianKetThuc.split(":").map(Number);
            const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
            if (durationMinutes > 0) {
                maxSlotsPerCaCheck = Math.floor(durationMinutes / 15);
            }
        }

        const [startHourC, startMinuteC] = (caKhamCheck.thoiGianBatDau || "07:00").split(":").map(Number);
        const [endHourC, endMinuteC] = (caKhamCheck.thoiGianKetThuc || "11:00").split(":").map(Number);
        const startTimeStrC = `${String(startHourC).padStart(2, "0")}:${String(startMinuteC).padStart(2, "0")}`;
        const endTimeStrC = `${String(endHourC).padStart(2, "0")}:${String(endMinuteC).padStart(2, "0")}`;

        const currentCaCount = await LichKham.count({
            where: {
                maBS: maBacSi,
                ngayKham: ngayKham,
                gioKham: {
                    [Op.between]: [startTimeStrC, endTimeStrC]
                }
            }
        });

        if (currentCaCount >= maxSlotsPerCaCheck) {
            return fail(res, { message: `❌ Ca làm việc của bác sĩ trong ${tenCaKhamCheck} ngày ${ngayKham} đã hết slot.`, status: 422 });
        }
    }


    // ⚠️ 5. Kiểm tra trùng ca khám tuyệt đối (cùng bác sĩ, cùng ngày, cùng giờ)
    if (!maBacSi) {
         return fail(res, { message: "❌ Lỗi hệ thống: Không thể xác định Bác sĩ cho lịch khám.", status: 500 });
    }

    const exists = await LichKham.findOne({
      where: { maBS: maBacSi, ngayKham, gioKham }
    });
    if (exists) {
      return fail(res, { message: `❌ Bác sĩ ${maBacSi} đã có lịch hẹn tại CHÍNH KHUNG GIỜ NÀY.`, status: 422 });
    }

    // ⚠️ 6. Mỗi bệnh nhân tối đa 2 lịch/ngày VÀ khác ca
    const lichTrongNgay = await LichKham.findAll({ where: { maBN, ngayKham } });

    // Xác định ca cho lịch mới
    const gioNew = parseInt(gioKham.split(":")[0], 10);
    const caNew = gioNew < 12 ? "SANG" : "CHIEU";

    const caDaDat = new Set();
    lichTrongNgay.forEach((lk) => {
      if (!lk.gioKham) return;
      const h = parseInt(lk.gioKham.split(":")[0], 10);
      const ca = h < 12 ? "SANG" : "CHIEU";
      caDaDat.add(ca);
    });

    // Không cho đặt 2 lịch trong cùng 1 ca
    if (caDaDat.has(caNew)) {
      return fail(res, { message: "❌ Bạn chỉ được đặt tối đa 1 lịch trong mỗi ca làm việc trong cùng một ngày.", status: 422 });
    }

    // Không cho đặt quá 2 lịch trong ngày (2 ca khác nhau)
    if (caDaDat.size >= 2) {
      return fail(res, { message: "❌ Bạn chỉ được đặt tối đa 2 lịch (2 ca khác nhau) trong cùng một ngày.", status: 422 });
    }

    // ✅ OK – Tạo lịch mới với trạng thái CHO_THANH_TOAN
    const maLich = uuidv4().slice(0, 8).toUpperCase();
    
    // ✅ Tạo hóa đơn tự động cho lịch khám
    const maHD = uuidv4().slice(0, 8).toUpperCase();
    const giaKham = 100000; // Giá khám mặc định (có thể lấy từ bảng dịch vụ sau)

    const lich = await db.sequelize.transaction(async (transaction) => {
      await HoaDon.create({
        maHD,
        maBN,
        maNS: "SYSTEM",
        tongTien: giaKham,
        trangThai: "CHUA_THANH_TOAN"
      }, { transaction });

      // Tạo chi tiết hóa đơn (dịch vụ khám)
      const maCTHD = uuidv4().slice(0, 8).toUpperCase();
      await ChiTietHoaDon.create({
        maCTHD,
        maHD,
        loaiDichVu: "KHAM",
        maDichVu: maLich, // Dùng maLich làm maDichVu
        donGia: giaKham,
        soLuong: 1,
        thanhTien: giaKham
      }, { transaction });

      // Tạo lịch với trạng thái và liên kết hóa đơn
      return LichKham.create({
        maLich,
        maBN,
        maBS: maBacSi,
        ngayKham,
        gioKham,
        tenKhoa,
        phong,
        ghiChu,
        trangThai: "CHO_THANH_TOAN",
        thoiGianTao: new Date(),
        maHD: maHD
      }, { transaction });
    });

    return ok(res, {
      message: "✅ Đặt lịch thành công! Vui lòng thanh toán trong 15 phút.",
      data: { ...lich.toJSON(), maHD, tongTien: giaKham },
      status: 201,
    });

  } catch (err) {
    console.error("❌ Lỗi tạo lịch khám:", err);
    return fail(res, { message: "❌ Lỗi tạo lịch khám", errors: err.message, status: 500 });
  }
};

// EXPORT CÁC HÀM CÒN THIẾU
exports.getByMaBN = async (req, res) => {
  try {
    const data = await LichKham.findAll({
      where: { maBN: req.params.maBN },
      include: [
        { model: BacSi, attributes: ["hoTen"] },
        { model: BenhNhan, attributes: ["hoTen"] }
      ],
      order: [["thoiGianTao", "DESC"]] // Sắp xếp theo thời gian tạo mới nhất
    });
    return ok(res, { message: "Lấy lịch theo bệnh nhân thành công", data, status: 200 });
  } catch (err) {
    return fail(res, { message: "Lỗi lấy lịch theo maBN", errors: err.message, status: 500 });
  }
};

exports.update = async (req, res) => {
  try {
    const { ngayKham, gioKham, phong, ghiChu } = req.body;
    const [updated] = await LichKham.update(
      { ngayKham, gioKham, phong, ghiChu },
      { where: { maLich: req.params.id } }
    );
    if (updated === 0)
      return fail(res, { message: "Không tìm thấy lịch để cập nhật", status: 404 });

    return ok(res, { message: "Cập nhật thành công", data: null, status: 200 });
  } catch (err) {
    return fail(res, { message: "Lỗi cập nhật lịch khám", errors: err.message, status: 500 });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await LichKham.destroy({ where: { maLich: req.params.id } });
    if (deleted === 0)
      return fail(res, { message: "Không tìm thấy lịch để xoá", status: 404 });
    return ok(res, { message: "Xoá thành công", data: null, status: 200 });
  } catch (err) {
    return fail(res, { message: "Lỗi xoá lịch khám", errors: err.message, status: 500 });
  }
};

exports.checkTrungLich = async (req, res) => {
  try {
    const { maBS, ngay, gio } = req.query;

    const exists = await LichKham.findOne({
      where: {
        maBS,
        ngayKham: ngay,
        gioKham: gio
      }
    });

    return ok(res, { message: "Kiểm tra trùng lịch thành công", data: { trung: !!exists }, status: 200 });
  } catch (err) {
    return fail(res, { message: "Lỗi kiểm tra lịch", errors: err.message, status: 500 });
  }
};

exports.getByMaBS = async (req, res) => {
  try {
    const maBS = req.params.maBS; 
    
    if (!maBS) {
       return fail(res, { message: "❌ Thiếu mã bác sĩ (maBS) trong tham số URL.", status: 422 });
    }

    const data = await LichKham.findAll({
      where: { maBS: maBS }, // Lọc theo maBS từ URL
      include: [
        { model: BacSi, attributes: ["hoTen"] },
        { model: BenhNhan, attributes: ["hoTen"] }
      ],
      order: [["ngayKham", "DESC"]] // Sắp xếp theo ngày mới nhất
    });
    return ok(res, { message: "Lấy lịch hẹn theo bác sĩ thành công", data, status: 200 });
  } catch (err) {
    return fail(res, { message: "Lỗi lấy lịch hẹn theo bác sĩ", errors: err.message, status: 500 });
  }
};
