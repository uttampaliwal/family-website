import { render, screen, fireEvent } from "@testing-library/react";
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
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: mockLogout,
      loading: false,
    });

    renderWithProviders(<AuthButtons />);

    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /logout/i }),
    ).not.toBeInTheDocument();
  });

  it("shows user menu and logout when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
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

    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /login/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /register/i }),
    ).not.toBeInTheDocument();
  });

  it("calls logout function when logout button is clicked", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
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

    const logoutButton = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("shows loading state when authentication is loading", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: mockLogout,
      loading: true,
    });

    renderWithProviders(<AuthButtons />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows user profile link when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
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

    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
  });

  it("shows admin link for admin users", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "1",
        username: "admin",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      },
      login: vi.fn(),
      logout: mockLogout,
      loading: false,
    });

    renderWithProviders(<AuthButtons />);

    expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
  });

  it("does not show admin link for regular users", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "1",
        username: "testuser",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
      },
      login: vi.fn(),
      logout: mockLogout,
      loading: false,
    });

    renderWithProviders(<AuthButtons />);

    expect(
      screen.queryByRole("link", { name: /admin/i }),
    ).not.toBeInTheDocument();
  });
});
