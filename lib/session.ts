export const ACCESS_KEY = "arpt_access_token";
export const REFRESH_KEY = "arpt_refresh_token";
export const LAST_ACTIVITY_KEY = "arpt_last_activity";
export const IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

const MAX_TOKEN_LENGTH = 32_768;

function isValidTokenValue(value: string): boolean {
  return (
    value.length > 0 && value.length <= MAX_TOKEN_LENGTH && !/\s/.test(value)
  );
}

function writeTokenPair(
  accessToken: string,
  refreshToken: string,
  recordLoginActivity: boolean,
) {
  if (!isValidTokenValue(accessToken) || !isValidTokenValue(refreshToken)) {
    clearSession();
    throw new Error("Réponse de session invalide.");
  }

  const previousAccess = localStorage.getItem(ACCESS_KEY);
  const previousRefresh = localStorage.getItem(REFRESH_KEY);
  const previousActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  try {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    if (recordLoginActivity)
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch (error) {
    if (previousAccess === null) localStorage.removeItem(ACCESS_KEY);
    else localStorage.setItem(ACCESS_KEY, previousAccess);
    if (previousRefresh === null) localStorage.removeItem(REFRESH_KEY);
    else localStorage.setItem(REFRESH_KEY, previousRefresh);
    if (previousActivity === null) localStorage.removeItem(LAST_ACTIVITY_KEY);
    else localStorage.setItem(LAST_ACTIVITY_KEY, previousActivity);
    throw error;
  }
}

export function isSessionInactive(now = Date.now()): boolean {
  const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!stored) return false;
  const lastActivity = Number(stored);
  return (
    !Number.isFinite(lastActivity) || now - lastActivity >= IDLE_TIMEOUT_MS
  );
}

export function recordActivity(now = Date.now()): boolean {
  if (!localStorage.getItem(REFRESH_KEY)) return false;
  if (isSessionInactive(now)) return false;
  const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? 0);
  if (!lastActivity || now - lastActivity >= 60_000)
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  return true;
}

export function storeTokenPair(accessToken: string, refreshToken: string) {
  writeTokenPair(accessToken, refreshToken, true);
}

export function rotateTokenPair(accessToken: string, refreshToken: string) {
  writeTokenPair(accessToken, refreshToken, false);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function tokenExpiresSoon(token: string, leewayMs = 60_000): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return (
      typeof payload.exp !== "number" ||
      payload.exp * 1000 <= Date.now() + leewayMs
    );
  } catch {
    return true;
  }
}
