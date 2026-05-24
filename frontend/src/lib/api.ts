/** In dev, use Vite proxy (`/api` → backend). Override with VITE_API_URL if needed. */
export const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "/api" : "");

const TOKEN_KEY = "hr_auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<{ ok: boolean; status: number; data: T }> {
  if (!API_BASE) {
    throw new Error("Missing VITE_API_URL. Set it in frontend/.env (e.g. VITE_API_URL=/api).");
  }

  const { auth = true, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  let data: T;
  try {
    data = (await response.json()) as T;
  } catch {
    data = {} as T;
  }

  if (response.status === 401 && auth) {
    setAuthToken(null);
  }

  return { ok: response.ok, status: response.status, data };
}
