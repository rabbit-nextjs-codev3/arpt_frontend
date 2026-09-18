"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE_NAME, type Locale } from "@/lib/locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Langue courante du site, partagée par tous les composants client via
 * Context — pas de préfixe d'URL, la langue vit dans le cookie NEXT_LOCALE.
 * `initialLocale` vient du serveur (layout.tsx, qui lit déjà ce cookie pour
 * next-intl) : ça évite le flash "fr" au premier rendu client le temps
 * qu'un hook local relise le cookie. `setLocale` réécrit le cookie, met à
 * jour tous les consommateurs du Context immédiatement (pour les données
 * fetchées côté client, ex: useContentBlock), puis `router.refresh()` pour
 * que les Server Components (dont le Provider next-intl) repartent avec les
 * nouveaux messages.
 */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(next)};path=/;max-age=${oneYear};SameSite=Lax`;
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale() doit être utilisé sous <LocaleProvider>.");
  return ctx;
}
