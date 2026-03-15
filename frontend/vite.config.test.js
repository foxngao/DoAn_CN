import { describe, expect, it } from "vitest";
import { resolveDevProxyTarget } from "./src/config/devProxyTarget";

describe("vite dev proxy target", () => {
  it("dev proxy uses VITE_DEV_PROXY_TARGET", () => {
    const proxyTarget = resolveDevProxyTarget({
      VITE_DEV_PROXY_TARGET: "https://api.app1.duongminhtien.io.vn",
    });

    expect(proxyTarget).toBe("https://api.app1.duongminhtien.io.vn");
  });

  it("localhost behavior keeps dev proxy default", () => {
    const proxyTarget = resolveDevProxyTarget({});

    expect(proxyTarget).toBe("http://localhost:4000");
  });
});
