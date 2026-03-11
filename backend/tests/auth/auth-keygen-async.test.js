const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "test-user";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-password";
process.env.DB_NAME = process.env.DB_NAME || "test-db";
process.env.DATA_ENCRYPTION_KEY =
  process.env.DATA_ENCRYPTION_KEY || "test-data-encryption-key";
process.env.HASH_PEPPER = process.env.HASH_PEPPER || "test-hash-pepper";

const {
  generateBlockchainKeyPair,
} = require("../../src/modules/auth/controller");

test("generateBlockchainKeyPair uses async crypto.generateKeyPair", async () => {
  const originalGenerateKeyPair = crypto.generateKeyPair;
  const calls = [];

  crypto.generateKeyPair = (type, options, callback) => {
    calls.push({ type, options });
    setImmediate(() => callback(null, "PUBLIC_KEY", "PRIVATE_KEY"));
  };

  try {
    const result = await generateBlockchainKeyPair();

    assert.equal(calls.length, 1);
    assert.equal(calls[0].type, "rsa");
    assert.equal(calls[0].options.modulusLength, 2048);
    assert.deepEqual(calls[0].options.publicKeyEncoding, {
      type: "spki",
      format: "pem",
    });
    assert.deepEqual(calls[0].options.privateKeyEncoding, {
      type: "pkcs8",
      format: "pem",
    });
    assert.equal(result.publicKey, "PUBLIC_KEY");
    assert.equal(result.privateKey, "PRIVATE_KEY");
  } finally {
    crypto.generateKeyPair = originalGenerateKeyPair;
  }
});
