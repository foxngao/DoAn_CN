const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "test-user";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-password";
process.env.DB_NAME = process.env.DB_NAME || "test-db";

const {
  getSessionCookieOptions,
  getCsrfCookieOptions,
  clearAuthCookies,
} = require("../../src/modules/auth/controller");
const { createCorsOptions } = require("../../src/config/cors");

test("session cookie flags in development", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCrossSite = process.env.SESSION_COOKIE_CROSS_SITE;
  const originalDomain = process.env.SESSION_COOKIE_DOMAIN;

  process.env.NODE_ENV = "development";
  delete process.env.SESSION_COOKIE_CROSS_SITE;
  delete process.env.SESSION_COOKIE_DOMAIN;

  const sessionOptions = getSessionCookieOptions();
  const csrfOptions = getCsrfCookieOptions();

  assert.equal(sessionOptions.httpOnly, true);
  assert.equal(sessionOptions.secure, false);
  assert.equal(sessionOptions.sameSite, "lax");
  assert.equal(sessionOptions.path, "/");

  assert.equal(csrfOptions.httpOnly, false);
  assert.equal(csrfOptions.secure, false);
  assert.equal(csrfOptions.sameSite, "lax");
  assert.equal(csrfOptions.path, "/");

  process.env.NODE_ENV = originalNodeEnv;
  process.env.SESSION_COOKIE_CROSS_SITE = originalCrossSite;
  process.env.SESSION_COOKIE_DOMAIN = originalDomain;
});

test("session cookie flags in production default to strict", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCrossSite = process.env.SESSION_COOKIE_CROSS_SITE;

  process.env.NODE_ENV = "production";
  delete process.env.SESSION_COOKIE_CROSS_SITE;

  const sessionOptions = getSessionCookieOptions();

  assert.equal(sessionOptions.httpOnly, true);
  assert.equal(sessionOptions.secure, true);
  assert.equal(sessionOptions.sameSite, "strict");

  process.env.NODE_ENV = originalNodeEnv;
  process.env.SESSION_COOKIE_CROSS_SITE = originalCrossSite;
});

test("session cookie flags in production support cross-site mode", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCrossSite = process.env.SESSION_COOKIE_CROSS_SITE;

  process.env.NODE_ENV = "production";
  process.env.SESSION_COOKIE_CROSS_SITE = "true";

  const sessionOptions = getSessionCookieOptions();

  assert.equal(sessionOptions.httpOnly, true);
  assert.equal(sessionOptions.secure, true);
  assert.equal(sessionOptions.sameSite, "none");

  process.env.NODE_ENV = originalNodeEnv;
  process.env.SESSION_COOKIE_CROSS_SITE = originalCrossSite;
});

test("logout clears session and csrf cookies with same path/domain", () => {
  const originalDomain = process.env.SESSION_COOKIE_DOMAIN;
  process.env.SESSION_COOKIE_DOMAIN = "example.com";

  const calls = [];
  const res = {
    clearCookie(name, options) {
      calls.push({ name, options });
      return this;
    },
  };

  clearAuthCookies(res);

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], {
    name: "session_token",
    options: { path: "/", domain: "example.com" },
  });
  assert.deepEqual(calls[1], {
    name: "csrf_token",
    options: { path: "/", domain: "example.com" },
  });

  process.env.SESSION_COOKIE_DOMAIN = originalDomain;
});

test("cors credentials true never allows wildcard origin", () => {
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;
  const originalFrontendOrigin = process.env.FRONTEND_ORIGIN;

  process.env.ALLOWED_ORIGINS = "*";
  delete process.env.FRONTEND_ORIGIN;

  const corsOptions = createCorsOptions();

  assert.equal(corsOptions.credentials, true);
  assert.notEqual(corsOptions.origin, "*");

  let callbackError;
  let callbackAllow;
  corsOptions.origin("https://attacker.example", (error, allow) => {
    callbackError = error;
    callbackAllow = allow;
  });

  assert.equal(callbackAllow, false);
  assert.equal(callbackError instanceof Error, true);

  process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
  process.env.FRONTEND_ORIGIN = originalFrontendOrigin;
});
