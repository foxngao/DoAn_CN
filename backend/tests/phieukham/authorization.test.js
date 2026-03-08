const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "test-user";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-password";
process.env.DB_NAME = process.env.DB_NAME || "test-db";

const db = require("../../src/models");
const blockchainService = require("../../src/services/blockchain.service");
const controller = require("../../src/modules/phieukham/controller");

test("create returns 403 when user role is not doctor", async () => {
  const req = {
    user: { maTK: "TK-NHANSU", maNhom: "NHANSU" },
    body: {
      maHSBA: "HS001",
      maBN: "BN001",
      maBS: "BS001",
      trieuChung: "Sot",
      chuanDoan: "Cam",
    },
  };
  const res = createMockRes();

  await controller.create(req, res);

  assert.equal(res.statusCode, 403);
  assert.match(res.payload.message, /không có quyền/i);
});

test("create returns 403 when body maBS mismatches authenticated doctor", async () => {
  const originalFindOne = db.BacSi.findOne;
  const originalAddBlock = blockchainService.addBlock;

  db.BacSi.findOne = async () => ({ maBS: "BS-AUTH" });
  let addBlockCalled = false;
  blockchainService.addBlock = async () => {
    addBlockCalled = true;
    return { id: 1, timestamp: new Date() };
  };

  try {
    const req = {
      user: { maTK: "TK-BS", maNhom: "BACSI" },
      body: {
        maHSBA: "HS001",
        maBN: "BN001",
        maBS: "BS-FORGED",
        trieuChung: "Dau dau",
        chuanDoan: "Cang thang",
      },
    };
    const res = createMockRes();

    await controller.create(req, res);

    assert.equal(res.statusCode, 403);
    assert.match(res.payload.message, /maBS/i);
    assert.equal(addBlockCalled, false);
  } finally {
    db.BacSi.findOne = originalFindOne;
    blockchainService.addBlock = originalAddBlock;
  }
});

test("create succeeds for doctor and uses authenticated doctor maBS", async () => {
  const originalFindOne = db.BacSi.findOne;
  const originalAddBlock = blockchainService.addBlock;

  db.BacSi.findOne = async () => ({ maBS: "BS-AUTH" });
  let capturedData = null;
  blockchainService.addBlock = async (_maHSBA, _blockType, data) => {
    capturedData = data;
    return { id: 99, timestamp: "2026-03-08T00:00:00.000Z" };
  };

  try {
    const req = {
      user: { maTK: "TK-BS", maNhom: "BACSI" },
      body: {
        maHSBA: "HS001",
        maBN: "BN001",
        trieuChung: "Ho",
        chuanDoan: "Viem hong",
        loiDan: "Uong nuoc am",
      },
    };
    const res = createMockRes();

    await controller.create(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(capturedData.maBS, "BS-AUTH");
    assert.equal(res.payload.data.maBS, "BS-AUTH");
  } finally {
    db.BacSi.findOne = originalFindOne;
    blockchainService.addBlock = originalAddBlock;
  }
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
