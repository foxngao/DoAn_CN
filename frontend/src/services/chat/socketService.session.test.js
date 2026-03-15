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

describe("socketService session-cookie auth", () => {
  afterEach(() => {
    disconnectSocket();
    localStorage.clear();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("connects socket without requiring token in localStorage", () => {
    connectSocket();

    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith(
      "http://localhost:4000",
      expect.objectContaining({
        withCredentials: true,
      })
    );
  });
});
