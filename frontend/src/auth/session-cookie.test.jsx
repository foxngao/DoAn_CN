import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import axiosClient from "../api/axiosClient";
import LoginPage from "../pages/LoginPage";

const navigateMock = vi.fn();
const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}));

vi.mock("../api/axiosClient", async () => {
  const actual = await vi.importActual("../api/axiosClient");
  return {
    ...actual,
    default: {
      ...actual.default,
      post: postMock,
    },
  };
});

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../components/Chatbot/ChatbotWidget.jsx", () => ({
  default: function ChatbotWidget() {
    return <div>ChatbotWidget</div>;
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  };
});

describe("session cookie migration", () => {
  let setItemSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setItemSpy = vi.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    setItemSpy?.mockRestore();
  });

  it("uses withCredentials on axios client", () => {
    expect(axiosClient.defaults.withCredentials).toBe(true);
  });

  it("login flow does not require plaintext token in localStorage", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          csrfToken: "csrf-token",
          user: {
            maTK: "TK001",
            maNhom: "BENHNHAN",
            maBN: "BN001",
            loaiNS: null,
          },
        },
      },
    });

    const { container, getByRole } = render(<LoginPage />);

    fireEvent.change(container.querySelector('input[type="text"]'), {
      target: { value: "user" },
    });
    fireEvent.change(container.querySelector('input[type="password"]'), {
      target: { value: "Pass1234" },
    });
    fireEvent.click(getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith("/auth/login", {
        tenDangNhap: "user",
        matKhau: "Pass1234",
      });
    });

    expect(setItemSpy).not.toHaveBeenCalledWith("token", "legacy-token");
    expect(localStorage.getItem("role")).toBe("BENHNHAN");
    expect(navigateMock).toHaveBeenCalledWith("/patient");
  });
});
