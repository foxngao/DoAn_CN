const crypto = require("crypto");

const PRIVATE_KEY_MARKER = "enc:v1:";
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

function isEncryptedPrivateKey(value) {
  return typeof value === "string" && value.startsWith(PRIVATE_KEY_MARKER);
}

function getPrivateKeyEncryptionKey() {
  const envKey = process.env.PRIVATE_KEY_ENCRYPTION_KEY;

  if (!envKey || !envKey.trim()) {
    throw new Error("Missing PRIVATE_KEY_ENCRYPTION_KEY for private key encryption");
  }

  const key = envKey.trim();

  if (/^[a-fA-F0-9]{64}$/.test(key)) {
    return Buffer.from(key, "hex");
  }

  const base64Decoded = Buffer.from(key, "base64");
  if (base64Decoded.length === 32) {
    return base64Decoded;
  }

  throw new Error("PRIVATE_KEY_ENCRYPTION_KEY must be 32-byte base64 or 64-char hex");
}

function encryptPrivateKey(plainPrivateKey) {
  if (plainPrivateKey === null || plainPrivateKey === undefined) {
    return plainPrivateKey;
  }

  if (typeof plainPrivateKey !== "string") {
    throw new Error("Private key must be a string");
  }

  if (isEncryptedPrivateKey(plainPrivateKey)) {
    return plainPrivateKey;
  }

  const key = getPrivateKeyEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainPrivateKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PRIVATE_KEY_MARKER}${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

function decryptPrivateKeyForUse(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== "string") {
    throw new Error("Stored private key must be a string");
  }

  if (!isEncryptedPrivateKey(value)) {
    return value;
  }

  const payload = value.slice(PRIVATE_KEY_MARKER.length);
  const [ivB64, authTagB64, encryptedB64] = payload.split(".");

  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted private key format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const key = getPrivateKeyEncryptionKey();

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString("utf8");
}

function resolvePrivateKey(value) {
  const plainPrivateKey = decryptPrivateKeyForUse(value);
  return {
    plainPrivateKey,
    wasLegacyPlaintext: typeof value === "string" && value.length > 0 && !isEncryptedPrivateKey(value),
  };
}

module.exports = {
  PRIVATE_KEY_MARKER,
  isEncryptedPrivateKey,
  encryptPrivateKey,
  decryptPrivateKeyForUse,
  resolvePrivateKey,
};
