const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { ok, fail } = require("../../src/utils/apiResponse");
const chatController = require("../../src/modules/chat/controller");
const chatService = require("../../src/chat/chatService");

const originalGetUserRooms = chatService.getUserRooms;

afterEach(() => {
  chatService.getUserRooms = originalGetUserRooms;
});

test("ok response returns standardized envelope", () => {
  const res = createMockRes();

  ok(res, {
    message: "Created",
    data: { id: "LK001" },
    status: 201,
  });

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.payload, {
    success: true,
    message: "Created",
    data: { id: "LK001" },
    errors: null,
  });
});

test("fail response returns standardized envelope", () => {
  const res = createMockRes();

  fail(res, {
    message: "Validation failed",
    errors: { field: "email" },
    status: 422,
  });

  assert.equal(res.statusCode, 422);
  assert.deepEqual(res.payload, {
    success: false,
    message: "Validation failed",
    data: null,
    errors: { field: "email" },
  });
});

test("chat controller endpoint uses standardized response envelope", async () => {
  chatService.getUserRooms = async () => [{ roomId: "TK001_TK002" }];

  const req = {
    user: { maTK: "TK001" },
  };
  const res = createMockRes();

  await chatController.getUserRooms(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, {
    success: true,
    message: "Lấy danh sách phòng chat thành công",
    data: [{ roomId: "TK001_TK002" }],
    errors: null,
  });
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
