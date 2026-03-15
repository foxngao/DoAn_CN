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

describe("TinTucPage regression", () => {
  it("keeps safe link while stripping javascript URI from detail HTML", async () => {
    mocks.getAllTinTuc.mockResolvedValueOnce({
      data: {
        data: [
          {
            maTin: "TIN-R1",
            tieuDe: "Tin regression",
            tomTat: "Tóm tắt regression",
            noiDung: "<p>Short</p>",
            ngayDang: "2026-03-15T00:00:00.000Z",
            luotXem: 3,
          },
        ],
      },
    });

    mocks.getOneTinTuc.mockResolvedValueOnce({
      data: {
        data: {
          maTin: "TIN-R1",
          tieuDe: "Tin regression",
          tomTat: "Tóm tắt regression",
          noiDung:
            '<p>Nội dung an toàn</p><a href="https://example.com" target="_blank">safe</a><a href="javascript:alert(1)">bad</a>',
          ngayDang: "2026-03-15T00:00:00.000Z",
          luotXem: 9,
        },
      },
    });

    render(<TinTucPage />);

    await waitFor(() => {
      expect(mocks.getAllTinTuc).toHaveBeenCalledWith({ trangThai: "HIEN_THI" });
    });

    fireEvent.click(screen.getByText("Tin regression"));

    await waitFor(() => {
      expect(mocks.getOneTinTuc).toHaveBeenCalledWith("TIN-R1");
      expect(screen.getByText("Nội dung an toàn")).toBeInTheDocument();
    });

    const modalContent = document.querySelector(".prose.max-w-none");
    expect(modalContent).toBeTruthy();
    expect(modalContent.innerHTML).toContain('href="https://example.com"');
    expect(modalContent.innerHTML).not.toContain("javascript:");
  });
});
