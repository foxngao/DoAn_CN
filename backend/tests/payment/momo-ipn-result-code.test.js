const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");

process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "test-user";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-password";
process.env.DB_NAME = process.env.DB_NAME || "test-db";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const controller = require("../../src/modules/payment/controller");
const PaymentService = require("../../src/services/payment.service");
const db = require("../../src/models");

const originalVerifyMoMoSignature = PaymentService.verifyMoMoSignature;
const originalHoaDonFindByPk = db.HoaDon.findByPk;
const originalLichKhamUpdate = db.LichKham.update;
const originalThanhToanCreate = db.ThanhToan.create;

afterEach(() => {
  PaymentService.verifyMoMoSignature = originalVerifyMoMoSignature;
  db.HoaDon.findByPk = originalHoaDonFindByPk;
  db.LichKham.update = originalLichKhamUpdate;
  db.ThanhToan.create = originalThanhToanCreate;
});

test("momoIpn treats string resultCode '0' as successful payment", async () => {
  PaymentService.verifyMoMoSignature = () => ({
    isSuccess: true,
    resultCode: "0",
    orderId: "HD001_1710000000",
    amount: 100000,
    transId: "TRANS001",
  });

  const hoaDon = {
    trangThai: "CHUA_THANH_TOAN",
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      this.trangThai = "DA_THANH_TOAN";
    },
  };

  db.HoaDon.findByPk = async () => hoaDon;

  let updateCalls = 0;
  db.LichKham.update = async () => {
    updateCalls += 1;
  };

  let thanhToanCalls = 0;
  db.ThanhToan.create = async () => {
    thanhToanCalls += 1;
  };

  const req = { body: {} };
  const res = createMockRes();

  await controller.momoIpn(req, res);

  assert.equal(res.statusCode, 204);
  assert.equal(hoaDon.saveCalls, 1);
  assert.equal(updateCalls, 1);
  assert.equal(thanhToanCalls, 1);
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
    send(body) {
      this.payload = body;
      return this;
    },
  };
}
