import { describe, expect, it } from "vitest";
import {
  buildUploadUrl,
  getApiOrigin,
  getSocketOrigin,
  getUploadOrigin,
} from "./runtimeEndpoints";

describe("runtimeEndpoints", () => {
  it("api override uses VITE_API_ORIGIN", () => {
    const apiOrigin = getApiOrigin({
      env: { VITE_API_ORIGIN: "https://api.override.duongminhtien.io.vn/" },
      locationObj: {
        protocol: "https:",
        hostname: "app1.duongminhtien.io.vn",
      },
    });

    expect(apiOrigin).toBe("https://api.override.duongminhtien.io.vn");
  });

  it("upload override uses VITE_UPLOAD_ORIGIN", () => {
    const uploadUrl = buildUploadUrl("/uploads/hsba.pdf", {
      env: { VITE_UPLOAD_ORIGIN: "https://uploads.override.duongminhtien.io.vn/" },
      locationObj: {
        protocol: "https:",
        hostname: "app1.duongminhtien.io.vn",
      },
    });

    expect(uploadUrl).toBe(
      "https://uploads.override.duongminhtien.io.vn/uploads/hsba.pdf"
    );
  });

  it("localhost upload keeps http://localhost:4000", () => {
    const uploadOrigin = getUploadOrigin({
      env: {},
      locationObj: {
        protocol: "http:",
        hostname: "localhost",
      },
    });

    expect(uploadOrigin).toBe("http://localhost:4000");
  });

  it("maps project subdomain to api subdomain by default", () => {
    const apiOrigin = getApiOrigin({
      env: {},
      locationObj: {
        protocol: "https:",
        hostname: "app2.duongminhtien.io.vn",
      },
    });

    expect(apiOrigin).toBe("https://api.app2.duongminhtien.io.vn");
  });

  it("returns unchanged full upload URL", () => {
    const fullUrl = buildUploadUrl("https://cdn.example.com/file.png", {
      env: {},
      locationObj: {
        protocol: "https:",
        hostname: "app1.duongminhtien.io.vn",
      },
    });

    expect(fullUrl).toBe("https://cdn.example.com/file.png");
  });

  it("falls back socket origin from inferred api origin", () => {
    const socketOrigin = getSocketOrigin({
      env: {},
      locationObj: {
        protocol: "https:",
        hostname: "app1.duongminhtien.io.vn",
      },
    });

    expect(socketOrigin).toBe("https://api.app1.duongminhtien.io.vn");
  });
});
