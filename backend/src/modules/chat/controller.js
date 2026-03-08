const chatService = require("../../chat/chatService");
const { ok, fail } = require("../../utils/apiResponse");

/**
 * Lấy danh sách các phòng chat CŨ của user
 */
exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.user.maTK;
    const result = await chatService.getUserRooms(userId, {
      page: req.query?.page,
      limit: req.query?.limit,
    });

    const isLegacyShape = Array.isArray(result);
    const rooms = isLegacyShape ? result : result?.data || [];
    const pagination = isLegacyShape ? null : result?.pagination || null;

    return ok(res, {
      message: "Lấy danh sách phòng chat thành công",
      data: rooms,
      pagination,
      status: 200,
    });
  } catch (error) {
    return fail(res, {
      message: "Lỗi lấy danh sách phòng chat",
      errors: error.message,
      status: 500,
    });
  }
};

/**
 * Lấy lịch sử tin nhắn của một phòng
 */
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params; // roomId ở đây là roomName
    const isMember = await chatService.isUserInRoom(roomId, req.user.maTK);
    if (!isMember) {
      return fail(res, {
        message: "Bạn không có quyền truy cập phòng chat này",
        status: 403,
      });
    }

    const history = await chatService.getRoomHistory(roomId);
    return ok(res, {
      message: "Lấy lịch sử phòng chat thành công",
      data: history,
      status: 200,
    });
  } catch (error) {
    return fail(res, {
      message: "Lỗi lấy lịch sử phòng chat",
      errors: error.message,
      status: 500,
    });
  }
};

/**
 * Lấy danh sách user CÓ THỂ liên hệ
 */
exports.getContacts = async (req, res) => {
    try {
        // req.user được gán từ middleware verifyToken
        const result = await chatService.getContacts(req.user, {
          page: req.query?.page,
          limit: req.query?.limit,
        });

        const isLegacyShape = Array.isArray(result);
        const contacts = isLegacyShape ? result : result?.data || [];
        const pagination = isLegacyShape ? null : result?.pagination || null;

        return ok(res, {
          message: "Lấy danh sách liên hệ thành công",
          data: contacts,
          pagination,
          status: 200,
        });
    } catch (error) {
        return fail(res, {
          message: "Lỗi lấy danh sách liên hệ",
          errors: error.message,
          status: 500,
        });
    }
};
