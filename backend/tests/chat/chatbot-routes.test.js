const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-chatbot-secret";
process.env.DB_HOST = "localhost";
process.env.DB_USER = "test-user";
process.env.DB_PASSWORD = "test-password";
process.env.DB_NAME = "test-db";

const verifyToken = require("../../src/middleware/auth");
const router = require("../../src/modules/chatbot/routes");

test("does not enforce global verifyToken middleware for every chatbot route", () => {
  const hasGlobalVerifyToken = router.stack.some(
    (layer) => !layer.route && layer.handle === verifyToken
  );

  assert.equal(hasGlobalVerifyToken, false);
});

test("registers POST /upload route for chatbot image flow", () => {
  const uploadRoute = router.stack.find(
    (layer) => layer.route?.path === "/upload" && layer.route.methods?.post
  );

  assert.ok(uploadRoute, "Expected POST /upload route to be registered");
});

test("optional auth on POST / decodes valid bearer token", () => {
  const rootPostLayer = router.stack.find(
    (layer) => layer.route?.path === "/" && layer.route.methods?.post
  );

  assert.ok(rootPostLayer, "Expected POST / route to be registered");

  const optionalAuthMiddleware = rootPostLayer.route.stack[0]?.handle;
  assert.equal(typeof optionalAuthMiddleware, "function");

  const payload = { maTK: "TK123", role: "BENHNHAN" };
  const token = jwt.sign(payload, process.env.JWT_SECRET);

  const req = {
    header: (name) => (name === "Authorization" ? `Bearer ${token}` : undefined),
    cookies: {},
  };
  const res = {};
  let nextCalled = false;

  optionalAuthMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user?.maTK, payload.maTK);
  assert.equal(req.user?.role, payload.role);
});
