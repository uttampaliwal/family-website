export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** Double-submit CSRF token, read from the JS-visible `kulaya_csrf` cookie. */
export function csrfToken(): string {
  const match = /(?:^|;\s*)kulaya_csrf=([^;]+)/.exec(document.cookie);
  return match ? decodeURIComponent(match[1]!) : "";
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiErrorBody {
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
}

/** Bearer token kept in sync by the auth store (avoids an import cycle). */
let accessToken: string | null = null;

/** Set by the auth store whenever the session token changes. */
export function setAuthToken(token: string | null): void {
  accessToken = token;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (method !== "GET") {
    const token = csrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let payload: ApiErrorBody = {};
    try {
      payload = (await res.json()) as ApiErrorBody;
    } catch {
      // non-JSON error body — keep defaults
    }
    throw new ApiError(
      res.status,
      payload.error ?? "REQUEST_FAILED",
      payload.message ?? `Request failed with status ${res.status}`,
      payload.issues,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
