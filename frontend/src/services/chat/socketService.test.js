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
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("connects socket using current origin by default", () => {
    connectSocket();

    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith(
      "http://localhost:4000",
      expect.objectContaining({
        withCredentials: true,
      })
    );
  });

  it("socket override uses VITE_SOCKET_URL", () => {
    vi.stubEnv("VITE_SOCKET_URL", "https://socket.override.duongminhtien.io.vn/");

    connectSocket();

    expect(io).toHaveBeenCalledWith(
      "https://socket.override.duongminhtien.io.vn",
      expect.objectContaining({
        withCredentials: true,
      })
    );
  });
});
