"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api, apiFetch, ApiError, SESSION_EXPIRED_EVENT } from "@/lib/api";

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
  // Contrairement à register() : ne connecte jamais automatiquement — le
  // compte créé reste bloqué jusqu'à validation d'un admin, voir le backend
  // AuthService.registerEnterprise. `body` porte déjà tous les champs
  // (email, fullname, companyName, password, password2, companyDocument).
  registerEnterprise: (body: FormData) => Promise<{ detail: string }>;
  logout: () => Promise<void>;
  hasPermission: (action: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_KEY = "arpt_access_token";
const REFRESH_KEY = "arpt_refresh_token";

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
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

  // apiFetch (lib/api.ts) a déjà purgé les tokens en localStorage au moment
  // où ce 401 survient — reste à faire retomber l'UI sur un état déconnecté.
  // Ne notifie que s'il y avait effectivement une session ouverte (sinon un
  // simple mauvais mot de passe sur le formulaire de connexion déclencherait
  // aussi ce toast, ce qui n'a pas de sens tant qu'on n'était pas connecté).
  useEffect(() => {
    function handleSessionExpired() {
      setUser((previous) => {
        if (previous) toast.error(t("sessionExpired"));
        return null;
      });
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [t]);

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

  const registerEnterprise = useCallback(async (body: FormData) => {
    return apiFetch<{ detail: string }>("/auth/register/enterprise", { method: "POST", body });
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
    <AuthContext.Provider
      value={{ user, loading, login, register, registerEnterprise, logout, hasPermission, refreshUser }}
    >
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
