/**
 * Typed fetch wrapper for all API calls from the frontend.
 * - Always sends credentials (httpOnly cookie with JWT)
 * - Always sets Content-Type for JSON bodies
 * - Returns typed response or throws on network error
 */

const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(path, {
      ...options,
      credentials: "include", // always send httpOnly auth cookie
      headers: {
        ...DEFAULT_HEADERS,
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data?.error || "Request failed", status: res.status };
    }
    return { data, status: res.status };
  } catch (err: any) {
    return { error: err?.message || "Network error", status: 0 };
  }
}

export const apiClient = {
  get: <T = any>(path: string) => apiFetch<T>(path),
  post: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = any>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};
