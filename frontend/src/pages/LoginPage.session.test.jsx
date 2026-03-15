import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import LoginPage from "./LoginPage";

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

describe("LoginPage session regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("removes legacy token and keeps cookie-first session metadata", async () => {
    localStorage.setItem("token", "legacy-insecure-token");

    postMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: {
            maTK: "TK-PATIENT-001",
            maNhom: "BENHNHAN",
            maBN: "BN-001",
            loaiNS: null,
          },
        },
      },
    });

    const { container, getByRole } = render(<LoginPage />);

    fireEvent.change(container.querySelector('input[type="text"]'), {
      target: { value: "patient01" },
    });
    fireEvent.change(container.querySelector('input[type="password"]'), {
      target: { value: "Pass1234" },
    });
    fireEvent.click(getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith("/auth/login", {
        tenDangNhap: "patient01",
        matKhau: "Pass1234",
      });
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("maTK")).toBe("TK-PATIENT-001");
    expect(localStorage.getItem("role")).toBe("BENHNHAN");
    expect(localStorage.getItem("maBN")).toBe("BN-001");
    expect(navigateMock).toHaveBeenCalledWith("/patient");
  });
});
