const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const controller = require("../../src/modules/chat/controller");
const chatService = require("../../src/chat/chatService");

const originalIsUserInRoom = chatService.isUserInRoom;
const originalGetRoomHistory = chatService.getRoomHistory;

afterEach(() => {
  chatService.isUserInRoom = originalIsUserInRoom;
  chatService.getRoomHistory = originalGetRoomHistory;
});

test("returns 403 when user is not a room member", async () => {
  let getHistoryCalled = false;

  chatService.isUserInRoom = async () => false;
  chatService.getRoomHistory = async () => {
    getHistoryCalled = true;
    return [];
  };

  const req = {
    params: { roomId: "TK001_TK002" },
    user: { maTK: "TK003" },
  };
  const res = createMockRes();

  await controller.getRoomMessages(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.payload, {
    success: false,
    message: "Bạn không có quyền truy cập phòng chat này",
    data: null,
    errors: null,
  });
  assert.equal(getHistoryCalled, false);
});

test("returns 200 and room messages when user is a room member", async () => {
  const mockedMessages = [
    { id: 1, room: "TK001_TK002", message: "Xin chào" },
    { id: 2, room: "TK001_TK002", message: "Chào bạn" },
  ];
  let queriedRoomId = null;

  chatService.isUserInRoom = async (roomId, maTK) => roomId === "TK001_TK002" && maTK === "TK001";
  chatService.getRoomHistory = async (roomId) => {
    queriedRoomId = roomId;
    return mockedMessages;
  };

  const req = {
    params: { roomId: "TK001_TK002" },
    user: { maTK: "TK001" },
  };
  const res = createMockRes();

  await controller.getRoomMessages(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, {
    success: true,
    message: "Lấy lịch sử phòng chat thành công",
    data: mockedMessages,
    errors: null,
  });
  assert.equal(queriedRoomId, "TK001_TK002");
});

function createMockRes() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}
