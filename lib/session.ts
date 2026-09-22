export const ACCESS_KEY = "arpt_access_token";
export const REFRESH_KEY = "arpt_refresh_token";
export const LAST_ACTIVITY_KEY = "arpt_last_activity";
export const IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

export function isSessionInactive(now = Date.now()): boolean {
  const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!stored) return false; // Existing sessions created before activity tracking.
  const lastActivity = Number(stored);
  return !Number.isFinite(lastActivity) || now - lastActivity >= IDLE_TIMEOUT_MS;
}

export function recordActivity(now = Date.now()): boolean {
  if (!localStorage.getItem(REFRESH_KEY)) return false;
  if (isSessionInactive(now)) return false;
  const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? 0);
  if (!lastActivity || now - lastActivity >= 60_000) localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  return true;
}

export function storeTokenPair(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function rotateTokenPair(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function tokenExpiresSoon(token: string, leewayMs = 60_000): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now() + leewayMs;
  } catch {
    return false; // Let the API reject malformed tokens; refresh then handles the 401.
  }
}
