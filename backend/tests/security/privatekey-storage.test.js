const test = require("node:test");
const assert = require("node:assert/strict");

process.env.PRIVATE_KEY_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const TaiKhoan = require("../../src/models/TaiKhoan");
const blockchainService = require("../../src/services/blockchain.service");
const {
  encryptPrivateKey,
  decryptPrivateKeyForUse,
  isEncryptedPrivateKey,
} = require("../../src/utils/crypto");

test("encrypt/decrypt private key roundtrip", () => {
  const plain = "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----";
  const encrypted = encryptPrivateKey(plain);

  assert.notEqual(encrypted, plain);
  assert.equal(isEncryptedPrivateKey(encrypted), true);
  assert.equal(decryptPrivateKeyForUse(encrypted), plain);
});

test("TaiKhoan stores encrypted private key value", () => {
  const plain = "-----BEGIN PRIVATE KEY-----\nmodel\n-----END PRIVATE KEY-----";

  const user = TaiKhoan.build({
    maTK: "TK_TEST_01",
    tenDangNhap: "test_user",
    matKhau: "hashed_password",
    maNhom: "BENHNHAN",
    privateKey: plain,
  });

  const storedValue = user.getDataValue("privateKey");
  assert.notEqual(storedValue, plain);
  assert.equal(isEncryptedPrivateKey(storedValue), true);
  assert.equal(user.privateKey, plain);
});

test("blockchain private key read path decrypts encrypted value", () => {
  const plain = "-----BEGIN PRIVATE KEY-----\nblockchain\n-----END PRIVATE KEY-----";
  const encrypted = encryptPrivateKey(plain);

  assert.equal(blockchainService.resolvePrivateKeyForSigning(encrypted), plain);
});

test("legacy plaintext private key remains readable", () => {
  const legacyPlain = "-----BEGIN PRIVATE KEY-----\nlegacy\n-----END PRIVATE KEY-----";

  assert.equal(decryptPrivateKeyForUse(legacyPlain), legacyPlain);
  assert.equal(blockchainService.resolvePrivateKeyForSigning(legacyPlain), legacyPlain);
});
