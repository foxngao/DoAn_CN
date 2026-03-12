import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => {
  return {
    io: vi.fn(() => ({
      connected: false,
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    })),
  };
});

import { io } from "socket.io-client";
import { connectSocket, disconnectSocket } from "./socketService";

describe("socketService connectSocket", () => {
  afterEach(() => {
    disconnectSocket();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("connects socket using current origin by default", () => {
    localStorage.setItem("token", "abc-token");

    connectSocket();

    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith(
      window.location.origin,
      expect.objectContaining({
        auth: {
          token: "Bearer abc-token",
        },
      })
    );
  });
});
