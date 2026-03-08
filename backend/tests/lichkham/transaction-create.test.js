const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");

process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "test-user";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-password";
process.env.DB_NAME = process.env.DB_NAME || "test-db";

const db = require("../../src/models");
const controller = require("../../src/modules/lichkham/controller");

const originalMethods = {
  transaction: db.sequelize.transaction,
  caKhamFindOne: db.CaKham.findOne,
  lichLamViecFindOne: db.LichLamViec.findOne,
  lichKhamCount: db.LichKham.count,
  lichKhamFindOne: db.LichKham.findOne,
  lichKhamFindAll: db.LichKham.findAll,
  lichKhamCreate: db.LichKham.create,
  hoaDonCreate: db.HoaDon.create,
  chiTietHoaDonCreate: db.ChiTietHoaDon.create,
};

afterEach(() => {
  db.sequelize.transaction = originalMethods.transaction;
  db.CaKham.findOne = originalMethods.caKhamFindOne;
  db.LichLamViec.findOne = originalMethods.lichLamViecFindOne;
  db.LichKham.count = originalMethods.lichKhamCount;
  db.LichKham.findOne = originalMethods.lichKhamFindOne;
  db.LichKham.findAll = originalMethods.lichKhamFindAll;
  db.LichKham.create = originalMethods.lichKhamCreate;
  db.HoaDon.create = originalMethods.hoaDonCreate;
  db.ChiTietHoaDon.create = originalMethods.chiTietHoaDonCreate;
});

test("create commits transaction and creates all related records", async () => {
  setupHappyPathPrerequisites();

  let transactionCalled = false;
  const tx = { id: "tx-success" };
  db.sequelize.transaction = async (callback) => {
    transactionCalled = true;
    return callback(tx);
  };

  let hoaDonTx;
  db.HoaDon.create = async (_payload, options = {}) => {
    hoaDonTx = options.transaction;
    return { maHD: "HD001" };
  };

  let chiTietTx;
  db.ChiTietHoaDon.create = async (_payload, options = {}) => {
    chiTietTx = options.transaction;
    return { maCTHD: "CT001" };
  };

  let lichKhamTx;
  db.LichKham.create = async (payload, options = {}) => {
    lichKhamTx = options.transaction;
    return {
      toJSON() {
        return {
          maLich: payload.maLich,
          maBN: payload.maBN,
          maBS: payload.maBS,
          maHD: payload.maHD,
        };
      },
    };
  };

  const req = {
    body: {
      maBN: "BN001",
      maBS: "BS001",
      ngayKham: futureDate(),
      gioKham: "08:00",
      tenKhoa: "K001",
      phong: "P101",
      ghiChu: "",
    },
  };
  const res = createMockRes();

  await controller.create(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(transactionCalled, true);
  assert.equal(hoaDonTx, tx);
  assert.equal(chiTietTx, tx);
  assert.equal(lichKhamTx, tx);
  assert.equal(res.payload.data.maHD !== undefined, true);
  assert.equal(res.payload.data.tongTien, 100000);
});

test("create rolls back transaction when ChiTietHoaDon.create fails", async () => {
  setupHappyPathPrerequisites();

  const persisted = {
    hoaDon: 0,
    chiTietHoaDon: 0,
    lichKham: 0,
  };

  let rolledBack = false;
  db.sequelize.transaction = async (callback) => {
    const tx = {
      id: "tx-failure",
      staged: {
        hoaDon: 0,
        chiTietHoaDon: 0,
        lichKham: 0,
      },
    };

    try {
      await callback(tx);
      persisted.hoaDon += tx.staged.hoaDon;
      persisted.chiTietHoaDon += tx.staged.chiTietHoaDon;
      persisted.lichKham += tx.staged.lichKham;
    } catch (error) {
      rolledBack = true;
      throw error;
    }
  };

  db.HoaDon.create = async (_payload, options = {}) => {
    const tx = options.transaction;
    if (tx && tx.staged) {
      tx.staged.hoaDon += 1;
    } else {
      persisted.hoaDon += 1;
    }
    return { maHD: "HD001" };
  };

  db.ChiTietHoaDon.create = async (_payload, options = {}) => {
    const tx = options.transaction;
    if (tx && tx.staged) {
      tx.staged.chiTietHoaDon += 1;
    } else {
      persisted.chiTietHoaDon += 1;
    }
    throw new Error("Chi tiết hóa đơn lỗi");
  };

  db.LichKham.create = async (_payload, options = {}) => {
    const tx = options.transaction;
    if (tx && tx.staged) {
      tx.staged.lichKham += 1;
    } else {
      persisted.lichKham += 1;
    }
    return { toJSON: () => ({}) };
  };

  const req = {
    body: {
      maBN: "BN001",
      maBS: "BS001",
      ngayKham: futureDate(),
      gioKham: "08:00",
      tenKhoa: "K001",
      phong: "P101",
      ghiChu: "",
    },
  };
  const res = createMockRes();

  await controller.create(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(rolledBack, true);
  assert.deepEqual(persisted, {
    hoaDon: 0,
    chiTietHoaDon: 0,
    lichKham: 0,
  });
});

function setupHappyPathPrerequisites() {
  db.CaKham.findOne = async () => ({
    maCa: "CA001",
    thoiGianBatDau: "07:00",
    thoiGianKetThuc: "11:00",
  });
  db.LichLamViec.findOne = async () => ({ maBS: "BS001" });
  db.LichKham.count = async () => 0;
  db.LichKham.findOne = async () => null;
  db.LichKham.findAll = async () => [];
}

function futureDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

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
