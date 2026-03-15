const test = require("node:test");
const assert = require("node:assert/strict");

const { sanitizeTinTucHtml } = require("../../src/modules/tintuc/sanitizer");

test("xss regression: strips executable payload while preserving safe markup", () => {
  const unsafeHtml =
    '<p>An toàn</p><script>alert("xss")</script><img src="https://safe.example/x.png" onerror="alert(1)"><a href="javascript:alert(1)">bad</a>';

  const sanitized = sanitizeTinTucHtml(unsafeHtml);

  assert.equal(sanitized.includes("<script"), false);
  assert.equal(sanitized.includes("onerror"), false);
  assert.equal(sanitized.includes("javascript:"), false);
  assert.equal(sanitized.includes("<p>An toàn</p>"), true);
  assert.equal(sanitized.includes("<img"), true);
});

test("xss regression: keeps https links and enforces rel noopener noreferrer", () => {
  const input = '<a href="https://example.com" target="_blank">xem thêm</a>';

  const sanitized = sanitizeTinTucHtml(input);

  assert.equal(
    sanitized.includes('href="https://example.com"'),
    true,
    "safe https href should be preserved"
  );
  assert.equal(
    sanitized.includes('rel="noopener noreferrer"'),
    true,
    "anchor rel should be normalized for reverse-tabnabbing mitigation"
  );
});
