const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

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
const blockchainService = require("../../src/services/blockchain.service");
const authController = require("../../src/modules/auth/controller");

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

test("register regression: BENHNHAN registration creates BenhNhan + HoSo and returns success", async () => {
  const originalVerifyOtp = otpService.verifyOtp;
  const originalFindOne = models.TaiKhoan.findOne;
  const originalTaiKhoanCreate = models.TaiKhoan.create;
  const originalBenhNhanCreate = models.BenhNhan.create;
  const originalHoSoCreate = models.HoSoBenhAn.create;
  const originalAddBlock = blockchainService.addBlock;
  const originalGenerateKeyPair = crypto.generateKeyPair;
  const originalBcryptHash = bcrypt.hash;

  const createdBenhNhan = [];
  const createdHoSo = [];

  otpService.verifyOtp = async () => true;
  models.TaiKhoan.findOne = async () => null;
  bcrypt.hash = async () => "hashed-password";

  crypto.generateKeyPair = (type, options, callback) => {
    setImmediate(() => callback(null, "PUBLIC_KEY", "PRIVATE_KEY"));
  };

  models.TaiKhoan.create = async (payload) => ({
    maTK: payload.maTK,
    tenDangNhap: payload.tenDangNhap,
    email: payload.email,
    maNhom: payload.maNhom,
  });

  models.BenhNhan.create = async (payload) => {
    createdBenhNhan.push(payload);
    return payload;
  };

  models.HoSoBenhAn.create = async (payload) => {
    createdHoSo.push(payload);
    return {
      maHSBA: payload.maHSBA,
      ngayLap: payload.ngayLap,
    };
  };

  blockchainService.addBlock = async () => null;

  try {
    const req = {
      body: {
        tenDangNhap: "benhnhan_test",
        matKhau: "StrongPass123",
        email: "benhnhan@example.com",
        maNhom: "BENHNHAN",
        otpCode: "123456",
      },
    };
    const res = createMockRes();

    await authController.register(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(createdBenhNhan.length, 1);
    assert.equal(createdHoSo.length, 1);
    assert.equal(createdBenhNhan[0].maBN, createdBenhNhan[0].maTK);
    assert.equal(createdHoSo[0].maBN, createdBenhNhan[0].maBN);
  } finally {
    otpService.verifyOtp = originalVerifyOtp;
    models.TaiKhoan.findOne = originalFindOne;
    models.TaiKhoan.create = originalTaiKhoanCreate;
    models.BenhNhan.create = originalBenhNhanCreate;
    models.HoSoBenhAn.create = originalHoSoCreate;
    blockchainService.addBlock = originalAddBlock;
    crypto.generateKeyPair = originalGenerateKeyPair;
    bcrypt.hash = originalBcryptHash;
  }
});
