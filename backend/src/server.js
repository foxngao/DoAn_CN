const app = require("./app");
const db = require("./models");
const { TaiKhoan, NhanSuYTe } = db;
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const chatService = require("./chat/chatService"); 
const env = require("./config/env");
const logger = require("./utils/logger");
const { createSocketCorsOptions } = require("./config/originPolicy");
const { createSocketAuthMiddleware } = require("./chat/socketAuth");

const PORT = process.env.PORT || 4000;
const SECRET_KEY = env.JWT_SECRET;
const SOCKET_SLOW_THRESHOLD_MS = env.SOCKET_SLOW_THRESHOLD_MS;

function logSocketEventPerformance(eventName, socket, startedAt, meta = {}) {
  const durationMs = Date.now() - startedAt;
  const payload = {
    eventName,
    socketId: socket.id,
    maTK: socket.user?.maTK,
    maNhom: socket.user?.maNhom,
    durationMs,
    ...meta,
  };

  if (durationMs >= SOCKET_SLOW_THRESHOLD_MS) {
    logger.warn("Socket event slow", payload);
    return;
  }

  logger.info("Socket event completed", payload);
}

function logSocketEventError(eventName, socket, error, meta = {}) {
  logger.error("Socket event failed", {
    eventName,
    socketId: socket.id,
    maTK: socket.user?.maTK,
    maNhom: socket.user?.maNhom,
    errorMessage: error?.message,
    ...meta,
  });
}

// Tạo HTTP server từ Express app
const server = http.createServer(app);

// Khởi tạo Socket.IO server
const io = new Server(server, {
  cors: createSocketCorsOptions(),
});

// Cache để lưu trữ các yêu cầu đang chờ xử lý (requestKey -> { senderId, receiverId, timestamp })
const pendingRequests = {}; 

// Middleware xác thực JWT cho MỖI kết nối Socket.IO
io.use(
  createSocketAuthMiddleware({
    secretKey: SECRET_KEY,
    logger,
  })
);

