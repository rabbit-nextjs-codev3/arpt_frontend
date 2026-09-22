"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type PaginatedResult } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";

/** Liste paginée côté backend, chargée une fois et exposée telle quelle (pas de pagination UI pour l'instant). */
export function useApiList<T>(path: string | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    let annule = false;
    queueMicrotask(() => { if (!annule) { setLoading(true); setError(null); } });
    api
      .get<PaginatedResult<T>>(path)
      .then((res) => {
        if (!annule) setData(res.results);
      })
      .catch((err: unknown) => {
        if (!annule) setError(err instanceof ApiError ? err.message : "Impossible de charger les données.");
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, [path, version]);

  return { data, loading, error, refetch: () => setVersion((v) => v + 1) };
}

interface ContentBlockRecord<T> {
  key: string;
  value: T;
  updatedAt: string;
}

/**
 * Bloc de contenu du CMS léger (`/content-blocks/:key`) — texte/images éditables
 * depuis l'admin. Le bloc peut ne pas encore exister en base (404 tant qu'aucun
 * admin ne l'a créé) : dans ce cas on retombe silencieusement sur `fallback`
 * (le contenu par défaut codé en dur) plutôt que d'afficher une erreur.
 *
 * Résout côté serveur (`?lang=`) tout champ traduisible `{ fr, en?, ar? }`
 * du bloc dans la langue courante (voir `useLocale`) — `T` reçoit donc des
 * chaînes déjà résolues, pas les objets i18n bruts. Refetch automatique au
 * changement de langue (le Context est partagé avec `LocaleSwitcher`, pas
 * besoin d'attendre le `router.refresh()`).
 */
export function useContentBlock<T>(key: string, fallback: T) {
  const { locale } = useLocale();
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let annule = false;
    queueMicrotask(() => { if (!annule) setLoading(true); });
    api
      .get<ContentBlockRecord<T>>(`/content-blocks/${key}?lang=${locale}`)
      .then((res) => {
        if (!annule) setData(res.value);
      })
      .catch(() => {
        if (!annule) setData(fallback);
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, locale, version]);

  return { data, loading, refetch: () => setVersion((v) => v + 1) };
}

/**
 * Variante "brute" pour l'admin : ne résout jamais les champs traduisibles
 * (pas de `?lang=`) — l'éditeur a besoin des objets `{ fr, en, ar }` complets
 * pour proposer un champ par langue, pas d'une chaîne déjà résolue.
 */
export function useContentBlockRaw<T>(key: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let annule = false;
    queueMicrotask(() => { if (!annule) setLoading(true); });
    api
      .get<ContentBlockRecord<T>>(`/content-blocks/${key}`)
      .then((res) => {
        if (!annule) setData(res.value);
      })
      .catch(() => {
        if (!annule) setData(fallback);
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  return { data, loading, refetch: () => setVersion((v) => v + 1) };
}

/** Une seule ressource (détail, overview…), chargée une fois. */
export function useApiOne<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    let annule = false;
    queueMicrotask(() => { if (!annule) { setLoading(true); setError(null); } });
    api
      .get<T>(path)
      .then((res) => {
        if (!annule) setData(res);
      })
      .catch((err: unknown) => {
        if (!annule) setError(err instanceof ApiError ? err.message : "Impossible de charger les données.");
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, [path, version]);

  useEffect(() => {
    if (path !== "/site-config") return;
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener("arpt:site-config-updated", refresh);
    return () => window.removeEventListener("arpt:site-config-updated", refresh);
  }, [path]);

  return { data, loading, error, refetch: () => setVersion((v) => v + 1) };
}
