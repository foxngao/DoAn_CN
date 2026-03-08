const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "test-user";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test-password";
process.env.DB_NAME = process.env.DB_NAME || "test-db";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DATA_ENCRYPTION_KEY =
  process.env.DATA_ENCRYPTION_KEY || "test-data-encryption-key";
process.env.HASH_PEPPER = process.env.HASH_PEPPER || "test-hash-pepper";

const app = require("../../src/app");

test("GET /api/health returns service health payload", async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    const response = await requestJson({
      hostname: "127.0.0.1",
      port: address.port,
      path: "/api/health",
      method: "GET",
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(typeof response.body.uptime, "number");
    assert.equal(Number.isFinite(response.body.uptime), true);
    assert.equal(response.body.uptime >= 0, true);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

function requestJson(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let rawData = "";

      res.on("data", (chunk) => {
        rawData += chunk;
      });

      res.on("end", () => {
        try {
          const body = rawData ? JSON.parse(rawData) : {};
          resolve({ statusCode: res.statusCode, body });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}
