import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import TinTucPage from "./TinTucPage";

const mocks = vi.hoisted(() => ({
  getAllTinTuc: vi.fn(),
  getOneTinTuc: vi.fn(),
}));

vi.mock("../../../services/tintuc/tintucService", () => ({
  getAllTinTuc: mocks.getAllTinTuc,
  getOneTinTuc: mocks.getOneTinTuc,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe("TinTucPage security rendering", () => {
  it("sanitizes dangerous HTML before rendering detail content", async () => {
    mocks.getAllTinTuc.mockResolvedValueOnce({
      data: {
        data: [
          {
            maTin: "TIN001",
            tieuDe: "Tin test",
            tomTat: "Mô tả",
            noiDung: "<p>Nội dung tóm tắt</p>",
            ngayDang: "2026-03-15T00:00:00.000Z",
            luotXem: 0,
          },
        ],
      },
    });

    mocks.getOneTinTuc.mockResolvedValueOnce({
      data: {
        data: {
          maTin: "TIN001",
          tieuDe: "Tin test",
          tomTat: "Mô tả",
          noiDung:
            '<p>An toàn</p><img src="x" onerror="alert(1)"><script>alert("xss")</script>',
          ngayDang: "2026-03-15T00:00:00.000Z",
          luotXem: 5,
        },
      },
    });

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<TinTucPage />);

    await waitFor(() => {
      expect(mocks.getAllTinTuc).toHaveBeenCalledWith({ trangThai: "HIEN_THI" });
    });

    fireEvent.click(screen.getByText("Tin test"));

    await waitFor(() => {
      expect(mocks.getOneTinTuc).toHaveBeenCalledWith("TIN001");
      expect(screen.getByText("An toàn")).toBeInTheDocument();
    });

    const modalContent = document.querySelector(".prose.max-w-none");
    expect(modalContent).toBeTruthy();
    expect(modalContent.innerHTML).not.toContain("<script");
    expect(modalContent.innerHTML).not.toContain("onerror");
    expect(alertSpy).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
