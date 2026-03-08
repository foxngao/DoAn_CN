import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import HomePage from "./HomePage";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("HomePage accessibility", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("supports keyboard activation for service card", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const serviceCard = screen.getByRole("button", { name: /khoa tim mạch/i });

    serviceCard.focus();
    expect(serviceCard).toHaveFocus();

    fireEvent.keyDown(serviceCard, { key: "Enter" });
    fireEvent.keyDown(serviceCard, { key: " " });

    expect(navigateMock).toHaveBeenCalledTimes(2);
    expect(navigateMock).toHaveBeenNthCalledWith(1, "/login");
    expect(navigateMock).toHaveBeenNthCalledWith(2, "/login");
  });
});
