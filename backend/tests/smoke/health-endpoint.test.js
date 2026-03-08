const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

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