// Xử lý các sự kiện khi client kết nối
io.on("connection", (socket) => {
  console.log(`✅ User đã kết nối: ${socket.user.tenDangNhap} (Socket ID: ${socket.id})`);

  // Tự động cho user tham gia vào một "phòng" riêng theo 'maTK' của họ.
  socket.join(socket.user.maTK); 

  // === 1. Yêu cầu Chat (Người gửi: A) ===
  socket.on("requestChat", async ({ receiverId }) => {
    const startedAt = Date.now();
    const telemetry = {
      receiverId,
      outcome: "unknown",
      mode: "unknown",
    };

    const senderId = socket.user.maTK;
    if (senderId === receiverId) {
      telemetry.outcome = "ignored_self_receiver";
      return;
    }

    try {
      // ✅ Kiểm tra xem có cần chấp nhận không (chỉ bệnh nhân chat với admin/y tá)
      const receiverUser = await TaiKhoan.findByPk(receiverId, {
        attributes: ["maTK", "maNhom"],
      });
      
      if (!receiverUser) {
        telemetry.outcome = "receiver_not_found";
        return socket.emit("chatError", { message: "Không tìm thấy thông tin người dùng." });
      }

      // Kiểm tra xem receiver có phải admin hoặc y tá không
      let isReceiverAdminOrYTa = false;
      if (receiverUser.maNhom === 'ADMIN') {
        isReceiverAdminOrYTa = true;
      } else if (receiverUser.maNhom === 'NHANSU') {
        const nhanSu = await NhanSuYTe.findOne({ where: { maTK: receiverId } });
        if (nhanSu && nhanSu.loaiNS === 'YT') {
          isReceiverAdminOrYTa = true;
        }
      }

      // ✅ CHỈ BỆNH NHÂN mới có thể gửi yêu cầu chat tới admin/y tá (cần chấp nhận)
      // Admin/y tá chat với bệnh nhân sẽ tự động tạo phòng (không cần chấp nhận)
      const isSenderBenhNhan = socket.user.maNhom === 'BENHNHAN';
      const needsAcceptance = isSenderBenhNhan && isReceiverAdminOrYTa;

      if (needsAcceptance) {
        telemetry.mode = "needs_acceptance";
        // Cần chấp nhận: gửi yêu cầu
        const requestKey = [senderId, receiverId].sort().join('_');
        if (pendingRequests[requestKey]) {
          telemetry.outcome = "duplicate_request";
          return socket.emit("chatError", { message: "Yêu cầu đã được gửi trước đó. Vui lòng chờ." });
        }
        
        // Kiểm tra xem phòng có tồn tại và đã hết hạn chưa
        const existingRoom = await chatService.findRoom(senderId, receiverId);
        if (existingRoom && existingRoom.trangThai === 'EXPIRED') {
          // Nếu phòng đã hết hạn, xóa và tạo yêu cầu mới
          await db.ChatRooms.update(
            { trangThai: 'PENDING' },
            { where: { roomName: existingRoom.roomName } }
          );
        }
        
        // Lưu trạng thái yêu cầu đang chờ
        pendingRequests[requestKey] = { senderId, receiverId, timestamp: Date.now() };

        // Gửi sự kiện "chatRequest" đến người nhận
        const senderInfo = { maTK: senderId, tenDangNhap: socket.user.tenDangNhap, maNhom: socket.user.maNhom };
        io.to(receiverId).emit("chatRequest", senderInfo);
        
        // Báo lại cho người gửi là đã gửi yêu cầu thành công
        socket.emit("requestSent", { receiverId });
        telemetry.outcome = "request_sent";

        console.log(`💬 Yêu cầu chat từ ${socket.user.tenDangNhap} (Bệnh nhân) tới ${receiverId} (Admin/Y tá) - Cần chấp nhận.`);
        
        // Xóa yêu cầu khỏi cache sau 5 phút nếu chưa được chấp nhận
        setTimeout(() => {
          if (pendingRequests[requestKey]) {
            delete pendingRequests[requestKey];
            io.to(senderId).emit("chatRejected", { rejecterId: receiverId, message: "Yêu cầu chat đã hết hạn." });
            console.log(`💬 Yêu cầu chat ${requestKey} đã hết hạn.`);
          }
        }, 5 * 60 * 1000);
      } else {
        telemetry.mode = "auto_activate";
        // Không cần chấp nhận: tự động tạo phòng và join
        const roomName = await chatService.createRoom(senderId, receiverId, new Date());
        
        socket.join(roomName);
        try {
          const receiverSockets = await io.in(receiverId).fetchSockets();
          receiverSockets.forEach(s => s.join(roomName));
        } catch (err) {
          console.error("Lỗi join room cho receiver:", err);
        }
        
        const history = await chatService.getRoomHistory(roomName);
        socket.emit("chatAccepted", { roomName, partnerId: receiverId });
        socket.emit("roomHistory", { room: roomName, history });
        
        io.to(receiverId).emit("chatAccepted", { roomName, partnerId: senderId });
        io.to(receiverId).emit("roomHistory", { room: roomName, history });
        telemetry.outcome = "room_auto_activated";
        
        console.log(`✅ Chat tự động kích hoạt giữa ${socket.user.tenDangNhap} và ${receiverId}`);
      }
    } catch (error) {
      telemetry.outcome = "error";
      console.error("Lỗi khi xử lý yêu cầu chat:", error);
      logSocketEventError("requestChat", socket, error, telemetry);
      socket.emit("chatError", { message: "Lỗi hệ thống khi xử lý yêu cầu chat" });
    } finally {
      if (telemetry.outcome !== "error") {
        logSocketEventPerformance("requestChat", socket, startedAt, telemetry);
      }
    }
  });
  
  // === 2. Chấp nhận yêu cầu chat (Người nhận: B) ===
  socket.on("acceptChat", async ({ requesterId }) => {
    try {
      const accepterId = socket.user.maTK;
      const requestKey = [requesterId, accepterId].sort().join('_');
      
      if (pendingRequests[requestKey]) {
          delete pendingRequests[requestKey];
      }

      // 2a. Tạo/Tìm phòng chat và set thời gian bắt đầu chat
      const thoiGianBatDauChat = new Date();
      const roomName = await chatService.createRoom(requesterId, accepterId, thoiGianBatDauChat);

      // 2b. Cho người chấp nhận (accepter) tham gia phòng
      socket.join(roomName); 
      
      // 2c. Cho tất cả các socket của requester tham gia phòng
      try {
        const requesterSockets = await io.in(requesterId).fetchSockets();
        requesterSockets.forEach(s => s.join(roomName));
      } catch (err) {
        console.error("Lỗi join room cho requester:", err);
      }
      
      // 2d. Load lịch sử tin nhắn
      const history = await chatService.getRoomHistory(roomName);
      
      // 2e. Gửi sự kiện "chatAccepted" và lịch sử đến cả 2 người (kèm thời gian bắt đầu)
      io.to(requesterId).emit("chatAccepted", { 
        roomName, 
        partnerId: accepterId,
        thoiGianBatDauChat: thoiGianBatDauChat.toISOString()
      });
      io.to(requesterId).emit("roomHistory", { room: roomName, history });
      
      socket.emit("chatAccepted", { 
        roomName, 
        partnerId: requesterId,
        thoiGianBatDauChat: thoiGianBatDauChat.toISOString()
      });
      socket.emit("roomHistory", { room: roomName, history });
      
      console.log(`✅ ${socket.user.tenDangNhap} đã chấp nhận chat. Phòng ${roomName} đã được kích hoạt. Thời gian: ${thoiGianBatDauChat.toISOString()}`);
    } catch (error) {
      console.error("Lỗi khi chấp nhận chat:", error);
      socket.emit("chatError", { message: "Không thể chấp nhận yêu cầu chat" });
    }
  });
  
  // === 3. Từ chối yêu cầu chat (Người nhận: B) ===
  socket.on("rejectChat", ({ requesterId }) => {
    const rejecterId = socket.user.maTK;
    const requestKey = [requesterId, rejecterId].sort().join('_');
    
    if (pendingRequests[requestKey]) {
        delete pendingRequests[requestKey];
    }
    
    // Gửi thông báo từ chối đến người yêu cầu
    io.to(requesterId).emit("chatRejected", { rejecterId });
    
    console.log(`❌ ${socket.user.tenDangNhap} đã từ chối chat từ ${requesterId}.`);
  });

  // === 4. Mở lại phòng chat đã kích hoạt hoặc xem lịch sử (Khác với joinRoom cũ) ===
  socket.on("openActiveRoom", async ({ receiverId }) => {
    const startedAt = Date.now();
    const telemetry = {
      receiverId,
      outcome: "unknown",
    };

    try {
        const senderId = socket.user.maTK;
        const existingRoom = await chatService.findRoom(senderId, receiverId);
        
        if (!existingRoom) {
             telemetry.outcome = "room_not_found";
             // Nếu không tìm thấy phòng (chưa chat lần nào), trả về lịch sử rỗng và không join room
             return socket.emit("roomHistory", { room: null, history: [] });
        }
        
        const roomName = existingRoom.roomName;
        
        // ✅ Kiểm tra thời gian 15 phút nếu là bệnh nhân chat với admin/y tá
        if (socket.user.maNhom === 'BENHNHAN') {
          const receiverUser = await TaiKhoan.findByPk(receiverId, {
            attributes: ['maTK', 'maNhom'],
          });

          if (receiverUser) {
          let isReceiverAdminOrYTa = false;
          if (receiverUser.maNhom === 'ADMIN') {
            isReceiverAdminOrYTa = true;
          } else if (receiverUser.maNhom === 'NHANSU') {
            const nhanSu = await NhanSuYTe.findOne({ where: { maTK: receiverId } });
            if (nhanSu && nhanSu.loaiNS === 'YT') {
              isReceiverAdminOrYTa = true;
            }
          }
          
          const needsTimeLimit = isReceiverAdminOrYTa;
          
          if (needsTimeLimit && !chatService.isChatActive(existingRoom)) {
            // Hết thời gian: cập nhật trạng thái
            await db.ChatRooms.update(
              { trangThai: 'EXPIRED' },
              { where: { roomName } }
            );
            
            // Gửi thông báo hết thời gian
            socket.emit("chatExpired", { 
              message: "Cuộc trò chuyện đã hết hạn (15 phút). Vui lòng gửi yêu cầu chat mới." 
            });
            
            // Vẫn trả về lịch sử nhưng với trạng thái EXPIRED
            const history = await chatService.getRoomHistory(roomName);
            telemetry.outcome = "room_expired";
            return socket.emit("roomHistory", { 
              room: roomName, 
              history,
              trangThai: 'EXPIRED',
              message: "Cuộc trò chuyện đã hết hạn (15 phút). Vui lòng gửi yêu cầu chat mới."
            });
          }
          }
        }
        
        // Join phòng socket để nhận tin nhắn mới
        socket.join(roomName);
        console.log(`User ${socket.user.tenDangNhap} đã mở lại phòng: ${roomName}`);
        
        // Load lịch sử tin nhắn
        const history = await chatService.getRoomHistory(roomName);
        telemetry.outcome = "room_opened";
        socket.emit("roomHistory", { 
          room: roomName, 
          history,
          trangThai: existingRoom.trangThai,
          thoiGianBatDauChat: existingRoom.thoiGianBatDauChat ? existingRoom.thoiGianBatDauChat.toISOString() : null
        });
        
    } catch (error) {
       telemetry.outcome = "error";
       console.error("Lỗi khi mở lại phòng:", error);
       logSocketEventError("openActiveRoom", socket, error, telemetry);
       socket.emit("chatError", { message: "Không thể mở lại phòng" });
    } finally {
      if (telemetry.outcome !== "error") {
        logSocketEventPerformance("openActiveRoom", socket, startedAt, telemetry);
      }
    }
  });
  
  // === 5. Gửi tin nhắn (Kiểm tra phòng đã được tạo và thời gian 15 phút) ===
  socket.on("sendMessage", async (data) => {
    const startedAt = Date.now();
    const telemetry = {
      receiverId: data?.receiverId,
      outcome: "unknown",
      messageLength: data?.message?.trim ? data.message.trim().length : 0,
    };

    try {
      const { receiverId, message } = data; 
      const senderId = socket.user.maTK; 
      
      if (!receiverId || !message || !message.trim()) { 
        telemetry.outcome = "invalid_payload";
        return socket.emit("chatError", { message: "Thiếu thông tin người nhận hoặc tin nhắn" }); 
      }
      
      // KIỂM TRA PHÒNG ĐÃ ĐƯỢC TẠO CHƯA (phòng phải tồn tại trong DB)
      const existingRoom = await chatService.findRoom(senderId, receiverId);
      if (!existingRoom) {
          telemetry.outcome = "room_not_found";
          return socket.emit("chatError", { message: "Phòng chat chưa được kích hoạt. Vui lòng gửi yêu cầu chat trước." });
      }
      
      // ✅ KIỂM TRA THỜI GIAN 15 PHÚT (chỉ cho bệnh nhân chat với admin/y tá)
      if (socket.user.maNhom === 'BENHNHAN') {
        const receiverUser = await TaiKhoan.findByPk(receiverId, {
          attributes: ['maTK', 'maNhom'],
        });

        if (receiverUser) {
        let isReceiverAdminOrYTa = false;
        if (receiverUser.maNhom === 'ADMIN') {
          isReceiverAdminOrYTa = true;
        } else if (receiverUser.maNhom === 'NHANSU') {
          const nhanSu = await NhanSuYTe.findOne({ where: { maTK: receiverId } });
          if (nhanSu && nhanSu.loaiNS === 'YT') {
            isReceiverAdminOrYTa = true;
          }
        }
        
        const needsTimeLimit = isReceiverAdminOrYTa;
        
        if (needsTimeLimit) {
          // Kiểm tra thời gian 15 phút
          if (!chatService.isChatActive(existingRoom)) {
            // Hết thời gian: cập nhật trạng thái và yêu cầu chấp nhận lại
            await db.ChatRooms.update(
              { trangThai: 'EXPIRED' },
              { where: { roomName: existingRoom.roomName } }
            );
            
            // Gửi thông báo hết thời gian đến cả 2 người
            io.to(existingRoom.roomName).emit("chatExpired", { 
              message: "Cuộc trò chuyện đã hết hạn (15 phút). Vui lòng gửi yêu cầu chat mới." 
            });
            
            return socket.emit("chatError", { 
              message: "Cuộc trò chuyện đã hết hạn (15 phút). Vui lòng gửi yêu cầu chat mới." 
            });
          }
        }
        }
      }
      
      const roomName = existingRoom.roomName; 

      // 1. Lưu tin nhắn vào CSDL
      const savedMessage = await chatService.saveMessage({
        room: roomName,
        senderId,
        receiverId,
        message: message.trim()
      });

      if (!savedMessage) { 
         throw new Error("Không thể lưu tin nhắn"); 
      }

      // 2. Đảm bảo sender join room để nhận message realtime trong phiên hiện tại
      socket.join(roomName);

      // 3. Gửi tin nhắn đến TẤT CẢ client đang ở trong phòng đó
      const messageData = {
        ...savedMessage.toJSON(), 
        // Gửi kèm thông tin người gửi để hiển thị
        Sender: { 
          tenDangNhap: socket.user.tenDangNhap, 
          maTK: socket.user.maTK 
        } 
      };
      
      io.to(roomName).emit("receiveMessage", messageData);

      // 4. Gửi thông báo "có tin nhắn mới" đến phòng CÁ NHÂN của người nhận (nếu họ không đang ở trong phòng chat)
      io.to(receiverId).emit("newMessageNotification", { 
        senderId, 
        tenDangNhap: socket.user.tenDangNhap, 
        message: message.trim()
      });

      telemetry.outcome = "sent";

    } catch (error) {
      telemetry.outcome = "error";
      console.error("Lỗi khi gửi tin nhắn:", error); 
      logSocketEventError("sendMessage", socket, error, telemetry);
      socket.emit("chatError", { message: "Không thể gửi tin nhắn" }); 
    } finally {
      if (telemetry.outcome !== "error") {
        logSocketEventPerformance("sendMessage", socket, startedAt, telemetry);
      }
    }
  });

  // Xử lý ngắt kết nối
  socket.on("disconnect", () => {
    console.log(`🔻 User đã ngắt kết nối: ${socket.user.tenDangNhap} (Socket ID: ${socket.id})`); 
  });
});

// Đồng bộ models với CSDL và khởi động server
db.sequelize.authenticate()
  .then(() => {
    console.log("✅ Kết nối CSDL thành công.");
    
    // ✅ Khởi động job hủy lịch hết hạn thanh toán
    const { startCancelJob } = require("./services/cancelAppointmentJob");
    startCancelJob();
    
    // ✅ Khởi động job ngưng chat hết hạn (15 phút)
    const { startExpireChatJob } = require("./services/expireChatJob");
    startExpireChatJob();
    
    // Khởi động server HTTP (đã bao gồm app và io)
    server.listen(PORT, () => {
      console.log(`🚀 Server đang chạy (bao gồm Socket.IO) tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối Sequelize:", err);
  });
