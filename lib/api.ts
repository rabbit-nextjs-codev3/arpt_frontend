export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Émis quand une requête échoue en 401 (token absent/expiré/invalide) — écouté par AuthStateProvider pour déconnecter et renvoyer vers la connexion, voir lib/auth.tsx. */
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

/**
 * Client fetch commun à toute l'app — préfixe l'URL du backend, attache le
 * token d'accès s'il existe (voir lib/auth.tsx), et normalise les erreurs
 * dans la forme { statusCode, message } renvoyée par AllExceptionsFilter
 * côté NestJS.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("arpt_access_token") : null;

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    // Token absent/expiré/invalide : purge locale + signal global (une requête
    // de login avec mauvais mot de passe renvoie aussi 401 mais sans token à
    // purger, donc sans effet ici — AuthStateProvider distingue en pratique
    // via l'état déjà null). Le composant appelant reçoit quand même l'erreur
    // normalement, pour son propre message d'erreur éventuel.
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("arpt_access_token");
      localStorage.removeItem("arpt_refresh_token");
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
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
    apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
