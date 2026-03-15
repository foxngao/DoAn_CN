const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getAllowedOriginsFromEnv,
  createOriginValidator,
} = require("../../src/config/originPolicy");

function evaluateOrigin(validator, origin) {
  return new Promise((resolve) => {
    validator(origin, (error, allowed) => {
      resolve({ error, allowed });
    });
  });
}

test("localhost origin is allowed", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    NODE_ENV: "development",
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn",
    ALLOWED_ORIGINS: "https://api.app1.duongminhtien.io.vn",
  });
  const validator = createOriginValidator(allowedOrigins);

  const result = await evaluateOrigin(validator, "http://localhost:5173");
  assert.equal(result.error, null);
  assert.equal(result.allowed, true);
});

test("localhost origin is rejected in staging when not configured", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    NODE_ENV: "staging",
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn",
    ALLOWED_ORIGINS: "https://api.app1.duongminhtien.io.vn",
  });
  const validator = createOriginValidator(allowedOrigins);

  const result = await evaluateOrigin(validator, "http://localhost:5173");
  assert.equal(result.allowed, false);
  assert.ok(result.error instanceof Error);
  assert.equal(result.error.message, "Origin is not allowed by CORS");
});

test("localhost origin can be explicitly configured in production", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    NODE_ENV: "production",
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn,http://localhost:5173",
    ALLOWED_ORIGINS: "https://api.app1.duongminhtien.io.vn",
  });
  const validator = createOriginValidator(allowedOrigins);

  const result = await evaluateOrigin(validator, "http://localhost:5173");
  assert.equal(result.error, null);
  assert.equal(result.allowed, true);
});

test("configured subdomain origin is allowed", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn",
    ALLOWED_ORIGINS:
      "https://api.app1.duongminhtien.io.vn,https://app2.duongminhtien.io.vn",
  });
  const validator = createOriginValidator(allowedOrigins);

  const result = await evaluateOrigin(validator, "https://app2.duongminhtien.io.vn");
  assert.equal(result.error, null);
  assert.equal(result.allowed, true);
});

test("foreign origin is rejected", async () => {
  const allowedOrigins = getAllowedOriginsFromEnv({
    FRONTEND_ORIGIN: "https://app1.duongminhtien.io.vn",
    ALLOWED_ORIGINS: "https://api.app1.duongminhtien.io.vn",
  });
  const validator = createOriginValidator(allowedOrigins);

  const result = await evaluateOrigin(validator, "https://evil.example.com");
  assert.equal(result.allowed, false);
  assert.ok(result.error instanceof Error);
  assert.equal(result.error.message, "Origin is not allowed by CORS");
});
