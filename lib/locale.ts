// Langues disponibles sur le site — mêmes 3 langues que le backend
// (colonnes Json {fr, en, ar} par champ traduisible, voir ?lang= sur l'API).
// Pas de préfixe d'URL par langue : la langue vit dans un cookie
// (NEXT_LOCALE), lu côté serveur pour les Server Components et exposé côté
// client via useLocale() (lib/locale-context.tsx) — même architecture que
// l'ancien frontend.
export type Locale = "fr" | "en" | "ar";

export const LOCALES: Locale[] = ["fr", "en", "ar"];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}

/** Server Components / Route Handlers uniquement (utilise next/headers). */
export async function getServerLocale(): Promise<Locale> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
