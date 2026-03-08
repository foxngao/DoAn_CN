const test = require("node:test");
const assert = require("node:assert/strict");

const seeder = require("../../seeders/20260308-core-seed-idempotent");

test("core idempotent seeder runs upsert SQL for all core datasets", async () => {
  const queries = [];
  const transaction = {
    committed: false,
    rolledBack: false,
    async commit() {
      this.committed = true;
    },
    async rollback() {
      this.rolledBack = true;
    },
  };

  const queryInterface = {
    sequelize: {
      async transaction() {
        return transaction;
      },
      async query(sql) {
        queries.push(sql);
      },
    },
  };

  await seeder.up(queryInterface);

  assert.equal(transaction.committed, true);
  assert.equal(transaction.rolledBack, false);
  assert.equal(queries.length, 10);
  assert.ok(queries.every((sql) => sql.includes("ON DUPLICATE KEY UPDATE")));
  assert.ok(queries[0].includes("INSERT INTO NhomQuyen"));
  assert.ok(queries[1].includes("INSERT INTO KhoaPhong"));
  assert.ok(queries[2].includes("INSERT INTO NhomThuoc"));
  assert.ok(queries[3].includes("INSERT INTO CaKham"));
  assert.ok(queries[4].includes("INSERT INTO DonViTinh"));
  assert.ok(queries[5].includes("INSERT INTO LoaiXetNghiem"));
  assert.ok(queries[6].includes("INSERT INTO TaiKhoan"));
  assert.ok(queries[7].includes("INSERT INTO NhanSuYTe"));
  assert.ok(queries[8].includes("INSERT INTO Thuoc"));
  assert.ok(queries[9].includes("INSERT INTO XetNghiem"));
});
