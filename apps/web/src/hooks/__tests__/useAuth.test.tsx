import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "../useAuth";
import { AuthProvider } from "../../context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "../../context/ToastProvider";

// Mock axios
const mockPost = vi.fn();
const mockGet = vi.fn();
vi.mock("../../services/axios", () => ({
  default: {
    post: mockPost,
    get: mockGet,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock useToast
vi.mock("../useToast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

describe("useAuth Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("should initialize with no user when no token in localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("should attempt to load user when token exists in localStorage", () => {
    localStorageMock.getItem.mockReturnValue("fake-token");
    mockGet.mockResolvedValue({
      data: {
        user: {
          id: "1",
          username: "testuser",
          email: "test@example.com",
        },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it("should login successfully with valid credentials", async () => {
    const mockUser = {
      id: "1",
      username: "testuser",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
    };

    mockPost.mockResolvedValue({
      data: {
        user: mockUser,
        accessToken: "fake-access-token",
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "accessToken",
      "fake-access-token",
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "username",
      "testuser",
    );
  });

  it("should handle login failure", async () => {
    mockPost.mockRejectedValue({
      response: {
        data: { message: "Invalid credentials" },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login("test@example.com", "wrongpassword");
      }),
    ).rejects.toThrow();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("should logout successfully", async () => {
    // Setup authenticated state
    const mockUser = {
      id: "1",
      username: "testuser",
      email: "test@example.com",
    };

    localStorageMock.getItem.mockReturnValue("fake-token");
    mockGet.mockResolvedValue({ data: { user: mockUser } });
    mockPost.mockResolvedValue({ data: { message: "Logout successful" } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("accessToken");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("username");
  });

  it("should handle logout when not authenticated", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("should register user successfully", async () => {
    const registrationData = {
      username: "newuser",
      email: "new@example.com",
      password: "password123",
      confirmPassword: "password123",
      firstName: "New",
      lastName: "User",
      dateOfBirth: "1990-01-01",
      termsAccepted: true,
    };

    mockPost.mockResolvedValue({
      data: {
        message: "Registration successful",
        user: {
          id: "2",
          username: "newuser",
          email: "new@example.com",
        },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register(registrationData);
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/api/auth/register",
      registrationData,
    );
  });

  it("should handle registration failure", async () => {
    const registrationData = {
      username: "existinguser",
      email: "existing@example.com",
      password: "password123",
      confirmPassword: "password123",
      firstName: "Existing",
      lastName: "User",
      dateOfBirth: "1990-01-01",
      termsAccepted: true,
    };

    mockPost.mockRejectedValue({
      response: {
        data: { message: "Email already exists" },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.register(registrationData);
      }),
    ).rejects.toThrow();
  });

  it("should clear auth state on token expiration", async () => {
    localStorageMock.getItem.mockReturnValue("expired-token");
    mockGet.mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("accessToken");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("username");
  });
});
