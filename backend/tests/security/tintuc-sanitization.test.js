const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "test-user";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-password";
process.env.DB_NAME = process.env.DB_NAME || "test-db";
process.env.DATA_ENCRYPTION_KEY =
  process.env.DATA_ENCRYPTION_KEY || "test-data-encryption-key";
process.env.HASH_PEPPER = process.env.HASH_PEPPER || "test-hash-pepper";

const db = require("../../src/models");
const controller = require("../../src/modules/tintuc/controller");

const originalTinTucCreate = db.TinTuc.create;
const originalTinTucUpdate = db.TinTuc.update;

afterEach(() => {
  db.TinTuc.create = originalTinTucCreate;
  db.TinTuc.update = originalTinTucUpdate;
});

test("create sanitizes dangerous script and event handlers", async () => {
  let capturedPayload = null;

  db.TinTuc.create = async (payload) => {
    capturedPayload = payload;
    return payload;
  };

  const req = {
    user: { maNS: "NS001" },
    body: {
      tieuDe: "Tin test",
      tomTat: "Tom tat",
      noiDung: '<p>Safe</p><script>alert("xss")</script><img src="x" onerror="alert(1)">',
      loai: "TIN_TUC",
      hinhAnh: "https://example.com/image.jpg",
    },
  };
  const res = createMockRes();

  await controller.create(req, res);

  assert.equal(res.statusCode, 201);
  assert.ok(capturedPayload);
  assert.equal(capturedPayload.noiDung.includes("<script"), false);
  assert.equal(capturedPayload.noiDung.includes("onerror"), false);
  assert.equal(capturedPayload.noiDung.includes("<p>Safe</p>"), true);
  assert.equal(capturedPayload.noiDung.includes("<img"), true);
});

test("update sanitizes dangerous attributes while preserving allowed markup", async () => {
  let capturedUpdatePayload = null;

  db.TinTuc.update = async (payload) => {
    capturedUpdatePayload = payload;
    return [1];
  };

  const req = {
    params: { maTin: "TIN001" },
    body: {
      tieuDe: "Updated",
      tomTat: "Updated summary",
      noiDung:
        '<h2>Title</h2><a href="javascript:alert(1)">link</a><img src="https://safe.example/image.png" onload="evil()">',
      loai: "THONG_BAO",
      hinhAnh: "https://example.com/new.jpg",
      trangThai: "HIEN_THI",
    },
  };
  const res = createMockRes();

  await controller.update(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(capturedUpdatePayload);
  assert.equal(capturedUpdatePayload.noiDung.includes("javascript:"), false);
  assert.equal(capturedUpdatePayload.noiDung.includes("onload"), false);
  assert.equal(capturedUpdatePayload.noiDung.includes("<h2>Title</h2>"), true);
});

function createMockRes() {
  return {
    statusCode: 200,
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
