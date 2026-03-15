const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const {
  extractSocketTokenFromHandshake,
  createSocketAuthMiddleware,
} = require("../../src/chat/socketAuth");

const SECRET = "socket-session-regression-secret";

test("socket session regression: prefers handshake auth token over cookie token", () => {
  const tokenFromAuth = "token.from.auth";

  const extracted = extractSocketTokenFromHandshake({
    auth: { token: tokenFromAuth },
    headers: { cookie: "session_token=token.from.cookie" },
  });

  assert.equal(extracted, tokenFromAuth);
});

test("socket session regression: supports Bearer token in handshake auth", () => {
  const extracted = extractSocketTokenFromHandshake({
    auth: { token: "Bearer abc.def.ghi" },
  });

  assert.equal(extracted, "abc.def.ghi");
});

test("socket session regression: middleware rejects missing token deterministically", async () => {
  const middleware = createSocketAuthMiddleware({
    secretKey: SECRET,
    logger: { warn: () => {} },
  });

  const socket = { handshake: {} };

  const error = await new Promise((resolve) => {
    middleware(socket, (err) => resolve(err || null));
  });

  assert.ok(error instanceof Error);
  assert.equal(error.message, "Xác thực thất bại: Không có session token");
});

test("socket session regression: middleware accepts valid auth Bearer token", async () => {
  const token = jwt.sign({ maTK: "TK-REG", maNhom: "BENHNHAN" }, SECRET, {
    expiresIn: "1h",
  });

  const middleware = createSocketAuthMiddleware({
    secretKey: SECRET,
    logger: { warn: () => {} },
  });

  const socket = {
    handshake: {
      auth: { token: `Bearer ${token}` },
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

  assert.equal(socket.user.maTK, "TK-REG");
  assert.equal(socket.user.maNhom, "BENHNHAN");
});

test("socket session regression: middleware rejects expired token deterministically", async () => {
  const expiredToken = jwt.sign({ maTK: "TK-EXPIRED", maNhom: "BENHNHAN" }, SECRET, {
    expiresIn: -1,
  });

  const capturedWarnLogs = [];
  const middleware = createSocketAuthMiddleware({
    secretKey: SECRET,
    logger: {
      warn: (...args) => capturedWarnLogs.push(args),
    },
  });

  const socket = {
    handshake: {
      auth: { token: `Bearer ${expiredToken}` },
    },
  };

  const error = await new Promise((resolve) => {
    middleware(socket, (err) => resolve(err || null));
  });

  assert.ok(error instanceof Error);
  assert.equal(error.message, "Xác thực thất bại: Token không hợp lệ");
  assert.equal(capturedWarnLogs.length > 0, true);
  assert.equal(JSON.stringify(capturedWarnLogs).includes("expired"), true);
});
