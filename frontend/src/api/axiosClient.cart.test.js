import { describe, it, expect } from "vitest";
import axiosClient, {
  CART_NOT_FOUND_CODE,
  isCartNotFoundRequest,
} from "./axiosClient";

function getResponseRejectedInterceptor() {
  const interceptor = axiosClient.interceptors.response.handlers.find(
    (handler) => typeof handler?.rejected === "function"
  );
  return interceptor?.rejected;
}

describe("axiosClient cart error contract", () => {
  it("keeps 404 cart errors as rejected and tags typed code", async () => {
    const rejected = getResponseRejectedInterceptor();
    const error = {
      response: { status: 404 },
      config: { url: "/hoadon/giohang/BN001" },
    };

    await expect(rejected(error)).rejects.toBe(error);
    expect(error.code).toBe(CART_NOT_FOUND_CODE);
    expect(error.isCartNotFound).toBe(true);
  });

  it("does not tag non-cart 404 errors", async () => {
    const rejected = getResponseRejectedInterceptor();
    const error = {
      response: { status: 404 },
      config: { url: "/lichkham/khong-ton-tai" },
    };

    await expect(rejected(error)).rejects.toBe(error);
    expect(error.code).toBeUndefined();
    expect(error.isCartNotFound).toBeUndefined();
  });

  it("detects cart endpoint urls consistently", () => {
    expect(isCartNotFoundRequest("/hoadon/giohang/BN001")).toBe(true);
    expect(isCartNotFoundRequest("/hoadon/myhoadon/BN001")).toBe(false);
    expect(isCartNotFoundRequest(undefined)).toBe(false);
  });
});
