import {
  ACCESS_KEY,
  REFRESH_KEY,
  clearSession,
  isSessionInactive,
  rotateTokenPair,
  tokenExpiresSoon,
} from "./session";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const SESSION_EXPIRED_EVENT = "arpt:session-expired";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface PaginatedResult<T> {
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  results: T[];
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
let refreshInFlight: Promise<string> | null = null;

export function expireSession() {
  if (typeof window === "undefined") return;
  const hadSession = Boolean(
    localStorage.getItem(ACCESS_KEY) || localStorage.getItem(REFRESH_KEY),
  );
  clearSession();
  if (hadSession) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

/** One refresh at a time per tab and, where supported, across open tabs. */
export function refreshAccessToken(
  staleAccessToken?: string | null,
): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  async function rotate(): Promise<string> {
    if (isSessionInactive()) {
      expireSession();
      throw new ApiError(401, "Session expirée après sept jours d'inactivité.");
    }
    const currentAccess = localStorage.getItem(ACCESS_KEY);
    if (staleAccessToken && currentAccess && currentAccess !== staleAccessToken)
      return currentAccess;

    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      expireSession();
      throw new ApiError(401, "Session expirée.");
    }

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      const updatedRefresh = localStorage.getItem(REFRESH_KEY);
      const updatedAccess = localStorage.getItem(ACCESS_KEY);
      if (updatedRefresh && updatedRefresh !== refreshToken && updatedAccess)
        return updatedAccess;
      if (response.status === 401) expireSession();
      throw new ApiError(
        response.status,
        response.status === 401
          ? "Session expirée."
          : "Renouvellement temporairement indisponible.",
      );
    }

    const pair = (await response.json()) as TokenPair;
    if (!pair.accessToken || !pair.refreshToken)
      throw new ApiError(502, "Réponse de session invalide.");
    if (localStorage.getItem(REFRESH_KEY) !== refreshToken) {
      const newerAccess = localStorage.getItem(ACCESS_KEY);
      if (newerAccess) return newerAccess;
      throw new ApiError(401, "Session fermée.");
    }
    rotateTokenPair(pair.accessToken, pair.refreshToken);
    return pair.accessToken;
  }

  const task: Promise<string> = (async () => {
    if (typeof navigator !== "undefined" && navigator.locks) {
      return await navigator.locks.request(
        "arpt-session-refresh",
        async () => await rotate(),
      );
    }
    return await rotate();
  })();
  const result = task.finally(() => {
    refreshInFlight = null;
  });
  refreshInFlight = result;
  return result;
}

export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken && !refreshToken) return null;
  if (isSessionInactive()) {
    expireSession();
    throw new ApiError(401, "Session expirée après sept jours d'inactivité.");
  }
  if (!refreshToken) return accessToken;
  if (!accessToken || tokenExpiresSoon(accessToken))
    return refreshAccessToken(accessToken);
  return accessToken;
}

const AUTH_ACTION = /^\/auth\/(login|register|token\/refresh)(?:\/|$)/;

/** Fetch commun : renouvelle le JWT avant expiration et réessaie une fois sur 401. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isAuthAction = AUTH_ACTION.test(path);
  let token = isAuthAction ? null : await getValidAccessToken();

  function send(accessToken: string | null) {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData) && !headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  }

  let response = await send(token);
  if (response.status === 401 && !isAuthAction && token) {
    token = await refreshAccessToken(token);
    response = await send(token);
  }

  if (response.status === 204) return undefined as T;
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    if (response.status === 401 && !isAuthAction && token) expireSession();
    const message = Array.isArray(data?.message)
      ? data.message.join(" ")
      : (data?.message ?? `Erreur ${response.status}`);
    throw new ApiError(response.status, message);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
