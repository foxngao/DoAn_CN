import { describe, it, expect, vi } from "vitest";
import axiosClient from "./axiosClient";

function getResponseRejectedInterceptor() {
  const interceptor = axiosClient.interceptors.response.handlers.find(
    (handler) => typeof handler?.rejected === "function"
  );
  return interceptor?.rejected;
}

describe("axiosClient response interceptor", () => {
  it.each([401, 403])(
    "emits session-expired signal for auth status %i",
    async (status) => {
      const onSessionExpired = vi.fn();
      window.addEventListener("auth:session-expired", onSessionExpired);

      const rejected = getResponseRejectedInterceptor();
      const error = {
        response: { status },
        config: { url: "/bao-mat" },
      };

      await expect(rejected(error)).rejects.toBe(error);
      expect(onSessionExpired).toHaveBeenCalledTimes(1);

      window.removeEventListener("auth:session-expired", onSessionExpired);
    }
  );

  it("does not emit session-expired signal for non-auth errors", async () => {
    const onSessionExpired = vi.fn();
    window.addEventListener("auth:session-expired", onSessionExpired);

    const rejected = getResponseRejectedInterceptor();
    const error = {
      response: { status: 500 },
      config: { url: "/thong-ke" },
    };

    await expect(rejected(error)).rejects.toBe(error);
    expect(onSessionExpired).not.toHaveBeenCalled();

    window.removeEventListener("auth:session-expired", onSessionExpired);
  });
});
