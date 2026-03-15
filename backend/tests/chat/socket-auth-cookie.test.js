const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const {
  extractSocketTokenFromHandshake,
  createSocketAuthMiddleware,
} = require("../../src/chat/socketAuth");

const SECRET = "socket-cookie-secret-for-tests";

test("extracts session token from cookie when handshake.auth.token is absent", () => {
  const token = extractSocketTokenFromHandshake({
    headers: {
      cookie: "foo=bar; session_token=abc.def.ghi; csrf_token=csrf-value",
    },
  });

  assert.equal(token, "abc.def.ghi");
});

test("socket auth middleware accepts valid session cookie token", async () => {
  const payload = { maTK: "TK001", tenDangNhap: "user", maNhom: "BENHNHAN" };
  const token = jwt.sign(payload, SECRET, { expiresIn: "1h" });

  const middleware = createSocketAuthMiddleware({
    secretKey: SECRET,
    logger: { warn: () => {} },
  });

  const socket = {
    handshake: {
      headers: {
        cookie: `session_token=${token}`,
      },
    },
  };

  await new Promise((resolve, reject) => {
    middleware(socket, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  assert.equal(socket.user.maTK, payload.maTK);
  assert.equal(socket.user.maNhom, payload.maNhom);
});

test("socket auth middleware rejects invalid session cookie token", async () => {
  const middleware = createSocketAuthMiddleware({
    secretKey: SECRET,
    logger: { warn: () => {} },
  });

  const socket = {
    handshake: {
      headers: {
        cookie: "session_token=invalid-token",
      },
    },
  };

  const error = await new Promise((resolve) => {
    middleware(socket, (err) => {
      resolve(err || null);
    });
  });

  assert.ok(error instanceof Error);
  assert.equal(error.message, "Xác thực thất bại: Token không hợp lệ");
});
