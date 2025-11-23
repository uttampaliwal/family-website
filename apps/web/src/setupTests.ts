import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock the i18n hook to prevent errors in tests
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Returns the key itself
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      // Add other i18n properties and methods if needed by components
    },
  }),
}));

// Mock the central api (axios instance) to prevent real network requests in tests
vi.mock("./services/axios", () => ({
  default: {
    get: vi.fn((url: string) => {
      // By default, simulate a logged-out user for auth checks
      if (url === "/api/auth/me") {
        return Promise.reject({
          response: { status: 401, data: { message: "Not authorized" } },
        });
      }
      // For other GET requests, return an empty object
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));
