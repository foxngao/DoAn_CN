const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'test-user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test-password';
process.env.DB_NAME = process.env.DB_NAME || 'test-db';

const {
  LICH_KHAM_STATUS,
  LICH_KHAM_STATUS_VALUES,
  HOA_DON_STATUS,
  HOA_DON_STATUS_VALUES,
} = require('../../src/constants/status');
const LichKham = require('../../src/models/LichKham .js');
const HoaDon = require('../../src/models/HoaDon');

test('status constants include expected values', () => {
  assert.deepEqual(LICH_KHAM_STATUS_VALUES, [
    LICH_KHAM_STATUS.CHO_THANH_TOAN,
    LICH_KHAM_STATUS.DA_THANH_TOAN,
    LICH_KHAM_STATUS.DA_HUY,
  ]);

  assert.deepEqual(HOA_DON_STATUS_VALUES, [
    HOA_DON_STATUS.CHUA_THANH_TOAN,
    HOA_DON_STATUS.DA_THANH_TOAN,
    HOA_DON_STATUS.DA_HUY,
  ]);
});

test('LichKham accepts valid status and rejects invalid status', async () => {
  const validRecord = LichKham.build({
    maLich: 'LK_VALID',
    maBN: 'BN001',
    maBS: 'BS001',
    ngayKham: '2099-12-31',
    gioKham: '08:00',
    trangThai: LICH_KHAM_STATUS.CHO_THANH_TOAN,
  });

  await assert.doesNotReject(() => validRecord.validate());

  const invalidRecord = LichKham.build({
    maLich: 'LK_INVALID',
    maBN: 'BN001',
    maBS: 'BS001',
    ngayKham: '2099-12-31',
    gioKham: '08:00',
    trangThai: 'INVALID_STATUS',
  });

  await assert.rejects(() => invalidRecord.validate());
});

test('HoaDon accepts valid status and rejects invalid status', async () => {
  const validRecord = HoaDon.build({
    maHD: 'HD_VALID',
    maBN: 'BN001',
    maNS: 'NS001',
    trangThai: HOA_DON_STATUS.CHUA_THANH_TOAN,
  });

  await assert.doesNotReject(() => validRecord.validate());

  const invalidRecord = HoaDon.build({
    maHD: 'HD_INVALID',
    maBN: 'BN001',
    maNS: 'NS001',
    trangThai: 'INVALID_STATUS',
  });

  await assert.rejects(() => invalidRecord.validate());
});
