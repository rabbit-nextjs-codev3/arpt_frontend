"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, apiFetch, ApiError } from "@/lib/api";

export interface AuthUser {
  id: number;
  email: string;
  fullname: string;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  emailVerified: boolean;
  role: { id: number; name: string; permissions: string[] } | null;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, context?: "admin" | "public") => Promise<AuthUser>;
  register: (fullname: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (action: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_KEY = "arpt_access_token";
const REFRESH_KEY = "arpt_refresh_token";

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<AuthUser>("/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, context: "admin" | "public" = "public") => {
    const res = await api.post<LoginResponse>("/auth/login", { email, password, context });
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (fullname: string, email: string, password: string, password2: string) => {
    const res = await api.post<LoginResponse>("/auth/register", { fullname, email, password, password2 });
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    // Révoque le refresh token côté serveur avant d'effacer le token d'accès
    // local (la route /auth/logout est authentifiée) — sinon le refresh
    // token reste valide en base malgré la "déconnexion".
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken }).catch(() => {});
    }
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (action: string) => Boolean(user?.isSuperuser || user?.role?.permissions.includes(action)),
    [user],
  );

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(ACCESS_KEY)) return;
    const fresh = await apiFetch<AuthUser>("/auth/me");
    setUser(fresh);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé sous AuthStateProvider");
  return ctx;
}

export { ApiError };
