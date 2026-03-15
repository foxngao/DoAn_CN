const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "test-user";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-password";
process.env.DB_NAME = process.env.DB_NAME || "test-db";
process.env.DATA_ENCRYPTION_KEY =
  process.env.DATA_ENCRYPTION_KEY || "test-data-encryption-key";
process.env.HASH_PEPPER = process.env.HASH_PEPPER || "test-hash-pepper";

const models = require("../../src/models");
const otpService = require("../../src/OTP/otp.service");
const authController = require("../../src/modules/auth/controller");
const authRoutes = require("../../src/modules/auth/routes");
const logger = require("../../src/utils/logger");

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("legacy OTP disclosure endpoints are removed from controller exports and router", () => {
  assert.equal(typeof authController.taoMaXacThuc, "undefined");
  assert.equal(typeof authController.quenMatKhau, "undefined");

  const hasLegacyOtpCodeRoute = authRoutes.stack.some(
    (layer) => layer.route?.path === "/ma-xac-thuc/:maTaiKhoan"
  );
  const hasLegacyForgotPasswordRoute = authRoutes.stack.some(
    (layer) => layer.route?.path === "/quenmatkhau"
  );

  assert.equal(hasLegacyOtpCodeRoute, false);
  assert.equal(hasLegacyForgotPasswordRoute, false);
});

test("forgot-password flow does not log OTP plaintext", async () => {
  const originalTaiKhoanFindOne = models.TaiKhoan.findOne;
  const originalCreateAndSendOtp = otpService.createAndSendOtp;
  const originalConsoleLog = console.log;
  const originalLoggerInfo = logger.info;

  const capturedLogs = [];
  const capturedLoggerInfo = [];
  console.log = (...args) => capturedLogs.push(args.join(" "));
  logger.info = (...args) => capturedLoggerInfo.push(args);

  models.TaiKhoan.findOne = async () => ({ maTK: "TK02", email: "user@example.com" });
  otpService.createAndSendOtp = async () => ({ otpCode: "654321" });

  try {
    const req = { body: { email: "user@example.com" } };
    const res = createMockRes();

    await authController.forgotPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(capturedLogs.some((line) => line.includes("654321")), false);
    assert.equal(capturedLoggerInfo.length > 0, true);
    assert.equal(Object.prototype.hasOwnProperty.call(res.body, "maXacThuc"), false);
    assert.equal(JSON.stringify(capturedLoggerInfo).includes("654321"), false);
  } finally {
    models.TaiKhoan.findOne = originalTaiKhoanFindOne;
    otpService.createAndSendOtp = originalCreateAndSendOtp;
    console.log = originalConsoleLog;
    logger.info = originalLoggerInfo;
  }
});
