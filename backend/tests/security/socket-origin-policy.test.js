const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getAllowedOriginsFromEnv,
  createSocketCorsOptions,
} = require("../../src/config/originPolicy");

function evaluateOrigin(validator, origin) {
  return new Promise((resolve) => {
    validator(origin, (error, allowed) => {
      resolve({ error, allowed });
    });
  });
}

test("localhost socket origin is allowed", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    NODE_ENV: "development",
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn",
    ALLOWED_ORIGINS: "https://api.app1.duongminhtien.io.vn",
  });

  const socketCors = createSocketCorsOptions(allowedOrigins);
  const result = await evaluateOrigin(socketCors.origin, "http://localhost:4000");

  assert.equal(result.error, null);
  assert.equal(result.allowed, true);
});

test("localhost socket origin is rejected in production when not explicitly configured", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    NODE_ENV: "production",
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn",
    ALLOWED_ORIGINS: "https://api.app1.duongminhtien.io.vn",
  });

  const socketCors = createSocketCorsOptions(allowedOrigins);
  const result = await evaluateOrigin(socketCors.origin, "http://localhost:4000");

  assert.equal(result.allowed, false);
  assert.ok(result.error instanceof Error);
  assert.equal(result.error.message, "Origin is not allowed by CORS");
});

test("localhost socket origin can be explicitly allowed in production", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    NODE_ENV: "production",
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn,http://localhost:4000",
    ALLOWED_ORIGINS: "https://api.app1.duongminhtien.io.vn",
  });

  const socketCors = createSocketCorsOptions(allowedOrigins);
  const result = await evaluateOrigin(socketCors.origin, "http://localhost:4000");

  assert.equal(result.error, null);
  assert.equal(result.allowed, true);
});

test("configured socket origin is allowed", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn",
    ALLOWED_ORIGINS:
      "https://api.app1.duongminhtien.io.vn,https://api.app2.duongminhtien.io.vn",
  });

  const socketCors = createSocketCorsOptions(allowedOrigins);
  const result = await evaluateOrigin(socketCors.origin, "https://api.app2.duongminhtien.io.vn");

  assert.equal(result.error, null);
  assert.equal(result.allowed, true);
});

test("foreign socket origin is rejected", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn",
    ALLOWED_ORIGINS: "https://api.app1.duongminhtien.io.vn",
  });

  const socketCors = createSocketCorsOptions(allowedOrigins);
  const result = await evaluateOrigin(socketCors.origin, "https://socket.attacker.test");

  assert.equal(result.allowed, false);
  assert.ok(result.error instanceof Error);
  assert.equal(result.error.message, "Origin is not allowed by CORS");
});
