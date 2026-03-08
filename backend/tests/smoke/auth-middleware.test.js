const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";
process.env.DB_HOST = "localhost";
process.env.DB_USER = "test-user";
process.env.DB_PASSWORD = "test-password";
process.env.DB_NAME = "test-db";

const authMiddleware = require("../../src/middleware/auth");

test("returns 401 when authorization header is missing", () => {
  const req = { headers: {} };
  const res = createMockRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { thongBao: "Không có token truy cập" });
  assert.equal(nextCalled, false);
});

test("calls next and attaches user for valid bearer token", () => {
  const payload = { maTK: "TK001", role: "ADMIN" };
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createMockRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
  assert.equal(req.user.maTK, payload.maTK);
  assert.equal(req.user.role, payload.role);
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
