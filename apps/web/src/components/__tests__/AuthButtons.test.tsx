import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import AuthButtons from "../AuthButtons";
import { AuthProvider } from "../../context/AuthContext";
import { ToastProvider } from "../../context/ToastProvider";

// Mock the useAuth hook
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../hooks/useToast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>{component}</AuthProvider>
      </ToastProvider>
    </BrowserRouter>,
  );
};

describe("AuthButtons Component", () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it("shows login and register links when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: false,
      username: null,
      user: null,
      login: vi.fn(),
      logout: mockLogout,
      loading: false,
    });

    renderWithProviders(<AuthButtons />);

    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
  });

  it("shows user profile link when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      username: "testuser",
      user: {
        id: "1",
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
      login: vi.fn(),
      logout: mockLogout,
      loading: false,
    });

    renderWithProviders(<AuthButtons />);

    expect(screen.getByRole("link", { name: /testuser/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /login/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /register/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Profile as fallback when username is not available", () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      username: null,
      user: {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
      login: vi.fn(),
      logout: mockLogout,
      loading: false,
    });

    renderWithProviders(<AuthButtons />);

    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
  });
});
